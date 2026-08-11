/**
 * yiTrace backend unit tier: project real session records through the real
 * `@yitrace/trace-sdk` HTTP pipeline and assert the resulting trace tree.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import { Context } from 'cordis'
import {
  CallId,
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage,
} from '@deepseek-ai/dsh-llm'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import DshTrace from '../src/index.ts'

interface WireEvent {
  trace_id: string
  span_id: string
  seq: string
  event_type: number
  ext_span_id: string
  parent_span_id: string | null
  event_id: string
  status: number | null
  duration_ns: string | null
  input_tokens: string | null
  output_tokens: string | null
  cache_read_tokens: string | null
  cache_write_tokens: string | null
  session_id: string | null
  tenant_id: string | null
  span_name: string | null
  agent_name: string | null
  tool_name: string | null
  model: string | null
  input_text: string | null
  output_text: string | null
  logs: string[]
  attrs: Record<string, string | number | boolean>
}

interface Capture {
  headers: import('node:http').IncomingHttpHeaders
  events: WireEvent[]
}

const servers: Server[] = []

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.close()
    server.closeAllConnections()
  }
})

async function mockYiTrace(statuses: readonly number[] = []): Promise<{ url: string; captures: Capture[] }> {
  const captures: Capture[] = []
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', chunk => chunks.push(chunk as Buffer))
    request.on('end', () => {
      captures.push({
        headers: request.headers,
        events: JSON.parse(Buffer.concat(chunks).toString()) as WireEvent[],
      })
      const status = statuses[captures.length - 1] ?? 200
      response.writeHead(status, { 'content-type': 'application/json' }).end('{}')
    })
  })
  servers.push(server)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('yiTrace mock has no port')
  return { url: `http://127.0.0.1:${address.port}/v1/ingest`, captures }
}

function flatten(captures: Capture[]): WireEvent[] {
  return captures.flatMap(capture => capture.events)
}

describe('DshTrace wire', () => {
  it('maps one turn into turn, step, and tool spans through the real SDK pipeline', async () => {
    const { url, captures } = await mockYiTrace()
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    const fiber = await ctx.plugin(DshTrace, {
      exporter: { url, token: 'wire-token', tenantId: '7' },
      batchSize: 3,
      nodeId: 9,
      agentName: 'dsh-test-agent',
    })

    const session = ctx.sessions.create(SessionId('wire-session'), { meta: { cwd: '/tmp/project' } })
    const callId = CallId('call-1')
    session.append('turn/start', { turn: 1 })
    session.append('step/start', { turn: 1, step: 1 })
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'check this repository' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    session.append('assistant/message', {
      turn: 1,
      step: 1,
      message: createAssistantMessage({
        content: [{ type: 'tool-call', id: callId, name: 'bash', arguments: '{"command":"pwd"}' }],
        source: { provider: 'mock-provider', model: 'mock-model' },
      }),
      usage: { inputTokens: 11, outputTokens: 3, cacheReadTokens: 2, reasoningTokens: 1 },
    }, { surfaceOp: 'append' })
    session.append('tool/call', { turn: 1, step: 1, callId, name: 'bash', arguments: '{"command":"pwd"}' })
    session.append('tool/result', {
      turn: 1,
      step: 1,
      message: createToolResultMessage({
        callId,
        content: [{ type: 'text', text: '/tmp/project' }],
        isError: false,
      }),
    }, { surfaceOp: 'append' })
    session.append('step/end', { turn: 1, step: 1 })
    session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
    await fiber.dispose()

    const events = flatten(captures)
    expect(events.length).toBeGreaterThan(0)
    expect(captures[0]?.headers.authorization).toBe('Bearer wire-token')
    expect(captures[0]?.headers['x-tenant-id']).toBe('7')

    const starts = events.filter(event => event.event_type === 1)
    const turn = starts.find(event => event.span_name === 'dsh.turn')
    const step = starts.find(event => event.span_name === 'dsh.step')
    const tool = starts.find(event => event.span_name === 'tool.bash')
    expect(turn).toBeDefined()
    expect(step?.parent_span_id).toBe(turn?.span_id)
    expect(tool?.parent_span_id).toBe(step?.span_id)
    expect(new Set(starts.map(event => event.trace_id))).toEqual(new Set([turn?.trace_id]))
    expect(new Set(starts.map(event => event.session_id)).size).toBe(1)
    expect(starts.every(event => event.tenant_id === '7')).toBe(true)
    expect(starts.every(event => event.agent_name === 'dsh-test-agent')).toBe(true)

    const stepEnd = events.find(event => event.event_type === 2 && event.span_id === step?.span_id)
    expect(stepEnd).toMatchObject({
      status: 0,
      input_tokens: '11',
      output_tokens: '3',
      cache_read_tokens: '2',
      model: 'mock-model',
      input_text: 'check this repository',
    })
    expect(stepEnd?.output_text).toContain('bash({"command":"pwd"})')
    expect(stepEnd?.attrs).toMatchObject({
      'llm.provider': 'mock-provider',
      'llm.reasoning_tokens': 1,
    })

    const toolEnd = events.find(event => event.event_type === 2 && event.span_id === tool?.span_id)
    expect(toolEnd).toMatchObject({
      status: 0,
      tool_name: 'bash',
      input_text: '{"command":"pwd"}',
      output_text: '/tmp/project',
    })
    const turnEnd = events.find(event => event.event_type === 2 && event.span_id === turn?.span_id)
    expect(turnEnd?.status).toBe(0)
    expect(BigInt(turnEnd!.duration_ns!)).toBeGreaterThanOrEqual(0n)
    expect(new Set(events.map(event => event.event_id)).size).toBe(events.length)
  })

  it('fails loud on invalid transport and identity configuration', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await expect(ctx.plugin(DshTrace, {
      exporter: { url: 'file:///tmp/traces' },
    })).rejects.toThrow('exporter.url must be http(s)')
    await expect(ctx.plugin(DshTrace, {
      exporter: { url: 'http://127.0.0.1:7878/v1/ingest', tenantId: '-1' },
    })).rejects.toThrow('exporter.tenantId must be an unsigned 64-bit integer')
    await expect(ctx.plugin(DshTrace, {
      exporter: { url: 'http://127.0.0.1:7878/v1/ingest' },
      nodeId: 1024,
    })).rejects.toThrow('nodeId must be an integer from 0 through 1023')
  })

  it('retries the SDK HTTP failure buffer at a natural flush before shutdown', async () => {
    const { url, captures } = await mockYiTrace([503, 200])
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    const fiber = await ctx.plugin(DshTrace, {
      exporter: { url },
      batchSize: 1,
    })
    const session = ctx.sessions.create(SessionId('retry-session'), { meta: {} })
    session.append('turn/start', { turn: 1 })

    ctx.telemetry.flush?.()
    await fiber.dispose()

    expect(captures.length).toBeGreaterThanOrEqual(2)
    const firstEventId = captures[0]?.events[0]?.event_id
    expect(firstEventId).toBeDefined()
    expect(captures.slice(1).some(capture => capture.events.some(event => event.event_id === firstEventId))).toBe(true)
  })

  it('recovers positioned error events into failed spans without an earlier lifecycle prefix', async () => {
    const { url, captures } = await mockYiTrace()
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    const fiber = await ctx.plugin(DshTrace, {
      exporter: { url },
      batchSize: 2,
    })

    ctx.telemetry.emit({
      channel: 'ops',
      time: Date.now(),
      severity: 'error',
      attributes: {
        'telemetry.op': 'agent-error',
        'session.id': 'recovered-session',
        turn: 2,
        step: 3,
        'error.name': 'ProviderFailure',
      },
      body: { message: 'provider unavailable' },
    })
    await fiber.dispose()

    const events = flatten(captures)
    const turn = events.find(event => event.event_type === 2
      && event.attrs['dsh.turn'] === 2 && event.attrs['dsh.step'] === undefined)
    const step = events.find(event => event.event_type === 2 && event.attrs['dsh.step'] === 3)
    expect(turn).toMatchObject({ status: 1 })
    expect(turn?.attrs['dsh.recovered_segment']).toBe(true)
    expect(step).toMatchObject({ status: 1 })
    expect(step?.attrs).toMatchObject({
      'dsh.recovered_segment': true,
      'error.name': 'ProviderFailure',
    })
    expect(events.flatMap(event => event.logs)).toContain(JSON.stringify({ message: 'provider unavailable' }))
  })

  it('keeps concurrent sessions in separate yiTrace traces', async () => {
    const { url, captures } = await mockYiTrace()
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    const fiber = await ctx.plugin(DshTrace, {
      exporter: { url },
      batchSize: 2,
    })

    const first = ctx.sessions.create(SessionId('parallel-session-a'), { meta: {} })
    const second = ctx.sessions.create(SessionId('parallel-session-b'), { meta: {} })
    first.append('turn/start', { turn: 1 })
    second.append('turn/start', { turn: 1 })
    first.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
    second.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
    await fiber.dispose()

    const starts = flatten(captures).filter(event => event.event_type === 1 && event.span_name === 'dsh.turn')
    const ends = flatten(captures).filter(event => event.event_type === 2
      && starts.some(start => start.span_id === event.span_id))
    expect(starts).toHaveLength(2)
    expect(new Set(starts.map(event => event.trace_id)).size).toBe(2)
    expect(new Set(starts.map(event => event.session_id)).size).toBe(2)
    expect(new Set(ends.map(event => event.attrs['dsh.session.id']))).toEqual(
      new Set(['parallel-session-a', 'parallel-session-b']),
    )
  })

  it('records a failed orphan tool result as a recovered error span', async () => {
    const { url, captures } = await mockYiTrace()
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    const fiber = await ctx.plugin(DshTrace, {
      exporter: { url },
      batchSize: 2,
    })

    const session = ctx.sessions.create(SessionId('orphan-tool-session'), { meta: {} })
    const callId = CallId('missing-call')
    session.append('turn/start', { turn: 1 })
    session.append('step/start', { turn: 1, step: 1 })
    session.append('tool/result', {
      turn: 1,
      step: 1,
      message: createToolResultMessage({
        callId,
        content: [{ type: 'text', text: 'tool process exited unexpectedly' }],
        isError: true,
      }),
      error: { name: 'SubprocessFailure', code: 'EXITED' },
    }, { surfaceOp: 'append' })
    session.append('step/end', { turn: 1, step: 1 })
    session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
    await fiber.dispose()

    const events = flatten(captures)
    const toolStart = events.find(event => event.event_type === 1 && event.span_name === 'tool.unknown')
    const toolEnd = events.find(event => event.event_type === 2 && event.span_id === toolStart?.span_id)
    expect(toolStart?.parent_span_id).not.toBeNull()
    expect(toolEnd).toMatchObject({
      status: 1,
      tool_name: 'unknown',
      output_text: 'tool process exited unexpectedly',
    })
    expect(toolEnd?.attrs).toMatchObject({
      'dsh.recovered_segment': true,
      'dsh.tool.call_id': 'missing-call',
      'error.name': 'SubprocessFailure',
      'error.code': 'EXITED',
    })
  })
})

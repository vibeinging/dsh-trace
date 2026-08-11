/**
 * yiTrace backend unit tier: project real session records into the embedded
 * database, close it, reopen it, and assert the durable trace read model.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from 'cordis'
import { YiTraceDB } from '@yitrace/db'
import {
  CallId,
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage,
} from '@deepseek-ai/dsh-llm'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import DshTrace, { type Config } from '../src/index.ts'

interface StoredTraceSummary {
  trace_id: string | number
  external_trace_id: string
  span_count: number
  error_count: number
  total_input_tokens: number | null
  total_output_tokens: number | null
  total_cache_read_tokens: number | null
}

interface StoredTraceSpan {
  id: string
  parentId: string | null
  externalSpanId: string
  externalParentSpanId: string | null
  externalSessionId: string | null
  spanName: string
  agentName: string | null
  toolName: string | null
  status: string
  inTok: number
  outTok: number
  cacheReadTokens: number | null
  model: string | null
  attrs: Record<string, unknown>
  logEvents: Array<{ messages: string[] }>
}

interface StoredTraceDetail {
  spans: StoredTraceSpan[]
}

interface StoredSpanDetail {
  id: string
  externalSpanId: string
  externalParentSpanId: string | null
  spanName: string
  agentName: string | null
  toolName: string | null
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number | null
  model: string | null
  input: string | null
  output: string | null
  attrs: Record<string, unknown>
  logEvents: Array<{ messages: string[] }>
}

interface StoredTrace {
  summary: StoredTraceSummary
  detail: StoredTraceDetail
  spans: StoredSpanDetail[]
}

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

async function traceDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-trace-embedded-'))
  directories.push(directory)
  return directory
}

async function readTraces(dataDir: string, tenantId?: string | number): Promise<StoredTrace[]> {
  const database = await YiTraceDB.open({ dataDir, ...tenantId === undefined ? {} : { tenantId } })
  try {
    const summaries = await database.traces<StoredTraceSummary>()
    return await Promise.all(summaries.map(async (summary) => {
      const traceId = summary.external_trace_id ?? summary.trace_id
      const detail = await database.trace<StoredTraceDetail>(traceId)
      if (detail === null) throw new Error(`missing embedded trace detail: ${String(traceId)}`)
      const spans = await Promise.all(detail.spans.map(async (span) => {
        const stored = await database.span<StoredSpanDetail>(traceId, span.externalSpanId ?? span.id)
        if (stored === null) throw new Error(`missing embedded span detail: ${span.id}`)
        return stored
      }))
      return { summary, detail, spans }
    }))
  } finally {
    await database.close()
  }
}

async function loadTrace(config: Config): Promise<{ ctx: Context; fiber: Awaited<ReturnType<Context['plugin']>> }> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  const fiber = await ctx.plugin(DshTrace, config)
  return { ctx, fiber }
}

describe('DshTrace embedded database', () => {
  it('persists one turn as turn, step, and tool spans', async () => {
    const dataDir = await traceDirectory()
    const { ctx, fiber } = await loadTrace({
      database: { dataDir, tenantId: '7' },
      batchSize: 3,
      nodeId: 9,
      agentName: 'dsh-test-agent',
    })

    const session = ctx.sessions.create(SessionId('embedded-session'), { meta: { cwd: '/tmp/project' } })
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

    const [stored] = await readTraces(dataDir, '7')
    expect(stored?.summary).toMatchObject({
      span_count: 3,
      error_count: 0,
      total_input_tokens: 11,
      total_output_tokens: 3,
      total_cache_read_tokens: 2,
    })
    const turn = stored?.detail.spans.find(span => span.spanName === 'dsh.turn')
    const step = stored?.detail.spans.find(span => span.spanName === 'dsh.step')
    const tool = stored?.detail.spans.find(span => span.spanName === 'tool.bash')
    expect(turn).toMatchObject({ parentId: null, status: 'ok', agentName: 'dsh-test-agent' })
    expect(step?.externalParentSpanId).toBe(turn?.externalSpanId)
    expect(tool?.externalParentSpanId).toBe(step?.externalSpanId)
    expect(new Set(stored?.detail.spans.map(span => span.externalSessionId))).toHaveLength(1)

    const stepDetail = stored?.spans.find(span => span.spanName === 'dsh.step')
    expect(stepDetail).toMatchObject({
      inputTokens: 11,
      outputTokens: 3,
      cacheReadTokens: 2,
      model: 'mock-model',
      input: 'check this repository',
      output: 'bash({"command":"pwd"})',
    })
    expect(stepDetail?.attrs).toMatchObject({
      'llm.provider': 'mock-provider',
      'llm.reasoning_tokens': 1,
    })
    expect(stored?.spans.find(span => span.spanName === 'tool.bash')).toMatchObject({
      toolName: 'bash',
      input: '{"command":"pwd"}',
      output: '/tmp/project',
    })
  })

  it('fails loud on invalid database and identity configuration', async () => {
    async function expectInvalid(config: Config, message: string): Promise<void> {
      const ctx = new Context()
      await ctx.plugin(SessionStore)
      try {
        await expect(ctx.plugin(DshTrace, config)).rejects.toThrow(message)
      } finally {
        await ctx.fiber.dispose()
      }
    }

    await expectInvalid({ database: { dataDir: '   ' } }, 'database.dataDir must not be empty')
    await expectInvalid({ database: { dataDir: '/tmp/traces', tenantId: '-1' } }, 'database.tenantId must be an unsigned 64-bit integer')
    await expectInvalid({ database: { dataDir: '/tmp/traces' }, nodeId: 1024 }, 'nodeId must be an integer from 0 through 1023')
  })

  it('drains a natural flush and reopens the durable database after shutdown', async () => {
    const dataDir = await traceDirectory()
    const { ctx, fiber } = await loadTrace({ database: { dataDir }, batchSize: 64 })
    const session = ctx.sessions.create(SessionId('flush-session'), { meta: {} })
    session.append('turn/start', { turn: 1 })

    ctx.telemetry.flush?.()
    await fiber.dispose()

    const firstRead = await readTraces(dataDir)
    const secondRead = await readTraces(dataDir)
    expect(firstRead).toHaveLength(1)
    expect(firstRead[0]?.summary.span_count).toBe(1)
    expect(firstRead[0]?.summary.error_count).toBe(1)
    expect(secondRead[0]?.summary.external_trace_id).toBe(firstRead[0]?.summary.external_trace_id)
  })

  it('recovers positioned error events into failed spans without an earlier lifecycle prefix', async () => {
    const dataDir = await traceDirectory()
    const { ctx, fiber } = await loadTrace({ database: { dataDir }, batchSize: 2 })

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

    const [stored] = await readTraces(dataDir)
    const turn = stored?.detail.spans.find(span => span.spanName === 'dsh.turn')
    const step = stored?.detail.spans.find(span => span.spanName === 'dsh.step')
    expect(turn).toMatchObject({ status: 'error', attrs: { 'dsh.recovered_segment': true } })
    expect(step).toMatchObject({
      status: 'error',
      attrs: {
        'dsh.recovered_segment': true,
        'error.name': 'ProviderFailure',
      },
    })
    expect(step?.logEvents.flatMap(event => event.messages)).toContain(JSON.stringify({ message: 'provider unavailable' }))
  })

  it('keeps concurrent sessions in separate yiTrace traces', async () => {
    const dataDir = await traceDirectory()
    const { ctx, fiber } = await loadTrace({ database: { dataDir }, batchSize: 2 })

    const first = ctx.sessions.create(SessionId('parallel-session-a'), { meta: {} })
    const second = ctx.sessions.create(SessionId('parallel-session-b'), { meta: {} })
    first.append('turn/start', { turn: 1 })
    second.append('turn/start', { turn: 1 })
    first.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
    second.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
    await fiber.dispose()

    const traces = await readTraces(dataDir)
    expect(traces).toHaveLength(2)
    expect(new Set(traces.map(trace => trace.summary.external_trace_id)).size).toBe(2)
    expect(new Set(traces.map(trace => trace.detail.spans[0]?.externalSessionId)).size).toBe(2)
    expect(new Set(traces.map(trace => trace.detail.spans[0]?.attrs['dsh.session.id']))).toEqual(
      new Set(['parallel-session-a', 'parallel-session-b']),
    )
  })

  it('records a failed orphan tool result as a recovered error span', async () => {
    const dataDir = await traceDirectory()
    const { ctx, fiber } = await loadTrace({ database: { dataDir }, batchSize: 2 })

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

    const [stored] = await readTraces(dataDir)
    const tool = stored?.spans.find(span => span.spanName === 'tool.unknown')
    expect(tool?.externalParentSpanId).not.toBeNull()
    expect(tool).toMatchObject({
      toolName: 'unknown',
      output: 'tool process exited unexpectedly',
      attrs: {
        'dsh.recovered_segment': true,
        'dsh.tool.call_id': 'missing-call',
        'error.name': 'SubprocessFailure',
        'error.code': 'EXITED',
      },
    })
    expect(stored?.detail.spans.find(span => span.spanName === 'tool.unknown')?.status).toBe('error')
  })
})

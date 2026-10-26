import { describe, expect, it } from 'vitest'
import type { TrajectorySnapshot } from '@deepseek-ai/dsh-client-ui-trajectory/client'
import { aggregateUsage, buildTrace } from '../src/model.ts'

type Node = TrajectorySnapshot['eventNodes'][number]
type Assistant = Extract<Node, { kind: 'assistant' }>
type Result = Extract<Node, { kind: 'tool-result' }>
type Request = TrajectorySnapshot['requests'][number]
type AssistantRequest = Extract<Request, { purpose: 'assistant' }>

function snapshot(change: Partial<TrajectorySnapshot> = {}): TrajectorySnapshot {
  return { eventNodes: [], eventLocations: new Map(), requests: [], callSchemas: new Map(), partial: null, runningCalls: [], ...change }
}

function assistant(change: Partial<Assistant> = {}): Assistant {
  return { kind: 'assistant', seq: 10, time: 3000, turn: 2, step: 1,
    blocks: [{ kind: 'text', text: 'Read the failing case.' }, { kind: 'tool-call', callId: 'read-1', name: 'read', argsRaw: '{"path":"case.ts"}' }],
    timing: { stepStartTime: 1000, firstTokenTime: 1500, completedTime: 3000 },
    usage: { inputTokens: 100, outputTokens: 20, cacheReadTokens: 80 }, ...change }
}

function request(change: Partial<AssistantRequest> = {}): AssistantRequest {
  return { purpose: 'assistant', turn: 2, step: 1, startSeq: 5, startedAt: 1000, completedAt: 3000,
    status: 'complete', resultSeq: 10, usage: { inputTokens: 100, outputTokens: 20, cacheReadTokens: 80 }, ...change }
}

function tool(change: Partial<Result> = {}): Result {
  return { kind: 'tool-result', seq: 12, time: 4000, callId: 'read-1', name: 'read',
    args: null as never, call: { name: 'read', argsRaw: '{"path":"case.ts"}' }, callTime: 3100,
    content: [{ type: 'text', text: 'case source' }], isError: false, subCalls: [], ...change }
}

describe('buildTrace', () => {
  it('counts one model request when both the request and assistant carry the same usage', () => {
    const data = buildTrace(snapshot({ eventNodes: [assistant(), tool()], requests: [request()] }), 'session')
    expect(data.rows).toHaveLength(2)
    expect(data.turns[0]?.usage).toMatchObject({ inputTokens: 100, outputTokens: 20, cacheReadTokens: 80, cacheWriteTokens: null, reportedRequests: 1, missingRequests: 0 })
    expect(aggregateUsage([...data.rows, ...data.rows])?.inputTokens).toBe(100)
    expect(data.rows.find(row => row.kind === 'tool')).toMatchObject({ parentId: 'session:model:2:1', turn: 2, step: 1, durationMs: 900 })
  })

  it('preserves selection identities as older requests arrive and missing timing becomes available', () => {
    const tail = buildTrace(snapshot({ eventNodes: [assistant(), tool({ callTime: null })] }), 'session', { hasMore: true })
    const full = buildTrace(snapshot({ eventNodes: [assistant({ turn: 1, seq: 1 }), assistant(), tool()], requests: [request()] }), 'session')
    expect(tail.rows.find(row => row.kind === 'model')?.id).toBe(full.rows.find(row => row.turn === 2 && row.kind === 'model')?.id)
    expect(tail.rows.find(row => row.kind === 'tool')?.id).toBe(full.rows.find(row => row.kind === 'tool')?.id)
    expect(tail.rows.find(row => row.kind === 'tool')?.durationMs).toBeNull()
    expect(full.rows.find(row => row.kind === 'tool')?.durationMs).toBe(900)
    expect(tail.partialHistory).toBe(true)
    expect(tail.turns[0]?.durationMs).toBeNull()
  })

  it('retains real nested tool calls and does not duplicate their independent result rows', () => {
    const child = tool({ callId: 'child', parentCallId: 'read-1', name: 'subtool', seq: 11, callTime: 3200, time: 3500 })
    const data = buildTrace(snapshot({ eventNodes: [assistant(), child, tool({ subCalls: [child] })] }), 'session')
    expect(data.rows.filter(row => row.kind === 'tool')).toHaveLength(2)
    expect(data.rows.find(row => row.id === 'session:tool:child')).toMatchObject({ parentId: 'session:tool:read-1', turn: 2, step: 1, durationMs: 300 })
  })

  it('prefers a real subCalls edge over a model callId link even without parentCallId', () => {
    const child = tool({ callId: 'child', name: 'subtool', seq: 11, callTime: 3200, time: 3500 })
    const parent = tool({ subCalls: [child] })
    const node = assistant({ blocks: [
      { kind: 'tool-call', callId: 'read-1', name: 'read', argsRaw: '{}' },
      { kind: 'tool-call', callId: 'child', name: 'subtool', argsRaw: '{}' },
    ] })
    for (const eventNodes of [[node, child, parent], [node, parent, child]]) {
      const data = buildTrace(snapshot({ eventNodes }), 'session')
      expect(data.rows.find(row => row.id === 'session:tool:child')).toMatchObject({ parentId: 'session:tool:read-1', turn: 2, step: 1 })
    }
  })

  it('does not assign an orphan tool to the nearest model or invent its arguments or duration', () => {
    const data = buildTrace(snapshot({ eventNodes: [assistant({ blocks: [] }), tool({ callId: 'orphan', call: null, callTime: null })] }), 'session')
    expect(data.rows.find(row => row.kind === 'tool')).toMatchObject({ turn: null, step: null, parentId: null, durationMs: null, input: null })
  })

  it('merges a partial model into its running request without completing it or making elapsed time', () => {
    const data = buildTrace(snapshot({ requests: [request({ completedAt: null, status: 'running', usage: undefined })],
      partial: { turn: 2, step: 1, blocks: [{ kind: 'text', text: 'Working' }], timing: { stepStartTime: 1000, firstTokenTime: 1100 } } }), 'session')
    expect(data.rows).toHaveLength(1)
    expect(data.rows[0]).toMatchObject({ status: 'running', durationMs: null, endTime: null, output: 'Working', usage: null })
    expect(data.turns[0]?.usage).toMatchObject({ inputTokens: null, outputTokens: null, missingRequests: 1, reportedRequests: 0 })
  })

  it('prefers terminal tool results over an old running view of the same call', () => {
    const data = buildTrace(snapshot({ eventNodes: [assistant(), tool({ isError: true, content: [{ type: 'text', text: 'Exit code: 1' }] })],
      runningCalls: [{ phase: 'start', callId: 'read-1', name: 'read', turn: 2, step: 1, time: 3100, argsRaw: '{}', args: null as never, subCalls: [] }] }), 'session')
    expect(data.rows.filter(row => row.kind === 'tool')).toHaveLength(1)
    expect(data.rows.find(row => row.kind === 'tool')).toMatchObject({ status: 'failed', output: 'Exit code: 1' })
  })

  it('preserves mixed tool output while hiding reasoning and keeping text-only output readable', () => {
    const content: Result['content'] = [
      { type: 'text', text: 'Screenshot captured.' },
      { type: 'reasoning', text: 'private tool reasoning' },
      { type: 'image', attachment: { attachmentId: 'screenshot' as never, mediaType: 'image/png', bytes: 42, width: 800, height: 600 } },
      { type: 'text', text: 'Review the highlighted region.' },
    ]
    const data = buildTrace(snapshot({ eventNodes: [tool({ content }), tool({ callId: 'text-only', seq: 13,
      content: [{ type: 'text', text: 'First result.' }, { type: 'text', text: 'Second result.' }] })] }), 'session')
    expect(data.rows.find(row => row.id === 'session:tool:read-1')?.output).toEqual([content[0], content[2], content[3]])
    expect(data.rows.find(row => row.id === 'session:tool:text-only')?.output).toBe('First result.\n\nSecond result.')
    expect(JSON.stringify(data.rows)).not.toContain('private tool reasoning')
  })

  it('keeps an earlier retry error as data without marking its recovered request failed', () => {
    const data = buildTrace(snapshot({ requests: [request({ error: 'old attempt failed', retry: 1 })], eventNodes: [assistant()] }), 'session')
    expect(data.rows[0]).toMatchObject({ status: 'completed', error: null })
    expect(data.rows[0]?.raw).toMatchObject({ request: { error: 'old attempt failed' } })
  })

  it('exposes only recorded prompt inputs and excludes reasoning from ordinary model output', () => {
    const prompt = { config: { provider: 'provider', model: 'model' }, system: 'system prompt', tools: [] }
    const data = buildTrace(snapshot({ requests: [request({ prompt })], eventNodes: [assistant({ blocks: [{ kind: 'reasoning', text: 'internal trace' }, { kind: 'text', text: 'answer' }] })] }), 'session')
    expect(data.rows[0]?.input).toEqual(prompt)
    expect(data.rows[0]?.output).toBe('answer')
    expect(JSON.stringify(data.rows[0]?.raw)).not.toContain('internal trace')
  })

  it('does not mark a turn completed merely because its currently loaded calls completed', () => {
    const data = buildTrace(snapshot({ eventNodes: [assistant()] }), 'session')
    expect(data.rows[0]?.status).toBe('completed')
    expect(data.turns[0]?.status).toBe('unknown')
    expect(data.turns[0]?.timingComplete).toBe(false)
    expect(data.turns[0]?.observedStartTime).toBe(1000)
    expect(data.turns[0]?.observedEndTime).toBe(3000)
  })

  it('does not normalize missing provider counters to zero or add cache reads into uncached input', () => {
    const data = buildTrace(snapshot({ requests: [request({ usage: { inputTokens: 0, outputTokens: 2, cacheReadTokens: 100 } }), request({ turn: 3, startSeq: 20, usage: undefined })] }), 'session')
    expect(aggregateUsage(data.rows)).toMatchObject({ inputTokens: 0, outputTokens: 2, cacheReadTokens: 100, cacheWriteTokens: null, reportedRequests: 1, missingRequests: 1 })
  })

  it('retains a standalone compaction outside the turn even when a different turn is streaming', () => {
    const data = buildTrace(snapshot({ requests: [{ purpose: 'compaction', turn: null, step: 0, startSeq: 1,
      startedAt: 100, completedAt: 500, status: 'complete', summary: [{ type: 'text', text: 'summary' }] }],
      partial: { turn: 2, step: 1, blocks: [] } }), 'session')
    expect(data.rows.find(row => row.kind === 'compaction')).toMatchObject({ turn: null, step: 0, durationMs: 400, output: 'summary' })
    expect(data.turns).toHaveLength(2)
  })

  it('reads a complete turn boundary without clearing an intermediate failed call', () => {
    type Location = TrajectorySnapshot['eventLocations'] extends ReadonlyMap<number, infer Value> ? Value : never
    const location: Location = { kind: 'turn', turn: { turn: 2, start: { type: 'turn/start', seq: 1 as never, time: 500, data: { turn: 2 } },
      end: { type: 'turn/end', seq: 20 as never, time: 5000, data: { turn: 2, reason: { kind: 'completed' } } },
      status: 'closed', steps: [], data: { get: () => undefined, source: () => ({ getSnapshot: () => undefined, subscribe: () => () => {} }) } } }
    const data = buildTrace(snapshot({ eventNodes: [assistant(), tool({ isError: true })], eventLocations: new Map([[10, location]]) }), 'session')
    expect(data.turns[0]).toMatchObject({ status: 'completed', startTime: 500, endTime: 5000, durationMs: 4500, timingComplete: true, errorCount: 1 })
    expect(data.rows.find(row => row.kind === 'tool')?.status).toBe('failed')
  })

  it('recognizes the lowercase interruption code emitted by the official trajectory', () => {
    const data = buildTrace(snapshot({ eventNodes: [tool({ isError: true, error: { name: 'Interrupted', code: 'interrupted' } })] }), 'session')
    expect(data.rows[0]?.status).toBe('interrupted')
  })

  it('marks partial usage while keeping known counters available', () => {
    const data = buildTrace(snapshot({ requests: [request({ usage: { inputTokens: 8 } })] }), 'session')
    expect(data.turns[0]?.usage).toMatchObject({ inputTokens: 8, outputTokens: null, reportedRequests: 0, missingRequests: 1 })
  })
})

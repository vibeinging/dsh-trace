import { describe, expect, it } from 'vitest'
import type {} from '@deepseek-ai/dsh-compaction/types'
import type { SessionEvent } from '@deepseek-ai/dsh-session/types'
import { captureSessionEvent } from '../src/host/capture.ts'

const position = { seq: 37 as SessionEvent['seq'], time: 1792992200123 }
type Assistant = SessionEvent<'assistant/message'>['data']['message']
type ToolMessage = SessionEvent<'tool/result'>['data']['message']
const callId = 'read-1' as ToolMessage['toolCallId']

function assistant(data: Partial<SessionEvent<'assistant/message'>['data']> = {}): SessionEvent<'assistant/message'> {
  return {
    ...position, type: 'assistant/message', surfaceOp: 'append',
    data: {
      turn: 4, step: 2, stream: [],
      message: { id: 'answer-1' as Assistant['id'], role: 'assistant', source: { kind: 'model', provider: 'deepseek', model: 'v4' }, content: [{ type: 'text', text: 'Visible answer' }] },
      ...data,
    },
  }
}

describe('live session capture whitelist', () => {
  it('records original identity and lifecycle endings without inventing a turn', () => {
    const start: SessionEvent<'turn/start'> = { ...position, type: 'turn/start', data: { turn: 4 } }
    expect(captureSessionEvent('session-1', start)).toEqual({
      sessionId: 'session-1', ...position, type: 'turn/start', turn: 4, point: 'lifecycle', failed: false, metadata: { status: 'running' },
    })
    const reasons: SessionEvent<'turn/end'>['data']['reason'][] = [
      { kind: 'completed' }, { kind: 'blocked' }, { kind: 'max-tokens' },
      { kind: 'aborted', reason: { kind: 'user' } }, { kind: 'interrupted' }, { kind: 'forked' },
      { kind: 'error', error: { message: 'secret provider message', code: 'TIMEOUT' } },
    ]
    expect(reasons.map(reason => captureSessionEvent('session-1', { ...position, type: 'turn/end', data: { turn: 4, reason } })?.end))
      .toEqual(['completed', 'failed', 'failed', 'interrupted', 'interrupted', 'interrupted', 'failed'])
    const failure = captureSessionEvent('session-1', { ...position, type: 'turn/end', data: { turn: 4, reason: reasons[6]! } })
    expect(failure).toMatchObject({ failed: true, metadata: { errorCode: 'TIMEOUT' } })
    expect(JSON.stringify(failure)).not.toContain('secret provider message')
  })

  it('keeps only provider and model from request configuration', () => {
    const config = { provider: 'provider', model: 'model', headers: { Authorization: 'Bearer never-store' }, apiKey: 'api-secret', baseUrl: 'https://example.test/?key=do-not-store' }
    const event: SessionEvent<'request/header'> = { ...position, type: 'request/header', data: { header: { config, tools: [{ name: 'secret-schema', description: 'internal tool instructions', parameters: {} }] }, reason: 'initial' } }
    const result = captureSessionEvent('session-1', event)
    expect(result).toEqual({ sessionId: 'session-1', ...position, type: 'request/header', point: 'model', turn: null, failed: false, metadata: { provider: 'provider', model: 'model' } })
    expect(JSON.stringify(result)).not.toMatch(/never-store|api-secret|do-not-store|internal tool instructions/)
  })

  it('does not declare successful model completion from a step boundary alone', () => {
    const start: SessionEvent<'step/start'> = { ...position, type: 'step/start', data: { turn: 4, step: 2 } }
    const end: SessionEvent<'step/end'> = { ...position, type: 'step/end', data: { turn: 4, step: 2 } }
    expect(captureSessionEvent('s', start)).toMatchObject({ point: 'model', metadata: { step: 2, status: 'running' } })
    expect(captureSessionEvent('s', end)).toMatchObject({ metadata: { status: 'ended' } })
    expect(captureSessionEvent('s', end)).not.toHaveProperty('end')
  })

  it('copies visible model text, but never reasoning, replay state or duplicate tool calls', () => {
    const source = { kind: 'model' as const, provider: 'deepseek', model: 'v4', replayState: { credentials: 'private-replay' } }
    const event = assistant({ message: {
      id: 'answer-2' as Assistant['id'], role: 'assistant', source,
      content: [{ type: 'text', text: 'First' }, { type: 'reasoning', text: 'private thought' }, { type: 'tool-call', id: callId, name: 'read', arguments: '{"secret":"tool-call-already-logged"}' }, { type: 'text', text: 'Second' }],
    } })
    const result = captureSessionEvent('s', event)
    expect(result?.output).toBe('First\n\nSecond')
    expect(result?.metadata).toEqual({ provider: 'deepseek', model: 'v4', step: 2, status: 'completed' })
    expect(JSON.stringify(result)).not.toMatch(/private thought|private-replay|tool-call-already-logged/)
  })

  it('keeps actual usage values and omits missing counters', () => {
    const result = captureSessionEvent('s', assistant({ usage: { inputTokens: 18, outputTokens: 0, cacheReadTokens: 7 } }))
    expect(result?.metadata).toMatchObject({ inputTokens: 18, outputTokens: 0, cacheReadTokens: 7 })
    expect(result?.metadata).not.toHaveProperty('cacheWriteTokens')
    expect(result?.metadata).not.toHaveProperty('reasoningTokens')
    const missing = captureSessionEvent('s', assistant())
    expect(missing?.metadata).not.toHaveProperty('inputTokens')
    expect(missing?.metadata).not.toHaveProperty('outputTokens')
  })

  it('retains one failed attempt with safe status and usage instead of its raw stream', () => {
    const event: SessionEvent<'assistant/attempt'> = { ...position, type: 'assistant/attempt', data: { turn: 4, step: 2, stream: [
      { type: 'reasoning-chunks', index: 0, time0: 100, dt: [], texts: ['secret reasoning'] },
      { type: 'text-chunks', index: 1, time0: 110, dt: [], texts: ['uncommitted answer'] },
      { type: 'chunk', time: 120, chunk: { type: 'usage', usage: { inputTokens: 10, outputTokens: 3, reasoningTokens: 2 } } },
      { type: 'chunk', time: 130, chunk: { type: 'finish', reason: { kind: 'error', failure: { code: 'RATE_LIMIT', message: 'server error with credentials' } } } },
    ] } }
    const result = captureSessionEvent('s', event)
    expect(result).toMatchObject({ type: 'assistant/attempt', failed: true, metadata: { step: 2, status: 'failed', reason: 'error', errorCode: 'RATE_LIMIT', inputTokens: 10, outputTokens: 3, reasoningTokens: 2 } })
    expect(result).not.toHaveProperty('output')
    expect(result).not.toHaveProperty('end')
    expect(JSON.stringify(result)).not.toMatch(/secret reasoning|uncommitted answer|server error with credentials/)
  })

  it('marks a cancelled assistant prefix interrupted while preserving visible text', () => {
    const event = assistant({ interrupted: true, stream: [{ type: 'chunk', time: 130, chunk: { type: 'finish', reason: { kind: 'aborted', failure: { code: 'CANCELLED', message: 'private reason' } } } }] })
    expect(captureSessionEvent('s', event)).toMatchObject({ failed: false, output: 'Visible answer', metadata: { status: 'interrupted', reason: 'aborted', errorCode: 'CANCELLED' } })
  })

  it('keeps tool arguments as ordinary JSON without reasoning or full headers', () => {
    const event: SessionEvent<'tool/call'> = { ...position, type: 'tool/call', data: { turn: 4, step: 2, callId, name: 'read', arguments: JSON.stringify({ path: 'src/index.ts', headers: { authorization: 'Bearer no' }, apiKey: 'private-key', parts: [{ type: 'reasoning', text: 'private thought' }, { type: 'text', text: 'ordinary content' }], nested: { reasoning_content: 'private nested', keep: 3 } }) } }
    const result = captureSessionEvent('s', event)
    expect(result).toMatchObject({ point: 'tool', metadata: { step: 2, toolName: 'read', callId, status: 'running' }, input: { path: 'src/index.ts', parts: [{ type: 'text', text: 'ordinary content' }], nested: { keep: 3 } } })
    expect(JSON.stringify(result)).not.toMatch(/Bearer no|private-key|private thought|private nested/)
  })

  it('records failed tool identity and text without private presentation metadata', () => {
    const event: SessionEvent<'tool/result'> = { ...position, type: 'tool/result', surfaceOp: 'append', data: {
      turn: 4, step: 2,
      message: { id: 'result-1' as ToolMessage['id'], role: 'tool', source: { kind: 'tool', callId }, toolCallId: callId, isError: true, content: [{ type: 'text', text: 'Permission denied' }, { type: 'reasoning', text: 'private tool reasoning' }] },
      error: { name: 'FileAccessError', code: 'EACCES', reason: 'private filesystem reason' }, meta: { internalDiff: 'private presentation' },
    } }
    const result = captureSessionEvent('s', event)
    expect(result).toMatchObject({ failed: true, output: 'Permission denied', metadata: { step: 2, callId, status: 'failed', errorName: 'FileAccessError', errorCode: 'EACCES' } })
    expect(result?.metadata).not.toHaveProperty('toolName')
    expect(JSON.stringify(result)).not.toMatch(/private tool reasoning|private filesystem reason|private presentation/)
  })

  it('records standalone compaction boundaries with null turns and leaves summaries with DSH', () => {
    const compactionId = 'compact-1' as SessionEvent<'compaction/start'>['data']['compactionId']
    const start: SessionEvent<'compaction/start'> = { ...position, type: 'compaction/start', data: { compactionId, turn: null } }
    const end: SessionEvent<'compaction/end'> = { ...position, type: 'compaction/end', data: { compactionId, turn: null, error: 'private compaction error' } }
    expect(captureSessionEvent('s', start)).toMatchObject({ point: 'compaction', turn: null, failed: false, metadata: { status: 'running' } })
    const result = captureSessionEvent('s', end)
    expect(result).toMatchObject({ point: 'compaction', turn: null, failed: true, metadata: { status: 'failed' } })
    expect(JSON.stringify(result)).not.toContain('private compaction error')
    const summary: SessionEvent<'compaction/summary'> = { ...position, type: 'compaction/summary', data: { compactionId, summary: [{ type: 'text', text: 'private conversation summary' }], shadowedRange: { start: position.seq, end: position.seq }, shadowedSeqs: [position.seq], shadowedTokenCount: 20, provider: 'deepseek', model: 'v4' } }
    expect(captureSessionEvent('s', summary)).toBeNull()
  })

  it('ignores unrelated model-visible prompts and route context events', () => {
    const context: SessionEvent<'request/context'> = { ...position, type: 'request/context', data: { provider: 'deepseek', model: 'v4', contextWindow: 1000000 } }
    expect(captureSessionEvent('s', context)).toBeNull()
    expect(captureSessionEvent('s', { ...position, type: 'session/end-seed', data: {} })).toBeNull()
  })
})

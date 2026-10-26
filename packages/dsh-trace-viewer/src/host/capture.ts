import type {} from '@deepseek-ai/dsh-compaction/types'
import type { SessionEvent } from '@deepseek-ai/dsh-session/types'
import type { TraceCapturedEvent } from '../management.ts'

type Metadata = TraceCapturedEvent['metadata']
type AssistantEvent = SessionEvent<'assistant/message'>
type Stream = AssistantEvent['data']['stream']
type Usage = NonNullable<AssistantEvent['data']['usage']>

const usageKeys = ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens'] as const
const excludedPayloadKeys = new Set(['reasoning', 'reasoning_content', 'reasoningcontent', 'headers', 'authorization', 'apikey', 'api_key'])

function usageMetadata(usage: Usage | undefined): Metadata {
  const metadata: Metadata = {}
  for (const key of usageKeys) {
    const value = usage?.[key]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) metadata[key] = value
  }
  return metadata
}

/** Copy ordinary JSON tool arguments without retaining reasoning or credential fields. */
function ordinaryPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordinaryPayload).filter(item => item !== undefined)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.type === 'reasoning' || record.kind === 'reasoning') return undefined
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(record)) {
      if (excludedPayloadKeys.has(key.toLowerCase())) continue
      const clean = ordinaryPayload(item)
      if (clean !== undefined) Object.defineProperty(result, key, { value: clean, enumerable: true, writable: true, configurable: true })
    }
    return result
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

function toolArguments(value: string): unknown {
  try { return ordinaryPayload(JSON.parse(value)) } catch { return value }
}

/** Only user-visible text is copied; attachments, replay state and reasoning stay with DSH. */
function textContent(content: AssistantEvent['data']['message']['content']): string | undefined {
  const text = content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n\n')
  return text === '' ? undefined : text
}

function streamMetadata(stream: Stream): { metadata: Metadata; failed: boolean } {
  const metadata: Metadata = {}
  let failed = false
  let usage: Usage | undefined
  for (const record of stream) {
    if (record.type !== 'chunk') continue
    const chunk = record.chunk
    if (chunk.type === 'usage') usage = chunk.usage
    if (chunk.type !== 'finish') continue
    metadata.reason = chunk.reason.kind
    if (chunk.reason.kind === 'error') {
      metadata.status = 'failed'
      metadata.errorCode = chunk.reason.failure.code
      failed = true
    } else if (chunk.reason.kind === 'aborted') {
      metadata.status = 'interrupted'
      metadata.errorCode = chunk.reason.failure.code
      failed = false
    } else if (chunk.reason.kind === 'max-tokens') {
      metadata.status = 'failed'
      failed = true
    } else if (chunk.reason.kind === 'stop' || chunk.reason.kind === 'tool-calls') {
      metadata.status = 'completed'
      failed = false
    }
  }
  return { metadata: { ...metadata, ...usageMetadata(usage) }, failed }
}

function turnEnd(kind: string): TraceCapturedEvent['end'] {
  if (kind === 'completed') return 'completed'
  if (kind === 'error' || kind === 'blocked' || kind === 'max-tokens') return 'failed'
  if (kind === 'aborted' || kind === 'interrupted' || kind === 'forked') return 'interrupted'
  return undefined
}

/** Project one live host event into one whitelisted, JSON-only Trace event. */
export function captureSessionEvent(sessionId: string, event: SessionEvent): TraceCapturedEvent | null {
  const base = { sessionId, seq: event.seq, time: event.time, failed: false }
  switch (event.type) {
    case 'turn/start':
      return { ...base, type: event.type, point: 'lifecycle', turn: event.data.turn, metadata: { status: 'running' } }
    case 'turn/end': {
      const end = turnEnd(event.data.reason.kind)
      const metadata: Metadata = { reason: event.data.reason.kind }
      if (end !== undefined) metadata.status = end
      if (event.data.reason.kind === 'error') metadata.errorCode = event.data.reason.error.code
      return { ...base, type: event.type, point: 'lifecycle', turn: event.data.turn, metadata, failed: end === 'failed', ...(end === undefined ? {} : { end }) }
    }
    case 'step/start':
    case 'step/end':
      return { ...base, type: event.type, point: 'model', turn: event.data.turn, metadata: { step: event.data.step, status: event.type === 'step/start' ? 'running' : 'ended' } }
    case 'request/header':
      return { ...base, type: event.type, point: 'model', turn: null, metadata: { provider: event.data.header.config.provider, model: event.data.header.config.model } }
    case 'assistant/message': {
      const stream = streamMetadata(event.data.stream)
      const metadata: Metadata = {
        ...stream.metadata,
        ...usageMetadata(event.data.usage),
        step: event.data.step,
        provider: event.data.message.source.provider,
        model: event.data.message.source.model,
      }
      if (event.data.interrupted) metadata.status = 'interrupted'
      else if (metadata.status === undefined) metadata.status = 'completed'
      const output = textContent(event.data.message.content)
      return { ...base, type: event.type, point: 'model', turn: event.data.turn, metadata, failed: event.data.interrupted ? false : stream.failed, ...(output === undefined ? {} : { output }) }
    }
    case 'assistant/attempt': {
      const stream = streamMetadata(event.data.stream)
      return { ...base, type: event.type, point: 'model', turn: event.data.turn, metadata: { ...stream.metadata, step: event.data.step }, failed: stream.failed }
    }
    case 'tool/call': {
      const input = toolArguments(event.data.arguments)
      return { ...base, type: event.type, point: 'tool', turn: event.data.turn, metadata: { step: event.data.step, toolName: event.data.name, callId: event.data.callId, status: 'running' }, ...(input === undefined ? {} : { input }) }
    }
    case 'tool/result': {
      const metadata: Metadata = { step: event.data.step, callId: event.data.message.toolCallId, status: event.data.message.isError ? 'failed' : 'completed' }
      if (event.data.error) { metadata.errorName = event.data.error.name; metadata.errorCode = event.data.error.code }
      const output = textContent(event.data.message.content)
      return { ...base, type: event.type, point: 'tool', turn: event.data.turn, metadata, failed: event.data.message.isError === true, ...(output === undefined ? {} : { output }) }
    }
    case 'compaction/start':
      return { ...base, type: event.type, point: 'compaction', turn: event.data.turn, metadata: { status: 'running' } }
    case 'compaction/end': {
      const failed = typeof event.data.error === 'string'
      return { ...base, type: event.type, point: 'compaction', turn: event.data.turn, metadata: { status: failed ? 'failed' : 'completed' }, failed }
    }
    default:
      return null
  }
}

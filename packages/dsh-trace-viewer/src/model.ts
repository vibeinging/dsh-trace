import type { TrajectorySnapshot } from '@deepseek-ai/dsh-client-ui-trajectory/client'
import type { TraceBuildOptions, TraceData, TraceRow, TraceStatus, TraceTurn, TraceUsage } from './types.ts'

type Node = TrajectorySnapshot['eventNodes'][number]
type Assistant = Extract<Node, { kind: 'assistant' }>
type Request = TrajectorySnapshot['requests'][number]
type Tool = TrajectorySnapshot['runningCalls'][number] | Extract<Node, { kind: 'tool-result' }>
type Location = TrajectorySnapshot['eventLocations'] extends ReadonlyMap<number, infer Value> ? Value : never
type TurnLocation = Extract<Location, { kind: 'turn' | 'step' }>['turn']
interface Placement { turn: number | null; step: number | null; parentId: string | null }

const COUNTERS = ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens'] as const

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function duration(start: number | null, end: number | null): number | null {
  return start !== null && end !== null && end >= start ? end - start : null
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

function readUsage(value: unknown): TraceUsage | null {
  const source = record(value)
  if (source === null) return null
  const result: TraceUsage = {
    inputTokens: null, outputTokens: null, cacheReadTokens: null,
    cacheWriteTokens: null, reasoningTokens: null, reportedRequests: 1, missingRequests: 0,
  }
  let reported = false
  for (const key of COUNTERS) {
    const count = finite(source[key])
    result[key] = count !== null && count >= 0 ? count : null
    reported ||= result[key] !== null
  }
  result.reportedRequests = result.inputTokens !== null && result.outputTokens !== null ? 1 : 0
  result.missingRequests = result.reportedRequests === 1 ? 0 : 1
  return reported ? result : null
}

function usageOf(request: Request | undefined, node: Assistant | undefined): TraceUsage | null {
  const primary = readUsage(request?.usage)
  const fallback = readUsage(node?.usage)
  if (primary === null) return fallback
  if (fallback === null) return primary
  const result = { ...primary }
  for (const key of COUNTERS) result[key] = primary[key] ?? fallback[key]
  result.reportedRequests = result.inputTokens !== null && result.outputTokens !== null ? 1 : 0
  result.missingRequests = result.reportedRequests === 1 ? 0 : 1
  return result
}

/** Sum each request once; missing counters remain distinguishable from zero. */
export function aggregateUsage(rows: readonly TraceRow[]): TraceUsage | null {
  const requests = [...new Map(rows.filter(row => row.kind === 'model' || row.kind === 'compaction')
    .map(row => [row.id, row])).values()]
  if (requests.length === 0) return null
  const result: TraceUsage = {
    inputTokens: null, outputTokens: null, cacheReadTokens: null,
    cacheWriteTokens: null, reasoningTokens: null, reportedRequests: 0, missingRequests: 0,
  }
  for (const row of requests) {
    if (row.usage === null) { result.missingRequests++; continue }
    result.reportedRequests += row.usage.reportedRequests
    result.missingRequests += row.usage.missingRequests
    for (const key of COUNTERS) {
      const count = row.usage[key]
      if (count !== null) result[key] = (result[key] ?? 0) + count
    }
  }
  return result
}

function plainContent(content: readonly unknown[]): string | readonly unknown[] {
  const blocks = content.filter(block => record(block)?.type !== 'reasoning')
  const text = blocks.flatMap(block => {
    const value = record(block)
    return value?.type === 'text' && typeof value.text === 'string' ? [value.text] : []
  })
  return text.length > 0 && text.length === blocks.length ? text.join('\n\n') : blocks
}

function assistantOutput(node: Pick<Assistant, 'blocks'> | undefined): unknown | null {
  if (node === undefined) return null
  const blocks = node.blocks.filter(block => block.kind !== 'reasoning')
  if (blocks.length === 0) return null
  if (blocks.every(block => block.kind === 'text')) return blocks.map(block => block.text).join('\n\n')
  return blocks
}

function modelId(sessionId: string, turn: number, step: number): string {
  return `${sessionId}:model:${turn}:${step}`
}

function placement(location: Location | undefined): Placement {
  return location?.kind === 'step'
    ? { turn: location.turn.turn, step: location.step.step, parentId: null }
    : location?.kind === 'turn'
      ? { turn: location.turn.turn, step: null, parentId: null }
      : { turn: null, step: null, parentId: null }
}

function requestRow(sessionId: string, request: Request | undefined, node: Assistant | undefined,
  partial: TrajectorySnapshot['partial']): TraceRow {
  const turn = request === undefined ? node?.turn ?? partial?.turn ?? null : request.turn
  const step = request?.step ?? node?.step ?? partial?.step ?? null
  const partialMatches = partial !== null && partial.turn === turn && partial.step === step
  const startTime = finite(request?.startedAt) ?? finite(node?.timing?.stepStartTime)
    ?? (partialMatches ? finite(partial.timing?.stepStartTime) : null)
  const endTime = finite(request?.completedAt) ?? finite(node?.timing?.completedTime) ?? finite(node?.time)
  const status: TraceStatus = node?.interrupted === true ? 'interrupted'
    : request?.status === 'error' ? 'failed'
      : request?.status === 'complete' || node !== undefined ? 'completed' : 'running'
  const config = request?.requestConfig ?? node?.requestConfig
  const metadata = request?.providerMetadata ?? node?.providerMetadata
  const compaction = request?.purpose === 'compaction'
  const identity = compaction ? `${sessionId}:compaction:${request.startSeq}`
    : modelId(sessionId, turn ?? 0, step ?? 0)
  const output = compaction ? plainContent(request.rawOutput ?? request.summary ?? [])
    : assistantOutput(node ?? (partialMatches ? partial : undefined))
  return {
    id: identity, parentId: null, kind: compaction ? 'compaction' : 'model',
    name: compaction ? 'compaction' : 'model', status, turn, step,
    seq: request?.startSeq ?? node?.seq ?? null, startTime,
    endTime: status === 'running' ? null : endTime,
    durationMs: status === 'running' ? null : duration(startTime, endTime),
    input: request?.purpose === 'assistant' ? request.prompt ?? null : null,
    output, error: status === 'failed' ? request?.error ?? request?.errorCode ?? null : null,
    provider: metadata?.provider ?? config?.provider ?? null,
    model: metadata?.model ?? config?.model ?? null,
    usage: usageOf(request, node),
    raw: {
      source: 'trajectory-projection', request: request === undefined ? null : {
        purpose: request.purpose, startSeq: request.startSeq, startedAt: request.startedAt,
        completedAt: request.completedAt, status: request.status, resultSeq: request.resultSeq,
        requestConfig: request.requestConfig, providerMetadata: request.providerMetadata,
        usage: request.usage, error: request.error, errorCode: request.errorCode,
        ...(request.purpose === 'assistant' ? { turn: request.turn, step: request.step, retry: request.retry } : {}),
      },
      resultSeq: node?.seq ?? null, timing: node?.timing ?? null,
      interrupted: node?.interrupted === true,
    },
  }
}

function toolRow(sessionId: string, block: Tool, position: Placement): TraceRow {
  const settled = 'kind' in block
  const startTime = finite(settled ? block.callTime : block.time)
  const endTime = settled ? finite(block.time) : null
  const errorCode = settled ? block.error?.code.toLowerCase() : undefined
  const interrupted = errorCode === 'interrupted' || errorCode === 'aborted'
  const status: TraceStatus = !settled ? 'running' : interrupted ? 'interrupted' : block.isError ? 'failed' : 'completed'
  const input = settled ? block.call?.argsRaw ?? null : block.phase === 'start' ? block.argsRaw : null
  return {
    id: `${sessionId}:tool:${block.callId}`,
    parentId: block.parentCallId === undefined ? position.parentId : `${sessionId}:tool:${block.parentCallId}`,
    kind: 'tool', name: block.name || block.callId, status,
    turn: settled ? position.turn : block.turn,
    step: settled ? position.step : block.step,
    seq: settled ? block.seq : null, startTime, endTime,
    durationMs: duration(startTime, endTime), input,
    output: settled ? plainContent(block.content) : null,
    error: settled && block.isError ? block.error?.reason ?? block.error?.code
      ?? (typeof plainContent(block.content) === 'string' ? String(plainContent(block.content)) : null) : null,
    provider: null, model: null, usage: null,
    raw: {
      source: 'trajectory-projection', callId: block.callId,
      parentCallId: block.parentCallId ?? null, name: block.name,
      ...(settled ? { seq: block.seq, time: block.time, callTime: block.callTime,
        isError: block.isError, error: block.error, meta: block.meta } : { phase: block.phase, time: block.time }),
    },
  }
}

function turnStatus(boundary: TurnLocation | undefined, rows: readonly TraceRow[]): TraceStatus {
  if (boundary?.end !== undefined) {
    const reason = boundary.end.data.reason.kind
    if (reason === 'completed') return 'completed'
    if (reason === 'interrupted' || reason === 'forked' || reason === 'aborted') return 'interrupted'
    if (reason === 'error' || reason === 'max-tokens' || reason === 'blocked') return 'failed'
  }
  if (boundary?.status === 'open' || rows.some(row => row.status === 'running')) return 'running'
  if (rows.some(row => row.status === 'interrupted')) return 'interrupted'
  return 'unknown'
}

function chronological(left: TraceRow, right: TraceRow): number {
  return (left.startTime ?? left.endTime ?? Infinity) - (right.startTime ?? right.endTime ?? Infinity)
    || (left.seq ?? Infinity) - (right.seq ?? Infinity) || left.id.localeCompare(right.id)
}

/**
 * Build a read-only waterfall view from the DSH trajectory window.
 * @param snapshot - Current official trajectory projection; it can grow after paging.
 * @param sessionId - Stable Session identity, included in every row key.
 * @param options - Paging facts supplied by the Session binding.
 * @returns Rows and turn summaries without inferred times or duplicate requests.
 */
export function buildTrace(snapshot: TrajectorySnapshot, sessionId: string, options: TraceBuildOptions = {}): TraceData {
  const boundaries = new Map<number, TurnLocation>()
  for (const location of snapshot.eventLocations.values()) {
    if (location.kind !== 'step' && location.kind !== 'turn') continue
    const previous = boundaries.get(location.turn.turn)
    if (previous === undefined || location.turn.end !== undefined || previous.start === undefined) {
      boundaries.set(location.turn.turn, location.turn)
    }
  }
  const assistants = new Map<string, Assistant>()
  const toolPositions = new Map<string, Placement>()
  for (const node of snapshot.eventNodes) {
    if (node.kind !== 'assistant') continue
    const id = modelId(sessionId, node.turn, node.step)
    const existing = assistants.get(id)
    if (existing === undefined || existing.seq < node.seq) assistants.set(id, node)
    for (const block of node.blocks) {
      if (block.kind === 'tool-call') toolPositions.set(block.callId, { turn: node.turn, step: node.step, parentId: id })
    }
  }
  if (snapshot.partial !== null) {
    for (const block of snapshot.partial.blocks) {
      if (block.kind === 'tool-call') toolPositions.set(block.callId, {
        turn: snapshot.partial.turn, step: snapshot.partial.step,
        parentId: modelId(sessionId, snapshot.partial.turn, snapshot.partial.step),
      })
    }
  }
  const rows = new Map<string, TraceRow>()
  for (const request of snapshot.requests) {
    const node = request.purpose === 'assistant' ? assistants.get(modelId(sessionId, request.turn, request.step)) : undefined
    const row = requestRow(sessionId, request, node, snapshot.partial)
    rows.set(row.id, row)
  }
  for (const [id, node] of assistants) {
    if (!rows.has(id)) rows.set(id, requestRow(sessionId, undefined, node, snapshot.partial))
  }
  if (snapshot.partial !== null) {
    const id = modelId(sessionId, snapshot.partial.turn, snapshot.partial.step)
    if (!rows.has(id)) rows.set(id, requestRow(sessionId, undefined, undefined, snapshot.partial))
  }
  const seenTools = new Set<string>()
  const toolParents = new Map<string, string>()
  function indexTool(block: Tool, inherited?: Placement, visited = new Set<string>()): void {
    if (visited.has(block.callId)) return
    const next = new Set(visited).add(block.callId)
    const direct = toolPositions.get(block.callId)
    const fallback = 'kind' in block ? placement(snapshot.eventLocations.get(block.seq))
      : { turn: block.turn, step: block.step, parentId: null }
    if (block.parentCallId !== undefined) toolParents.set(block.callId, `${sessionId}:tool:${block.parentCallId}`)
    else if (inherited?.parentId !== null && inherited?.parentId !== undefined) toolParents.set(block.callId, inherited.parentId)
    const context = direct !== undefined && direct.turn !== null ? direct : inherited ?? fallback
    const position = { ...context, parentId: toolParents.get(block.callId) ?? context.parentId }
    toolPositions.set(block.callId, position)
    for (const child of block.subCalls) indexTool(child, {
      turn: position.turn, step: position.step, parentId: `${sessionId}:tool:${block.callId}`,
    }, next)
  }
  for (const node of snapshot.eventNodes) if (node.kind === 'tool-result') indexTool(node)
  for (const block of snapshot.runningCalls) indexTool(block)
  function addTool(block: Tool, inherited?: Placement): void {
    if (seenTools.has(block.callId)) return
    seenTools.add(block.callId)
    const direct = toolPositions.get(block.callId)
    const fromLocation = 'kind' in block ? placement(snapshot.eventLocations.get(block.seq)) : {
      turn: block.turn, step: block.step, parentId: null,
    }
    const position = direct ?? inherited ?? fromLocation
    const row = toolRow(sessionId, block, position)
    rows.set(row.id, row)
    for (const child of block.subCalls) addTool(child, { turn: row.turn, step: row.step, parentId: row.id })
  }
  for (const node of snapshot.eventNodes) if (node.kind === 'tool-result') addTool(node)
  for (const block of snapshot.runningCalls) addTool(block)
  for (const node of snapshot.eventNodes) {
    if (node.kind !== 'turn-error' && node.kind !== 'turn-max-tokens') continue
    const interrupted = node.kind === 'turn-error' && node.code === 'INTERRUPTED'
    const error = node.kind === 'turn-error' ? node.message || node.code || null : 'max-tokens'
    rows.set(`${sessionId}:notice:${node.seq}`, {
      id: `${sessionId}:notice:${node.seq}`, parentId: null, kind: 'notice', name: node.kind,
      status: interrupted ? 'interrupted' : 'failed', turn: node.turn, step: node.step,
      seq: node.seq, startTime: null, endTime: finite(node.time), durationMs: null,
      input: null, output: null, error, provider: null, model: null, usage: null,
      raw: { source: 'trajectory-projection', ...node },
    })
  }
  const ordered = [...rows.values()].sort(chronological)
  const grouped = new Map<number | null, TraceRow[]>()
  for (const row of ordered) {
    const group = grouped.get(row.turn) ?? []
    group.push(row)
    grouped.set(row.turn, group)
  }
  const titles = new Map<number, string>()
  for (const node of snapshot.eventNodes) {
    if (node.kind !== 'user') continue
    const position = placement(snapshot.eventLocations.get(node.seq))
    if (position.turn === null || titles.has(position.turn)) continue
    const content = plainContent(node.content)
    if (typeof content === 'string' && content.trim() !== '') titles.set(position.turn, content.trim())
  }
  const turns: TraceTurn[] = [...grouped].sort(([left], [right]) => (left ?? Infinity) - (right ?? Infinity)).map(([turn, group]) => {
    const boundary = turn === null ? undefined : boundaries.get(turn)
    const startTime = finite(boundary?.start?.time)
    const endTime = finite(boundary?.end?.time)
    const knownStarts = group.flatMap(row => row.startTime === null ? [] : [row.startTime])
    const knownEnds = group.flatMap(row => row.endTime === null ? [] : [row.endTime])
    return {
      id: `${sessionId}:turn:${turn ?? 'unplaced'}`, turn,
      title: turn === null ? null : titles.get(turn) ?? null,
      status: turnStatus(boundary, group), startTime, endTime,
      durationMs: duration(startTime, endTime), timingComplete: duration(startTime, endTime) !== null,
      observedStartTime: knownStarts.length === 0 ? null : Math.min(...knownStarts),
      observedEndTime: knownEnds.length === 0 ? null : Math.max(...knownEnds),
      rows: group, modelCount: group.filter(row => row.kind === 'model').length,
      toolCount: group.filter(row => row.kind === 'tool').length,
      errorCount: group.filter(row => row.status === 'failed' || row.status === 'interrupted').length,
      usage: aggregateUsage(group),
    }
  })
  return { sessionId, turns, rows: ordered, partialHistory: options.hasMore === true }
}

/**
 * dsh-trace plugin backed by the DeepSeek Harness session-telemetry seam.
 *
 * The backend converts the seam's already-redacted logical records into a
 * yiTrace hierarchy: one trace per DSH turn, step spans under the turn, and
 * tool spans under their step. Delivery, retry buffering, deterministic event
 * ids, and wire encoding remain owned by `@yitrace/trace-sdk`.
 *
 * @module @deepseek-ai/dsh-trace
 */

import z from 'schemastery'
import type { Context } from 'cordis'
import { APP_IDENTITY, type ContentBlock } from '@deepseek-ai/dsh-llm'
import type { SessionEventMap, TurnEndReason } from '@deepseek-ai/dsh-session'
import { Telemetry, TelemetryCoordinator, type TelemetryRecord } from '@deepseek-ai/dsh-session-telemetry'
import {
  BatchExporter,
  EventType,
  HttpExporter,
  Snowflake,
  type SpanEvent,
} from '@yitrace/trace-sdk'

type AttributeValue = string | number | boolean

/** HTTP exporter settings passed to yiTrace after load-time validation. */
export interface TraceExporterConfig {
  /** Full yiTrace ingest endpoint, normally ending in `/v1/ingest`. */
  url: string
  /** Additional HTTP headers. `token`, when present, owns `Authorization`. */
  headers?: Record<string, string>
  /** Bearer token sent by yiTrace's HTTP exporter. */
  token?: string
  /** Unsigned 64-bit tenant id sent as `X-Tenant-Id`. */
  tenantId?: string | number
  /** Maximum failed events retained in the yiTrace SDK's in-memory retry buffer. */
  maxBuffered?: number
}

/** Cordis plugin configuration for dsh-trace. */
export interface Config {
  /** yiTrace HTTP exporter settings. */
  exporter: TraceExporterConfig
  /** Events collected before the serial yiTrace SDK batch exporter sends one request. */
  batchSize?: number
  /** Optional yiTrace Snowflake node id; omit to derive it from the process id. */
  nodeId?: number
  /** Agent name attached to every emitted yiTrace span. */
  agentName?: string
  /** Outer deadline for draining the yiTrace SDK during plugin disposal. */
  shutdownTimeoutMillis?: number
}

const TraceExporterConfig: z<TraceExporterConfig> = z.object({
  url: z.string().required(),
  headers: z.dict(z.string()),
  token: z.string(),
  tenantId: z.union([z.string(), z.number()]),
  maxBuffered: z.number(),
}).required()

/** Schemastery validator for {@link Config}. */
export const Config: z<Config> = z.object({
  exporter: TraceExporterConfig,
  batchSize: z.number(),
  nodeId: z.number(),
  agentName: z.string(),
  shutdownTimeoutMillis: z.number(),
})

/** yiTrace SDK batch size used when the deployment does not choose one. */
export const DEFAULT_BATCH_SIZE = 256
/** Outer shutdown allowance used when the deployment does not choose one. */
export const DEFAULT_SHUTDOWN_TIMEOUT_MILLIS = 3_000

const MAX_TIMER_DELAY_MILLIS = 2_147_483_647
const MAX_YITRACE_NODE_ID = 1_023
const MAX_U64 = (1n << 64n) - 1n
const FNV_OFFSET = 0xcbf29ce484222325n
const FNV_PRIME = 0x100000001b3n

interface ResolvedConfig {
  exporter: {
    url: string
    headers: Record<string, string>
    token?: string
    tenantId?: bigint
    maxBuffered: number
  }
  batchSize: number
  nodeId?: number
  agentName: string
  shutdownTimeoutMillis: number
}

interface SpanSpec {
  traceId: bigint
  spanId: bigint
  parentSpanId: bigint | null
  sessionId: bigint
  tenantId: bigint | null
  name: string
  displayName: string
  agentName: string
  startedAt: number
  attributes: Record<string, AttributeValue>
  toolName?: string
}

interface StepState {
  turn: number
  step: number
  span: OpenSpan
  tools: Map<string, OpenSpan>
  failed: boolean
}

interface TurnState {
  turn: number
  span: OpenSpan
  step?: StepState
  failed: boolean
}

interface SessionState {
  numericId: bigint
  messages: string[]
  system?: string
  turn?: TurnState
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`dsh-trace: ${field} must be a positive safe integer, got ${String(value)}`)
  }
  return value
}

function parseUrl(value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`dsh-trace: exporter.url is not a valid URL: ${JSON.stringify(value)}`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`dsh-trace: exporter.url must be http(s), got ${parsed.protocol}`)
  }
  return value
}

function parseTenantId(value: string | number | undefined): bigint | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) {
    throw new Error(`dsh-trace: exporter.tenantId must be an unsigned 64-bit integer, got ${String(value)}`)
  }
  if (typeof value === 'string' && !/^\d+$/.test(value)) {
    throw new Error(`dsh-trace: exporter.tenantId must be an unsigned 64-bit integer, got ${JSON.stringify(value)}`)
  }
  const parsed = BigInt(value)
  if (parsed > MAX_U64) {
    throw new Error(`dsh-trace: exporter.tenantId exceeds the unsigned 64-bit range: ${String(value)}`)
  }
  return parsed
}

function resolveConfig(config: Config): ResolvedConfig {
  const batchSize = positiveInteger(config.batchSize ?? DEFAULT_BATCH_SIZE, 'batchSize')
  const maxBuffered = positiveInteger(config.exporter.maxBuffered ?? batchSize * 16, 'exporter.maxBuffered')
  const tenantId = parseTenantId(config.exporter.tenantId)
  const shutdownTimeoutMillis = config.shutdownTimeoutMillis ?? DEFAULT_SHUTDOWN_TIMEOUT_MILLIS
  if (!Number.isFinite(shutdownTimeoutMillis) || shutdownTimeoutMillis <= 0
    || shutdownTimeoutMillis > MAX_TIMER_DELAY_MILLIS) {
    throw new Error(
      `dsh-trace: shutdownTimeoutMillis must be a positive finite number no greater than ${MAX_TIMER_DELAY_MILLIS}, got ${String(shutdownTimeoutMillis)}`,
    )
  }
  if (config.nodeId !== undefined
    && (!Number.isInteger(config.nodeId) || config.nodeId < 0 || config.nodeId > MAX_YITRACE_NODE_ID)) {
    throw new Error(`dsh-trace: nodeId must be an integer from 0 through ${MAX_YITRACE_NODE_ID}, got ${String(config.nodeId)}`)
  }
  const agentName = (config.agentName ?? APP_IDENTITY.product).trim()
  if (agentName.length === 0) throw new Error('dsh-trace: agentName must not be empty')
  if (config.exporter.token !== undefined && config.exporter.token.length === 0) {
    throw new Error('dsh-trace: exporter.token must not be empty')
  }
  return {
    exporter: {
      url: parseUrl(config.exporter.url),
      headers: { ...config.exporter.headers },
      ...config.exporter.token === undefined ? {} : { token: config.exporter.token },
      ...tenantId === undefined ? {} : { tenantId },
      maxBuffered,
    },
    batchSize,
    ...config.nodeId === undefined ? {} : { nodeId: config.nodeId },
    agentName,
    shutdownTimeoutMillis,
  }
}

function epochNanos(time: number): bigint {
  return BigInt(Math.max(0, Math.trunc(time))) * 1_000_000n
}

function stableSessionId(value: string): bigint {
  let hash = FNV_OFFSET
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte)
    hash = (hash * FNV_PRIME) & MAX_U64
  }
  return hash
}

function eventSeq(record: TelemetryRecord): number | undefined {
  const value = record.attributes['event.seq']
  return typeof value === 'number' ? value : undefined
}

function eventType(record: TelemetryRecord): string {
  const value = record.attributes['event.type']
  if (typeof value !== 'string') throw new Error('dsh-trace: ledger record has no event.type')
  return value
}

function sessionId(record: TelemetryRecord): string {
  const value = record.attributes['session.id']
  if (typeof value !== 'string') throw new Error('dsh-trace: record has no session.id')
  return value
}

function bodyText(value: unknown): string {
  return JSON.stringify(value)
}

function sourceSeqAttribute(record: TelemetryRecord): Record<string, number> {
  const seq = eventSeq(record)
  return seq === undefined ? {} : { 'dsh.event.start_seq': seq }
}

function contentText(blocks: readonly ContentBlock[]): string {
  return blocks.map((block) => {
    switch (block.type) {
      case 'text':
      case 'reasoning':
        return block.text
      case 'tool-call':
        return `${block.name}(${block.arguments})`
      case 'tool-result':
        return contentText(block.content)
      default:
        return bodyText(block)
    }
  }).filter(Boolean).join('\n')
}

function turnStatus(reason: TurnEndReason): number {
  return reason.kind === 'completed' ? 0 : 1
}

class OpenSpan {
  private seq = 0n
  private closed = false
  private model: string | null = null
  private inputText: string | null = null
  private outputText: string | null = null
  private inputTokens: bigint | null = null
  private outputTokens: bigint | null = null
  private cacheReadTokens: bigint | null = null
  private cacheWriteTokens: bigint | null = null

  constructor(
    private readonly exporter: BatchExporter,
    private readonly spec: SpanSpec,
  ) {
    this.export(EventType.SpanStart, spec.startedAt)
  }

  get spanId(): bigint {
    return this.spec.spanId
  }

  get traceId(): bigint {
    return this.spec.traceId
  }

  get sessionId(): bigint {
    return this.spec.sessionId
  }

  setModel(model: string): void {
    this.model = model
  }

  setIo(inputText: string | undefined, outputText: string | undefined): void {
    if (inputText !== undefined) this.inputText = inputText
    if (outputText !== undefined) this.outputText = outputText
  }

  setTokens(usage: SessionEventMap['assistant/message']['usage']): void {
    if (usage === undefined) return
    this.inputTokens = BigInt(usage.inputTokens)
    this.outputTokens = BigInt(usage.outputTokens)
    if (usage.cacheReadTokens !== undefined) this.cacheReadTokens = BigInt(usage.cacheReadTokens)
    if (usage.cacheWriteTokens !== undefined) this.cacheWriteTokens = BigInt(usage.cacheWriteTokens)
    if (usage.reasoningTokens !== undefined) this.spec.attributes['llm.reasoning_tokens'] = usage.reasoningTokens
  }

  setAttribute(key: string, value: AttributeValue): void {
    this.spec.attributes[key] = value
  }

  log(time: number, message: string): void {
    if (this.closed) return
    this.export(EventType.Log, time, { logs: [message] })
  }

  close(time: number, status: number): void {
    if (this.closed) return
    this.closed = true
    const durationNs = BigInt(Math.max(0, Math.trunc(time - this.spec.startedAt))) * 1_000_000n
    this.export(EventType.SpanEnd, time, { status, durationNs })
  }

  private export(
    eventTypeValue: SpanEvent['eventType'],
    time: number,
    options: { status?: number; durationNs?: bigint; logs?: string[] } = {},
  ): void {
    this.seq += 1n
    const isStart = eventTypeValue === EventType.SpanStart
    const isEnd = eventTypeValue === EventType.SpanEnd
    this.exporter.export({
      traceId: this.spec.traceId,
      spanId: this.spec.spanId,
      ts: epochNanos(time),
      seq: this.seq,
      eventType: eventTypeValue,
      extSpanId: `${this.spec.traceId}-${this.spec.spanId}`,
      parentSpanId: this.spec.parentSpanId,
      status: options.status ?? null,
      durationNs: options.durationNs ?? null,
      inputTokens: isEnd ? this.inputTokens : null,
      outputTokens: isEnd ? this.outputTokens : null,
      cacheReadTokens: isEnd ? this.cacheReadTokens : null,
      cacheWriteTokens: isEnd ? this.cacheWriteTokens : null,
      sessionId: this.spec.sessionId,
      tenantId: this.spec.tenantId,
      spanName: isStart ? this.spec.name : null,
      displayName: isStart ? this.spec.displayName : null,
      agentName: this.spec.agentName,
      toolName: this.spec.toolName ?? null,
      model: this.model,
      inputText: this.inputText,
      outputText: this.outputText,
      logs: options.logs ?? [],
      attrs: isEnd ? { ...this.spec.attributes } : {},
    })
  }
}

/**
 * Loadable dsh-trace plugin. The class owns only projection state; the seam owns
 * capture and redaction, while the yiTrace SDK owns transport behavior.
 */
export class DshTrace extends Telemetry {
  static inject = ['sessions']
  static Config = Config

  private readonly ids: Snowflake
  private readonly http: HttpExporter
  private readonly exporter: BatchExporter
  private readonly sessions = new Map<string, SessionState>()
  private readonly resolved: ResolvedConfig
  private readonly logger: Context['logger']
  private delivery = Promise.resolve()
  private shutdownPromise: Promise<void> | undefined

  constructor(ctx: Context, config: Config) {
    super(ctx)
    this.resolved = resolveConfig(config)
    this.logger = ctx.logger
    this.ids = new Snowflake(this.resolved.nodeId)
    this.http = new HttpExporter({
      url: this.resolved.exporter.url,
      headers: this.resolved.exporter.headers,
      ...this.resolved.exporter.token === undefined ? {} : { token: this.resolved.exporter.token },
      ...this.resolved.exporter.tenantId === undefined ? {} : { tenantId: this.resolved.exporter.tenantId },
      max: this.resolved.batchSize,
      maxBuffered: this.resolved.exporter.maxBuffered,
      onError: (error, dropped) => {
        ctx.logger.warn(`dsh-trace: export failed (${dropped} buffered events dropped)`, error)
      },
    })
    this.exporter = new BatchExporter(this.http, this.resolved.batchSize)
    new TelemetryCoordinator(ctx, this)
  }

  /**
   * Project one already-redacted seam record into the open yiTrace hierarchy.
   * The method only creates SDK events and enqueues them in memory.
   * @param record - logical record handed over synchronously by the seam.
   */
  override emit(record: TelemetryRecord): void {
    switch (record.channel) {
      case 'ledger':
        this.emitLedger(record)
        return
      case 'ops':
        this.emitOps(record)
        return
    }
  }

  /** Forward a natural seam boundary into the serial SDK and retry queues. */
  override flush(): void {
    void this.queueDelivery('flush', async () => {
      await this.exporter.flush()
      await this.http.flush()
    })
  }

  /**
   * Close open spans, drain the yiTrace SDK, and stop awaiting after the
   * configured outer deadline. The underlying HTTP request cannot be canceled.
   * @returns fulfillment after the SDK quiesces or rejection at the deadline.
   */
  override shutdown(): Promise<void> {
    if (this.shutdownPromise !== undefined) return this.shutdownPromise
    this.shutdownPromise = this.shutdownOnce()
    return this.shutdownPromise
  }

  private async shutdownOnce(): Promise<void> {
    const time = Date.now()
    for (const [id, state] of this.sessions) this.closeSession(id, state, time)
    const close = this.queueDelivery('shutdown', async () => {
      await this.exporter.close()
    })
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`dsh-trace: SDK shutdown exceeded ${this.resolved.shutdownTimeoutMillis}ms`))
      }, this.resolved.shutdownTimeoutMillis)
    })
    try {
      await Promise.race([close, deadline])
    } finally {
      /* v8 ignore else -- the Promise executor assigns synchronously. */
      if (timer !== undefined) clearTimeout(timer)
    }
  }

  private queueDelivery(label: string, operation: () => Promise<void>): Promise<void> {
    this.delivery = this.delivery.then(operation).catch((error: unknown) => {
      this.logger.warn(`dsh-trace: ${label} failed`, error)
    })
    return this.delivery
  }

  private emitLedger(record: TelemetryRecord): void {
    const type = eventType(record)
    const id = sessionId(record)
    const state = this.session(id)
    switch (type) {
      case 'turn/start': {
        const body = record.body as SessionEventMap['turn/start']
        this.startTurn(id, state, body.turn, record, false)
        return
      }
      case 'turn/end': {
        const body = record.body as SessionEventMap['turn/end']
        const turn = this.ensureTurn(id, state, body.turn, record)
        this.closeStep(turn, record.time, turn.failed ? 1 : 0)
        turn.span.setAttribute('dsh.turn.reason', body.reason.kind)
        turn.span.close(record.time, turn.failed ? 1 : turnStatus(body.reason))
        delete state.turn
        return
      }
      case 'step/start': {
        const body = record.body as SessionEventMap['step/start']
        this.startStep(id, state, body.turn, body.step, record, false)
        return
      }
      case 'step/end': {
        const body = record.body as SessionEventMap['step/end']
        const turn = this.ensureTurn(id, state, body.turn, record)
        const step = this.ensureStep(id, state, body.turn, body.step, record)
        this.closeStep(turn, record.time, step.failed ? 1 : 0)
        return
      }
      case 'user/message': {
        const body = record.body as SessionEventMap['user/message']
        const step = state.turn?.step
        if (step === undefined) return
        state.messages.push(contentText(body.content))
        return
      }
      case 'request/header': {
        const body = record.body as SessionEventMap['request/header']
        const step = state.turn?.step
        if (step === undefined) return
        if (body.header.system === undefined) delete state.system
        else state.system = body.header.system
        step.span.setModel(body.header.config.model)
        step.span.setAttribute('llm.provider', body.header.config.provider)
        step.span.setIo(this.requestText(state), undefined)
        step.span.log(record.time, bodyText({ type, seq: eventSeq(record), body: record.body }))
        return
      }
      case 'assistant/message': {
        const body = record.body as SessionEventMap['assistant/message']
        const step = this.ensureStep(id, state, body.turn, body.step, record)
        const output = contentText(body.message.content)
        step.span.setModel(body.message.source.model)
        step.span.setAttribute('llm.provider', body.message.source.provider)
        step.span.setIo(this.requestText(state), output)
        step.span.setTokens(body.usage)
        state.messages.push(output)
        return
      }
      case 'tool/call': {
        const body = record.body as SessionEventMap['tool/call']
        const step = this.ensureStep(id, state, body.turn, body.step, record)
        this.startTool(step, String(body.callId), body.name, body.arguments, record)
        return
      }
      case 'tool/result': {
        const body = record.body as SessionEventMap['tool/result']
        const step = this.ensureStep(id, state, body.turn, body.step, record)
        const block = body.message.content[0]
        const callId = String(body.message.source.callId)
        const tool = step.tools.get(callId)
          ?? this.startTool(step, callId, 'unknown', undefined, record, true)
        tool.setIo(undefined, contentText(block.content))
        if (body.error !== undefined) {
          tool.setAttribute('error.name', body.error.name)
          tool.setAttribute('error.code', body.error.code)
        }
        tool.close(record.time, block.isError === true ? 1 : 0)
        step.tools.delete(callId)
        state.messages.push(contentText(block.content))
        return
      }
      case 'assistant/chunk':
      case 'session/end-seed':
        return
      default:
        this.logGeneric(state, record)
    }
  }

  private emitOps(record: TelemetryRecord): void {
    const id = sessionId(record)
    const op = record.attributes['telemetry.op']
    if (op === 'shutdown') {
      const state = this.sessions.get(id)
      if (state !== undefined) this.closeSession(id, state, record.time)
      return
    }
    if (op !== 'agent-error') return
    const turnNumber = record.attributes['turn']
    const stepNumber = record.attributes['step']
    if (typeof turnNumber !== 'number' || typeof stepNumber !== 'number') return
    const state = this.session(id)
    const turn = this.ensureTurn(id, state, turnNumber, record)
    const step = this.ensureStep(id, state, turnNumber, stepNumber, record)
    step.failed = true
    turn.failed = true
    step.span.setAttribute('error.name', String(record.attributes['error.name'] ?? 'Error'))
    step.span.log(record.time, bodyText(record.body))
  }

  private session(id: string): SessionState {
    let state = this.sessions.get(id)
    if (state !== undefined) return state
    state = { numericId: stableSessionId(id), messages: [] }
    this.sessions.set(id, state)
    return state
  }

  private startTurn(
    id: string,
    state: SessionState,
    turnNumber: number,
    record: TelemetryRecord,
    recovered: boolean,
  ): TurnState {
    if (state.turn?.turn === turnNumber) return state.turn
    if (state.turn !== undefined) this.closeTurn(state.turn, record.time, 1)
    const traceId = this.ids.next()
    const span = this.openSpan({
      traceId,
      parentSpanId: null,
      sessionId: state.numericId,
      name: 'dsh.turn',
      displayName: `Turn ${turnNumber}`,
      startedAt: record.time,
      attributes: {
        'dsh.session.id': id,
        'dsh.turn': turnNumber,
        ...sourceSeqAttribute(record),
        ...recovered ? { 'dsh.recovered_segment': true } : {},
      },
    })
    state.turn = { turn: turnNumber, span, failed: false }
    return state.turn
  }

  private ensureTurn(id: string, state: SessionState, turnNumber: number, record: TelemetryRecord): TurnState {
    return state.turn?.turn === turnNumber
      ? state.turn
      : this.startTurn(id, state, turnNumber, record, true)
  }

  private startStep(
    id: string,
    state: SessionState,
    turnNumber: number,
    stepNumber: number,
    record: TelemetryRecord,
    recovered: boolean,
  ): StepState {
    const turn = this.ensureTurn(id, state, turnNumber, record)
    if (turn.step?.step === stepNumber) return turn.step
    if (turn.step !== undefined) this.closeStep(turn, record.time, 1)
    const span = this.openSpan({
      traceId: turn.span.traceId,
      parentSpanId: turn.span.spanId,
      sessionId: state.numericId,
      name: 'dsh.step',
      displayName: `Step ${turnNumber}.${stepNumber}`,
      startedAt: record.time,
      attributes: {
        'dsh.session.id': id,
        'dsh.turn': turnNumber,
        'dsh.step': stepNumber,
        ...sourceSeqAttribute(record),
        ...recovered ? { 'dsh.recovered_segment': true } : {},
      },
    })
    turn.step = { turn: turnNumber, step: stepNumber, span, tools: new Map(), failed: false }
    return turn.step
  }

  private ensureStep(
    id: string,
    state: SessionState,
    turnNumber: number,
    stepNumber: number,
    record: TelemetryRecord,
  ): StepState {
    return state.turn?.turn === turnNumber && state.turn.step?.step === stepNumber
      ? state.turn.step
      : this.startStep(id, state, turnNumber, stepNumber, record, true)
  }

  private startTool(
    step: StepState,
    callId: string,
    toolName: string,
    input: string | undefined,
    record: TelemetryRecord,
    recovered = false,
  ): OpenSpan {
    const existing = step.tools.get(callId)
    if (existing !== undefined) return existing
    const tool = this.openSpan({
      traceId: step.span.traceId,
      parentSpanId: step.span.spanId,
      sessionId: step.span.sessionId,
      name: `tool.${toolName}`,
      displayName: toolName,
      toolName,
      startedAt: record.time,
      attributes: {
        'dsh.turn': step.turn,
        'dsh.step': step.step,
        'dsh.tool.call_id': callId,
        ...sourceSeqAttribute(record),
        ...recovered ? { 'dsh.recovered_segment': true } : {},
      },
    })
    tool.setIo(input, undefined)
    step.tools.set(callId, tool)
    return tool
  }

  private openSpan(spec: Omit<SpanSpec, 'spanId' | 'agentName' | 'tenantId'>): OpenSpan {
    return new OpenSpan(this.exporter, {
      ...spec,
      spanId: this.ids.next(),
      agentName: this.resolved.agentName,
      tenantId: this.resolved.exporter.tenantId ?? null,
    })
  }

  private closeStep(turn: TurnState, time: number, status: number): void {
    const step = turn.step
    if (step === undefined) return
    for (const tool of step.tools.values()) tool.close(time, 1)
    step.tools.clear()
    step.span.close(time, step.failed ? 1 : status)
    delete turn.step
  }

  private closeTurn(turn: TurnState, time: number, status: number): void {
    this.closeStep(turn, time, status)
    turn.span.close(time, turn.failed ? 1 : status)
  }

  private closeSession(id: string, state: SessionState, time: number): void {
    if (state.turn !== undefined) this.closeTurn(state.turn, time, 1)
    this.sessions.delete(id)
  }

  private requestText(state: SessionState): string | undefined {
    const sections = [state.system, ...state.messages].filter((value): value is string => value !== undefined && value.length > 0)
    return sections.length === 0 ? undefined : sections.join('\n\n')
  }

  private logGeneric(state: SessionState, record: TelemetryRecord): void {
    const target = state.turn?.step?.span ?? state.turn?.span
    if (target === undefined) return
    target.log(record.time, bodyText({ type: eventType(record), seq: eventSeq(record), body: record.body }))
    if (record.severity === 'error') {
      if (state.turn?.step !== undefined) state.turn.step.failed = true
      if (state.turn !== undefined) state.turn.failed = true
    }
  }
}

export default DshTrace

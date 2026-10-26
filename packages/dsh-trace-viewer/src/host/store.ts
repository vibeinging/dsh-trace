import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import { validateTraceSettings } from '../management.ts'
import type { TraceCapturedEvent, TraceCleanupPreview, TraceCleanupResult, TraceDataSettings, TraceDataStatus, TraceStoredRecord } from '../management.ts'

const RECORD_NAME = /^[a-f0-9]{64}-(?:turn|segment)-\d+\.trace\.json$/
const META_KEYS = new Set(['step', 'model', 'provider', 'toolName', 'callId', 'status', 'reason', 'errorName', 'errorCode', 'inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens'])
const DAY = 86_400_000
const HOUR = 3_600_000
const PREVIEW_LIFETIME = 300_000
const MAX_PAYLOAD_BYTES = 1_048_576
type CleanupState = { lastRunAt: number | null; removedTraces: number; lastError: string | null }
type Entry = { record: TraceStoredRecord; bytes: number; digest: string }
type Preview = { expiresAt: number; targets: Map<string, string> }
type FileIdentity = { dev: number; ino: number }

export interface TraceDataStoreOptions {
  dataDir: string
  getSettings: () => TraceDataSettings
  now?: () => number
  activeSessionIds?: () => ReadonlySet<string>
}

function message(error: unknown) { return error instanceof Error ? error.message : String(error) }
function hash(value: string) { return createHash('sha256').update(value).digest('hex') }
function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) }
function integer(value: unknown): value is number { return finite(value) && Number.isSafeInteger(value) && value >= 0 }
function isEnd(value: unknown): value is 'completed' | 'failed' | 'interrupted' { return value === 'completed' || value === 'failed' || value === 'interrupted' }
function noEntry(error: unknown) { return object(error) && error.code === 'ENOENT' }
function alreadyExists(error: unknown) { return object(error) && error.code === 'EEXIST' }
function alive(pid: number) {
  try { process.kill(pid, 0); return true } catch (error) { return !object(error) || error.code !== 'ESRCH' }
}
function segmentEnd(event: TraceCapturedEvent) {
  if (event.end !== undefined) return event.end
  if (event.turn === null && event.type === 'compaction/end' && isEnd(event.metadata.status)) return event.metadata.status
  return undefined
}

/** Only JSON content is owned here. Reasoning blocks and fields never enter the copy. */
function payload(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'object') return undefined
  if (ancestors.has(value)) throw new Error('Trace payload contains a circular reference')
  if (object(value) && [value.kind, value.type].some(kind => typeof kind === 'string' && /^(reasoning|thinking|redacted_thinking)$/i.test(kind))) return undefined
  ancestors.add(value)
  try {
    if (Array.isArray(value)) return value.map(item => payload(item, ancestors)).filter(item => item !== undefined)
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      if (/reasoning|chain.?of.?thought|^thinking$/i.test(key)) continue
      const clean = payload(item, ancestors)
      if (clean !== undefined) Object.defineProperty(result, key, { value: clean, enumerable: true, configurable: true, writable: true })
    }
    return result
  } finally { ancestors.delete(value) }
}

function cleanEvent(event: TraceCapturedEvent, settings: TraceDataSettings): TraceCapturedEvent {
  if (!event || typeof event.sessionId !== 'string' || !event.sessionId || !integer(event.seq) || !finite(event.time) || event.time < 0 || (event.turn !== null && !integer(event.turn))) throw new Error('Invalid Trace event identity')
  if (!['model', 'tool', 'compaction', 'lifecycle'].includes(event.point) || typeof event.type !== 'string' || !event.type || typeof event.failed !== 'boolean' || !object(event.metadata) || (event.end !== undefined && !isEnd(event.end))) throw new Error('Invalid Trace event')
  const metadata: TraceCapturedEvent['metadata'] = {}
  for (const [key, value] of Object.entries(event.metadata)) {
    if (!META_KEYS.has(key)) continue
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || finite(value)) metadata[key] = value
  }
  const result: TraceCapturedEvent = { sessionId: event.sessionId, turn: event.turn, seq: event.seq, time: event.time, type: event.type, point: event.point, failed: event.failed, metadata }
  if (event.end !== undefined) result.end = event.end
  const includeBody = (event.point === 'model' && settings.captureModelText) || (event.point === 'tool' && settings.captureToolPayloads)
  if (includeBody) {
    const input = payload(event.input)
    const output = payload(event.output)
    if (input !== undefined) result.input = input
    if (output !== undefined) result.output = output
    if (Buffer.byteLength(JSON.stringify({ input, output }), 'utf8') > MAX_PAYLOAD_BYTES) throw new Error('Trace event payload exceeds 1 MiB')
  }
  return result
}

/** A single writer, bounded to its own flat directory. It never reads DSH session files. */
export class TraceDataStore {
  readonly dataDir: string
  private readonly options: TraceDataStoreOptions
  private readonly now: () => number
  private readonly owner = randomUUID()
  private queue: Promise<void> = Promise.resolve()
  private initialized = false
  private closed = false
  private locked = false
  private initializedAt = 0
  private records = new Map<string, Entry>()
  private previews = new Map<string, Preview>()
  private lastCapturedAt: number | null = null
  private captureError: string | null = null
  private cleanupState: CleanupState = { lastRunAt: null, removedTraces: 0, lastError: null }

  constructor(options: TraceDataStoreOptions) {
    if (!options.dataDir || options.dataDir.split(/[\\/]/).includes('..')) throw new Error('Invalid Trace data directory')
    this.options = options
    this.now = options.now ?? Date.now
    this.dataDir = path.resolve(options.dataDir)
  }

  private serial<T>(operation: () => Promise<T>, area: 'capture' | 'cleanup' = 'capture'): Promise<T> {
    const next = this.queue.then(operation).catch(async error => {
      if (area === 'capture') this.captureError = message(error)
      else {
        this.cleanupState.lastError = message(error)
        if (this.initialized && this.locked) await this.persistState().catch(() => {})
      }
      throw error
    })
    this.queue = next.then(() => undefined, () => undefined)
    return next
  }

  private settings() { return validateTraceSettings(this.options.getSettings()) }
  private requireReady() {
    if (this.closed) throw new Error('Trace data store is closed')
    if (!this.initialized) throw new Error('Trace data store is not initialized')
  }
  private async directory() {
    const stat = await fs.lstat(this.dataDir)
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Trace data directory must be a real directory')
  }
  private file(name: string) {
    if (name !== '.writer.lock' && name !== '.state.json' && !RECORD_NAME.test(name)) throw new Error('Invalid Trace store filename')
    return path.join(this.dataDir, name)
  }
  private async readFile(name: string): Promise<{ text: string; identity: FileIdentity }> {
    await this.directory()
    const before = await fs.lstat(this.file(name))
    if (!before.isFile() || before.isSymbolicLink()) throw new Error('Trace store entry must be a regular file')
    const handle = await fs.open(this.file(name), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
    try {
      const stat = await handle.stat()
      if (!stat.isFile() || stat.dev !== before.dev || stat.ino !== before.ino) throw new Error('Trace store entry changed while reading')
      return { text: await handle.readFile('utf8'), identity: stat }
    } finally { await handle.close() }
  }
  private async read(name: string): Promise<string> { return (await this.readFile(name)).text }
  private async write(name: string, value: unknown): Promise<string> {
    await this.directory()
    const target = this.file(name)
    try {
      const current = await fs.lstat(target)
      if (!current.isFile() || current.isSymbolicLink()) throw new Error('Trace store entry must be a regular file')
    } catch (error) { if (!noEntry(error)) throw error }
    const text = `${JSON.stringify(value)}\n`
    const temp = `${target}.tmp-${this.owner}-${randomUUID()}`
    try {
      const handle = await fs.open(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
      try { await handle.writeFile(text, 'utf8'); await handle.sync() } finally { await handle.close() }
      await fs.rename(temp, target)
    } catch (error) { await fs.unlink(temp).catch(() => {}); throw error }
    return text
  }
  private async persistState() {
    await this.write('.state.json', { format: 'dsh-trace-store', version: 1, lastCapturedAt: this.lastCapturedAt, cleanup: this.cleanupState })
  }
  private async unlinkOwn(file: string, identity: FileIdentity) {
    try {
      const current = await fs.lstat(file)
      if (!current.isFile() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino) throw new Error('Trace lock ownership changed; refusing to remove it')
      await fs.unlink(file)
    } catch (error) { if (!noEntry(error)) throw error }
  }
  private async createLock() {
    const file = this.file('.writer.lock')
    const handle = await fs.open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
    let identity: FileIdentity | undefined
    try {
      identity = await handle.stat()
      await handle.writeFile(JSON.stringify({ version: 1, pid: process.pid, owner: this.owner }), 'utf8')
      await handle.sync()
      await handle.close()
      this.locked = true
    } catch (error) {
      await handle.close().catch(() => {})
      if (!identity) throw new Error(`${message(error)}; cannot identify incomplete Trace writer lock ${file}. Stop related DSH processes and move this lock aside before retrying.`)
      try { await this.unlinkOwn(file, identity) } catch (cleanupError) {
        throw new Error(`${message(error)}; failed to remove incomplete Trace writer lock: ${message(cleanupError)}`)
      }
      throw error
    }
  }
  private async lockSnapshot() {
    const { text, identity } = await this.readFile('.writer.lock')
    const lock: unknown = JSON.parse(text)
    if (!object(lock) || lock.version !== 1 || !integer(lock.pid) || lock.pid === 0 || typeof lock.owner !== 'string') throw new Error('Invalid Trace writer lock; refusing to replace it')
    return { pid: lock.pid, identity }
  }
  private async recoveryBlocked(guard: string): Promise<never> {
    let detail = 'owner unknown'
    try {
      const stat = await fs.lstat(guard)
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe Trace recovery guard')
      const handle = await fs.open(path.join(guard, 'owner.json'), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
      try {
        if (!(await handle.stat()).isFile()) throw new Error('Invalid recovery guard owner')
        const owner: unknown = JSON.parse(await handle.readFile('utf8'))
        if (object(owner) && integer(owner.pid) && owner.pid > 0) detail = `PID ${owner.pid} (${alive(owner.pid) ? 'active' : 'no longer running'})`
      } finally { await handle.close() }
    } catch { /* A damaged guard must fail closed too. */ }
    throw new Error(`Trace writer recovery is blocked by ${guard}; ${detail}. Stop all DSH processes using this data directory, move this recovery directory aside, then retry. It is never removed automatically.`)
  }
  private async acquire() {
    try { await this.createLock(); return } catch (error) { if (!alreadyExists(error)) throw error }
    const initial = await this.lockSnapshot()
    if (alive(initial.pid)) throw new Error('Trace data directory already has an active writer')
    const guard = path.join(this.dataDir, '.writer-recovery')
    try { await fs.mkdir(guard, { mode: 0o700 }) } catch (error) {
      if (alreadyExists(error)) return this.recoveryBlocked(guard)
      throw error
    }
    const identity = await fs.lstat(guard)
    const ownerFile = path.join(guard, 'owner.json')
    let ownerIdentity: FileIdentity | undefined
    const errors: unknown[] = []
    try {
      const owner = await fs.open(ownerFile, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
      try {
        ownerIdentity = await owner.stat()
        await owner.writeFile(JSON.stringify({ version: 1, pid: process.pid, owner: this.owner }), 'utf8')
      } finally { await owner.close() }
      // Every stale-lock remover owns this guard. A fresh writer may still win
      // O_EXCL after unlink; in that case we fail instead of unlinking again.
      try {
        const current = await this.lockSnapshot()
        if (alive(current.pid)) throw new Error('Trace data directory already has an active writer')
        await this.unlinkOwn(this.file('.writer.lock'), current.identity)
      } catch (error) { if (!noEntry(error)) throw error }
      try { await this.createLock() } catch (error) {
        if (alreadyExists(error)) throw new Error('Trace data directory already has an active writer')
        throw error
      }
    } catch (error) { errors.push(error) }
    try {
      const current = await fs.lstat(guard)
      if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== identity.dev || current.ino !== identity.ino) throw new Error('Trace recovery guard ownership changed')
      if (ownerIdentity) await this.unlinkOwn(ownerFile, ownerIdentity)
      await fs.rmdir(guard)
    } catch (error) {
      errors.push(new Error(`${message(error)}; Trace recovery guard remains at ${guard}. Stop related DSH processes and move it aside before retrying.`))
      if (this.locked) {
        try { await this.release() } catch (releaseError) { errors.push(releaseError) }
      }
    }
    if (errors.length === 1) throw errors[0]
    if (errors.length > 1) throw new AggregateError(errors, errors.map(message).join('; '))
  }
  private async release() {
    if (!this.locked) return
    const lock: unknown = JSON.parse(await this.read('.writer.lock'))
    if (!object(lock) || lock.owner !== this.owner) throw new Error('Trace writer lock ownership changed')
    await fs.unlink(this.file('.writer.lock'))
    this.locked = false
  }

  private decode(name: string, text: string): Entry {
    const data: unknown = JSON.parse(text)
    if (!object(data) || data.version !== 1 || typeof data.id !== 'string' || `${data.id}.trace.json` !== name || typeof data.sessionId !== 'string' || !data.sessionId || (data.turn !== null && !integer(data.turn)) || !finite(data.startedAt) || !finite(data.updatedAt) || !(data.endedAt === null || finite(data.endedAt)) || !['running', 'completed', 'failed', 'interrupted'].includes(String(data.status)) || !Array.isArray(data.events)) throw new Error(`Invalid owned Trace record: ${name}`)
    if (Object.keys(data).some(key => !['version', 'id', 'sessionId', 'turn', 'startedAt', 'updatedAt', 'endedAt', 'status', 'events'].includes(key))) throw new Error(`Unknown field in owned Trace record: ${name}`)
    const prefix = `${hash(data.sessionId)}-${data.turn === null ? 'segment' : 'turn'}-`
    if (!data.id.startsWith(prefix) || (data.turn !== null && data.id !== `${prefix}${data.turn}`)) throw new Error(`Trace record identity mismatch: ${name}`)
    const seen = new Set<number>()
    for (const item of data.events) {
      if (!object(item)) throw new Error(`Invalid Trace event in ${name}`)
      const event = cleanEvent(item as unknown as TraceCapturedEvent, { captureEnabled: true, points: { models: true, tools: true, errors: true, compaction: true }, captureModelText: true, captureToolPayloads: true, retentionDays: null, cleanupIntervalHours: 24 })
      if (event.sessionId !== data.sessionId || event.turn !== data.turn || seen.has(event.seq) || JSON.stringify(event) !== JSON.stringify(item)) throw new Error(`Invalid Trace event in ${name}`)
      seen.add(event.seq)
    }
    return { record: data as unknown as TraceStoredRecord, bytes: Buffer.byteLength(text), digest: hash(text) }
  }
  private active(record: TraceStoredRecord) { return record.status === 'running' || (record.endedAt === null && (this.options.activeSessionIds?.().has(record.sessionId) ?? false)) }
  private eligible(entry: Entry, settings: TraceDataSettings, now = this.now()) {
    return settings.retentionDays !== null && !this.active(entry.record) && entry.record.updatedAt < now - settings.retentionDays * DAY
  }
  private async settleSegments(event: TraceCapturedEvent) {
    const end = segmentEnd(event)
    if (end === undefined) return
    for (const [name, entry] of this.records) {
      const record = entry.record
      if (record.sessionId !== event.sessionId || record.status !== 'running') continue
      const sameTurn = record.turn === event.turn
      const earlierUnassigned = event.end !== undefined && record.turn === null && record.events.every(item => item.seq <= event.seq)
      if (!sameTurn && !earlierUnassigned) continue
      const ended: TraceStoredRecord = { ...record, updatedAt: Math.max(record.updatedAt, event.time), endedAt: event.time, status: end }
      const text = await this.write(name, ended)
      this.records.set(name, { record: ended, bytes: Buffer.byteLength(text), digest: hash(text) })
    }
  }

  initialize(): Promise<void> {
    return this.serial(async () => {
      if (this.closed) throw new Error('Trace data store is closed')
      this.settings()
      if (this.initialized) return
      await fs.mkdir(this.dataDir, { recursive: true, mode: 0o700 })
      await this.directory()
      await fs.chmod(this.dataDir, 0o700)
      await this.acquire()
      try {
        this.records.clear()
        try {
          const state: unknown = JSON.parse(await this.read('.state.json'))
          if (!object(state) || state.format !== 'dsh-trace-store' || state.version !== 1 || !(state.lastCapturedAt === null || finite(state.lastCapturedAt)) || !object(state.cleanup) || !(state.cleanup.lastRunAt === null || finite(state.cleanup.lastRunAt)) || !integer(state.cleanup.removedTraces) || !(state.cleanup.lastError === null || typeof state.cleanup.lastError === 'string')) throw new Error('Invalid Trace store state')
          this.lastCapturedAt = state.lastCapturedAt
          this.cleanupState = state.cleanup as CleanupState
        } catch (error) { if (!noEntry(error)) throw error }
        for (const name of await fs.readdir(this.dataDir)) {
          if (!RECORD_NAME.test(name)) continue
          const entry = this.decode(name, await this.read(name))
          if (entry.record.status === 'running' && !this.options.activeSessionIds?.().has(entry.record.sessionId)) {
            // Recovery is an observation; it does not invent an end event or endedAt.
            entry.record.status = 'interrupted'
            const text = await this.write(name, entry.record)
            entry.bytes = Buffer.byteLength(text)
            entry.digest = hash(text)
          }
          this.records.set(name, entry)
        }
        if (this.lastCapturedAt === null && this.records.size > 0) this.lastCapturedAt = Math.max(...[...this.records.values()].map(entry => entry.record.updatedAt))
        this.initializedAt = this.now()
        this.initialized = true
        this.captureError = null
      } catch (error) { await this.release(); throw error }
    })
  }

  record(event: TraceCapturedEvent): Promise<void> {
    return this.serial(async () => {
      this.requireReady()
      const settings = this.settings()
      if (!settings.captureEnabled) {
        if (event.end === undefined && !(event.turn === null && event.type === 'compaction/end')) return
        const clean = cleanEvent(event, { ...settings, captureModelText: false, captureToolPayloads: false })
        await this.settleSegments(clean)
        this.captureError = null
        return
      }
      const selected = event.point === 'lifecycle' || (event.point === 'model' && settings.points.models) || (event.point === 'tool' && settings.points.tools) || (event.point === 'compaction' && settings.points.compaction) || (settings.points.errors && (event.failed || event.metadata.status === 'interrupted' || event.end === 'interrupted'))
      if (!selected) return
      const clean = cleanEvent(event, settings)
      const sessionPrefix = hash(clean.sessionId)
      let name = clean.turn === null ? undefined : `${sessionPrefix}-turn-${clean.turn}.trace.json`
      if (name === undefined) {
        const existing = [...this.records.entries()].filter(([, entry]) => entry.record.sessionId === clean.sessionId && entry.record.turn === null)
        const match = existing.find(([, entry]) => entry.record.events.some(item => item.seq === clean.seq)) ?? existing.findLast(([, entry]) => entry.record.status === 'running')
        name = match?.[0] ?? `${sessionPrefix}-segment-${clean.seq}.trace.json`
      }
      const previous = this.records.get(name)
      if (previous?.record.events.some(item => item.seq === clean.seq)) { await this.settleSegments(clean); return }
      const record: TraceStoredRecord = previous ? { ...previous.record, events: [...previous.record.events] } : { version: 1, id: name.slice(0, -'.trace.json'.length), sessionId: clean.sessionId, turn: clean.turn, startedAt: clean.time, updatedAt: clean.time, endedAt: null, status: 'running', events: [] }
      record.events.push(clean)
      record.events.sort((a, b) => a.seq - b.seq)
      record.startedAt = Math.min(record.startedAt, clean.time)
      record.updatedAt = Math.max(record.updatedAt, clean.time)
      if (record.status === 'interrupted' && record.endedAt === null && clean.end === undefined) record.status = 'running'
      const end = segmentEnd(clean)
      if (end !== undefined) { record.status = end; record.endedAt = clean.time }
      const text = await this.write(name, record)
      this.records.set(name, { record, bytes: Buffer.byteLength(text), digest: hash(text) })
      await this.settleSegments(clean)
      this.lastCapturedAt = this.now()
      await this.persistState()
      this.captureError = null
    })
  }

  /** End only our recording segment when its host session is disposed. */
  finishSession(sessionId: string): Promise<void> {
    return this.serial(async () => {
      this.requireReady()
      this.settings()
      if (typeof sessionId !== 'string' || !sessionId) throw new Error('Invalid Trace session identity')
      for (const [name, entry] of this.records) {
        if (entry.record.sessionId !== sessionId || entry.record.status !== 'running') continue
        const now = this.now()
        const record: TraceStoredRecord = { ...entry.record, status: 'interrupted', endedAt: now, updatedAt: Math.max(entry.record.updatedAt, now) }
        const text = await this.write(name, record)
        this.records.set(name, { record, bytes: Buffer.byteLength(text), digest: hash(text) })
      }
      this.captureError = null
    })
  }

  status(): Promise<TraceDataStatus> {
    return this.serial(async () => {
      const settings = this.settings()
      const entries = [...this.records.values()]
      const eligible = entries.filter(entry => this.eligible(entry, settings))
      return {
        settings, dataDir: this.dataDir,
        stats: { traces: entries.length, events: entries.reduce((sum, entry) => sum + entry.record.events.length, 0), bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0), activeTraces: entries.filter(entry => this.active(entry.record)).length, oldestAt: entries.length ? Math.min(...entries.map(entry => entry.record.startedAt)) : null },
        lastCapturedAt: this.lastCapturedAt, captureError: this.captureError,
        cleanup: { ...this.cleanupState, nextRunAt: settings.retentionDays === null ? null : (this.cleanupState.lastRunAt ?? this.initializedAt) + (this.cleanupState.lastRunAt === null ? 0 : settings.cleanupIntervalHours * HOUR), eligibleTraces: eligible.length, eligibleBytes: eligible.reduce((sum, entry) => sum + entry.bytes, 0) },
      }
    })
  }

  previewCleanup(): Promise<TraceCleanupPreview> {
    return this.serial(async () => {
      this.requireReady()
      const settings = this.settings()
      const now = this.now()
      const targets = new Map<string, string>()
      let events = 0
      let bytes = 0
      for (const [name, entry] of this.records) {
        if (!this.eligible(entry, settings, now)) continue
        const current = this.decode(name, await this.read(name))
        if (current.digest !== entry.digest) throw new Error('Trace file changed outside the store; refresh before cleanup')
        targets.set(name, entry.digest)
        events += entry.record.events.length
        bytes += entry.bytes
      }
      for (const [key, preview] of this.previews) if (preview.expiresAt <= now) this.previews.delete(key)
      const token = randomUUID()
      const expiresAt = now + PREVIEW_LIFETIME
      this.previews.set(token, { expiresAt, targets })
      return { token, traces: targets.size, events, bytes, cutoffAt: settings.retentionDays === null ? null : now - settings.retentionDays * DAY, expiresAt }
    }, 'cleanup')
  }

  private async remove(targets: Map<string, string>, settings: TraceDataSettings): Promise<TraceCleanupResult> {
    const result: TraceCleanupResult = { removedTraces: 0, removedBytes: 0, skippedTraces: 0, completedAt: this.now() }
    this.cleanupState.lastRunAt = result.completedAt
    this.cleanupState.removedTraces = 0
    this.cleanupState.lastError = null
    try {
      for (const [name, digest] of targets) {
        const entry = this.records.get(name)
        if (!entry || !this.eligible(entry, settings) || entry.digest !== digest) { result.skippedTraces++; continue }
        let current: Entry
        try { current = this.decode(name, await this.read(name)) } catch (error) {
          if (noEntry(error)) { this.records.delete(name); result.skippedTraces++; continue }
          throw error
        }
        if (current.digest !== digest || !this.eligible(current, settings)) { result.skippedTraces++; continue }
        await fs.unlink(this.file(name))
        this.records.delete(name)
        result.removedTraces++
        result.removedBytes += current.bytes
        this.cleanupState.removedTraces = result.removedTraces
      }
      result.completedAt = this.now()
      this.cleanupState.lastRunAt = result.completedAt
      await this.persistState()
      return result
    } catch (error) {
      this.cleanupState.lastError = message(error)
      await this.persistState().catch(() => {})
      throw error
    }
  }

  cleanup(token: string): Promise<TraceCleanupResult> {
    return this.serial(async () => {
      this.requireReady()
      const settings = this.settings()
      const preview = this.previews.get(token)
      this.previews.delete(token)
      if (!preview || preview.expiresAt <= this.now()) throw new Error('Trace cleanup preview expired; preview again before confirming')
      return this.remove(preview.targets, settings)
    }, 'cleanup')
  }

  cleanupIfDue(): Promise<void> {
    return this.serial(async () => {
      this.requireReady()
      const settings = this.settings()
      if (settings.retentionDays === null) return
      if (this.cleanupState.lastRunAt !== null && this.now() < this.cleanupState.lastRunAt + settings.cleanupIntervalHours * HOUR) return
      const targets = new Map([...this.records].filter(([, entry]) => this.eligible(entry, settings)).map(([name, entry]) => [name, entry.digest]))
      await this.remove(targets, settings)
    }, 'cleanup')
  }

  close(): Promise<void> {
    return this.serial(async () => {
      if (this.closed) return
      await this.release()
      this.closed = true
      this.initialized = false
      this.previews.clear()
    })
  }
}

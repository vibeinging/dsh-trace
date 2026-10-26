/** Shared, JSON-only contracts for the Trace-owned recording store. */
export const TRACE_DATA_CHANNEL = '/api'
export const TRACE_DATA_PREFIX = 'dsh-trace-data'
export interface TraceDataSettings {
  captureEnabled: boolean
  points: { models: boolean; tools: boolean; errors: boolean; compaction: boolean }
  captureModelText: boolean
  captureToolPayloads: boolean
  retentionDays: number | null
  cleanupIntervalHours: number
}

export const DEFAULT_TRACE_SETTINGS: TraceDataSettings = {
  captureEnabled: false,
  points: { models: true, tools: true, errors: true, compaction: true },
  captureModelText: false,
  captureToolPayloads: false,
  retentionDays: 30,
  cleanupIntervalHours: 24,
}

export type TraceCapturePoint = 'model' | 'tool' | 'compaction' | 'lifecycle'

/** A whitelisted event; never the complete host event or request configuration. */
export interface TraceCapturedEvent {
  sessionId: string
  turn: number | null
  seq: number
  time: number
  type: string
  point: TraceCapturePoint
  failed: boolean
  end?: 'completed' | 'failed' | 'interrupted'
  metadata: Record<string, string | number | boolean | null>
  input?: unknown
  output?: unknown
}

export interface TraceStoredRecord {
  version: 1
  id: string
  sessionId: string
  turn: number | null
  startedAt: number
  updatedAt: number
  endedAt: number | null
  status: 'running' | 'completed' | 'failed' | 'interrupted'
  events: TraceCapturedEvent[]
}

export interface TraceDataStatus {
  settings: TraceDataSettings
  dataDir: string
  stats: { traces: number; events: number; bytes: number; activeTraces: number; oldestAt: number | null }
  lastCapturedAt: number | null
  captureError: string | null
  cleanup: {
    lastRunAt: number | null
    nextRunAt: number | null
    removedTraces: number
    eligibleTraces: number
    eligibleBytes: number
    lastError: string | null
  }
}

export interface TraceDataPageState extends TraceDataStatus {
  settingsWritable: boolean
  settingsRevision: number | undefined
}

export interface TraceCleanupPreview {
  token: string
  traces: number
  events: number
  bytes: number
  cutoffAt: number | null
  expiresAt: number
}

export interface TraceCleanupResult { removedTraces: number; removedBytes: number; skippedTraces: number; completedAt: number }

export interface TraceDataManagementApi {
  readState(): Promise<TraceDataPageState>
  saveSettings(settings: TraceDataSettings, expectedRevision: number | undefined): Promise<void>
  previewCleanup(): Promise<TraceCleanupPreview>
  cleanup(token: string): Promise<TraceCleanupResult>
}

/** Validate the complete settings object before accepting it at any boundary. */
export function validateTraceSettings(value: unknown): TraceDataSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid Trace settings')
  const settings = value as Record<string, unknown>
  const keys = ['captureEnabled', 'points', 'captureModelText', 'captureToolPayloads', 'retentionDays', 'cleanupIntervalHours']
  if (Object.keys(settings).some(key => !keys.includes(key))) throw new Error('Unknown Trace setting')
  const points = settings.points
  if (!points || typeof points !== 'object' || Array.isArray(points)) throw new Error('Invalid capture points')
  const selected = points as Record<string, unknown>
  if (Object.keys(selected).some(key => !['models', 'tools', 'errors', 'compaction'].includes(key))) throw new Error('Unknown capture point')
  for (const key of ['models', 'tools', 'errors', 'compaction']) if (typeof selected[key] !== 'boolean') throw new Error('Invalid capture point')
  for (const key of ['captureEnabled', 'captureModelText', 'captureToolPayloads']) if (typeof settings[key] !== 'boolean') throw new Error('Invalid capture switch')
  if (settings.captureEnabled && !Object.values(selected).some(value => value === true)) throw new Error('Choose at least one capture point')
  const days = settings.retentionDays
  if (days !== null && (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 3650)) throw new Error('Retention must be 1–3650 days or unlimited')
  const hours = settings.cleanupIntervalHours
  if (typeof hours !== 'number' || !Number.isInteger(hours) || hours < 1 || hours > 168) throw new Error('Cleanup interval must be 1–168 hours')
  return {
    captureEnabled: settings.captureEnabled as boolean,
    points: { models: selected.models as boolean, tools: selected.tools as boolean, errors: selected.errors as boolean, compaction: selected.compaction as boolean },
    captureModelText: settings.captureModelText as boolean,
    captureToolPayloads: settings.captureToolPayloads as boolean,
    retentionDays: days as number | null,
    cleanupIntervalHours: hours,
  }
}

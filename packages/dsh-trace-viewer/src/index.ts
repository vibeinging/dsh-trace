import type { Context, Volatile } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-app-boot'
import type {} from '@deepseek-ai/dsh-client-connection'
import type { Session, SessionSeq } from '@deepseek-ai/dsh-session'
import z from '@deepseek-ai/schemastery'
import { join } from 'node:path'
import { DEFAULT_TRACE_SETTINGS, validateTraceSettings, type TraceDataSettings } from './management.js'
import { captureSessionEvent } from './host/capture.js'
import { TraceDataStore } from './host/store.js'
import { traceDataRoutes } from './host/rpc.js'

export const name = 'dsh-trace-viewer'
export const inject = ['sessions', 'profileContext']
export interface Config { settings: Volatile<TraceDataSettings> }

const Settings = z.object({
  captureEnabled: z.boolean().default(false),
  points: z.object({ models: z.boolean().default(true), tools: z.boolean().default(true), errors: z.boolean().default(true), compaction: z.boolean().default(true) }),
  captureModelText: z.boolean().default(false),
  captureToolPayloads: z.boolean().default(false),
  retentionDays: z.union([z.number().step(1).min(1).max(3650), z.const(null)]),
  cleanupIntervalHours: z.number().step(1).min(1).max(168).default(24),
})

/** Only data schemas survive DSH's settings descriptor transport; validate cross-field rules at use/write boundaries. */
export const Config = z.object({
  // Keep null explicit: a field-level default would replace unlimited retention with 30 days.
  settings: Settings.default(DEFAULT_TRACE_SETTINGS).volatile(),
}) as z<Config>

/** Locate only the currently active boundary; seed contents are never copied. */
function liveTurn(session: Session): number | undefined {
  for (let offset = Number(session.seq) - 1; offset >= 0; offset--) {
    const event = session.eventAt(offset as SessionSeq)
    if (event?.type === 'turn/end') return undefined
    if (event?.type === 'turn/start') return event.data.turn
  }
  return undefined
}

/** Capture post-commit events globally, independently of which UI page is open. */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const profile = ctx.get('profileContext')
  if (!profile) throw new Error('Trace data management requires a DSH profile')
  const activeSessions = new Set<string>()
  const turns = new Map<string, number>()
  for (const session of ctx.sessions.list()) {
    const turn = liveTurn(session)
    if (turn !== undefined) { activeSessions.add(String(session.id)); turns.set(String(session.id), turn) }
  }
  const settings = () => validateTraceSettings(config.settings.get())
  const store = new TraceDataStore({ dataDir: join(profile.dir, 'data', 'dsh-trace-viewer'), getSettings: settings, activeSessionIds: () => activeSessions })
  await store.initialize()
  ctx.effect(() => () => store.close())
  const report = (error: unknown) => { ctx.logger.warn('Trace-owned data operation failed', error) }
  ctx.on('session/created', session => {
    const turn = liveTurn(session)
    if (turn !== undefined) { activeSessions.add(String(session.id)); turns.set(String(session.id), turn) }
  })
  ctx.on('session/event', (session, event) => {
    const id = String(session.id)
    if (event.type === 'turn/start') { activeSessions.add(id); turns.set(id, event.data.turn) }
    else if (event.type === 'step/start') { activeSessions.add(id); turns.set(id, event.data.turn) }
    try {
      if (settings().captureEnabled || event.type === 'turn/end' || event.type === 'compaction/end') {
        const value = captureSessionEvent(id, event)
        if (value) {
          if (value.type === 'request/header' && value.turn === null && turns.has(id)) value.turn = turns.get(id)!
          void store.record(value).catch(report)
        }
      }
    } catch (error) { report(error) }
    if (event.type === 'turn/end') { activeSessions.delete(id); turns.delete(id) }
  })
  ctx.on('session/disposed', session => {
    const id = String(session.id)
    activeSessions.delete(id); turns.delete(id)
    void store.finishSession(id).catch(report)
  })
  const timer = setInterval(() => { void store.cleanupIfDue().catch(report) }, 60_000)
  timer.unref()
  ctx.effect(() => () => { clearInterval(timer) })
  ctx.inject(['connection'], child => {
    for (const route of traceDataRoutes(store)) child.connection.fetch.register(route)
  })
}

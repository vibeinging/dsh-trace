import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
import { TRACE_DATA_CHANNEL, TRACE_DATA_PREFIX, validateTraceSettings, type TraceDataSettings, type TraceDataManagementApi, type TraceDataStatus, type TraceCleanupPreview, type TraceCleanupResult } from '../management.js'

export interface TraceProfileConfig { settings: TraceDataSettings }

/** The editable values and revision must come from one accepted profile snapshot. */
function formSettings(snapshot: ReturnType<ConfigForm<TraceProfileConfig>['getSnapshot']>): TraceDataSettings | undefined {
  if (snapshot.status !== 'ready' || snapshot.value === undefined) return undefined
  try { return validateTraceSettings(snapshot.value.settings) } catch { return undefined }
}

/** Statistics use an owner-authenticated RPC; edits use DSH's own profile store. */
export function managementApi(connection: ConnectionHandle, form: ConfigForm<TraceProfileConfig>): TraceDataManagementApi {
  const call = async <T,>(endpoint: string, payload: unknown): Promise<T> => {
    const result = await connection.rpc.call(TRACE_DATA_CHANNEL, `${TRACE_DATA_PREFIX}/${endpoint}`, payload)
    if (!result.ok) throw new Error(result.error.message)
    return result.value as T
  }
  return {
    async readState() {
      const status = await call<TraceDataStatus>('status', {})
      const snapshot = form.getSnapshot()
      const settings = formSettings(snapshot)
      return {
        ...status,
        settings: settings ?? status.settings,
        settingsWritable: settings !== undefined && snapshot.writable && snapshot.revision !== undefined,
        settingsRevision: settings === undefined ? undefined : snapshot.revision,
      }
    },
    async saveSettings(settings, expectedRevision) {
      const accepted = validateTraceSettings(settings)
      const snapshot = form.getSnapshot()
      if (formSettings(snapshot) === undefined || !snapshot.writable || expectedRevision === undefined) throw new Error('Trace settings are not writable yet')
      if (snapshot.revision !== expectedRevision) throw new Error('Trace settings changed; refresh before saving')
      const saved = await form.mutate([{ op: 'set', path: ['settings'], value: accepted }], expectedRevision)
      if (!saved) throw new Error('The Host refused the Trace settings update; reload the saved configuration')
    },
    previewCleanup: () => call<TraceCleanupPreview>('cleanup/preview', {}),
    cleanup: token => call<TraceCleanupResult>('cleanup/apply', { token }),
  }
}

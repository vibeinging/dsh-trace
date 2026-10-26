import { describe, expect, it, vi } from 'vitest'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { managementApi, type TraceProfileConfig } from '../src/client/managementApi.ts'
import { DEFAULT_TRACE_SETTINGS, TRACE_DATA_CHANNEL, TRACE_DATA_PREFIX, type TraceDataStatus, type TraceCleanupPreview, type TraceCleanupResult } from '../src/management.ts'

function status(): TraceDataStatus {
  return {
    settings: { ...DEFAULT_TRACE_SETTINGS, points: { ...DEFAULT_TRACE_SETTINGS.points }, captureEnabled: true },
    dataDir: '/profile/plugin-data/dsh-trace', stats: { traces: 3, events: 18, bytes: 5120, activeTraces: 1, oldestAt: 100 },
    lastCapturedAt: 200, captureError: null,
    cleanup: { lastRunAt: null, nextRunAt: 1000, removedTraces: 0, eligibleTraces: 2, eligibleBytes: 1024, lastError: null },
  }
}

function harness(change: Partial<ConfigFormSnapshot<TraceProfileConfig>> = {}) {
  let snapshot: ConfigFormSnapshot<TraceProfileConfig> = {
    status: 'ready', writable: true, revision: 17,
    value: { settings: DEFAULT_TRACE_SETTINGS }, base: undefined, user: undefined, ...change,
  }
  const response = status()
  const call = vi.fn<ConnectionHandle['rpc']['call']>().mockResolvedValue({ ok: true, value: response })
  // This adapter consumes only the authenticated RPC face, not the carrier's socket controls.
  const connection: Pick<ConnectionHandle, 'rpc'> = { rpc: { call } }
  const mutate = vi.fn<ConfigForm<TraceProfileConfig>['mutate']>().mockResolvedValue(true)
  const form: ConfigForm<TraceProfileConfig> = {
    getSnapshot: vi.fn(() => snapshot), subscribe: vi.fn(() => () => {}), mutate,
    set: vi.fn(async () => true), unset: vi.fn(async () => true),
  }
  return { api: managementApi(connection as ConnectionHandle, form), call, mutate, form, response, update: (value: Partial<typeof snapshot>) => { snapshot = { ...snapshot, ...value } } }
}

describe('Trace data management client adapter', () => {
  it('gets statistics through Connection RPC but pairs editable settings with their profile revision', async () => {
    const bench = harness()
    const state = await bench.api.readState()
    expect(bench.call).toHaveBeenCalledExactlyOnceWith(TRACE_DATA_CHANNEL, `${TRACE_DATA_PREFIX}/status`, {})
    expect(state).toEqual({ ...bench.response, settings: DEFAULT_TRACE_SETTINGS, settingsWritable: true, settingsRevision: 17 })
    // The RPC status has no revision: its settings cannot fence an editable draft.
    expect(state.settings.captureEnabled).toBe(false)
    expect(state.stats.events).toBe(18)
    expect(bench.mutate).not.toHaveBeenCalled()
  })

  it.each([
    { status: 'loading' as const, writable: true },
    { status: 'unavailable' as const, writable: true },
    { status: 'ready' as const, writable: false },
  ])('exposes a read-only page for form state $status / writable $writable', async snapshot => {
    const bench = harness(snapshot)
    const state = await bench.api.readState()
    expect(state).toMatchObject({ settingsWritable: false, settingsRevision: snapshot.status === 'ready' ? 17 : undefined })
    expect(state.settings).toEqual(snapshot.status === 'ready' ? DEFAULT_TRACE_SETTINGS : bench.response.settings)
    await expect(bench.api.saveSettings(DEFAULT_TRACE_SETTINGS, 17)).rejects.toThrow('not writable')
    expect(bench.mutate).not.toHaveBeenCalled()
  })

  it('keeps concurrent profile changes paired with their revision even when RPC returns older settings', async () => {
    const bench = harness({ status: 'loading', revision: undefined })
    let settle!: (value: Awaited<ReturnType<ConnectionHandle['rpc']['call']>>) => void
    bench.call.mockReturnValueOnce(new Promise(resolve => { settle = resolve }))
    const pending = bench.api.readState()
    const currentSettings = { ...DEFAULT_TRACE_SETTINGS, retentionDays: 7, cleanupIntervalHours: 12 }
    bench.update({ status: 'ready', writable: true, revision: 23, value: { settings: currentSettings } })
    settle({ ok: true, value: bench.response })
    const state = await pending
    expect(state).toMatchObject({ settings: currentSettings, settingsWritable: true, settingsRevision: 23 })
    await bench.api.saveSettings({ ...state.settings, captureToolPayloads: true }, state.settingsRevision)
    expect(bench.mutate).toHaveBeenCalledExactlyOnceWith([{ op: 'set', path: ['settings'], value: { ...currentSettings, captureToolPayloads: true } }], 23)
  })

  it.each([
    { value: undefined },
    { value: { settings: { ...DEFAULT_TRACE_SETTINGS, retentionDays: -1 } } },
  ])('keeps an absent or invalid profile section read-only instead of fencing RPC settings', async snapshot => {
    const bench = harness(snapshot)
    expect(await bench.api.readState()).toMatchObject({ settings: bench.response.settings, settingsWritable: false, settingsRevision: undefined })
    await expect(bench.api.saveSettings(DEFAULT_TRACE_SETTINGS, 17)).rejects.toThrow('not writable')
    expect(bench.mutate).not.toHaveBeenCalled()
  })

  it('keeps a valid profile section without an accepted revision read-only', async () => {
    const bench = harness({ revision: undefined })
    expect(await bench.api.readState()).toMatchObject({ settings: DEFAULT_TRACE_SETTINGS, settingsWritable: false, settingsRevision: undefined })
    await expect(bench.api.saveSettings(DEFAULT_TRACE_SETTINGS, undefined)).rejects.toThrow('not writable')
    expect(bench.mutate).not.toHaveBeenCalled()
  })

  it('does not accept a save without an explicitly read revision', async () => {
    const bench = harness()
    await expect(bench.api.saveSettings(DEFAULT_TRACE_SETTINGS, undefined)).rejects.toThrow('not writable')
    expect(bench.mutate).not.toHaveBeenCalled()
    expect(bench.call).not.toHaveBeenCalled()
  })

  it('rejects a stale revision even if the current form has become writable', async () => {
    const bench = harness({ revision: 18 })
    await expect(bench.api.saveSettings(DEFAULT_TRACE_SETTINGS, 17)).rejects.toThrow('changed')
    expect(bench.mutate).not.toHaveBeenCalled()
    expect(bench.call).not.toHaveBeenCalled()
  })

  it('writes only the settings path through ConfigForm with the exact earlier revision', async () => {
    const bench = harness({ revision: 0 })
    const edited = { ...DEFAULT_TRACE_SETTINGS, points: { models: false, tools: true, errors: true, compaction: false }, captureEnabled: true, retentionDays: 7 }
    await expect(bench.api.saveSettings(edited, 0)).resolves.toBeUndefined()
    expect(bench.mutate).toHaveBeenCalledExactlyOnceWith([{ op: 'set', path: ['settings'], value: edited }], 0)
    expect(bench.mutate.mock.calls[0]?.[0][0]).toEqual({ op: 'set', path: ['settings'], value: edited })
    expect(bench.form.set).not.toHaveBeenCalled()
    expect(bench.form.unset).not.toHaveBeenCalled()
    expect(bench.call).not.toHaveBeenCalled()
  })

  it('reports a Host-refused profile write as failure', async () => {
    const bench = harness()
    bench.mutate.mockResolvedValueOnce(false)
    await expect(bench.api.saveSettings(DEFAULT_TRACE_SETTINGS, 17)).rejects.toThrow('Host refused')
    expect(bench.mutate).toHaveBeenCalledOnce()
  })

  it('propagates a failed settings transport instead of reporting success', async () => {
    const bench = harness()
    const error = new Error('profile transport disconnected')
    bench.mutate.mockRejectedValueOnce(error)
    await expect(bench.api.saveSettings(DEFAULT_TRACE_SETTINGS, 17)).rejects.toBe(error)
  })

  it('validates settings before sending a profile mutation', async () => {
    const bench = harness()
    await expect(bench.api.saveSettings({ ...DEFAULT_TRACE_SETTINGS, retentionDays: -1 }, 17)).rejects.toThrow('Retention')
    expect(bench.mutate).not.toHaveBeenCalled()
    expect(bench.call).not.toHaveBeenCalled()
  })

  it('requests a cleanup preview without deleting, then sends only its token for apply', async () => {
    const bench = harness()
    const preview: TraceCleanupPreview = { token: 'owner-preview-token', traces: 2, events: 12, bytes: 4096, cutoffAt: 100, expiresAt: 300 }
    const applied: TraceCleanupResult = { removedTraces: 2, removedBytes: 4096, skippedTraces: 0, completedAt: 250 }
    bench.call.mockResolvedValueOnce({ ok: true, value: preview }).mockResolvedValueOnce({ ok: true, value: applied })
    expect(await bench.api.previewCleanup()).toEqual(preview)
    expect(bench.call).toHaveBeenCalledExactlyOnceWith(TRACE_DATA_CHANNEL, `${TRACE_DATA_PREFIX}/cleanup/preview`, {})
    expect(await bench.api.cleanup(preview.token)).toEqual(applied)
    expect(bench.call).toHaveBeenNthCalledWith(2, TRACE_DATA_CHANNEL, `${TRACE_DATA_PREFIX}/cleanup/apply`, { token: preview.token })
    expect(bench.call.mock.calls[1]?.[2]).toEqual({ token: 'owner-preview-token' })
    expect(bench.mutate).not.toHaveBeenCalled()
  })

  it.each(['readState', 'previewCleanup', 'cleanup'] as const)('propagates Host error envelopes from %s', async operation => {
    const bench = harness()
    bench.call.mockResolvedValueOnce({ ok: false, error: { code: 'forbidden', message: 'owner authorization required', details: {} } })
    const request = operation === 'cleanup' ? bench.api.cleanup('preview-token') : bench.api[operation]()
    await expect(request).rejects.toThrow('owner authorization required')
  })

  it('propagates a status transport rejection without reading the form or synthesizing a ready state', async () => {
    const bench = harness()
    const error = new Error('connection lost')
    bench.call.mockRejectedValueOnce(error)
    await expect(bench.api.readState()).rejects.toBe(error)
    expect(bench.form.getSnapshot).not.toHaveBeenCalled()
  })
})

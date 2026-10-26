// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import * as connectionPlugin from '@deepseek-ai/dsh-client-connection'
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import { traceDataRoutes, traceDataRpc } from '../src/host/rpc.ts'
import type { TraceDataStore } from '../src/host/store.ts'
import { DEFAULT_TRACE_SETTINGS, TRACE_DATA_CHANNEL, TRACE_DATA_PREFIX, type TraceDataStatus, type TraceCleanupPreview, type TraceCleanupResult } from '../src/management.ts'

type Peer = Parameters<ConnectionRpcHandler>[3]
type ManagedStore = Pick<TraceDataStore, 'status' | 'previewCleanup' | 'cleanup'>
// Only principal is consulted here; carrier and peer lifetime are outside this handler.
const owner = { principal: { kind: 'owner' } } as Peer
const nonOwner = { principal: { kind: 'unprivileged-api-peer' } } as unknown as Peer

function harness() {
  const state: TraceDataStatus = {
    settings: DEFAULT_TRACE_SETTINGS, dataDir: '/profile/plugin-data/dsh-trace',
    stats: { traces: 2, events: 8, bytes: 512, activeTraces: 0, oldestAt: 100 },
    lastCapturedAt: 200, captureError: null,
    cleanup: { lastRunAt: null, nextRunAt: 1000, removedTraces: 0, eligibleTraces: 1, eligibleBytes: 256, lastError: null },
  }
  const preview: TraceCleanupPreview = { token: 'preview-1', traces: 1, events: 4, bytes: 256, cutoffAt: 150, expiresAt: 500 }
  const result: TraceCleanupResult = { removedTraces: 1, removedBytes: 256, skippedTraces: 0, completedAt: 300 }
  const store = {
    status: vi.fn<ManagedStore['status']>().mockResolvedValue(state),
    previewCleanup: vi.fn<ManagedStore['previewCleanup']>().mockResolvedValue(preview),
    cleanup: vi.fn<ManagedStore['cleanup']>().mockResolvedValue(result),
  } satisfies ManagedStore
  const handler = traceDataRpc(store)
  const signal = new AbortController().signal
  const call = (endpoint: string, payload: unknown, peer = owner, requestSignal = signal) => handler(endpoint, payload, requestSignal, peer)
  const untouched = () => {
    expect(store.status).not.toHaveBeenCalled()
    expect(store.previewCleanup).not.toHaveBeenCalled()
    expect(store.cleanup).not.toHaveBeenCalled()
  }
  return { store, state, preview, result, call, untouched }
}

describe('Trace data owner RPC boundary', () => {
  it.each(['status', 'cleanup/preview', 'cleanup/apply'])('refuses non-owner %s requests before touching the store', async endpoint => {
    const bench = harness()
    expect(await bench.call(endpoint, endpoint === 'cleanup/apply' ? { token: 'preview-1' } : {}, nonOwner)).toEqual({
      ok: false, error: { code: 'forbidden', message: 'Trace data management requires the Host owner', details: {} },
    })
    bench.untouched()
  })

  it.each(['status', 'cleanup/preview', 'cleanup/apply'])('rejects an already aborted %s request without store effects', async endpoint => {
    const bench = harness()
    const controller = new AbortController()
    controller.abort()
    expect(await bench.call(endpoint, endpoint === 'cleanup/apply' ? { token: 'preview-1' } : {}, owner, controller.signal)).toMatchObject({ ok: false, error: { code: 'aborted' } })
    bench.untouched()
  })

  it.each([null, undefined, 'payload', 42, true, []])('rejects a non-object payload %j', async payload => {
    const bench = harness()
    expect(await bench.call('status', payload)).toMatchObject({ ok: false, error: { code: 'invalid-payload' } })
    bench.untouched()
  })

  it.each(['status', 'cleanup/preview'])('rejects custom path or filtering fields for %s', async endpoint => {
    const bench = harness()
    expect(await bench.call(endpoint, { path: '/arbitrary/host/path', days: 0 })).toMatchObject({ ok: false, error: { code: 'invalid-payload' } })
    bench.untouched()
  })

  it('returns status only from the store read operation', async () => {
    const bench = harness()
    expect(await bench.call('status', {})).toEqual({ ok: true, value: bench.state })
    expect(bench.store.status).toHaveBeenCalledExactlyOnceWith()
    expect(bench.store.previewCleanup).not.toHaveBeenCalled()
    expect(bench.store.cleanup).not.toHaveBeenCalled()
  })

  it('returns a preview without invoking deletion or a status side operation', async () => {
    const bench = harness()
    expect(await bench.call('cleanup/preview', {})).toEqual({ ok: true, value: bench.preview })
    expect(bench.store.previewCleanup).toHaveBeenCalledExactlyOnceWith()
    expect(bench.store.cleanup).not.toHaveBeenCalled()
    expect(bench.store.status).not.toHaveBeenCalled()
  })

  it.each([
    {}, { token: '' }, { token: 123 }, { token: null }, { token: 'x'.repeat(201) },
    { token: 'preview-1', path: '/arbitrary/host/path' }, { token: 'preview-1', cutoffAt: 0 },
  ])('rejects invalid cleanup input without reaching the store: %j', async payload => {
    const bench = harness()
    expect(await bench.call('cleanup/apply', payload)).toMatchObject({ ok: false, error: { code: 'invalid-payload' } })
    bench.untouched()
  })

  it('passes exactly one preview token to the cleanup store', async () => {
    const bench = harness()
    expect(await bench.call('cleanup/apply', { token: bench.preview.token })).toEqual({ ok: true, value: bench.result })
    expect(bench.store.cleanup).toHaveBeenCalledExactlyOnceWith('preview-1')
    expect(bench.store.previewCleanup).not.toHaveBeenCalled()
    expect(bench.store.status).not.toHaveBeenCalled()
  })

  it('preserves an expired-token refusal from the authoritative store as an error envelope', async () => {
    const bench = harness()
    bench.store.cleanup.mockRejectedValueOnce(new Error('Cleanup preview expired; preview again'))
    expect(await bench.call('cleanup/apply', { token: 'expired-preview' })).toEqual({
      ok: false, error: { code: 'trace-data-error', message: 'Cleanup preview expired; preview again', details: {} },
    })
    expect(bench.store.cleanup).toHaveBeenCalledExactlyOnceWith('expired-preview')
  })

  it('does not touch the store for an unknown operation', async () => {
    const bench = harness()
    expect(await bench.call('cleanup/delete-all', {})).toEqual({ ok: false, error: { code: 'not-found', message: 'Unknown Trace data operation', details: {} } })
    bench.untouched()
  })

  it.each(['status', 'cleanup/preview', 'cleanup/apply'])('turns store exceptions from %s into failure envelopes', async endpoint => {
    const bench = harness()
    const operation = endpoint === 'status' ? bench.store.status : endpoint === 'cleanup/preview' ? bench.store.previewCleanup : bench.store.cleanup
    operation.mockRejectedValueOnce(new Error('Trace storage unavailable'))
    expect(await bench.call(endpoint, endpoint === 'cleanup/apply' ? { token: 'preview-1' } : {})).toEqual({
      ok: false, error: { code: 'trace-data-error', message: 'Trace storage unavailable', details: {} },
    })
  })

  it('does not expose arbitrary thrown objects in a transport response', async () => {
    const bench = harness()
    bench.store.status.mockRejectedValueOnce({ secretInternalState: 'never-return' })
    expect(await bench.call('status', {})).toEqual({ ok: false, error: { code: 'trace-data-error', message: 'Trace data operation failed', details: {} } })
  })
})

describe('Trace exact Connection routes', () => {
  const request = (endpoint = 'status', fields: Record<string, unknown> = {}, init: RequestInit = {}) => new Request(`http://127.0.0.1${TRACE_DATA_CHANNEL}/${TRACE_DATA_PREFIX}/${endpoint}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'trace-route-test', method: `${TRACE_DATA_PREFIX}/${endpoint}`, payload: {}, ...fields }),
    ...init,
  })

  it('registers only three buffered POST routes below its own API prefix', () => {
    const bench = harness()
    expect(traceDataRoutes(bench.store).map(({ path, methods, requestBody }) => ({ path, methods, requestBody }))).toEqual(
      ['status', 'cleanup/preview', 'cleanup/apply'].map(endpoint => ({ path: `/api/dsh-trace-data/${endpoint}`, methods: ['POST'], requestBody: 'buffered' })),
    )
  })

  it('works in a strict sibling-service tree, uses the carrier owner gate, and releases its registrations', async () => {
    const bench = harness()
    const ctx = new Context()
    ctx.reflect.provide('credentials', { readRecord: async () => undefined, modifyRecord: async (_key: unknown, mutate: (current: undefined) => Promise<unknown>) => mutate(undefined) })
    await ctx.plugin(scope => { scope.provide('webServer', {
      host: '127.0.0.1', protocol: 'http:', port: 0,
      register: () => () => {}, registerUpgrade: () => () => {}, tapIndex: () => () => {},
    } as never) })
    await ctx.plugin(connectionPlugin)
    const registration = ctx.inject(['connection'], child => {
      for (const route of traceDataRoutes(bench.store)) child.connection.fetch.register(route)
    })
    try {
      await registration
      const connection = ctx.get('connection') as connectionPlugin.HostConnectionService
      const carrier = connection.createSharedFetchHandler('/api')
      const ownerResponse = await carrier.fetch(request(), connection.browserPeer)
      expect(ownerResponse.status).toBe(200)
      expect(await ownerResponse.json()).toEqual({ type: 'server-response', rpcId: 'trace-route-test', result: { ok: true, value: bench.state } })
      expect(bench.store.status).toHaveBeenCalledOnce()
      for (const endpoint of ['status', 'cleanup/preview', 'cleanup/apply']) {
        const forbidden = await carrier.fetch(request(endpoint, { payload: endpoint === 'cleanup/apply' ? { token: 'preview-1' } : {} }), nonOwner)
        expect(forbidden.status).toBe(403)
      }
      expect(bench.store.status).toHaveBeenCalledOnce()
      expect(bench.store.previewCleanup).not.toHaveBeenCalled()
      expect(bench.store.cleanup).not.toHaveBeenCalled()
      expect((await carrier.fetch(request('unknown'), connection.browserPeer)).status).toBe(404)
      await registration.dispose()
      expect((await carrier.fetch(request(), connection.browserPeer)).status).toBe(404)
    } finally { await ctx.fiber.dispose() }
  })

  it.each([
    ['status', {}, 'state'], ['cleanup/preview', {}, 'preview'], ['cleanup/apply', { token: 'preview-1' }, 'result'],
  ] as const)('frames %s results with the original correlation id', async (endpoint, payload, resultKey) => {
    const bench = harness()
    const route = traceDataRoutes(bench.store).find(candidate => candidate.path.endsWith(`/${endpoint}`))!
    const response = await route.fetch(request(endpoint, { payload }))
    expect(await response.json()).toEqual({ type: 'server-response', rpcId: 'trace-route-test', result: { ok: true, value: bench[resultKey] } })
  })

  it.each([
    { label: 'wrong method', fields: { method: 'dsh-trace-data/cleanup/apply' }, status: 200, code: 'gateway/bad-request' },
    { label: 'wrong direction', fields: { type: 'server-response' }, status: 400 },
    { label: 'missing correlation id', fields: { rpcId: null }, status: 400 },
    { label: 'wrong media type', init: { headers: { 'content-type': 'text/plain' } }, status: 415 },
    { label: 'malformed JSON', init: { body: '{' }, status: 400 },
  ])('rejects $label before reading or changing the store', async ({ fields, init, status, code }) => {
    const bench = harness()
    const response = await traceDataRoutes(bench.store)[0]!.fetch(request('status', fields, init))
    expect(response.status).toBe(status)
    if (code) expect(await response.json()).toMatchObject({ type: 'server-response', rpcId: 'trace-route-test', result: { ok: false, error: { code } } })
    bench.untouched()
  })

  it('rejects an already cancelled request without starting an operation', async () => {
    const bench = harness()
    const controller = new AbortController()
    controller.abort()
    const response = await traceDataRoutes(bench.store)[0]!.fetch(request('status', {}, { signal: controller.signal }))
    expect(await response.json()).toMatchObject({ result: { ok: false, error: { code: 'aborted' } } })
    bench.untouched()
  })

  it('does not accept a different URL or HTTP method through the endpoint adapter', async () => {
    const bench = harness()
    const route = traceDataRoutes(bench.store)[0]!
    expect((await route.fetch(request('cleanup/apply', { payload: { token: 'preview-1' } }))).status).toBe(404)
    expect((await route.fetch(new Request('http://127.0.0.1/api/dsh-trace-data/status'))).status).toBe(404)
    bench.untouched()
  })
})

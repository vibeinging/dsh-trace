// @vitest-environment node
import { Context } from '@deepseek-ai/cordis'
import { SessionSeq, type Session } from '@deepseek-ai/dsh-session'
import * as connectionPlugin from '@deepseek-ai/dsh-client-connection'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { apply } from '../src/index.js'
import { DEFAULT_TRACE_SETTINGS, TRACE_DATA_CHANNEL, TRACE_DATA_PREFIX, type TraceDataSettings, type TraceDataStatus } from '../src/management.js'

describe('global Host recording', () => {
  it('records future events without a client, observes the off switch, and leaves source files intact', async () => {
    const profile = await mkdtemp(join(tmpdir(), 'trace-host-'))
    const source = join(profile, 'canonical-session-marker')
    await writeFile(source, 'source session stays intact')
    const ctx = new Context()
    let policy: TraceDataSettings = structuredClone(DEFAULT_TRACE_SETTINGS)
    ctx.reflect.provide('sessions', { list: () => [] })
    ctx.reflect.provide('profileContext', { dir: profile })
    ctx.reflect.provide('credentials', { readRecord: async () => undefined, modifyRecord: async (_key: unknown, mutate: (current: undefined) => Promise<unknown>) => mutate(undefined) })
    // A sibling owns webServer, as in the real Loader. Root-provided doubles
    // would hide generic-channel registration's strict-injection failure.
    await ctx.plugin(scope => { scope.provide('webServer', {
      host: '127.0.0.1', port: 0, protocol: 'http:',
      register: () => () => {}, registerUpgrade: () => () => {}, tapIndex: () => () => {},
    } as never) })
    await ctx.plugin(connectionPlugin)
    const connection = ctx.get('connection') as connectionPlugin.HostConnectionService
    const carrier = connection.createSharedFetchHandler('/api')
    const fiber = ctx.plugin({ name: 'trace-recording-test', inject: ['sessions', 'profileContext'], apply: scope => apply(scope, { settings: { get: () => policy } }) })
    const request = () => new Request(`http://127.0.0.1${TRACE_DATA_CHANNEL}/${TRACE_DATA_PREFIX}/status`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'host-test', method: `${TRACE_DATA_PREFIX}/status`, payload: {} }),
    })
    const status = async () => {
      const response = await carrier.fetch(request(), connection.browserPeer)
      expect(response.status).toBe(200)
      const { result } = await response.json()
      if (!result.ok) throw new Error(result.error.message)
      return result.value as TraceDataStatus
    }
    const session = { id: 'host-session' } as unknown as Session
    try {
      await fiber
      ctx.emit('session/event', session, { type: 'turn/start', seq: SessionSeq(0), time: 1000, data: { turn: 1 } })
      ctx.emit('session/event', session, { type: 'turn/end', seq: SessionSeq(1), time: 2000, data: { turn: 1, reason: { kind: 'completed' } } })
      expect((await status()).stats.traces).toBe(0)
      policy = { ...policy, captureEnabled: true }
      ctx.emit('session/event', session, { type: 'turn/start', seq: SessionSeq(2), time: 3000, data: { turn: 2 } })
      ctx.emit('session/event', session, { type: 'step/start', seq: SessionSeq(3), time: 3100, data: { turn: 2, step: 1 } })
      const active = await status()
      expect(active.stats).toMatchObject({ traces: 1, events: 2, activeTraces: 1 })
      policy = { ...policy, captureEnabled: false }
      ctx.emit('session/event', session, { type: 'step/end', seq: SessionSeq(4), time: 3200, data: { turn: 2, step: 1 } })
      ctx.emit('session/event', session, { type: 'turn/end', seq: SessionSeq(5), time: 4000, data: { turn: 2, reason: { kind: 'completed' } } })
      expect((await status()).stats).toMatchObject({ traces: 1, events: 2, activeTraces: 0 })
      expect(await readFile(source, 'utf8')).toBe('source session stays intact')
      await fiber.dispose()
      expect((await carrier.fetch(request(), connection.browserPeer)).status).toBe(404)
      expect(await readdir(join(profile, 'data', 'dsh-trace-viewer'))).not.toContain('.writer.lock')
    } finally { await fiber.dispose(); await ctx.fiber.dispose(); await rm(profile, { recursive: true, force: true }) }
  })

  it('requires an explicit DSH profile instead of falling back to a shared directory', async () => {
    const ctx = new Context()
    try { await expect(apply(ctx, { settings: { get: () => DEFAULT_TRACE_SETTINGS } })).rejects.toThrow('requires a DSH profile') }
    finally { await ctx.fiber.dispose() }
  })
})

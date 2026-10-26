// @vitest-environment node
import { createHash } from 'node:crypto'
import { spawn, execFile } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_TRACE_SETTINGS } from '../src/management.ts'
import type { TraceCapturedEvent, TraceDataSettings, TraceStoredRecord } from '../src/management.ts'
import { TraceDataStore } from '../src/host/store.ts'

const DAY = 86_400_000
const dirs: string[] = []
const stores: TraceDataStore[] = []
const children: ChildProcess[] = []
afterEach(async () => {
  for (const child of children.splice(0)) { if (child.exitCode === null) child.kill('SIGKILL') }
  for (const store of stores.splice(0)) await store.close().catch(() => {})
  for (const dir of dirs.splice(0)) await fs.rm(dir, { recursive: true, force: true })
})

function event(overrides: Partial<TraceCapturedEvent> = {}): TraceCapturedEvent {
  return { sessionId: 'session-one', turn: 1, seq: 1, time: 10 * DAY, type: 'model/end', point: 'model', failed: false, metadata: { model: 'test-model' }, input: 'question', output: 'answer', ...overrides }
}
async function fixture(overrides: Partial<TraceDataSettings> = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'trace-store-'))
  dirs.push(root)
  const dataDir = path.join(root, 'owned')
  let settings: TraceDataSettings = { ...DEFAULT_TRACE_SETTINGS, points: { ...DEFAULT_TRACE_SETTINGS.points }, ...overrides }
  let now = 100 * DAY
  const active = new Set<string>()
  const create = () => {
    const store = new TraceDataStore({ dataDir, getSettings: () => settings, now: () => now, activeSessionIds: () => active })
    stores.push(store)
    return store
  }
  const store = create()
  await store.initialize()
  return { root, dataDir, store, create, active, setNow: (value: number) => { now = value }, setSettings: (value: Partial<TraceDataSettings>) => { settings = { ...settings, ...value } } }
}
async function saved(dir: string): Promise<TraceStoredRecord[]> {
  const names = (await fs.readdir(dir)).filter(name => name.endsWith('.trace.json'))
  return Promise.all(names.map(async name => JSON.parse(await fs.readFile(path.join(dir, name), 'utf8')) as TraceStoredRecord))
}
const storeUrl = new URL('../src/host/store.ts', import.meta.url).href
function childMessage(child: ChildProcess) { return once(child, 'message').then(([value]) => value as { type: string; error?: string }) }

describe('Trace-owned data store', () => {
  it('defaults to no capture and does not create any content or settings file', async () => {
    const bench = await fixture()
    await bench.store.record(event())
    expect(await fs.readdir(bench.dataDir)).toEqual(['.writer.lock'])
    expect((await bench.store.status()).stats).toMatchObject({ traces: 0, events: 0, bytes: 0 })
    expect((await fs.stat(bench.dataDir)).mode & 0o777).toBe(0o700)
  })

  it('applies point and body switches, keeps selected failures, and strips reasoning and unknown metadata', async () => {
    const bench = await fixture({ captureEnabled: true, points: { models: false, tools: true, errors: true, compaction: false } })
    await bench.store.record(event())
    await bench.store.record(event({ seq: 2, failed: true, metadata: { errorName: 'Unavailable', reasoning: 'private', reasoningTokens: 3, secret: 'hidden' } }))
    await bench.store.record(event({ seq: 3, point: 'tool' }))
    await bench.store.record(event({ seq: 4, point: 'compaction' }))
    await bench.store.record(event({ seq: 5, point: 'lifecycle', metadata: { status: 'completed' }, end: 'completed' }))
    let record = (await saved(bench.dataDir))[0]!
    expect(record.events.map(item => item.seq)).toEqual([2, 3, 5])
    expect(record.events[0]?.metadata).toEqual({ errorName: 'Unavailable', reasoningTokens: 3 })
    expect(record.events.every(item => item.input === undefined && item.output === undefined)).toBe(true)
    bench.setSettings({ captureModelText: true, captureToolPayloads: true })
    await bench.store.record(event({ seq: 6, point: 'tool', input: { command: 'pwd', reasoning: 'private' }, output: [{ type: 'reasoning', text: 'private' }, { type: 'text', text: 'safe' }] }))
    record = (await saved(bench.dataDir))[0]!
    expect(record.events.at(-1)?.input).toEqual({ command: 'pwd' })
    expect(record.events.at(-1)?.output).toEqual([{ type: 'text', text: 'safe' }])
    expect(JSON.stringify(record)).not.toContain('private')
    expect(JSON.stringify(record.events.find(item => item.point === 'lifecycle'))).not.toContain('answer')
  })

  it('captures interrupted events with only the failures point enabled without relabeling them as failures', async () => {
    const bench = await fixture({ captureEnabled: true, points: { models: false, tools: false, compaction: false, errors: true } })
    await bench.store.record(event())
    await bench.store.record(event({ seq: 2, type: 'assistant/attempt', metadata: { status: 'interrupted', reason: 'aborted' } }))
    await bench.store.record(event({ seq: 3, type: 'assistant/message', metadata: { status: 'interrupted' } }))
    const record = (await saved(bench.dataDir))[0]!
    expect(record.events.map(item => item.seq)).toEqual([2, 3])
    expect(record.events.every(item => item.failed === false && item.metadata.status === 'interrupted')).toBe(true)
    expect(record.events.every(item => item.input === undefined && item.output === undefined)).toBe(true)
  })

  it('recovers real statistics on restart, deduplicates seq, and persists cleanup state', async () => {
    const bench = await fixture({ captureEnabled: true })
    await Promise.all([bench.store.record(event()), bench.store.record(event()), bench.store.record(event({ seq: 2, point: 'lifecycle', end: 'completed' }))])
    const before = await bench.store.status()
    expect(before.stats).toMatchObject({ traces: 1, events: 2, activeTraces: 0 })
    await bench.store.cleanupIfDue()
    expect((await bench.store.status()).stats.traces).toBe(0)
    await bench.store.close()
    const reopened = bench.create()
    await reopened.initialize()
    expect((await reopened.status()).cleanup).toMatchObject({ lastRunAt: 100 * DAY, removedTraces: 1 })
    expect((await reopened.status()).lastCapturedAt).toBe(100 * DAY)
  })

  it('does not delete during preview and deletes only expired ended traces after confirmation', async () => {
    const bench = await fixture({ captureEnabled: true, retentionDays: 30 })
    await bench.store.record(event({ turn: 1, end: 'completed' }))
    await bench.store.record(event({ turn: 2, seq: 2, time: 90 * DAY, end: 'completed' }))
    await bench.store.record(event({ turn: 3, seq: 3 }))
    const preview = await bench.store.previewCleanup()
    expect(preview).toMatchObject({ traces: 1, events: 1, cutoffAt: 70 * DAY, expiresAt: 100 * DAY + 300_000 })
    expect((await saved(bench.dataDir))).toHaveLength(3)
    expect(preview.bytes).toBeGreaterThan(0)
    const result = await bench.store.cleanup(preview.token)
    expect(result).toMatchObject({ removedTraces: 1, removedBytes: preview.bytes, skippedTraces: 0 })
    expect((await saved(bench.dataDir)).map(item => item.turn).sort()).toEqual([2, 3])
    await expect(bench.store.cleanup(preview.token)).rejects.toThrow('preview expired')
  })

  it('skips changed targets, allows ended records in an active session, and never adds new expired records', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event({ turn: 1, end: 'completed' }))
    await bench.store.record(event({ sessionId: 'another', turn: 2, seq: 2, end: 'completed' }))
    const preview = await bench.store.previewCleanup()
    bench.active.add('another')
    await bench.store.record(event({ turn: 1, seq: 3, time: 11 * DAY }))
    await bench.store.record(event({ turn: 3, seq: 4, end: 'completed' }))
    const result = await bench.store.cleanup(preview.token)
    expect(result).toMatchObject({ removedTraces: 1, skippedTraces: 1 })
    expect((await saved(bench.dataDir))).toHaveLength(2)
  })

  it('expires confirmation and rechecks a changed retention policy', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event({ end: 'completed' }))
    const expired = await bench.store.previewCleanup()
    bench.setNow(expired.expiresAt)
    await expect(bench.store.cleanup(expired.token)).rejects.toThrow('expired')
    expect((await bench.store.status()).cleanup.lastError).toContain('expired')
    const preview = await bench.store.previewCleanup()
    bench.setSettings({ retentionDays: null })
    expect(await bench.store.cleanup(preview.token)).toMatchObject({ removedTraces: 0, skippedTraces: 1 })
    await bench.store.cleanupIfDue()
    expect((await bench.store.status()).cleanup.nextRunAt).toBeNull()
    expect((await saved(bench.dataDir))).toHaveLength(1)
  })

  it('obeys the cleanup interval and preserves running records during automatic cleanup', async () => {
    const bench = await fixture({ captureEnabled: true, cleanupIntervalHours: 24 })
    await bench.store.record(event({ end: 'completed' }))
    await bench.store.record(event({ seq: 2, turn: 2 }))
    await bench.store.cleanupIfDue()
    expect((await saved(bench.dataDir)).map(item => item.turn)).toEqual([2])
    await bench.store.record(event({ seq: 3, turn: 3, end: 'completed' }))
    bench.setNow(100 * DAY + 3_600_000)
    await bench.store.cleanupIfDue()
    expect((await saved(bench.dataDir))).toHaveLength(2)
    bench.setNow(101 * DAY)
    await bench.store.cleanupIfDue()
    expect((await saved(bench.dataDir)).map(item => item.turn)).toEqual([2])
  })

  it('recovers abandoned running segments without inventing an end event, and protects active sessions', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event())
    await bench.store.record(event({ sessionId: 'active', seq: 2 }))
    await bench.store.close()
    bench.active.add('active')
    const reopened = bench.create()
    await reopened.initialize()
    const records = await saved(bench.dataDir)
    expect(records.find(item => item.sessionId === 'session-one')).toMatchObject({ status: 'interrupted', endedAt: null })
    expect(records.find(item => item.sessionId === 'session-one')?.events).toHaveLength(1)
    expect(records.find(item => item.sessionId === 'active')?.status).toBe('running')
    expect((await reopened.status()).stats).toMatchObject({ traces: 2, events: 2, activeTraces: 1 })
    expect((await reopened.previewCleanup()).traces).toBe(1)
  })

  it('allows a disabled recorder to end existing segments without storing a new event or body', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event())
    bench.setSettings({ captureEnabled: false })
    await bench.store.record(event({ seq: 2, type: 'turn/end', point: 'lifecycle', end: 'completed', input: 'not saved' }))
    await bench.store.record(event({ seq: 3, turn: 2, end: 'completed' }))
    const records = await saved(bench.dataDir)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ status: 'completed', endedAt: 10 * DAY })
    expect(records[0]?.events).toHaveLength(1)
    expect(JSON.stringify(records)).not.toContain('not saved')
    expect((await bench.store.previewCleanup()).traces).toBe(1)
  })

  it('ends only owned recording segments on disposal without protecting ended records forever', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event())
    bench.active.add('session-one')
    await bench.store.finishSession('session-one')
    let record = (await saved(bench.dataDir))[0]!
    expect(record).toMatchObject({ status: 'interrupted', endedAt: 100 * DAY })
    expect(record.events).toHaveLength(1)
    bench.setNow(140 * DAY)
    expect((await bench.store.previewCleanup()).traces).toBe(1)
    bench.active.clear()
    expect((await bench.store.previewCleanup()).traces).toBe(1)
    await bench.store.record(event({ seq: 2, time: 140 * DAY }))
    record = (await saved(bench.dataDir))[0]!
    expect(record.events).toHaveLength(2)
  })

  it('counts and protects the running turn rather than every old completed turn in the same session', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event({ end: 'completed' }))
    await bench.store.record(event({ seq: 2, turn: 2, end: 'failed' }))
    await bench.store.record(event({ seq: 3, turn: 3 }))
    bench.active.add('session-one')
    expect((await bench.store.status()).stats).toMatchObject({ traces: 3, activeTraces: 1 })
    expect((await bench.store.previewCleanup()).traces).toBe(2)
    const result = await bench.store.cleanup((await bench.store.previewCleanup()).token)
    expect(result.removedTraces).toBe(2)
    expect((await saved(bench.dataDir)).map(item => item.turn)).toEqual([3])
  })

  it('uses hash-only filenames and separate null segments with stable duplicate handling', async () => {
    const bench = await fixture({ captureEnabled: true })
    const strange = '../../outside/session'
    await bench.store.record(event({ sessionId: strange, turn: null }))
    await bench.store.record(event({ sessionId: strange, turn: null, seq: 2, end: 'completed' }))
    await bench.store.record(event({ sessionId: strange, turn: null, seq: 3 }))
    await bench.store.record(event({ sessionId: strange, turn: null, seq: 2, end: 'completed' }))
    const records = await saved(bench.dataDir)
    expect(records).toHaveLength(2)
    expect(records.map(item => item.events.length).sort()).toEqual([1, 2])
    expect((await fs.readdir(bench.dataDir)).filter(name => name.endsWith('.trace.json')).every(name => /^[a-f0-9]{64}-segment-\d+\.trace\.json$/.test(name))).toBe(true)
    expect((await fs.stat(path.join(bench.dataDir, `${records[0]!.id}.trace.json`))).mode & 0o777).toBe(0o600)
  })

  it('settles unassigned request segments on a real turn end and standalone compaction on its own end', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event({ seq: 1, turn: 1, type: 'turn/start', point: 'lifecycle' }))
    await bench.store.record(event({ seq: 2, turn: null, type: 'request/header' }))
    await bench.store.record(event({ seq: 3, turn: 1, type: 'turn/end', point: 'lifecycle', end: 'completed' }))
    let records = await saved(bench.dataDir)
    expect(records).toHaveLength(2)
    expect(records.every(record => record.status === 'completed')).toBe(true)
    expect(records.find(record => record.turn === null)?.events).toHaveLength(1)
    await bench.store.record(event({ seq: 4, turn: null, type: 'compaction/start', point: 'compaction' }))
    await bench.store.record(event({ seq: 5, turn: null, type: 'compaction/end', point: 'compaction', metadata: { status: 'completed' } }))
    records = await saved(bench.dataDir)
    expect(records).toHaveLength(3)
    expect(records.every(record => record.status === 'completed')).toBe(true)
    expect((await bench.store.status()).stats.activeTraces).toBe(0)
  })

  it('rejects a second writer and releases the writer lock on close', async () => {
    const bench = await fixture()
    const second = bench.create()
    await expect(second.initialize()).rejects.toThrow('active writer')
    await bench.store.close()
    await second.initialize()
    expect((await second.status()).captureError).toBeNull()
  })

  it('recovers a dead process lock and fails closed on malformed locks', async () => {
    const bench = await fixture()
    await bench.store.close()
    await fs.writeFile(path.join(bench.dataDir, '.writer.lock'), JSON.stringify({ version: 1, pid: 2_147_483_647, owner: 'old-process' }))
    const reopened = bench.create()
    await reopened.initialize()
    await reopened.close()
    await fs.writeFile(path.join(bench.dataDir, '.writer.lock'), '{}')
    await expect(bench.create().initialize()).rejects.toThrow('Invalid Trace writer lock')
  })

  it('fails closed with a recovery path when a recovery guard is abandoned or damaged', async () => {
    const bench = await fixture()
    await bench.store.close()
    await fs.writeFile(path.join(bench.dataDir, '.writer.lock'), JSON.stringify({ version: 1, pid: 2_147_483_647, owner: 'old-process' }))
    const guard = path.join(bench.dataDir, '.writer-recovery')
    await fs.mkdir(guard)
    await fs.writeFile(path.join(guard, 'owner.json'), JSON.stringify({ pid: 2_147_483_647 }))
    await expect(bench.create().initialize()).rejects.toThrow(`blocked by ${guard}; PID 2147483647 (no longer running)`)
    await fs.writeFile(path.join(guard, 'owner.json'), 'damaged')
    await expect(bench.create().initialize()).rejects.toThrow('Stop all DSH processes')
    expect(await fs.readFile(path.join(guard, 'owner.json'), 'utf8')).toBe('damaged')
    // Explicit operator recovery after all contenders have stopped.
    await fs.rename(guard, path.join(bench.dataDir, 'operator-quarantined-recovery'))
    const recovered = bench.create()
    await recovered.initialize()
    expect((await recovered.status()).captureError).toBeNull()
  })

  it('permits exactly one real process to recover a stale writer when contenders observed the same old lock', async () => {
    const bench = await fixture()
    await bench.store.close()
    await fs.writeFile(path.join(bench.dataDir, '.writer.lock'), JSON.stringify({ version: 1, pid: 2_147_483_647, owner: 'old-process' }))
    const source = `
      import promises from 'node:fs/promises';
      import { constants } from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      const wait = type => new Promise(resolve => {
        const listen = message => { if (message === type) { process.off('message', listen); resolve(); } };
        process.on('message', listen);
      });
      const originalOpen = promises.open;
      let paused = false;
      promises.open = async (...args) => {
        const handle = await originalOpen(...args);
        if (String(args[0]).endsWith('.writer.lock') && args[1] === (constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)) {
          const read = handle.readFile.bind(handle);
          handle.readFile = async (...readArgs) => {
            const text = await read(...readArgs);
            if (!paused) { paused = true; const resume = wait('resume'); process.send({ type: 'stale-read' }); await resume; }
            return text;
          };
        }
        return handle;
      };
      syncBuiltinESMExports();
      const { TraceDataStore } = await import(${JSON.stringify(storeUrl)});
      const store = new TraceDataStore({ dataDir: ${JSON.stringify(bench.dataDir)}, getSettings: () => (${JSON.stringify(DEFAULT_TRACE_SETTINGS)}) });
      const start = wait('start'); process.send({ type: 'ready' }); await start;
      try {
        await store.initialize();
        const release = wait('release'); process.send({ type: 'acquired' }); await release;
        await store.close();
      } catch (error) { process.send({ type: 'rejected', error: error.message }); }
      process.disconnect();
    `
    const contenders = Array.from({ length: 3 }, () => {
      const child = spawn(process.execPath, ['--input-type=module', '--eval', source], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] })
      children.push(child)
      return { child, ready: childMessage(child) }
    })
    expect((await Promise.all(contenders.map(item => item.ready))).every(item => item.type === 'ready')).toBe(true)
    const staleReads = contenders.map(item => childMessage(item.child))
    for (const item of contenders) item.child.send('start')
    expect((await Promise.all(staleReads)).every(item => item.type === 'stale-read')).toBe(true)
    const outcomes = contenders.map(item => childMessage(item.child))
    for (const item of contenders) item.child.send('resume')
    const results = await Promise.all(outcomes)
    expect(results.filter(item => item.type === 'acquired')).toHaveLength(1)
    expect(results.filter(item => item.type === 'rejected')).toHaveLength(2)
    expect(results.filter(item => item.type === 'rejected').every(item => /active writer|recovery is blocked/.test(item.error ?? ''))).toBe(true)
    const winner = contenders[results.findIndex(item => item.type === 'acquired')]!.child
    const ended = once(winner, 'exit')
    winner.send('release')
    await ended
    expect(await fs.readdir(bench.dataDir)).not.toContain('.writer.lock')
    expect(await fs.readdir(bench.dataDir)).not.toContain('.writer-recovery')
  }, 10_000)

  it('removes only its incomplete lock inode after a real process experiences an initial write failure', async () => {
    const bench = await fixture()
    await bench.store.close()
    const source = `
      import promises from 'node:fs/promises';
      import { syncBuiltinESMExports } from 'node:module';
      const originalOpen = promises.open;
      let fail = true;
      promises.open = async (...args) => {
        const handle = await originalOpen(...args);
        if (fail && String(args[0]).endsWith('.writer.lock')) {
          fail = false;
          handle.writeFile = async () => { throw Object.assign(new Error('disk full test'), { code: 'ENOSPC' }); };
        }
        return handle;
      };
      syncBuiltinESMExports();
      const { TraceDataStore } = await import(${JSON.stringify(storeUrl)});
      const make = () => new TraceDataStore({ dataDir: ${JSON.stringify(bench.dataDir)}, getSettings: () => (${JSON.stringify(DEFAULT_TRACE_SETTINGS)}) });
      const first = make();
      let error = null;
      try { await first.initialize(); } catch (cause) { error = cause.message; }
      const filesAfterFailure = await promises.readdir(${JSON.stringify(bench.dataDir)});
      const second = make(); await second.initialize(); await second.close();
      process.stdout.write(JSON.stringify({ error, filesAfterFailure }));
    `
    const result = await promisify(execFile)(process.execPath, ['--input-type=module', '--eval', source])
    expect(JSON.parse(result.stdout)).toEqual({ error: 'disk full test', filesAfterFailure: [] })
  })

  it('refuses symlinks and does not read or delete unrelated files', async () => {
    const bench = await fixture({ captureEnabled: true })
    const outside = path.join(bench.root, 'unrelated.json')
    await fs.writeFile(outside, 'private content')
    await fs.writeFile(path.join(bench.dataDir, 'unrelated.json'), 'not an owned Trace record')
    const name = `${createHash('sha256').update('session-one').digest('hex')}-turn-1.trace.json`
    await fs.symlink(outside, path.join(bench.dataDir, name))
    await expect(bench.store.record(event())).rejects.toThrow('regular file')
    expect((await bench.store.status()).captureError).toContain('regular file')
    expect(await fs.readFile(outside, 'utf8')).toBe('private content')
    await fs.unlink(path.join(bench.dataDir, name))
    await bench.store.record(event({ end: 'completed' }))
    expect((await bench.store.status()).captureError).toBeNull()
    await bench.store.cleanup((await bench.store.previewCleanup()).token)
    expect(await fs.readFile(path.join(bench.dataDir, 'unrelated.json'), 'utf8')).toBe('not an owned Trace record')
    expect(await fs.readFile(outside, 'utf8')).toBe('private content')
  })

  it('validates settings and payload size at each action, surfaces errors, then recovers', async () => {
    const bench = await fixture({ captureEnabled: true, captureModelText: true })
    await expect(bench.store.record(event({ output: 'a'.repeat(1_048_577) }))).rejects.toThrow('1 MiB')
    expect((await bench.store.status()).captureError).toContain('1 MiB')
    expect(await saved(bench.dataDir)).toHaveLength(0)
    bench.setSettings({ retentionDays: 0 })
    await expect(bench.store.record(event())).rejects.toThrow('Retention')
    bench.setSettings({ retentionDays: 30 })
    await bench.store.record(event())
    expect((await bench.store.status()).captureError).toBeNull()
  })

  it('detects an externally changed file after preview and leaves it untouched', async () => {
    const bench = await fixture({ captureEnabled: true })
    await bench.store.record(event({ end: 'completed' }))
    const preview = await bench.store.previewCleanup()
    const name = (await fs.readdir(bench.dataDir)).find(name => name.endsWith('.trace.json'))!
    const filename = path.join(bench.dataDir, name)
    await fs.appendFile(filename, ' ')
    expect(await bench.store.cleanup(preview.token)).toMatchObject({ removedTraces: 0, skippedTraces: 1 })
    expect(await fs.readFile(filename, 'utf8')).toMatch(/ $/)
  })
})

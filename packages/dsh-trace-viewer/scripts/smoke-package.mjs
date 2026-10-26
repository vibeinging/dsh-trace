import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import * as jsx from 'react/jsx-runtime'
import * as jsxDev from 'react/jsx-dev-runtime'
import * as Cordis from '@deepseek-ai/cordis'
import * as Slots from '@deepseek-ai/dsh-client-ui-slots'
import { JSDOM } from 'jsdom'
import { loadBrowserModule } from './browser-module.mjs'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
assert.equal(manifest.name, '@vibeinging/dsh-trace-viewer')
assert.equal(manifest.version, '0.1.0')
assert.notEqual(manifest.private, true, 'The viewer must allow public package distribution')
assert.equal(manifest.publishConfig.access, 'public')
assert.equal(manifest.repository.directory, 'packages/dsh-trace-viewer')
for (const lifecycle of ['publish', 'prepare', 'prepublish', 'prepublishOnly', 'postinstall']) {
  assert.equal(manifest.scripts[lifecycle], undefined, `Unexpected ${lifecycle} lifecycle`)
}
assert.equal(manifest.exports['.'].default, './lib/index.js')
assert.equal(manifest.exports['./client'].default, './lib/client.js')
assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
assert.equal(manifest.dsh.client.platform, 'web')
assert.deepEqual(Object.keys(manifest.dependencies ?? {}), [])
for (const [id, version] of Object.entries(manifest.devDependencies)) {
  assert.doesNotMatch(version, /^(?:link:|file:|workspace:)/u, `Source dependency: ${id}`)
  if (id.startsWith('@deepseek-ai/dsh-')) assert.equal(version, '0.2.1-rc.2')
}

const host = await import(new URL('lib/index.js', root))
assert.equal(host.name, 'dsh-trace-viewer')
assert.equal(typeof host.apply, 'function')
assert.deepEqual(host.inject, ['sessions', 'profileContext'])
assert.ok(host.Config, 'Managed recording must expose a Host configuration schema')

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>')
const modules = { react: React, 'react-dom': ReactDOM, 'react-dom/client': ReactDOMClient, 'react/jsx-runtime': jsx, 'react/jsx-dev-runtime': jsxDev }
const first = await loadBrowserModule(new URL('lib/client.js', root), modules, dom.window.document)
assert.equal(first.id, manifest.name)
assert.equal(typeof first.exports.apply, 'function')
assert.ok(first.requested.includes('react'), 'React must come from the host module table')
assert.ok(first.requested.every(id => Object.hasOwn(modules, id)))
assert.doesNotMatch(first.source, /__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED/u)
assert.match(first.source, /conversation\.view/u)
assert.doesNotMatch(first.source, /dsh-trace-css:(?:\/|[a-z]:[\\/])/iu, 'CSS module IDs must not expose build machine paths')
assert.ok(dom.window.document.querySelector('style[data-plugin-css]'), 'CSS module style was not embedded')
const styleCount = dom.window.document.querySelectorAll('style[data-plugin-css]').length
await loadBrowserModule(new URL('lib/client.js', root), modules, dom.window.document)
assert.equal(dom.window.document.querySelectorAll('style[data-plugin-css]').length, styleCount)
dom.window.close()

// Bundle evaluation alone never constructs the virtualizer. Render the actual
// registered View from a VM without Node's process global to exercise that path.
const browserOnly = await loadBrowserModule(new URL('lib/client.js', root), modules, undefined)
const renderer = await loadBrowserModule(
  new URL(import.meta.resolve('@deepseek-ai/dsh-client-ui-renderer/client')),
  { ...modules, '@deepseek-ai/cordis': Cordis, '@deepseek-ai/dsh-client-ui-slots': Slots },
  undefined,
)
const context = new Cordis.Context()
await context.plugin(renderer.exports.SlotRegistry)
context.reflect.provide('locale', { register: () => () => {}, bind: () => key => key })
context.reflect.provide('sessions', { binding: () => { throw new Error('Rendering must not request a session') } })
context.reflect.provide('connection', { rpc: { call: async () => { throw new Error('Rendering must not call the Host') } } })
context.reflect.provide('layout', { selectPanel: () => {} })
context.reflect.provide('configForms', { get: () => ({
  getSnapshot: () => ({ status: 'unavailable', writable: false, revision: undefined, value: undefined }),
  mutate: async () => false,
}) })
const disposeOwner = context.slots.register({
  name: 'root', children: { 'conversation.view': { kind: 'list', scope: 'session' }, main: { kind: 'keyed', scope: 'root' }, 'sidebar.panellist': { kind: 'list', scope: 'root' }, 'settings.section': { kind: 'list', scope: 'root' } },
}, () => null)
const viewer = context.plugin(browserOnly.exports)
try {
  await viewer
  assert.equal(context.slots.entries('main')[0]?.options.key, 'dsh-trace-data')
  assert.equal(context.slots.entries('sidebar.panellist').length, 0)
  assert.equal(context.slots.entries('settings.section')[0]?.options.id, 'dsh-trace-data')
  const [entry] = context.slots.entries('conversation.view')
  assert.equal(entry.options.id, 'dsh-trace')
  const snapshot = {
    eventNodes: [{ kind: 'assistant', seq: 3, time: 3000, turn: 1, step: 1,
      blocks: [{ kind: 'text', text: 'browser runtime output' }],
      timing: { stepStartTime: 1000, firstTokenTime: 1500, completedTime: 3000 } }],
    eventLocations: new Map(), requests: [], callSchemas: new Map(), partial: null, runningCalls: [],
  }
  const html = renderToStaticMarkup(React.createElement(entry.component, {
    sessionId: 'bundle-browser-session',
    useTrajectory: selector => selector(snapshot),
    useSession: selector => selector({ hasMore: false, loadingOlder: false, running: false, openState: 'ready' }),
    t: key => key,
    loadOlder: async () => {},
  }))
  assert.match(html, /data-testid="trace-workbench"/u)
  assert.match(html, /browser runtime output/u)
} finally {
  await viewer.dispose()
  disposeOwner()
  await context.fiber.dispose()
}
assert.doesNotMatch(first.source, /\b(?:process|Buffer|__dirname|__filename|setImmediate)\b/u, 'A Node global leaked into the browser bundle')
assert.doesNotMatch(first.source, /\bglobal\s*(?:\.|\[)/u, 'Node global object leaked into the browser bundle')

const required = ['lib/index.js', 'lib/client.js', 'lib/client.js.map', 'lib/types/index.d.ts', 'lib/types/client/index.d.ts', 'cordis.patch.yml', 'LICENSE', 'THIRD_PARTY_NOTICES.md']
for (const file of required) await access(new URL(file, root))
const cache = await mkdtemp(join(tmpdir(), 'dsh-trace-package-'))
let stdout
try {
  ;({ stdout } = await promisify(execFile)('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', cache], {
    cwd: root,
    encoding: 'utf8',
  }))
} finally {
  await rm(cache, { recursive: true, force: true })
}
const [packed] = JSON.parse(stdout)
const paths = packed.files.map(file => file.path)
for (const file of required) assert.ok(paths.includes(file), `Package is missing ${file}`)
for (const file of paths) {
  assert.match(file, /^(?:package\.json|cordis\.patch\.yml|README(?:\.[a-z-]+)?\.md|LICENSE|THIRD_PARTY_NOTICES\.md|lib\/(?:index\.js|client\.js|client\.js\.map|types\/.+\.d\.ts))$/u, `Unexpected packed file ${file}`)
}
console.log(`package smoke passed: ${manifest.name}, shared React, embedded CSS, View rendered without Node globals, ${paths.length} package files`)

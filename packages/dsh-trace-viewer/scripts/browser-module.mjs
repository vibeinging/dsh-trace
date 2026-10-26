import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

/** Execute a DSH closure-factory bundle against an explicit shared module table. */
export async function loadBrowserModule(url, modules, browserDocument) {
  let declaration
  const requested = []
  const source = await readFile(url, 'utf8')
  runInNewContext(source, {
    window: {
      __ModuleLoader__: { load: value => { declaration = value } },
      addEventListener: browserDocument?.defaultView?.addEventListener.bind(browserDocument.defaultView) ?? (() => {}),
      removeEventListener: browserDocument?.defaultView?.removeEventListener.bind(browserDocument.defaultView) ?? (() => {}),
    },
    document: browserDocument,
    console,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    AbortController,
    URL,
    performance,
  }, { filename: String(url) })
  assert.equal(typeof declaration?.id, 'string', 'DSH loader declaration is missing')
  assert.equal(typeof declaration.factory, 'function', 'DSH loader factory is missing')
  const exports = declaration.factory(id => {
    requested.push(id)
    assert.ok(Object.hasOwn(modules, id), `Unshared browser dependency: ${id}`)
    return modules[id]
  })
  return { id: declaration.id, exports, requested, source }
}

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
assert.equal(packageJson.private, true, 'the private plugin must reject npm publication')
assert.equal(packageJson.publishConfig, undefined, 'the private plugin must not declare public publish settings')
assert.equal(packageJson.scripts?.prepack, undefined, 'Git installation must not build against unpublished peers')
assert.equal(packageJson.dsh?.bundle?.patch, './cordis.patch.yml')
await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
for (const [name, specifier] of Object.entries(packageJson.devDependencies ?? {})) {
  assert.equal(String(specifier).startsWith('link:'), false, `${name} exposes a local link in package.json`)
}

await import('../lib/index.js')
await import('../lib/invariant.js')
console.log('smoke-package: package metadata and plain-Node imports passed.')

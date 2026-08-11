import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
for (const [name, specifier] of Object.entries(packageJson.devDependencies ?? {})) {
  assert.equal(String(specifier).startsWith('link:'), false, `${name} exposes a local link in package.json`)
}

await import('../lib/index.js')
await import('../lib/invariant.js')
console.log('smoke-package: package metadata and plain-Node imports passed.')

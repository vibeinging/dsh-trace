import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const active = join(root, 'packages/dsh-trace-viewer')
const read = path => readFile(path, 'utf8')
const workspace = JSON.parse(await read(join(root, 'package.json')))
const manifest = JSON.parse(await read(join(active, 'package.json')))
assert.equal(workspace.name, 'dsh-trace-workspace')
assert.equal(workspace.private, true, 'Publish the plugin, not the development workspace')
for (const key of ['main', 'types', 'exports', 'dsh', 'dependencies', 'devDependencies']) {
  assert.equal(workspace[key], undefined, `The workspace must not expose runtime ${key}`)
}
assert.match(await read(join(root, 'pnpm-workspace.yaml')), /packages\/dsh-trace-viewer/u)
assert.doesNotMatch(await read(join(root, 'pnpm-workspace.yaml')), /legacy/u)
assert.equal(manifest.name, '@vibeinging/dsh-trace-viewer')
assert.notEqual(manifest.private, true)
assert.equal(manifest.publishConfig?.access, 'public')
assert.equal(manifest.license, 'BSD-3-Clause')
assert.equal(manifest.repository?.url, 'git+https://github.com/vibeinging/dsh-trace.git')
assert.equal(manifest.repository?.directory, 'packages/dsh-trace-viewer')
assert.equal(manifest.packageManager, workspace.packageManager)
assert.deepEqual(manifest.engines, workspace.engines)
assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml')
assert.equal(manifest.dsh?.client?.platform, 'web')

const runtime = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.optionalDependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
])
const development = new Set([...runtime, ...Object.keys(manifest.devDependencies ?? {})])
for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  for (const [name, version] of Object.entries(manifest[field] ?? {})) {
    assert.doesNotMatch(version, /^(?:file|link|workspace):/u, `${field}.${name} requires a local checkout`)
    assert.ok(!['cordis', 'schemastery', '@cordisjs/plugin-include', '@cordisjs/plugin-loader'].includes(name), `${name} must use the official SDK name`)
    if (name.startsWith('@deepseek-ai/dsh-')) assert.equal(version, '0.2.1-rc.2', `${name} changed SDK target`)
  }
}
for (const lifecycle of ['prepare', 'prepack', 'postinstall', 'prepublishOnly']) {
  assert.equal(manifest.scripts[lifecycle], undefined, `Unexpected automatic ${lifecycle} lifecycle`)
}
assert.equal(await read(join(root, '.npmrc')), '@deepseek-ai:registry=https://registry.npmjs.org/\n')
assert.equal(await read(join(active, '.npmrc')), '@deepseek-ai:registry=https://registry.npmjs.org/\n')
for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  await access(join(active, file))
  assert.ok(manifest.files.includes(file), `Missing package notice: ${file}`)
}

async function filesBelow(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesBelow(path))
    else files.push(path)
  }
  return files
}

const sdkImport = /(?:from\s+|import\s*(?:\(\s*)?)['"](@deepseek-ai\/[A-Za-z0-9_-]+)/gu
const sourceCheckout = /test-vibeinging|deepseek-harness\/packages|\.dsh\/source\/current\//u
for (const area of ['src', 'tests', 'scripts', 'shared']) {
  for (const path of await filesBelow(join(active, area))) {
    if (!['.ts', '.tsx', '.js', '.mjs'].includes(extname(path))) continue
    const source = await read(path)
    assert.doesNotMatch(source, sourceCheckout, `${relative(root, path)} imports a DSH source checkout`)
    for (const match of source.matchAll(sdkImport)) {
      assert.ok((area === 'src' ? runtime : development).has(match[1]), `${relative(root, path)} imports undeclared ${match[1]}`)
    }
  }
}
const ci = await read(join(root, '.github/workflows/ci.yml'))
assert.doesNotMatch(ci, /NPM_TOKEN|NODE_AUTH_TOKEN|no-frozen-lockfile/u, 'Public CI must install without private SDK credentials')
assert.match(ci, /pnpm install --frozen-lockfile --ignore-scripts/u)
for (const file of ['README.md', 'README.zh.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md']) {
  const source = await read(join(root, file))
  assert.doesNotMatch(source, /dsh-external|\/Users\/|\/private\/tmp\//u, `${file} contains an internal location`)
}
for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
  assert.doesNotMatch(await read(join(root, file)), /(?:^|[\s"'=])(?:file|link|workspace):/mu, `${file} contains a local dependency`)
}
console.log(`repository rules: independent ${manifest.name} workspace passed`)

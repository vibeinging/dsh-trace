import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFile, lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const argument = process.argv[2]
assert.ok(argument, 'Usage: node scripts/export-public-source.mjs /absolute/path/to/new-directory')
assert.ok(isAbsolute(argument), 'Use an absolute output directory')
const output = resolve(argument)
const fromRoot = relative(root, output)
assert.ok(fromRoot.startsWith(`..${sep}`), 'Export outside this checkout to avoid copying generated output')
// mkdir without recursive deliberately rejects existing targets.
await mkdir(output)
const excluded = new Set(['node_modules', '.git', '.DS_Store', 'coverage'])
const entries = []
async function copy(path) {
  const source = join(root, path)
  const info = await lstat(source)
  assert.ok(!info.isSymbolicLink(), `Refusing a source symlink: ${path}`)
  if (info.isDirectory()) {
    for (const entry of await readdir(source)) {
      if (excluded.has(entry) || entry.endsWith('.tgz') || entry === '.env' || entry.startsWith('.env.')) continue
      await copy(join(path, entry))
    }
    return
  }
  assert.ok(info.isFile(), `Unsupported source entry: ${path}`)
  const target = join(output, path)
  await mkdir(dirname(target), { recursive: true })
  await copyFile(source, target)
  const content = await readFile(target)
  entries.push({ path: path.split(sep).join('/'), sha256: createHash('sha256').update(content).digest('hex') })
}
for (const path of [
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc', '.gitignore',
  'LICENSE', 'README.md', 'README.zh.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md',
  '.github', 'scripts', 'packages/dsh-trace-viewer', 'legacy/yitrace-exporter',
  'docs/assets/readme', 'docs/demo', 'docs/usage.md', 'docs/development.md', 'docs/releasing.md',
  'docs/reports/2026-10-26_standalone-open-source-verification.md',
  'docs/reports/2026-10-26_npm-release-preparation.md',
]) await copy(path)
entries.sort((a, b) => a.path.localeCompare(b.path))
await writeFile(join(output, 'SOURCE_MANIFEST.json'), JSON.stringify({
  description: 'Public source snapshot; excludes Git history, dependencies, original session screenshots and raw acceptance evidence.',
  files: entries,
}, null, 2) + '\n')
console.log(`Public source snapshot: ${entries.length} files at ${output}`)

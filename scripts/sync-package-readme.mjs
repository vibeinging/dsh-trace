import { readFile, writeFile } from 'node:fs/promises'
const root = new URL('../', import.meta.url)
await writeFile(new URL('packages/dsh-trace-viewer/README.md', root), await readFile(new URL('README.md', root)))
console.log('npm README synchronized with the project README')

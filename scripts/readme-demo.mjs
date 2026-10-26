import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { build } from '../packages/dsh-trace-viewer/node_modules/tsdown/dist/index.mjs'
import { clientBundle } from '../packages/dsh-trace-viewer/shared/tsdown.client.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../packages/dsh-trace-viewer/package.json', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'dsh-trace-demo-'))
process.chdir(join(root, 'packages/dsh-trace-viewer'))
const preset = clientBundle('dsh-trace-readme-demo', [])[1]
await build({ ...preset, config: false, entry: { demo: join(root, 'docs/demo/main.tsx') }, outDir: directory,
  deps: { alwaysBundle: () => true },
  alias: { 'react': dirname(require.resolve('react/package.json')), 'react-dom': dirname(require.resolve('react-dom/package.json')) },
  outputOptions: { entryFileNames: 'demo.js' }, sourcemap: false,
})
const server = createServer(async (request, response) => {
  const script = request.url?.split('?')[0] === '/demo.js'
  response.setHeader('Content-Type', script ? 'text/javascript' : 'text/html; charset=utf-8')
  response.end(await readFile(script ? join(directory, 'demo.js') : join(root, 'docs/demo/index.html')))
})
server.listen(64936, '127.0.0.1', () => console.log('Synthetic README demo: http://127.0.0.1:64936/'))
const close = () => server.close(() => { void rm(directory, { recursive: true, force: true }).then(() => process.exit(0)) })
process.on('SIGINT', close)
process.on('SIGTERM', close)

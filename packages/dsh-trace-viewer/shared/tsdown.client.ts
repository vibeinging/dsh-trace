/** DSH browser modules use the host's React identity and an explicit loader. */
import { readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const CSS_PREFIX = '\0dsh-trace-css:'
const CSS_SUFFIX = '.mjs'
const SHARED_MODULES = ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client'] as const

/** Build the discoverable host entry and the independent browser plugin. */
export function clientBundle(packageName: string, hostEntries: readonly string[]): UserConfig[] {
  return [{
    entry: [...hostEntries],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  }, {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    // DSH's module table does not provide Node's process object. Libraries such
    // as TanStack Virtual read this flag even during component construction.
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: [...SHARED_MODULES],
      alwaysBundle: (id: string) => !SHARED_MODULES.includes(id as never),
    },
    plugins: [{
      name: 'dsh-browser-module-boundary',
      resolveId(source: string) {
        if (source.startsWith('@deepseek-ai/')) {
          throw new Error(`DSH SDK imports in browser code must be type-only; found ${JSON.stringify(source)}`)
        }
        if (source.startsWith('node:')) {
          throw new Error(`Node modules cannot enter the DSH browser bundle: ${JSON.stringify(source)}`)
        }
        return null
      },
    }, {
      name: 'dsh-inline-css-modules',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const file = resolve(importer === undefined ? '.' : dirname(importer), source)
        // Virtual module IDs also appear in emitted region comments. Keep them
        // relative so published bundles do not expose the build machine's path.
        return CSS_PREFIX + relative(process.cwd(), file).replaceAll('\\', '/') + CSS_SUFFIX
      },
      async load(id: string) {
        if (!id.startsWith(CSS_PREFIX)) return null
        const file = resolve(id.slice(CSS_PREFIX.length, -CSS_SUFFIX.length))
        this.addWatchFile(file)
        const { code, exports: cssExports } = transform({
          filename: file,
          code: await readFile(file),
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        const classes: Record<string, string> = {}
        for (const [local, value] of Object.entries(cssExports ?? {})) classes[local] = value.name
        const tagId = `${packageName}/${relative(process.cwd(), file)}`
        return {
          code: [
            `const tagId = ${JSON.stringify(tagId)};`,
            "if (typeof document !== 'undefined') {",
            "  let style = [...document.querySelectorAll('style[data-plugin-css]')].find(tag => tag.dataset.pluginCss === tagId);",
            "  if (!style) { style = document.createElement('style'); style.dataset.pluginCss = tagId; document.head.appendChild(style); }",
            `  style.dataset.plugin = ${JSON.stringify(packageName)};`,
            `  style.textContent = ${JSON.stringify(code.toString())};`,
            '}',
            `export default ${JSON.stringify(classes)};`,
          ].join('\n'),
          moduleType: 'js',
        }
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageName)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }]
}

import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    invariant: 'src/invariant.ts',
  },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: true,
  clean: true,
  deps: {
    neverBundle: [
      /^@deepseek-ai\//,
      '@yitrace/trace-sdk',
      '@deepseek-ai/cordis',
      '@deepseek-ai/schemastery',
    ],
  },
})

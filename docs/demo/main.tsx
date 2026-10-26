/** Public README examples: synthetic data only, rendered by the real components. */
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { TraceWorkbench } from '../../packages/dsh-trace-viewer/src/client/TraceView.js'
import { TraceDataPage } from '../../packages/dsh-trace-viewer/src/client/TraceDataPage.js'
import { en, zh } from '../../packages/dsh-trace-viewer/src/client/locales.js'
import { dataEn, dataZh } from '../../packages/dsh-trace-viewer/src/client/managementLocales.js'
import { DEFAULT_TRACE_SETTINGS } from '../../packages/dsh-trace-viewer/src/management.js'
import type { TraceDataPageState, TraceDataManagementApi } from '../../packages/dsh-trace-viewer/src/management.js'
import type { TraceData, TraceRow, TraceUsage } from '../../packages/dsh-trace-viewer/src/types.js'

const params = new URLSearchParams(location.search)
const chinese = params.get('lang') === 'zh'
const settingsView = params.get('view') === 'settings'
document.documentElement.dataset.theme = settingsView ? 'light' : 'dark'
document.documentElement.lang = chinese ? 'zh-CN' : 'en'
document.querySelector('#demo-label')!.textContent = chinese ? '演示会话 · 合成数据' : 'Example session · synthetic data'
document.querySelector('#active-tab')!.textContent = settingsView ? (chinese ? '设置 / Trace 数据' : 'Settings / Trace data') : 'Trace'
const translator = (dictionary: Record<string, string>) => (key: string, values: Record<string, string | number> = {}) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), dictionary[key] ?? key)
const t = translator(chinese ? zh : en)
const dataT = translator(chinese ? dataZh : dataEn)
const usage = (inputTokens: number, outputTokens: number, cacheReadTokens: number): TraceUsage => ({ inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens: null, reasoningTokens: null, reportedRequests: 1, missingRequests: 0 })
function row(id: string, start: number, duration: number, extra: Partial<TraceRow>): TraceRow {
  return { id, parentId: null, kind: 'tool', name: id, status: 'completed', turn: 3, step: 1, seq: null,
    startTime: start, endTime: start + duration, durationMs: duration, input: null, output: null, error: null,
    provider: null, model: null, usage: null, raw: { source: 'synthetic-readme-example' }, ...extra }
}
const rows = [
  row('model-1', 0, 1820, { kind: 'model', name: 'model', model: 'deepseek-chat', provider: 'example-provider', usage: usage(6400, 320, 5100), output: 'I will inspect the request handler and its tests.' }),
  row('read-handler', 1820, 48, { parentId: 'model-1', name: 'read', input: { path: 'src/api/requests.ts' }, output: 'export async function createRequest(input) { /* example */ }' }),
  row('read-test', 1840, 62, { parentId: 'model-1', name: 'read', input: { path: 'tests/requests.spec.ts' }, output: 'describe("request validation", () => { /* example */ })' }),
  row('model-2', 1902, 2580, { kind: 'model', name: 'model', model: 'deepseek-chat', provider: 'example-provider', step: 2, usage: usage(8200, 780, 7100), output: 'The request parser needs to reject empty input before creating a record.' }),
  row('edit-handler', 4482, 110, { parentId: 'model-2', name: 'edit', step: 2, input: { path: 'src/api/requests.ts' }, output: 'Added input validation and an early return.' }),
  row('run-tests', 4592, 1430, { parentId: 'model-2', name: 'bash', step: 2, input: { command: 'pnpm test -- requests' }, output: 'PASS tests/requests.spec.ts\n\n12 tests passed\n0 failed\n\nValidated empty input, valid payloads,\nand error responses.' }),
  row('model-3', 6022, 1860, { kind: 'model', name: 'model', model: 'deepseek-chat', provider: 'example-provider', step: 3, usage: usage(9100, 420, 8200), output: 'Input validation is now covered by the tests. All 12 checks in this example pass.' }),
]
const total = usage(23700, 1520, 20400)
total.reportedRequests = 3
const trace: TraceData = { sessionId: 'readme-example', rows, partialHistory: false, turns: [{
  id: 'example-turn-3', turn: 3, title: chinese ? '检查请求校验，并补齐测试' : 'Check request validation and add the missing tests',
  status: 'completed', startTime: 0, endTime: 7882, durationMs: 7882, timingComplete: true,
  observedStartTime: 0, observedEndTime: 7882, rows, modelCount: 3, toolCount: 4, errorCount: 0, usage: total,
}] }
let state: TraceDataPageState = {
  settings: { ...DEFAULT_TRACE_SETTINGS, points: { ...DEFAULT_TRACE_SETTINGS.points } }, settingsWritable: true,
  settingsRevision: 1, dataDir: '<profile>/data/dsh-trace-viewer',
  stats: { traces: 0, events: 0, bytes: 0, activeTraces: 0, oldestAt: null }, lastCapturedAt: null,
  captureError: null, cleanup: { lastRunAt: null, nextRunAt: null, removedTraces: 0, eligibleTraces: 0, eligibleBytes: 0, lastError: null },
}
const api: TraceDataManagementApi = {
  readState: async () => state,
  saveSettings: async (settings) => { state = { ...state, settings, settingsRevision: (state.settingsRevision ?? 0) + 1 } },
  previewCleanup: async () => ({ token: 'demo', traces: 0, events: 0, bytes: 0, cutoffAt: null, expiresAt: Date.now() + 300000 }),
  cleanup: async () => ({ removedTraces: 0, removedBytes: 0, skippedTraces: 0, completedAt: Date.now() }),
}
const root = createRoot(document.querySelector('#root')!)
if (settingsView) {
  document.querySelector('#root')!.classList.add('settings-demo')
  root.render(createElement(TraceDataPage, { api, t: dataT, embedded: true }))
} else {
  root.render(createElement(TraceWorkbench, { data: trace, t, loadOlder: async () => {},
    hasMore: false, loadingOlder: false, loading: false, running: false, readFailed: false }))
}

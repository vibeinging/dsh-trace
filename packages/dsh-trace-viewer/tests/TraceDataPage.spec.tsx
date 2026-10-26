// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TraceDataPage } from '../src/client/TraceDataPage.js'
import { dataZh, type DataKey } from '../src/client/managementLocales.js'
import { DEFAULT_TRACE_SETTINGS, type TraceDataManagementApi, type TraceDataPageState } from '../src/management.js'
import { navigationPreferences } from '../src/client/navigationPreferences.js'
import { browserStorage } from './browserStorage.js'

browserStorage()

const t = (key: DataKey, values: Record<string, string | number> = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), String(dataZh[key]))
const createState = (extra: Partial<TraceDataPageState> = {}): TraceDataPageState => ({
  settings: { ...DEFAULT_TRACE_SETTINGS, points: { ...DEFAULT_TRACE_SETTINGS.points } },
  settingsWritable: true, settingsRevision: 4, dataDir: '/local/trace-data',
  stats: { traces: 12, events: 240, bytes: 4096, activeTraces: 1, oldestAt: 1000 },
  lastCapturedAt: null, captureError: null,
  cleanup: { lastRunAt: null, nextRunAt: null, removedTraces: 0, eligibleTraces: 3, eligibleBytes: 2048, lastError: null }, ...extra,
})
const createApi = (state = createState()) => {
  const readState = vi.fn(async () => state)
  const saveSettings = vi.fn(async (..._args: Parameters<TraceDataManagementApi['saveSettings']>) => {})
  const previewCleanup = vi.fn(async () => ({ token: 'preview-1', traces: 3, events: 60, bytes: 2048, cutoffAt: 1000, expiresAt: 3000 }))
  const cleanup = vi.fn(async () => ({ removedTraces: 3, removedBytes: 2048, skippedTraces: 0, completedAt: 2000 }))
  return { readState, saveSettings, previewCleanup, cleanup }
}
async function ready(api: TraceDataManagementApi) {
  render(<TraceDataPage api={api} t={t} />)
  await screen.findByRole('switch', { name: '开启 Trace 数据采集' })
}
const button = (name: string) => screen.getByRole('button', { name, exact: true }) as HTMLButtonElement
const check = (name: string) => screen.getByRole('checkbox', { name, exact: true }) as HTMLInputElement

afterEach(() => { cleanup(); localStorage.clear() })

describe('Trace data management', () => {
  it('saves the sidebar preference immediately without writing capture settings', async () => {
    const api = createApi()
    const navigation = navigationPreferences()
    render(<TraceDataPage api={api} t={t} navigation={navigation} embedded />)
    const toggle = await screen.findByRole('checkbox', { name: '在侧边栏显示 Trace 数据' }) as HTMLInputElement
    expect(toggle.checked).toBe(false)
    fireEvent.click(toggle)
    expect(toggle.checked).toBe(true)
    expect(button('保存设置').disabled).toBe(true)
    expect(api.saveSettings).not.toHaveBeenCalled()
    expect(screen.getByTestId('trace-data-page').dataset.embedded).toBe('true')
    navigation.dispose()
  })

  it('starts with saved capture and content switches off without writing anything', async () => {
    const api = createApi()
    await ready(api)
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false)
    expect(check('保存模型回复正文').checked).toBe(false)
    expect(check('保存工具参数和结果').checked).toBe(false)
    expect(button('保存设置').disabled).toBe(true)
    expect(api.saveSettings).not.toHaveBeenCalled()
    expect(api.cleanup).not.toHaveBeenCalled()
    expect(screen.getByText('此处的清理只删除 Trace 自有副本，DSH 原始会话会保留。')).toBeTruthy()
  })

  it('retries an initial read failure without showing fake settings', async () => {
    const api = createApi()
    api.readState.mockRejectedValueOnce(new Error('host unavailable'))
    render(<TraceDataPage api={api} t={t} />)
    await screen.findByRole('button', { name: '重试' })
    expect(screen.queryByRole('switch')).toBeNull()
    expect(screen.getByRole('alert').textContent).toContain('host unavailable')
    fireEvent.click(button('重试'))
    await screen.findByRole('switch')
    expect(api.readState).toHaveBeenCalledTimes(2)
  })

  it('keeps unsaved edits during refresh and blocks cleanup until saved or discarded', async () => {
    const api = createApi()
    await ready(api)
    fireEvent.click(screen.getByRole('switch'))
    fireEvent.click(check('保存工具参数和结果'))
    expect(button('预览到期清理').disabled).toBe(true)
    fireEvent.click(button('刷新'))
    await screen.findByText('已刷新数据状态，未保存的修改已保留。')
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true)
    expect(check('保存工具参数和结果').checked).toBe(true)
    expect(api.saveSettings).not.toHaveBeenCalled()
    fireEvent.click(button('放弃修改'))
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false)
    expect(check('保存工具参数和结果').checked).toBe(false)
    expect(button('预览到期清理').disabled).toBe(false)
  })

  it('detects external revision changes without replacing the draft', async () => {
    const api = createApi()
    await ready(api)
    fireEvent.click(check('保存模型回复正文'))
    api.readState.mockResolvedValueOnce(createState({ settingsRevision: 5 }))
    fireEvent.click(button('刷新'))
    await screen.findByText('配置已在其他位置改变。你的修改已保留，请载入最新配置后再编辑。')
    expect(check('保存模型回复正文').checked).toBe(true)
    expect(button('保存设置').disabled).toBe(true)
    fireEvent.click(button('载入最新配置'))
    expect(check('保存模型回复正文').checked).toBe(false)
    expect(screen.queryByText('有未保存的修改')).toBeNull()
  })

  it('passes the loaded revision and reports a save failure without claiming success', async () => {
    const api = createApi()
    api.saveSettings.mockRejectedValueOnce(new Error('revision conflict'))
    await ready(api)
    fireEvent.click(screen.getByRole('switch'))
    fireEvent.click(check('保存模型回复正文'))
    fireEvent.click(button('保存设置'))
    await screen.findByText('设置保存失败，修改仍保留。')
    expect(api.saveSettings).toHaveBeenCalledWith({ ...DEFAULT_TRACE_SETTINGS, captureEnabled: true, captureModelText: true }, 4)
    expect(screen.queryByText('设置已保存。')).toBeNull()
    expect(check('保存模型回复正文').checked).toBe(true)
    expect(button('保存设置').disabled).toBe(false)
  })

  it('waits for save completion and refreshes the saved revision', async () => {
    const api = createApi()
    let resolveSave: (() => void) | undefined
    api.saveSettings.mockImplementationOnce(() => new Promise<void>(resolve => { resolveSave = resolve }))
    await ready(api)
    fireEvent.click(screen.getByRole('switch'))
    api.readState.mockResolvedValueOnce(createState({ settings: { ...DEFAULT_TRACE_SETTINGS, captureEnabled: true }, settingsRevision: 5 }))
    fireEvent.click(button('保存设置')); fireEvent.click(button('正在保存'))
    expect(api.saveSettings).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('设置已保存。')).toBeNull()
    resolveSave?.()
    await screen.findByText('设置已保存。')
    fireEvent.click(check('保存模型回复正文'))
    fireEvent.click(button('保存设置'))
    await waitFor(() => expect(api.saveSettings).toHaveBeenCalledTimes(2))
    expect(api.saveSettings.mock.calls[1]?.[1]).toBe(5)
  })

  it('keeps a successful write distinct from a failed status refresh', async () => {
    const api = createApi()
    await ready(api)
    fireEvent.click(check('保存模型回复正文'))
    api.readState.mockRejectedValueOnce(new Error('read disconnected'))
    fireEvent.click(button('保存设置'))
    await screen.findByText('设置已保存，但状态读取失败；请刷新后继续修改。')
    expect(screen.queryByText('设置保存失败，修改仍保留。')).toBeNull()
    expect(check('保存模型回复正文').checked).toBe(true)
    expect(check('保存模型回复正文').matches(':disabled')).toBe(true)
    api.readState.mockResolvedValueOnce(createState({ settings: { ...DEFAULT_TRACE_SETTINGS, captureModelText: true }, settingsRevision: 5 }))
    fireEvent.click(button('刷新'))
    await waitFor(() => expect(check('保存模型回复正文').matches(':disabled')).toBe(false))
    expect(check('保存模型回复正文').checked).toBe(true)
  })

  it('disables writes without permission and cannot save without a revision', async () => {
    const api = createApi(createState({ settingsWritable: false }))
    await ready(api)
    expect(screen.getByRole('switch').matches(':disabled')).toBe(true)
    expect(check('保存模型回复正文').matches(':disabled')).toBe(true)
    expect(button('预览到期清理').disabled).toBe(true)
    expect(screen.getByText('当前宿主未开放配置写入权限，此页只能查看。')).toBeTruthy()
    cleanup()
    const noRevision = createApi(createState({ settingsRevision: undefined }))
    await ready(noRevision)
    fireEvent.click(screen.getByRole('switch'))
    expect(button('保存设置').disabled).toBe(true)
    expect(noRevision.saveSettings).not.toHaveBeenCalled()
  })

  it('requires at least one event type when capture is enabled', async () => {
    const state = createState({ settings: { ...DEFAULT_TRACE_SETTINGS, captureEnabled: true } })
    await ready(createApi(state))
    for (const name of ['模型调用 调用时间、模型和用量', '工具执行 工具名称、执行时间和状态', '失败事件 保存失败和中断的记录', '历史压缩 上下文压缩事件']) fireEvent.click(check(name))
    expect(screen.getByRole('alert').textContent).toContain('至少选择一个埋点范围')
    expect(button('保存设置').disabled).toBe(true)
  })

  it('previews without deletion, cancels, and only cleans with the confirmed token', async () => {
    const api = createApi()
    await ready(api)
    fireEvent.click(button('预览到期清理'))
    await screen.findByText('将删除 3 条记录段、60 个事件，共 2 KB。')
    expect(api.cleanup).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(button('确认清理'))
    fireEvent.click(button('取消'))
    expect(screen.queryByRole('button', { name: '确认清理' })).toBeNull()
    expect(document.activeElement).toBe(button('预览到期清理'))
    fireEvent.click(button('预览到期清理'))
    await screen.findByRole('button', { name: '确认清理' })
    let resolveCleanup: ((value: { removedTraces: number; removedBytes: number; skippedTraces: number; completedAt: number }) => void) | undefined
    api.cleanup.mockImplementationOnce(() => new Promise(resolve => { resolveCleanup = resolve }))
    fireEvent.click(button('确认清理')); fireEvent.click(button('正在清理'))
    expect(api.cleanup).toHaveBeenCalledOnce()
    expect(api.cleanup).toHaveBeenCalledWith('preview-1')
    resolveCleanup?.({ removedTraces: 2, removedBytes: 1024, skippedTraces: 1, completedAt: 2000 })
    await screen.findByText('已清理 2 条记录段，释放 1 KB。 另有 1 条记录段因状态变化而跳过。')
  })

  it('does not offer deletion for an empty preview and exposes cleanup failures', async () => {
    const api = createApi()
    api.previewCleanup.mockResolvedValueOnce({ token: 'empty', traces: 0, events: 0, bytes: 0, cutoffAt: 1000, expiresAt: 3000 })
    await ready(api)
    fireEvent.click(button('预览到期清理'))
    await screen.findByText('没有到期数据需要清理。')
    expect(screen.queryByRole('button', { name: '确认清理' })).toBeNull()
    fireEvent.click(button('取消'))
    api.cleanup.mockRejectedValueOnce(new Error('expired token'))
    fireEvent.click(button('预览到期清理'))
    await screen.findByRole('button', { name: '确认清理' })
    fireEvent.click(button('确认清理'))
    await screen.findByText('清理失败，请重新预览后重试。')
    expect(screen.queryByRole('button', { name: '确认清理' })).toBeNull()
    expect(button('预览到期清理').disabled).toBe(false)
  })
})

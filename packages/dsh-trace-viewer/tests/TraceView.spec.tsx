// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TraceWorkbench, type TraceWorkbenchProps } from '../src/client/TraceView.js'
import { zh } from '../src/client/locales.js'
import type { Translate } from '../src/client/format.js'
import type { TraceData, TraceRow, TraceTurn } from '../src/types.js'

const t: Translate = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), String(zh[key]))
function row(id: string, overrides: Partial<TraceRow> = {}): TraceRow {
  return { id, parentId: null, kind: 'tool', name: id, status: 'completed', turn: 2, step: 1,
    seq: 10, startTime: 1000, endTime: 1200, durationMs: 200,
    input: { path: 'tests/selector.spec.ts' }, output: 'done', error: null,
    provider: null, model: null, usage: null, raw: { source: 'trajectory-projection' }, ...overrides }
}
function data(rows: TraceRow[]): TraceData {
  const turn: TraceTurn = { id: 's:turn:2', turn: 2, title: '检查失败的测试', status: 'completed', startTime: 900, endTime: 1500,
    durationMs: 600, timingComplete: true, observedStartTime: 1000, observedEndTime: 1500,
    rows, modelCount: rows.filter(row => row.kind === 'model').length, toolCount: rows.filter(row => row.kind === 'tool').length,
    errorCount: rows.filter(row => row.status === 'failed').length, usage: null }
  return { sessionId: 's', turns: [turn], rows, partialHistory: false }
}
function props(value: TraceData, extra: Partial<TraceWorkbenchProps> = {}): TraceWorkbenchProps {
  return { data: value, t, loadOlder: async () => {}, hasMore: false, loadingOlder: false,
    loading: false, running: false, readFailed: false, ...extra }
}
const calls = () => [row('model', { kind: 'model', name: 'model', model: 'test-model', input: { system: 'system prompt' } }),
  row('read', { parentId: 'model', output: 'file contents' }),
  row('test', { parentId: 'model', status: 'failed', output: 'Expected [] but received [undefined]', error: 'Assertion failed' }),
  row('verify', { output: '8 tests passed' })]

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 900, height: 460, x: 0, y: 0, top: 0, right: 900, bottom: 460, left: 0, toJSON: () => ({}) })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(460)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(900)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Trace workbench', () => {
  it('restores the host composer when focus mode is disabled or the view is left', () => {
    const restore = vi.fn()
    const focusComposer = vi.fn(() => restore)
    const view = render(<TraceWorkbench {...props(data(calls()), { focusComposer })} />)
    expect(focusComposer).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '专注查看' }))
    expect(restore).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '专注查看' }))
    expect(focusComposer).toHaveBeenCalledTimes(2)
    view.unmount()
    expect(restore).toHaveBeenCalledTimes(2)
  })

  it('moves between loaded turns with bounded navigation and releases the inspector width', () => {
    const current = data([row('latest')])
    const earlier = { ...current.turns[0]!, id: 's:turn:1', turn: 1, title: 'Earlier request', rows: [row('earlier', { turn: 1 })] }
    render(<TraceWorkbench {...props({ ...current, rows: [...earlier.rows, ...current.rows], turns: [earlier, ...current.turns] })} />)
    expect((screen.getByRole('button', { name: '下一轮' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '上一轮' }))
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('s:turn:1')
    expect((screen.getByRole('button', { name: '上一轮' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '关闭详情' }))
    expect(screen.queryByRole('complementary')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '查看 earlier', exact: true }))
    expect(screen.getByRole('complementary')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '下一轮' }))
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('s:turn:2')
  })

  it('selects a real row, switches payloads, and retains details when search hides that row', () => {
    render(<TraceWorkbench {...props(data(calls()))} />)
    fireEvent.click(screen.getByRole('button', { name: '查看 verify', exact: true }))
    expect(screen.getByTestId('trace-detail-content').textContent).toBe('8 tests passed')
    fireEvent.click(screen.getByRole('button', { name: '输入', exact: true }))
    expect(screen.getByTestId('trace-detail-content').textContent).toContain('tests/selector.spec.ts')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'not-found' } })
    expect(screen.getByText('没有匹配的调用')).toBeTruthy()
    expect(screen.getByTestId('trace-detail-content').textContent).toContain('tests/selector.spec.ts')
  })

  it('keeps failure ancestors, preserves failure evidence, and collapses actual children', () => {
    render(<TraceWorkbench {...props(data(calls()))} />)
    fireEvent.click(screen.getByRole('button', { name: '仅失败', exact: true }))
    expect(screen.getByRole('button', { name: '查看 test', exact: true })).toBeTruthy()
    expect(screen.getByRole('button', { name: '查看 test-model', exact: true })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '查看 verify', exact: true })).toBeNull()
    expect(screen.getByTestId('trace-detail-content').textContent).toContain('[undefined]')
    fireEvent.click(screen.getByRole('button', { name: '全部', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: '收起 test-model', exact: true }))
    expect(screen.queryByRole('button', { name: '查看 read', exact: true })).toBeNull()
    expect(screen.getByTestId('trace-detail-content').textContent).toContain('[undefined]')
  })

  it('keeps selected identity when older turns arrive and updates its settled output', () => {
    const current = data(calls())
    const view = render(<TraceWorkbench {...props(current)} />)
    fireEvent.click(screen.getByRole('button', { name: '查看 verify', exact: true }))
    const earlier = { ...current.turns[0]!, id: 's:turn:1', turn: 1, rows: [row('old', { turn: 1 })] }
    const nextRows = calls().map(value => value.id === 'verify' ? { ...value, output: '9 tests passed' } : value)
    const next = data(nextRows)
    view.rerender(<TraceWorkbench {...props({ ...next, turns: [earlier, ...next.turns] })} />)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('s:turn:2')
    expect(screen.getByTestId('trace-detail-content').textContent).toBe('9 tests passed')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's:turn:1' } })
    expect(screen.getByRole('button', { name: '查看 old', exact: true })).toBeTruthy()
  })

  it('shows missing data and running status without fabricating durations', () => {
    const value = data([row('live', { status: 'running', endTime: null, durationMs: null, output: 'partial' })])
    value.turns = [{ ...value.turns[0]!, durationMs: null, status: 'running' }]
    render(<TraceWorkbench {...props(value, { hasMore: true, running: true })} />)
    expect(screen.getAllByText('未采集').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '加载更早记录' })).toBeTruthy()
    expect(screen.getByText(/还有更早的记录未加载/)).toBeTruthy()
    expect(screen.getByText('持续接收当前会话的执行记录')).toBeTruthy()
    expect(screen.queryByText('1 ms')).toBeNull()
    expect(screen.queryByText('0 ms')).toBeNull()
  })

  it('follows the latest numbered turn when unassigned historical records are present', () => {
    const current = data([row('current')])
    const orphan = row('orphan', { turn: null })
    const unresolved = { ...current.turns[0]!, id: 's:unresolved', turn: null, rows: [orphan] }
    const view = render(<TraceWorkbench {...props({ ...current, rows: [...current.rows, orphan], turns: [...current.turns, unresolved] })} />)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('s:turn:2')
    const fresh = row('latest', { turn: 3, status: 'running', endTime: null, durationMs: null })
    const next = { ...current.turns[0]!, id: 's:turn:3', turn: 3, rows: [fresh] }
    view.rerender(<TraceWorkbench {...props({ ...current, rows: [...current.rows, fresh, orphan], turns: [...current.turns, next, unresolved] }, { running: true })} />)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('s:turn:3')
    expect(screen.getByTestId('trace-detail-content').textContent).toBe('done')
  })

  it('retains a selected tool when older history restores its actual turn', () => {
    const unresolvedRow = row('restored', { turn: null })
    const initial = data([unresolvedRow])
    initial.turns = [{ ...initial.turns[0]!, id: 's:unresolved', turn: null }]
    const view = render(<TraceWorkbench {...props(initial)} />)
    fireEvent.click(screen.getByRole('button', { name: '查看 restored', exact: true }))
    view.rerender(<TraceWorkbench {...props(data([row('restored', { output: 'restored tool result' })]))} />)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('s:turn:2')
    expect(screen.getByTestId('trace-detail-content').textContent).toBe('restored tool result')
  })

  it('searches complete recorded tool arguments beyond the preview length', () => {
    const raw = JSON.stringify({ description: 'a'.repeat(250), path: 'src/late-file.ts' })
    render(<TraceWorkbench {...props(data([row('long-args', { input: raw })]))} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'late-file.ts' } })
    expect(screen.getByRole('button', { name: '查看 long-args', exact: true })).toBeTruthy()
    expect(screen.queryByText('没有匹配的调用')).toBeNull()
  })

  it('does not double-load history and exposes a retryable paging failure', async () => {
    let reject: ((reason: Error) => void) | undefined
    const loader = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail }))
    render(<TraceWorkbench {...props(data(calls()), { hasMore: true, loadOlder: loader })} />)
    const load = screen.getByRole('button', { name: '加载更早记录' })
    fireEvent.click(load); fireEvent.click(load)
    expect(loader).toHaveBeenCalledTimes(1)
    reject?.(new Error('network failed'))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('记录读取失败'))
    expect(screen.getByRole('button', { name: '加载更早记录' }).hasAttribute('disabled')).toBe(false)
  })

  it('renders recorded markup as inert text and folds oversized payloads', () => {
    const payload = '<img src=x onerror="window.pwned=true">' + 'a'.repeat(25000)
    render(<TraceWorkbench {...props(data([row('unsafe', { output: payload })]))} />)
    const content = screen.getByTestId('trace-detail-content')
    expect(content.querySelector('img')).toBeNull()
    expect(content.textContent!.length).toBe(24000)
    fireEvent.click(screen.getByRole('button', { name: '展开完整内容' }))
    expect(content.textContent).toBe(payload)
  })

  it('reports copy success only after completion and exposes clipboard failures', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('denied'))
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    try {
      render(<TraceWorkbench {...props(data([row('copyable', { output: 'recorded output' })]))} />)
      fireEvent.click(screen.getByRole('button', { name: '复制内容', exact: true }))
      await waitFor(() => expect(screen.getByRole('button', { name: '已复制', exact: true })).toBeTruthy())
      expect(writeText).toHaveBeenCalledWith('recorded output')
      fireEvent.click(screen.getByRole('button', { name: '输入', exact: true }))
      fireEvent.click(screen.getByRole('button', { name: '复制内容', exact: true }))
      await waitFor(() => expect(screen.getByRole('button', { name: '复制失败，可直接选中文本复制', exact: true })).toBeTruthy())
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })
})

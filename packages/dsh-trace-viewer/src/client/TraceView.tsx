import { useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-trajectory/client'
import { buildTrace } from '../model.js'
import type { TraceData, TraceRow, TraceTurn } from '../types.js'
import { formatContent, formatPayload, getDisplayBlocks, formatDuration, formatTokens, rowName, rowPreview, type Translate } from './format.js'
import css from './TraceView.module.css'
import { TraceIcon } from './TraceIcon.js'

export interface TraceInjected { loadOlder: () => Promise<void>; focusComposer?: () => (() => void); openDataManagement?: () => void }
type TraceProps = ConvViewProps & PropsLocale<'dshTrace'> & TraceInjected

/** This adapter is the only component coupled to DSH's live selector hooks. */
export function TraceView(props: TraceProps) {
  if (typeof props.useTrajectory !== 'function') return <div className={css.empty}><h2>{props.t('unavailable')}</h2><p>{props.t('unavailableBody')}</p></div>
  return <BoundTrace {...props} />
}

function BoundTrace(props: TraceProps) {
  const snapshot = props.useTrajectory(value => value)
  const session = props.useSession(value => value)
  const data = useMemo(() => buildTrace(snapshot, String(props.sessionId), { hasMore: session.hasMore }), [snapshot, props.sessionId, session.hasMore])
  return <TraceWorkbench key={String(props.sessionId)} data={data} t={props.t} loadOlder={props.loadOlder}
    focusComposer={props.focusComposer} openDataManagement={props.openDataManagement} hasMore={session.hasMore} loadingOlder={session.loadingOlder} running={session.running}
    loading={session.openState === 'cold' || session.openState === 'loading'} readFailed={session.openState === 'error'} />
}

export interface TraceWorkbenchProps {
  data: TraceData
  t: Translate
  loadOlder: () => Promise<void>
  hasMore: boolean
  loadingOlder: boolean
  loading: boolean
  running: boolean
  readFailed: boolean
  focusComposer?: (() => (() => void)) | undefined
  openDataManagement?: (() => void) | undefined
}

type Filter = 'all' | 'errors' | 'models'
type DetailTab = 'input' | 'output' | 'record'
interface VisibleRow { row: TraceRow; depth: number; children: boolean }

/** Preserve real ancestors during filtering; only declared parent ids form edges. */
function visibleTree(rows: readonly TraceRow[], collapsed: ReadonlySet<string>, filter: Filter, query: string): VisibleRow[] {
  const byId = new Map(rows.map(row => [row.id, row]))
  const children = new Map<string | null, TraceRow[]>()
  const accepted = new Set<string>()
  const searching = filter !== 'all' || query !== ''
  for (const row of rows) {
    const parent = row.parentId !== null && byId.has(row.parentId) ? row.parentId : null
    const list = children.get(parent) ?? []
    list.push(row); children.set(parent, list)
    if ((filter === 'all' || filter === 'errors' && (row.status === 'failed' || row.status === 'interrupted') || filter === 'models' && row.kind === 'model')
      && (!query || [row.name, row.model, row.provider, row.error, formatContent(row.input)].join(' ').toLowerCase().includes(query))) {
      let cursor: TraceRow | undefined = row
      const seen = new Set<string>()
      while (cursor && !seen.has(cursor.id)) { accepted.add(cursor.id); seen.add(cursor.id); cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined }
    }
  }
  const result: VisibleRow[] = []
  const seen = new Set<string>()
  const visit = (row: TraceRow, depth: number) => {
    if (seen.has(row.id) || searching && !accepted.has(row.id)) return
    seen.add(row.id)
    const kids = children.get(row.id) ?? []
    result.push({ row, depth, children: kids.length > 0 })
    if (!collapsed.has(row.id) || searching) for (const child of kids) visit(child, depth + 1)
  }
  for (const row of children.get(null) ?? []) visit(row, 0)
  return result
}

function timeRange(rows: readonly TraceRow[]) {
  let start: number | null = null
  let end: number | null = null
  for (const row of rows) {
    if (row.startTime !== null) start = start === null ? row.startTime : Math.min(start, row.startTime)
    const endpoint = row.endTime ?? row.startTime
    if (endpoint !== null) end = end === null ? endpoint : Math.max(end, endpoint)
  }
  return { start, span: start !== null && end !== null && end > start ? end - start : null }
}

/** Pure display component; both the shipped tab and component tests use this surface. */
export function TraceWorkbench({ data, t, loadOlder, hasMore, loadingOlder, loading, running, readFailed, focusComposer, openDataManagement }: TraceWorkbenchProps) {
  const [focused, setFocused] = useState(true)
  useEffect(() => focused ? focusComposer?.() : undefined, [focused, focusComposer])
  const [turnId, setTurnId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [paging, setPaging] = useState(false)
  const [pageError, setPageError] = useState(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const selectedRecord = selectedId ? data.rows.find(row => row.id === selectedId) : undefined
  const latestTurn = data.turns.findLast(item => item.turn !== null) ?? data.turns.at(-1)
  const turn = (selectedRecord ? data.turns.find(item => item.turn === selectedRecord.turn) : undefined)
    ?? data.turns.find(item => item.id === turnId) ?? latestTurn
  const rows = turn?.rows ?? []
  const selected = selectedRecord ?? (selectedId === null ? rows.find(row => row.status === 'failed' || row.status === 'interrupted') ?? rows[0] : undefined)
  const visible = useMemo(() => visibleTree(rows, collapsed, filter, deferredQuery), [rows, collapsed, filter, deferredQuery])
  const range = useMemo(() => timeRange(rows), [rows])
  const viewport = useRef<HTMLDivElement>(null)
  const virtual = useVirtualizer({ count: visible.length, getScrollElement: () => viewport.current,
    estimateSize: () => 60, overscan: 8, getItemKey: index => visible[index]?.row.id ?? index,
    initialRect: { width: 800, height: 460 },
  })
  const page = async () => {
    if (paging || loadingOlder) return
    setPaging(true); setPageError(false)
    try { await loadOlder() } catch { if (mounted.current) setPageError(true) }
    finally { if (mounted.current) setPaging(false) }
  }
  const select = (row: TraceRow) => { setSelectedId(row.id); if (turn) setTurnId(turn.id) }
  const turnLabel = (item: TraceTurn) => item.turn === null ? t('unresolved') : t('turn', { turn: item.turn })
  const empty = data.rows.length === 0
  const turnIndex = data.turns.findIndex(item => item.id === turn?.id)
  const changeTurn = (id: string) => { setTurnId(id); setSelectedId(null) }

  return <section className={css.root} aria-label={t('title')} data-testid="trace-workbench" data-conversation-composer-overlay="">
    <header className={css.header}>
      <div className={css.heading}><TraceIcon name="waterfall" /><h2>{t('title')}</h2>{turn && <Status status={turn.status} t={t} />}</div>
      {data.turns.length > 0 && <div className={css.turnNavigation}>
        <button type="button" className={css.iconButton} aria-label={t('previousTurn')} disabled={turnIndex <= 0} onClick={() => { const previous = data.turns[turnIndex - 1]; if (previous) changeTurn(previous.id) }}><TraceIcon name="left" /></button>
        <label className={css.turnPicker}><span className={css.srOnly}>{t('turnPicker')}</span><select value={turn?.id ?? ''} onChange={event => changeTurn(event.target.value)}>
          {[...data.turns].reverse().map(item => <option key={item.id} value={item.id}>{turnLabel(item)}</option>)}
        </select></label>
        <button type="button" className={css.iconButton} aria-label={t('nextTurn')} disabled={turnIndex < 0 || turnIndex >= data.turns.length - 1} onClick={() => { const next = data.turns[turnIndex + 1]; if (next) changeTurn(next.id) }}><TraceIcon name="right" /></button>
      </div>}
    </header>
    {turn?.title && <details className={css.request} key={turn.id}>
      <summary><span className={css.requestLabel}>{t('request')}</span><span className={css.requestTitle}>{turn.title}</span><TraceIcon name="down" /></summary>
      <p>{turn.title}</p>
    </details>}
    {turn && <dl className={css.metrics}>
      <Metric label={t('duration')} value={formatDuration(turn.durationMs, t)} primary />
      <Metric label={t('modelCount')} value={String(turn.modelCount)} />
      <Metric label={t('toolCount')} value={String(turn.toolCount)} />
      <Metric label={t('inputTokens')} value={formatTokens(turn.usage?.inputTokens ?? null, t)} />
      <Metric label={t('outputTokens')} value={formatTokens(turn.usage?.outputTokens ?? null, t)} />
      <Metric label={t('cache')} value={formatTokens(turn.usage?.cacheReadTokens ?? null, t)} />
    </dl>}
    {readFailed && <div className={css.banner} role="alert">{t('readFailed')} · {t('readFailedBody')}</div>}
    <div className={css.toolbar}>
      <div className={css.filters} role="group" aria-label={t('steps')}>{(['all', 'errors', 'models'] as const).map(value => <button type="button" key={value} className={css.button} aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(value)}<span className={css.filterCount} aria-hidden="true">{value === 'all' ? rows.length : value === 'errors' ? rows.filter(row => row.status === 'failed' || row.status === 'interrupted').length : turn?.modelCount ?? 0}</span></button>)}</div>
      <div className={css.toolbarActions}>{openDataManagement && <button type="button" className={css.focusButton} onClick={openDataManagement} aria-label={t('dataManagement')} title={t('dataManagement')}><TraceIcon name="database" /></button>}{focusComposer && <button type="button" className={css.focusButton} aria-label={t('focusMode')} aria-pressed={focused} onClick={() => setFocused(value => !value)} title={t(focused ? 'showComposer' : 'hideComposer')}><TraceIcon name="focus" /><span>{t('focusMode')}</span></button>}
      <label className={css.searchBox}><TraceIcon name="search" /><input type="search" className={css.search} value={query} onChange={event => setQuery(event.target.value)} placeholder={t('search')} aria-label={t('search')} /></label></div>
    </div>
    <div className={`${css.body} ${selected ? css.hasDetail : ''}`}>
      <div className={css.tablePane}>
        <div className={`${css.ruler} ${css.columns}`}><span>{t('steps')}</span><div className={css.ticks} aria-label={t('elapsed')}><span>0</span><span>{range.span === null ? '' : formatDuration(range.span / 4, t)}</span><span>{range.span === null ? '' : formatDuration(range.span / 2, t)}</span><span>{range.span === null ? '' : formatDuration(range.span * 3 / 4, t)}</span><span>{range.span === null ? t('missing') : formatDuration(range.span, t)}</span></div><span className={css.duration}>{t('durationColumn')}</span></div>
        {hasMore && <div className={css.paging}><button type="button" className={css.textButton} disabled={paging || loadingOlder} onClick={() => { void page() }}><TraceIcon name={paging || loadingOlder ? 'loading' : 'history'} />{paging || loadingOlder ? t('loading') : t('loadOlder')}</button>{pageError && <span role="alert">{t('loadFailed')}</span>}</div>}
        <div ref={viewport} className={css.viewport} data-testid="trace-rows" role="list" aria-label={t('steps')}>
          {empty ? <div className={css.empty}><span className={css.emptyMark}><TraceIcon name="waterfall" /></span><h3>{loading ? t('loading') : t('empty')}</h3><p>{t('emptyBody')}</p></div>
            : visible.length === 0 ? <div className={css.empty}><h3>{t('noMatches')}</h3><button type="button" className={css.textButton} onClick={() => { setQuery(''); setFilter('all') }}>{t('clearFilters')}</button></div>
              : <div className={css.virtualRows} style={{ height: virtual.getTotalSize() }}>{virtual.getVirtualItems().map(item => {
                const value = visible[item.index]
                if (!value) return null
                const { row, depth, children } = value
                const name = rowName(row, t)
                const start = row.startTime !== null && range.start !== null ? range.span === null ? 0 : Math.max(0, (row.startTime - range.start) / range.span * 100) : null
                const width = row.durationMs !== null && range.span !== null ? row.durationMs / range.span * 100 : null
                return <div role="listitem" key={row.id} className={`${css.row} ${selected?.id === row.id ? css.selected : ''}`} data-status={row.status} style={{ transform: `translateY(${item.start}px)`, height: item.size }}>
                  <div className={css.rowName} style={{ '--trace-depth': Math.min(depth, 6) } as CSSProperties}>
                    {children ? <button type="button" className={css.collapse} aria-expanded={!collapsed.has(row.id)} aria-label={t(collapsed.has(row.id) ? 'expand' : 'collapse', { name })} onClick={() => setCollapsed(old => { const next = new Set(old); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next })}><TraceIcon name={collapsed.has(row.id) ? 'right' : 'down'} /></button> : <span className={css.collapseSpace} />}
                    <span className={css.kind} data-kind={row.kind}><TraceIcon name={row.status === 'failed' || row.status === 'interrupted' ? 'error' : row.kind} /></span>
                    <button type="button" title={rowPreview(row) || name} className={css.selectRow} aria-pressed={selected?.id === row.id} aria-label={t('select', { name })} onClick={() => select(row)}><span>{name}</span><small>{rowPreview(row) || t(row.kind)}</small></button>
                  </div>
                  <button type="button" className={css.timeline} onClick={() => select(row)} aria-label={`${t('select', { name })} · ${formatDuration(row.durationMs, t)}`}>
                    {start !== null && <span className={`${css.bar} ${width === null ? css.startMarker : ''}`} data-kind={row.kind} style={{ '--trace-left': `${Math.min(start, 99.5)}%`, '--trace-width': `${Math.min(width ?? 0, 100 - start)}%` } as CSSProperties} />}
                  </button>
                  <span className={css.duration}>{row.status === 'running' ? <span className={css.rowRunning}><TraceIcon name="loading" />{t('running')}</span> : formatDuration(row.durationMs, t)}</span>
                </div>
              })}</div>}
        </div>
        <div className={css.listFooter}><span>{t('shown', { visible: visible.length, total: rows.length })}</span><span className={css.legend}>{filter !== 'all' || query ? t('withAncestors') : <><i data-kind="model" />{t('modelCount')}<i data-kind="tool" />{t('toolCount')}</>}</span></div>
      </div>
      {selected && <aside className={css.detailPane} aria-label={t('detailTabs')}>
        <TraceDetail key={selected.id} row={selected} t={t} parent={selected.parentId ? rows.find(row => row.id === selected.parentId) : undefined} onParent={select} onClose={() => { setSelectedId('') }} />
      </aside>}
    </div>
    <footer className={css.footer}><span className={running ? css.streaming : ''}>{running && <span className={css.liveDot} />}{running ? t('streaming') : t('source')}</span><span>{hasMore ? t('partialHistory') : t('scope')}{turn?.usage && turn.usage.missingRequests > 0 && <> · {t('partialUsage')}</>}</span></footer><div className={css.composerSpace} aria-hidden="true" />
  </section>
}

function Metric({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) { return <div className={primary ? css.primaryMetric : undefined}><dt>{label}</dt><dd>{value}</dd></div> }
function Status({ status, t }: { status: TraceRow['status']; t: Translate }) { return <span className={css.status} data-status={status}><span aria-hidden="true" />{t(status)}</span> }

function TraceDetail({ row, t, parent, onParent, onClose }: { row: TraceRow; t: Translate; parent: TraceRow | undefined; onParent: (row: TraceRow) => void; onClose: () => void }) {
  const [tab, setTab] = useState<DetailTab>('output')
  const [expanded, setExpanded] = useState(false)
  const [copyState, setCopyState] = useState<'copy' | 'copied' | 'copyFailed'>('copy')
  const value = tab === 'input' ? row.input : tab === 'output' ? row.output : row.raw
  const text = useMemo(() => tab === 'record' ? formatContent(value) : formatPayload(value), [tab, value])
  const blocks = tab === 'record' ? null : getDisplayBlocks(value)
  const long = text.length > 24000
  const shown = long && !expanded ? text.slice(0, 24000) : text
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopyState('copied') }
    catch { setCopyState('copyFailed') }
  }
  const note = tab === 'record' ? t('recordScope') : tab === 'input' && row.kind === 'model' ? t('modelInputScope') : row.status === 'failed' ? t('failedRetained') : ''
  return <div className={css.detail}>
    <div className={css.detailHeader}>
      <div className={css.detailCrumb}><span><TraceIcon name={row.kind} />{t(row.kind)}</span><button type="button" className={css.iconButton} aria-label={t('closeDetail')} onClick={onClose}><TraceIcon name="close" /></button></div>
      <h3>{rowName(row, t)}</h3>
      <div className={css.detailMeta}><Status status={row.status} t={t} /><strong>{formatDuration(row.durationMs, t)}</strong><span className={css.sequence}>{row.seq !== null ? `#${row.seq}` : ''}</span></div>
      {parent && <button type="button" className={css.parentLink} onClick={() => onParent(parent)}><TraceIcon name="branch" />{t('parent')}<span>{rowName(parent, t)}</span><TraceIcon name="right" /></button>}
      {row.usage && <dl className={css.detailUsage}><Metric label={t('inputTokens')} value={formatTokens(row.usage.inputTokens, t)} /><Metric label={t('outputTokens')} value={formatTokens(row.usage.outputTokens, t)} /><Metric label={t('cache')} value={formatTokens(row.usage.cacheReadTokens, t)} /></dl>}
    </div>
    {row.error && <pre className={css.error}>{row.error}</pre>}
    <div className={css.payloadToolbar}>
      <div role="group" aria-label={t('detailTabs')} className={css.detailTabs}>{(['input', 'output', 'record'] as const).map(value => <button type="button" key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setExpanded(false); setCopyState('copy') }}>{t(value)}</button>)}</div>
      <button type="button" className={css.copyButton} aria-label={t(copyState)} title={t(copyState)} disabled={!text} onClick={() => { void copy() }}><TraceIcon name={copyState === 'copied' ? 'check' : 'copy'} /></button>
    </div>
    {copyState !== 'copy' && <p className={css.copyFeedback} role="status">{t(copyState)}</p>}
    {note && <p className={css.detailNote}>{note}</p>}
    <div className={css.payloadBody}>
      {long && !expanded && <span className={css.truncated}>{t('truncated')}</span>}
      <div data-testid="trace-detail-content">{blocks && (!long || expanded) ? blocks.map((block, index) => block.kind === 'text'
        ? <pre className={css.proseContent} key={index}>{block.text}</pre>
        : <section className={css.payloadBlock} key={index}><div className={css.payloadBlockHeader}><TraceIcon name="tool" /><strong>{block.name}</strong><span>{t('toolCall')}</span></div><pre className={css.content}>{formatPayload(block.argsRaw)}</pre><code className={css.payloadId}>{block.callId}</code></section>)
        : <pre className={css.content}>{shown || t('none')}</pre>}</div>
      {long && <button type="button" className={css.textButton} onClick={() => setExpanded(value => !value)}>{expanded ? t('showLess') : t('showMore')}</button>}
      {row.durationMs === null && <p className={css.detailNote}>{t('timingMissing')}</p>}
    </div>
  </div>
}

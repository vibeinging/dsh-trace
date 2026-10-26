import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { TraceCleanupPreview, TraceDataManagementApi, TraceDataPageState, TraceDataSettings } from '../management.js'
import type { DataKey } from './managementLocales.js'
import { TraceIcon } from './TraceIcon.js'
import styles from './TraceDataPage.module.css'
import type { TraceNavigationPreferences } from './navigationPreferences.js'

export interface TraceDataPageProps {
  api: TraceDataManagementApi
  t: (key: DataKey, params?: Record<string, string | number>) => string
  navigation?: TraceNavigationPreferences
  embedded?: boolean
}

type Message = { key: DataKey; error?: string; params?: Record<string, string | number>; suffix?: string }
const clone = (value: TraceDataSettings): TraceDataSettings => ({ ...value, points: { ...value.points } })
const equal = (a: TraceDataSettings, b: TraceDataSettings) => JSON.stringify(a) === JSON.stringify(b)
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error)
const hiddenSidebar = () => false
const noSubscription = () => () => {}
const bytes = (value: number) => {
  if (value < 1024) return `${value} B`
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), 3)
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value / 1024 ** exponent)} ${['B', 'KB', 'MB', 'GB'][exponent]}`
}

/** This page writes only through the host-backed management API. */
export function TraceDataPage({ api, t, navigation, embedded = false }: TraceDataPageProps) {
  const sidebarVisible = useSyncExternalStore(navigation?.subscribe ?? noSubscription, navigation?.getSnapshot ?? hiddenSidebar)
  const [navigationError, setNavigationError] = useState(false)
  const id = useId()
  const [state, setState] = useState<TraceDataPageState | null>(null)
  const [draft, setDraft] = useState<TraceDataSettings | null>(null)
  const [baseRevision, setBaseRevision] = useState<number | undefined>(undefined)
  const [busy, setBusy] = useState<'read' | 'save' | 'preview' | 'cleanup' | null>('read')
  const [message, setMessage] = useState<Message | null>(null)
  const [preview, setPreview] = useState<TraceCleanupPreview | null>(null)
  const [conflict, setConflict] = useState(false)
  const [reloadRequired, setReloadRequired] = useState(false)
  const gate = useRef(false)
  const alive = useRef(false)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const previewRef = useRef<HTMLButtonElement>(null)
  const restorePreviewFocus = useRef(false)
  const dirty = !!state && !!draft && !equal(draft, state.settings)
  const invalidPoints = !!draft?.captureEnabled && !Object.values(draft.points).some(Boolean)
  const canWrite = !!state?.settingsWritable
  const date = (value: number | null, fallback: DataKey = 'never') => value === null ? t(fallback) : new Date(value).toLocaleString()

  useEffect(() => {
    alive.current = true
    let current = true
    gate.current = true
    setBusy('read')
    void api.readState().then(next => {
      if (!current) return
      setState(next); setDraft(clone(next.settings)); setBaseRevision(next.settingsRevision)
      setMessage(null); setConflict(false); setReloadRequired(false)
    }).catch(error => {
      if (current) setMessage({ key: 'loadFailed', error: errorText(error) })
    }).finally(() => {
      if (current) { gate.current = false; setBusy(null) }
    })
    return () => { current = false; alive.current = false; gate.current = false }
  }, [api])

  useEffect(() => {
    if (busy) return
    if (preview && preview.traces > 0) confirmRef.current?.focus()
    else if (!preview && restorePreviewFocus.current) { previewRef.current?.focus(); restorePreviewFocus.current = false }
  }, [preview, busy])

  async function refresh() {
    if (gate.current) return
    gate.current = true; setBusy('read'); setPreview(null)
    try {
      const next = await api.readState()
      if (!alive.current) return
      setState(next)
      if (dirty && draft) {
        if (next.settingsRevision !== baseRevision) {
          setConflict(true); setMessage({ key: 'revisionChanged' })
        } else setMessage({ key: 'dirtyRefresh' })
      } else {
        setDraft(clone(next.settings)); setBaseRevision(next.settingsRevision)
        setConflict(false); setReloadRequired(false); setMessage(null)
      }
    } catch (error) {
      if (alive.current) setMessage({ key: state ? 'refreshFailed' : 'loadFailed', error: errorText(error) })
    } finally { if (alive.current) { gate.current = false; setBusy(null) } }
  }

  function discard() {
    if (!state || busy) return
    setDraft(clone(state.settings)); setBaseRevision(state.settingsRevision)
    setConflict(false); setPreview(null); setMessage(null)
  }

  function change(next: TraceDataSettings) {
    setDraft(next); setPreview(null)
    if (!conflict) setMessage(null)
  }

  async function save() {
    if (gate.current || !draft || !state || !canWrite || baseRevision === undefined || !dirty || conflict || reloadRequired || invalidPoints) return
    gate.current = true; setBusy('save'); setPreview(null)
    const nextSettings = clone(draft)
    let saved = false
    try {
      await api.saveSettings(nextSettings, baseRevision)
      saved = true
      if (!alive.current) return
      setState({ ...state, settings: nextSettings }); setDraft(nextSettings)
      const next = await api.readState()
      if (!alive.current) return
      setState(next); setDraft(clone(next.settings)); setBaseRevision(next.settingsRevision)
      setConflict(false); setReloadRequired(false); setMessage({ key: 'saved' })
    } catch (error) {
      if (alive.current) {
        setReloadRequired(saved)
        setMessage({ key: saved ? 'savedRefreshFailed' : 'saveFailed', error: errorText(error) })
      }
    } finally { if (alive.current) { gate.current = false; setBusy(null) } }
  }

  async function previewCleanup() {
    if (gate.current || !canWrite || dirty || conflict || reloadRequired) return
    gate.current = true; setBusy('preview'); setPreview(null); setMessage(null)
    try {
      const next = await api.previewCleanup()
      if (alive.current) setPreview(next)
    } catch (error) {
      if (alive.current) setMessage({ key: 'previewFailed', error: errorText(error) })
    } finally { if (alive.current) { gate.current = false; setBusy(null) } }
  }

  function cancelCleanup() { restorePreviewFocus.current = true; setPreview(null) }

  async function cleanup() {
    if (gate.current || !preview || !canWrite || dirty || conflict || reloadRequired) return
    gate.current = true; setBusy('cleanup')
    try {
      const result = await api.cleanup(preview.token)
      if (!alive.current) return
      restorePreviewFocus.current = true; setPreview(null)
      setMessage({ key: 'cleanupSuccess', params: { count: result.removedTraces, bytes: bytes(result.removedBytes) },
        ...(result.skippedTraces ? { suffix: t('cleanupSkipped', { count: result.skippedTraces }) } : {}) })
      try {
        const next = await api.readState()
        if (alive.current) {
          setState(next); setDraft(clone(next.settings)); setBaseRevision(next.settingsRevision)
        }
      } catch {
        if (alive.current) setMessage({ key: 'cleanupSuccess', params: { count: result.removedTraces, bytes: bytes(result.removedBytes) }, suffix: t('cleanupRefreshFailed') })
      }
    } catch (error) {
      if (alive.current) { setPreview(null); setMessage({ key: 'cleanupFailed', error: errorText(error) }) }
    } finally { if (alive.current) { gate.current = false; setBusy(null) } }
  }

  const controlsDisabled = !!busy || !canWrite || reloadRequired
  const points = ['models', 'tools', 'errors', 'compaction'] as const
  const pointHelp = { models: 'modelsHelp', tools: 'toolsHelp', errors: 'errorsHelp', compaction: 'compactionHelp' } as const
  return <section className={styles.root} data-embedded={embedded || undefined} aria-labelledby={`${id}-title`} data-testid="trace-data-page">
    <div className={styles.scroll}>
      <header className={styles.header}>
        <div><div className={styles.eyebrow}><TraceIcon name="waterfall" /><span>DSH Trace</span></div><h1 id={`${id}-title`}>{t('title')}</h1><p>{t('subtitle')}</p></div>
        <button type="button" className={styles.secondary} disabled={!!busy} onClick={() => void refresh()}><TraceIcon name={busy === 'read' ? 'loading' : 'history'} />{t(busy === 'read' ? 'refreshing' : 'refresh')}</button>
      </header>
      {!state || !draft ? <div className={styles.loadState}>
        {busy ? <p role="status">{t('loading')}</p> : <><h2>{t('loadFailed')}</h2><p role="alert">{message?.error ?? t('unknownError')}</p><button type="button" className={styles.secondary} onClick={() => void refresh()}>{t('retry')}</button></>}
      </div> : <>
        <dl className={styles.summary}>
          <div><dt>{t('captureStatus')}</dt><dd className={styles.status} data-enabled={state.settings.captureEnabled}><span />{t(state.settings.captureEnabled ? 'enabled' : 'disabled')}</dd></div>
          <div><dt>{t('savedTraces')}</dt><dd>{state.stats.traces.toLocaleString()}<small>{t('activeTraces', { count: state.stats.activeTraces })}</small></dd></div>
          <div><dt>{t('savedEvents')}</dt><dd>{state.stats.events.toLocaleString()}</dd></div>
          <div><dt>{t('storage')}</dt><dd>{bytes(state.stats.bytes)}</dd></div>
        </dl>
        {!canWrite && <p className={styles.notice}>{t('readOnly')}</p>}
        {canWrite && baseRevision === undefined && <p className={styles.notice}>{t('revisionUnavailable')}</p>}
        {message && <div className={`${styles.message} ${message.error ? styles.error : ''}`} role={message.error || conflict ? 'alert' : 'status'}>
          <p>{t(message.key, message.params)}{message.suffix && ` ${message.suffix}`}</p>
          {message.error && <p className={styles.errorDetail}>{t('detail', { message: message.error })}</p>}
          {conflict && <button type="button" className={styles.textButton} onClick={discard} disabled={!!busy}>{t('reloadSettings')}</button>}
        </div>}
        {navigation && <fieldset className={styles.section}>
          <legend>{t('navigation')}</legend>
          <p className={styles.sectionHelp}>{t('navigationHelp')}</p>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={sidebarVisible} onChange={event => {
              try { navigation.setVisible(event.target.checked); setNavigationError(false) }
              catch { setNavigationError(true) }
            }} />
            <span><strong>{t('showInSidebar')}</strong></span>
          </label>
          {navigationError && <p role="alert" className={styles.validation}>{t('navigationSaveFailed')}</p>}
        </fieldset>}
        <form onSubmit={event => { event.preventDefault(); void save() }}>
          <fieldset className={styles.section} disabled={controlsDisabled}>
            <legend>{t('collection')}</legend><p className={styles.sectionHelp}>{t('collectionHelp')}</p>
            <label className={styles.mainSwitch}><span>{t('captureEnabled')}</span><input type="checkbox" role="switch" checked={draft.captureEnabled} onChange={event => change({ ...draft, captureEnabled: event.target.checked })} /></label>
            <div className={styles.subsection}><h2>{t('points')}</h2><p className={styles.help}>{t('pointsHelp')}</p>
              <div className={styles.pointGrid}>{points.map(key => <label className={styles.checkRow} key={key}>
                <input type="checkbox" checked={draft.points[key]} onChange={event => change({ ...draft, points: { ...draft.points, [key]: event.target.checked } })} />
                <span><strong>{t(key)}</strong><small>{t(pointHelp[key])}</small></span>
              </label>)}</div>
              {invalidPoints && <p className={styles.validation} role="alert">{t('invalidPoints')}</p>}
            </div>
          </fieldset>
          <fieldset className={styles.section} disabled={controlsDisabled}>
            <legend>{t('content')}</legend><p className={styles.sectionHelp}>{t('contentHelp')}</p>
            <div className={styles.contentOptions}>
              <label className={styles.checkRow}><input type="checkbox" checked={draft.captureModelText} onChange={event => change({ ...draft, captureModelText: event.target.checked })} /><span><strong>{t('captureModelText')}</strong></span></label>
              <label className={styles.checkRow}><input type="checkbox" checked={draft.captureToolPayloads} onChange={event => change({ ...draft, captureToolPayloads: event.target.checked })} /><span><strong>{t('captureToolPayloads')}</strong></span></label>
            </div><p className={styles.help}>{t('contentNote')}</p>
          </fieldset>
          <fieldset className={styles.section} disabled={controlsDisabled}>
            <legend>{t('retention')}</legend><p className={styles.sectionHelp}>{t('retentionHelp')}</p>
            <div className={styles.selectGrid}>
              <label>{t('retentionDays')}<select value={draft.retentionDays ?? 'unlimited'} onChange={event => change({ ...draft, retentionDays: event.target.value === 'unlimited' ? null : Number(event.target.value) })}>
                {[7, 30, 90, 365].map(days => <option key={days} value={days}>{t('days', { days })}</option>)}
                {draft.retentionDays !== null && ![7, 30, 90, 365].includes(draft.retentionDays) && <option value={draft.retentionDays}>{t('days', { days: draft.retentionDays })}</option>}
                <option value="unlimited">{t('unlimited')}</option>
              </select></label>
              <label>{t('cleanupInterval')}<select value={draft.cleanupIntervalHours} onChange={event => change({ ...draft, cleanupIntervalHours: Number(event.target.value) })}>
                {[1, 6, 24].map(hours => <option key={hours} value={hours}>{t('hours', { hours })}</option>)}
                {![1, 6, 24].includes(draft.cleanupIntervalHours) && <option value={draft.cleanupIntervalHours}>{t('hours', { hours: draft.cleanupIntervalHours })}</option>}
              </select></label>
            </div>
          </fieldset>
          <section className={styles.storage} aria-labelledby={`${id}-storage`}>
            <h2 id={`${id}-storage`}>{t('dataDirectory')}</h2><code className={styles.path}>{state.dataDir}</code>
            <dl className={styles.storageDetails}>
              <div><dt>{t('lastCaptured')}</dt><dd>{date(state.lastCapturedAt)}</dd></div>
              <div><dt>{t('lastCleanup')}</dt><dd>{date(state.cleanup.lastRunAt)}</dd></div>
              <div><dt>{t('nextCleanup')}</dt><dd>{date(state.cleanup.nextRunAt, 'notScheduled')}</dd></div>
              <div><dt>{t('eligible')}</dt><dd>{t('eligibleCount', { count: state.cleanup.eligibleTraces, bytes: bytes(state.cleanup.eligibleBytes) })}</dd></div>
            </dl>
            {state.captureError && <p className={styles.validation}>{t('captureError')}: {state.captureError}</p>}
            {state.cleanup.lastError && <p className={styles.validation}>{t('cleanupError')}: {state.cleanup.lastError}</p>}
            <p className={styles.help}>{t('originalSafe')}</p>
            <button ref={previewRef} type="button" className={styles.secondary} disabled={controlsDisabled || dirty || conflict || !!preview} onClick={() => void previewCleanup()}>{t(busy === 'preview' ? 'previewing' : 'cleanNow')}</button>
            {dirty && <p className={styles.help}>{t('dirtyCleanup')}</p>}
            {preview && <fieldset className={styles.confirm} aria-labelledby={`${id}-confirm`} disabled={!!busy}>
              <legend id={`${id}-confirm`}>{t('cleanupTitle')}</legend>
              {preview.traces === 0 ? <p role="status">{t(state.settings.retentionDays === null ? 'cleanupUnlimited' : 'cleanupEmpty')}</p> : <>
                <p>{t('cleanupSummary', { traces: preview.traces, events: preview.events, bytes: bytes(preview.bytes) })}</p>
                {preview.cutoffAt !== null && <p className={styles.help}>{t('cleanupCutoff', { date: date(preview.cutoffAt) })}</p>}
                <p className={styles.help}>{t('cleanupExpiry', { date: date(preview.expiresAt) })}</p>
              </>}
              <div className={styles.confirmActions}>
                {preview.traces > 0 && <button ref={confirmRef} type="button" className={styles.danger} disabled={!!busy || !canWrite || dirty || conflict} onClick={() => void cleanup()}>{t(busy === 'cleanup' ? 'cleaning' : 'cleanupConfirm')}</button>}
                <button type="button" className={styles.secondary} onClick={cancelCleanup}>{t('cancel')}</button>
              </div>
            </fieldset>}
          </section>
          <footer className={styles.actions}>
            <span>{dirty ? t('unsaved') : ''}</span>
            <button type="button" className={styles.secondary} disabled={!dirty || !!busy || reloadRequired} onClick={discard}>{t('discard')}</button>
            <button type="submit" className={styles.primary} disabled={!dirty || controlsDisabled || baseRevision === undefined || invalidPoints || conflict}>{t(busy === 'save' ? 'saving' : 'save')}</button>
          </footer>
        </form>
      </>}
    </div>
  </section>
}

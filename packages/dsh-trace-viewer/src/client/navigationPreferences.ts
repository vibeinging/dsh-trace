/** UI preferences belong to this client; collection policy stays in the Host profile. */
export interface TraceNavigationPreferences {
  getSnapshot(): boolean
  subscribe(listener: () => void): () => void
  setVisible(visible: boolean): void
  dispose(): void
}

const KEY = 'dsh-trace-viewer.sidebar-visible'

export function navigationPreferences(): TraceNavigationPreferences {
  const listeners = new Set<() => void>()
  const read = () => {
    try { return window.localStorage.getItem(KEY) === 'true' } catch { return false }
  }
  let visible = read()
  const publish = (next: boolean) => {
    if (visible === next) return
    visible = next
    for (const listener of listeners) listener()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) publish(read())
  }
  window.addEventListener('storage', onStorage)
  return {
    getSnapshot: () => visible,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    setVisible(next) {
      // A failed write must leave the displayed value unchanged.
      window.localStorage.setItem(KEY, String(next))
      publish(next)
    },
    dispose() { window.removeEventListener('storage', onStorage); listeners.clear() },
  }
}

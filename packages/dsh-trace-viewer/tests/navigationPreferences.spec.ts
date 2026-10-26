import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigationPreferences } from '../src/client/navigationPreferences.js'
import { browserStorage } from './browserStorage.js'

browserStorage()

afterEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe('client Trace navigation preference', () => {
  it('defaults to hidden, persists an explicit choice, and follows other windows', () => {
    const first = navigationPreferences()
    const changed = vi.fn()
    first.subscribe(changed)
    expect(first.getSnapshot()).toBe(false)
    first.setVisible(true)
    expect(first.getSnapshot()).toBe(true)
    const reopened = navigationPreferences()
    expect(reopened.getSnapshot()).toBe(true)
    reopened.setVisible(false)
    window.dispatchEvent(new StorageEvent('storage', { key: 'dsh-trace-viewer.sidebar-visible', newValue: 'false' }))
    expect(first.getSnapshot()).toBe(false)
    expect(changed).toHaveBeenCalledTimes(2)
    first.dispose(); reopened.dispose()
  })

  it('does not claim a failed preference write succeeded', () => {
    const preferences = navigationPreferences()
    const changed = vi.fn()
    preferences.subscribe(changed)
    vi.spyOn(Object.getPrototypeOf(window.localStorage), 'setItem').mockImplementation(() => { throw new Error('storage unavailable') })
    expect(() => preferences.setVisible(true)).toThrow('storage unavailable')
    expect(preferences.getSnapshot()).toBe(false)
    expect(changed).not.toHaveBeenCalled()
    preferences.dispose()
  })
})

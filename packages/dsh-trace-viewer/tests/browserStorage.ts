import { JSDOM } from 'jsdom'
import { beforeEach, vi } from 'vitest'

/** Node's experimental localStorage must not replace the browser's DOM Storage. */
export function browserStorage() {
  beforeEach(() => {
    const dom = new JSDOM('', { url: 'http://trace.test' })
    vi.stubGlobal('localStorage', dom.window.localStorage)
    return () => { vi.unstubAllGlobals(); dom.window.close() }
  })
}

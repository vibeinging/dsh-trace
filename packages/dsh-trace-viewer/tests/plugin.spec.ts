import { Context } from '@deepseek-ai/cordis'
import * as Cordis from '@deepseek-ai/cordis'
import * as Slots from '@deepseek-ai/dsh-client-ui-slots'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as jsx from 'react/jsx-runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { ComposerChainProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import * as viewer from '../src/client/index.ts'
import { DEFAULT_TRACE_SETTINGS } from '../src/management.js'
import { loadBrowserModule } from '../scripts/browser-module.mjs'
import type { TraceNavigationPreferences } from '../src/client/navigationPreferences.js'
import { browserStorage } from './browserStorage.js'

browserStorage()

afterEach(() => localStorage.clear())

interface ViewInjected {
  loadOlder: () => Promise<void>
  focusComposer: () => (() => void)
  openDataManagement: () => void
}

/** Use the published renderer bundle exactly as the DSH browser loader does. */
async function boot() {
  const renderer = await loadBrowserModule(
    new URL(import.meta.resolve('@deepseek-ai/dsh-client-ui-renderer/client')),
    {
      '@deepseek-ai/cordis': Cordis,
      '@deepseek-ai/dsh-client-ui-slots': Slots,
      react: React,
      'react-dom': ReactDOM,
      'react-dom/client': ReactDOMClient,
      'react/jsx-runtime': jsx,
    },
    document,
  )
  const ctx = new Context()
  const registration = ctx.plugin(renderer.exports.SlotRegistry)
  await registration
  const slots = ctx.get('slots') as SlotRegistry | undefined ?? ctx.slots
  const dictionaries = new Map<string, unknown>()
  const loadOlder = vi.fn(async () => {})
  const binding = vi.fn(() => ({ session: { loadOlder } }))
  ctx.reflect.provide('locale', {
    register(namespace: string, values: unknown) {
      dictionaries.set(namespace, values)
      return () => { dictionaries.delete(namespace) }
    },
    bind: () => (key: string) => key,
  })
  ctx.reflect.provide('sessions', { binding })
  ctx.reflect.provide('connection', { rpc: { call: vi.fn() } })
  const selectPanel = vi.fn()
  ctx.reflect.provide('layout', { selectPanel })
  ctx.reflect.provide('configForms', { get: () => ({
    getSnapshot: () => ({ status: 'ready', value: { settings: DEFAULT_TRACE_SETTINGS }, revision: 1, writable: true }),
    subscribe: () => () => {}, mutate: vi.fn(async () => true),
  }) })
  const declareView = () => slots.register({
    name: 'root',
    children: {
      main: { kind: 'keyed', scope: 'root' },
      'settings.section': { kind: 'list', scope: 'root' },
      'sidebar.panellist': { kind: 'list', scope: 'root' },
      'conversation.view': { kind: 'list', scope: 'session' },
      'conversation.composer': { kind: 'chain', scope: 'session' },
    },
  }, () => null)
  return { ctx, slots, dictionaries, loadOlder, binding, declareView, selectPanel }
}

describe('DSH plugin boundary', () => {
  it('adds Settings, hides sidebar by default, and updates the sidebar only on explicit preference changes', async () => {
    const bench = await boot()
    const owner = bench.declareView()
    const fiber = bench.ctx.plugin(viewer)
    try {
      await fiber
      expect(bench.slots.entries('main').map(entry => entry.options.key)).toContain('dsh-trace-data')
      expect(bench.slots.entries('sidebar.panellist')).toHaveLength(0)
      const settings = bench.slots.entries('settings.section')[0]!
      expect(settings.options.id).toBe('dsh-trace-data')
      const page = (settings.inject as () => { navigation: TraceNavigationPreferences; embedded: boolean })()
      expect(page.embedded).toBe(true)
      page.navigation.setVisible(true)
      expect(bench.slots.entries('sidebar.panellist').map(entry => entry.options.id)).toContain('dsh-trace-data')
      page.navigation.setVisible(false)
      expect(bench.slots.entries('sidebar.panellist')).toHaveLength(0)
      expect(bench.slots.entries('settings.section')).toHaveLength(1)
      expect(bench.dictionaries.has('dshTraceData')).toBe(true)
      const inject = bench.slots.entries('conversation.view')[0]?.inject as (id: string) => ViewInjected
      inject('session').openDataManagement()
      expect(bench.selectPanel).toHaveBeenCalledWith('dsh-trace-data')
      await fiber.dispose()
      expect(bench.slots.entries('main')).toHaveLength(0)
      expect(bench.slots.entries('sidebar.panellist')).toHaveLength(0)
      expect(bench.slots.entries('settings.section')).toHaveLength(0)
    } finally { await fiber.dispose(); owner(); await bench.ctx.fiber.dispose() }
  })

  it('registers one session view and removes it through the real Cordis lifecycle', async () => {
    const bench = await boot()
    const disposeOwner = bench.declareView()
    const fiber = bench.ctx.plugin(viewer)
    try {
      await fiber
      const entries = bench.slots.entries('conversation.view')
      expect(entries).toHaveLength(1)
      expect(entries[0]?.options.id).toBe('dsh-trace')
      expect(entries[0]?.locale).toBe('dshTrace')
      expect(bench.dictionaries.has('dshTrace')).toBe(true)
      // Loading a tab never requests a session, reads storage, or sends a model call.
      expect(bench.binding).not.toHaveBeenCalled()
      const inject = entries[0]?.inject as ((sessionId: string) => { loadOlder: () => Promise<void> })
      await inject('session-real-shape').loadOlder()
      expect(bench.binding).toHaveBeenCalledWith('session-real-shape')
      expect(bench.loadOlder).toHaveBeenCalledOnce()
      await fiber.dispose()
      expect(bench.slots.entries('conversation.view')).toHaveLength(0)
      expect(bench.dictionaries.size).toBe(0)
    } finally {
      await fiber.dispose()
      disposeOwner()
      await bench.ctx.fiber.dispose()
    }
  })

  it('waits for the owning view slot, then collapses and reattaches with its declaration', async () => {
    const bench = await boot()
    const fiber = bench.ctx.plugin(viewer)
    try {
      await fiber
      expect(bench.slots.entries('conversation.view')).toHaveLength(0)
      const firstOwner = bench.declareView()
      expect(bench.slots.entries('conversation.view')).toHaveLength(1)
      firstOwner()
      expect(bench.slots.entries('conversation.view')).toHaveLength(0)
      const secondOwner = bench.declareView()
      expect(bench.slots.entries('conversation.view')).toHaveLength(1)
      await fiber.dispose()
      expect(bench.slots.entries('conversation.view')).toHaveLength(0)
      secondOwner()
    } finally {
      await fiber.dispose()
      await bench.ctx.fiber.dispose()
    }
  })

  it('focuses only the requested session and yields to pending interactions', async () => {
    const bench = await boot()
    const disposeOwner = bench.declareView()
    const fiber = bench.ctx.plugin(viewer)
    try {
      await fiber
      const inject = bench.slots.entries('conversation.view')[0]?.inject as (sessionId: string) => ViewInjected
      const view = inject('session-focused')
      expect(bench.slots.entries('conversation.composer')).toHaveLength(0)
      const restore = view.focusComposer()
      const entries = bench.slots.entries('conversation.composer')
      expect(entries).toHaveLength(1)
      const entry = entries[0]!
      expect(entry.options.priority).toBe(100)
      const select = entry.select as (owner: ComposerChainProps) => unknown
      const focused = { sessionId: 'session-focused', session: undefined, pendingInteraction: undefined } as ComposerChainProps
      expect(select(focused)).not.toBeNull()
      expect(select({ ...focused, sessionId: 'session-other' as ComposerChainProps['sessionId'] })).toBeNull()
      expect(select({ ...focused, sessionId: undefined })).toBeNull()
      const pending = { type: 'pending-user-interaction' } as unknown as ComposerChainProps['pendingInteraction']
      expect(select({ ...focused, pendingInteraction: pending })).toBeNull()
      expect((entry.component as () => null)()).toBeNull()
      // Focusing is presentation only: it never resolves input or session data.
      expect(bench.binding).not.toHaveBeenCalled()
      restore()
    } finally {
      await fiber.dispose()
      disposeOwner()
      await bench.ctx.fiber.dispose()
    }
  })

  it('restores the resident composer when the focus disposer runs', async () => {
    const bench = await boot()
    const disposeOwner = bench.declareView()
    const fiber = bench.ctx.plugin(viewer)
    try {
      await fiber
      const inject = bench.slots.entries('conversation.view')[0]?.inject as (sessionId: string) => ViewInjected
      const focusComposer = inject('session-focused').focusComposer
      const restore = focusComposer()
      expect(bench.slots.entries('conversation.composer')).toHaveLength(1)
      restore()
      restore()
      expect(bench.slots.entries('conversation.composer')).toHaveLength(0)
      expect(bench.slots.entries('conversation.view')).toHaveLength(1)
      const restoreAgain = focusComposer()
      expect(bench.slots.entries('conversation.composer')).toHaveLength(1)
      restoreAgain()
      expect(bench.slots.entries('conversation.composer')).toHaveLength(0)
    } finally {
      await fiber.dispose()
      disposeOwner()
      await bench.ctx.fiber.dispose()
    }
  })

  it('removes active focus takeovers when the plugin is unloaded', async () => {
    const bench = await boot()
    const disposeOwner = bench.declareView()
    const fiber = bench.ctx.plugin(viewer)
    try {
      await fiber
      const inject = bench.slots.entries('conversation.view')[0]?.inject as (sessionId: string) => ViewInjected
      const restore = inject('session-focused').focusComposer()
      expect(bench.slots.entries('conversation.composer')).toHaveLength(1)
      await fiber.dispose()
      expect(bench.slots.entries('conversation.composer')).toHaveLength(0)
      expect(bench.slots.entries('conversation.view')).toHaveLength(0)
      expect(bench.dictionaries.size).toBe(0)
      expect(() => restore()).not.toThrow()
    } finally {
      await fiber.dispose()
      disposeOwner()
      await bench.ctx.fiber.dispose()
    }
  })
})

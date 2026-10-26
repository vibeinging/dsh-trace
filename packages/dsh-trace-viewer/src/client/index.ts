/** Register one independently removable, session-bound Trace tab. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ComposerChainProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-trajectory/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { createElement } from 'react'
import { en, zh } from './locales.js'
import { TraceView } from './TraceView.js'
import { TraceIcon } from './TraceIcon.js'
import { TraceDataPage } from './TraceDataPage.js'
import { dataZh, dataEn } from './managementLocales.js'
import { managementApi, type TraceProfileConfig } from './managementApi.js'
import { navigationPreferences } from './navigationPreferences.js'

export const inject = ['slots', 'locale', 'sessions', 'connection', 'layout', 'configForms']
const PANEL_ID = 'dsh-trace-data' as MainPanelId

/** The host keeps its composer draft mounted behind the elected empty view. */
function FocusComposer() { return null }

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('dshTrace', { zh, en }), 'dsh-trace: locale')
  ctx.effect(() => ctx.locale.register('dshTraceData', { zh: dataZh, en: dataEn }), 'dsh-trace: data locale')
  const t = ctx.locale.bind('dshTrace')
  const dataT = ctx.locale.bind('dshTraceData')
  const api = managementApi(ctx.get('connection') as ConnectionHandle, ctx.configForms.get<TraceProfileConfig>('dsh-trace-viewer'))
  const navigation = navigationPreferences()
  ctx.effect(() => () => navigation.dispose())
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: PANEL_ID, order: 50, label: () => dataT('title'), locale: 'dshTraceData',
    inject: () => ({ api, navigation, embedded: true }),
  }, TraceDataPage))
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: PANEL_ID, locale: 'dshTraceData', inject: () => ({ api, navigation }),
  }, TraceDataPage))
  ctx.effect(() => {
    let remove: (() => void) | undefined
    const sync = () => {
      if (navigation.getSnapshot() && !remove) {
        remove = ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 40, locale: 'dshTraceData', label: () => dataT('title'),
        }, () => createElement(TraceIcon, { name: 'database' })))
      } else if (!navigation.getSnapshot() && remove) { remove(); remove = undefined }
    }
    const unsubscribe = navigation.subscribe(sync)
    sync()
    return () => { unsubscribe(); remove?.() }
  })
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view', id: 'dsh-trace', order: 12, locale: 'dshTrace',
    label: () => t('view'),
    inject: sessionId => ({
      openDataManagement: () => ctx.layout.selectPanel(PANEL_ID),
      focusComposer: () => ctx.slots.inject('conversation.composer', () => ctx.slots.register({
        name: 'conversation.composer', priority: 100,
        select: (owner: ComposerChainProps) => owner.sessionId === sessionId && owner.pendingInteraction === undefined
          ? { sessionId } : null,
      }, FocusComposer)),
      loadOlder: async () => {
        const binding = ctx.sessions.binding(sessionId)
        if (binding === undefined) throw new Error('Trace session is unavailable')
        await binding.session.loadOlder()
      },
    }),
  }, TraceView))
}

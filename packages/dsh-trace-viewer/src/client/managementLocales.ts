/** Product copy for Trace-owned data collection and retention. */
export const dataZh = {
  title: 'Trace 数据', subtitle: '管理本地采集、埋点范围和数据保留时间。', refresh: '刷新', refreshing: '正在刷新',
  navigation: '界面入口', navigationHelp: '侧边栏默认隐藏。此开关仅影响当前设备，修改后立即保存；所有配置都可从设置页访问。', showInSidebar: '在侧边栏显示 Trace 数据', navigationSaveFailed: '无法保存界面偏好，请重试。',
  loading: '正在读取 Trace 数据设置', loadFailed: '无法读取 Trace 数据设置', retry: '重试',
  captureStatus: '采集状态', enabled: '采集中', disabled: '已关闭', savedTraces: 'Trace 记录', savedEvents: '事件', storage: '数据占用', activeTraces: '{count} 条记录段正在写入',
  collection: '采集设置', collectionHelp: '从启用时起，为所有会话的新事件保存一份 Trace 副本。记录段可能对应会话轮次、独立请求或压缩事件。', captureEnabled: '开启 Trace 数据采集',
  points: '埋点范围', pointsHelp: '选择需要保存的事件类型。开启采集时至少保留一项。',
  models: '模型调用', modelsHelp: '调用时间、模型和用量', tools: '工具执行', toolsHelp: '工具名称、执行时间和状态',
  errors: '失败事件', errorsHelp: '保存失败和中断的记录', compaction: '历史压缩', compactionHelp: '上下文压缩事件',
  content: '正文内容', contentHelp: '正文开关只影响之后新保存的副本；关闭后，已保存的正文仍保留。',
  captureModelText: '保存模型回复正文', captureToolPayloads: '保存工具参数和结果', contentNote: '正文可能包含文件内容、用户输入等信息。默认只保存调用信息。',
  retention: '保留与清理', retentionHelp: '自动清理到期的 Trace 副本。正在写入的记录段会跳过。', retentionDays: '数据保留时间', days: '{days} 天', unlimited: '一直保留', cleanupInterval: '自动检查间隔', hours: '每 {hours} 小时',
  dataDirectory: '数据目录', lastCaptured: '最近写入', lastCleanup: '最近清理', nextCleanup: '下次检查', eligible: '到期待清理', eligibleCount: '{count} 条记录段 · {bytes}', never: '暂无记录', notScheduled: '未安排',
  originalSafe: '此处的清理只删除 Trace 自有副本，DSH 原始会话会保留。',
  cleanNow: '预览到期清理', previewing: '正在检查', cleanupTitle: '确认清理到期数据', cleanupSummary: '将删除 {traces} 条记录段、{events} 个事件，共 {bytes}。', cleanupCutoff: '清理范围：早于 {date} 的已结束记录段。', cleanupUnlimited: '当前设置为一直保留，没有到期数据。', cleanupEmpty: '没有到期数据需要清理。', cleanupExpiry: '预览有效至 {date}；确认时会再次检查数据状态。', cleanupConfirm: '确认清理', cleaning: '正在清理', cancel: '取消',
  cleanupSuccess: '已清理 {count} 条记录段，释放 {bytes}。', cleanupSkipped: '另有 {count} 条记录段因状态变化而跳过。', cleanupFailed: '清理失败，请重新预览后重试。', previewFailed: '无法预览清理，请重试。',
  save: '保存设置', saving: '正在保存', discard: '放弃修改', unsaved: '有未保存的修改', saved: '设置已保存。', saveFailed: '设置保存失败，修改仍保留。', savedRefreshFailed: '设置已保存，但状态读取失败；请刷新后继续修改。',
  dirtyRefresh: '已刷新数据状态，未保存的修改已保留。', revisionChanged: '配置已在其他位置改变。你的修改已保留，请载入最新配置后再编辑。', reloadSettings: '载入最新配置', refreshFailed: '刷新失败，当前设置与修改已保留。',
  revisionUnavailable: '当前宿主未提供配置版本，暂不能保存；可刷新重试。', cleanupRefreshFailed: '清理已完成，但状态读取失败；请刷新查看最新统计。',
  readOnly: '当前宿主未开放配置写入权限，此页只能查看。', dirtyCleanup: '请先保存或放弃修改，再预览清理。', invalidPoints: '开启采集时，请至少选择一个埋点范围。', captureError: '最近采集错误', cleanupError: '最近清理错误', detail: '错误详情：{message}', unknownError: '未知错误',
} as const

export type DataKey = keyof typeof dataZh
export const dataEn: Record<DataKey, string> = {
  title: 'Trace data', subtitle: 'Manage local collection, event scope, and data retention.', refresh: 'Refresh', refreshing: 'Refreshing',
  navigation: 'Navigation', navigationHelp: 'Hidden from the sidebar by default. This device preference saves immediately. All options remain available in Settings.', showInSidebar: 'Show Trace data in sidebar', navigationSaveFailed: 'Could not save this preference. Try again.',
  loading: 'Loading Trace data settings', loadFailed: 'Could not load Trace data settings', retry: 'Retry',
  captureStatus: 'Collection', enabled: 'Recording', disabled: 'Off', savedTraces: 'Trace records', savedEvents: 'Events', storage: 'Storage', activeTraces: '{count} segments being recorded',
  collection: 'Collection settings', collectionHelp: 'Save a Trace copy of new events across all sessions, starting when enabled. A record segment can represent a session turn, a standalone request, or compaction.', captureEnabled: 'Enable Trace data collection',
  points: 'Event scope', pointsHelp: 'Choose which event types to save. Select at least one while collection is enabled.',
  models: 'Model calls', modelsHelp: 'Timing, model, and usage', tools: 'Tool execution', toolsHelp: 'Tool name, timing, and status',
  errors: 'Failures', errorsHelp: 'Failed and interrupted events', compaction: 'History compaction', compactionHelp: 'Context compaction events',
  content: 'Content', contentHelp: 'Content switches affect only new copies. Previously saved content is retained when switched off.',
  captureModelText: 'Save model response text', captureToolPayloads: 'Save tool arguments and results', contentNote: 'Content may include files and user input. Only call metadata is saved by default.',
  retention: 'Retention and cleanup', retentionHelp: 'Automatically remove expired Trace copies. Active record segments are skipped.', retentionDays: 'Keep data for', days: '{days} days', unlimited: 'Keep indefinitely', cleanupInterval: 'Automatic check interval', hours: 'Every {hours} hours',
  dataDirectory: 'Data directory', lastCaptured: 'Last recorded', lastCleanup: 'Last cleanup', nextCleanup: 'Next check', eligible: 'Expired data', eligibleCount: '{count} segments · {bytes}', never: 'No record yet', notScheduled: 'Not scheduled',
  originalSafe: 'Cleanup removes only Trace-owned copies. Original DSH sessions are retained.',
  cleanNow: 'Preview expired data cleanup', previewing: 'Checking', cleanupTitle: 'Confirm expired data cleanup', cleanupSummary: 'Remove {traces} record segments and {events} events, totaling {bytes}.', cleanupCutoff: 'Scope: finished record segments older than {date}.', cleanupUnlimited: 'Retention is indefinite. No data has expired.', cleanupEmpty: 'No expired data to remove.', cleanupExpiry: 'Preview valid until {date}. Data status is checked again on confirmation.', cleanupConfirm: 'Confirm cleanup', cleaning: 'Cleaning', cancel: 'Cancel',
  cleanupSuccess: 'Removed {count} record segments and freed {bytes}.', cleanupSkipped: '{count} other record segments were skipped because their status changed.', cleanupFailed: 'Cleanup failed. Preview again to retry.', previewFailed: 'Could not preview cleanup. Try again.',
  save: 'Save settings', saving: 'Saving', discard: 'Discard changes', unsaved: 'Unsaved changes', saved: 'Settings saved.', saveFailed: 'Could not save settings. Your changes are retained.', savedRefreshFailed: 'Settings saved, but status could not be loaded. Refresh before editing again.',
  dirtyRefresh: 'Data status refreshed. Your unsaved changes are retained.', revisionChanged: 'Configuration changed elsewhere. Your edits are retained. Load the latest configuration before editing again.', reloadSettings: 'Load latest configuration', refreshFailed: 'Refresh failed. Current settings and edits are retained.',
  revisionUnavailable: 'The host did not provide a configuration revision. Saving is unavailable. Refresh to retry.', cleanupRefreshFailed: 'Cleanup completed, but status could not be loaded. Refresh to see the latest totals.',
  readOnly: 'This host does not grant configuration write access. This page is read-only.', dirtyCleanup: 'Save or discard your changes before previewing cleanup.', invalidPoints: 'Select at least one event type while collection is enabled.', captureError: 'Last collection error', cleanupError: 'Last cleanup error', detail: 'Error details: {message}', unknownError: 'Unknown error',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { dshTraceData: DataKey }
}

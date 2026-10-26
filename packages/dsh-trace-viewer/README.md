# dsh-trace viewer

DSH 会话中的瀑布工作台，并提供 **Trace 数据**管理页。打开会话后选择顶部的 **Trace**，按轮次查看模型与工具调用，点选步骤查看输入、输出、错误和记录详情。

这是独立开源项目 [dsh-trace](../../README.zh.md) 的 `@vibeinging/dsh-trace-viewer` 插件。瀑布工作台读取 DSH 已有会话；可选采集在当前 profile 下保存独立的 JSON 副本。两者都不需要启用 `legacy/` 中的旧 yiTrace 采集插件，也不需要新建数据库。界面按 DSH 重写，使用宿主的主题与中英文设置。

## 可以做什么

- 默认使用“专注查看”收起普通输入框；点击开关或离开 Trace 后恢复，草稿保留。待处理的审批与提问仍由宿主显示。
- 在统一时间轴上查看模型调用、工具调用及记录中明确的父子关系。
- 查看本轮耗时、输入和输出用量、缓存读取量；未采集的值保留为“未采集”。
- 搜索调用、工具和文件，筛选失败或模型调用；筛选保留父级上下文与当前详情。
- 展开长输入和输出，复制内容，读取更早的会话记录。
- 随宿主会话更新；切换会话时清理上一会话的选择与读取状态。
- 在 **设置 → Trace 数据**或瀑布工具栏的“数据管理”入口，管理采集开关、埋点范围、正文、数据保留和到期清理。侧边栏入口默认隐藏，可在 Trace 设置中打开；此界面偏好在当前设备立即保存。

## 兼容版本

当前针对 DSH `0.2.1-rc.2`、Cordis `4.0.5` 和 React `18.3.1` 开发与验收。SDK 来自 npm registry，未引用 DSH 源码目录。RC 版本的会话接口可能变化；其他版本需重新验证。

官方 Trajectory 插件必须保持启用，它提供 `useTrajectory` 数据。浏览器入口通过官方 `conversation.view` 扩展点添加 Trace，通过 `settings.section` 添加设置页，并按用户偏好显示可选侧边栏入口。Host 入口观察已提交的新会话事件，保存可选副本并处理统计和清理；采集与清理设置使用 DSH 官方 profile 配置服务持久保存。

## 本地开发与安装

从仓库根目录执行：

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
```

构建后，使用插件目录的绝对路径安装到指定的 DSH Web profile：

```sh
dsh plugin --profile web add -w link:/absolute/path/to/dsh-trace/packages/dsh-trace-viewer
dsh --profile web
```

打开一个已有会话，点击顶部 **Trace**。切换轮次后，在左侧选择调用，右侧可查看“输入”“输出”“原始记录”。读取更早记录后，当前选中的轮次和详情保持不变。

要保存额外的 Trace 副本，打开 **设置 → Trace 数据**，选择范围后点击“保存设置”。安装后采集默认关闭。查看已有会话不需要开启采集。

卸载：

```sh
dsh plugin --profile web remove -w @vibeinging/dsh-trace-viewer
```

安装与卸载都应针对实际使用的同一 profile；需要重启时，先正常退出该 profile。建议先在独立的 DSH home 中验收。源码使用 BSD-3-Clause 开源；npm 包尚未发布，请使用本地构建目录。仓库根目录是开发工作区，不能直接作为插件安装。

在 DSH Desktop 中，使用左侧“插件 → 添加插件”，输入上述 `link:/absolute/path/...`，安装后点击“立即启用”。当前桌面已通过此路径热加载。若使用 CLI 管理 Desktop profile，按官方要求先完全退出 Desktop，再执行命令并重新打开。

## Trace 数据管理

管理页面向当前 Host 的所有会话。采集由 Host 执行，不依赖是否正在打开 Trace 页面。开启后只记录之后的新事件，不回填已有会话，也不会复制旧历史。关闭后停止新增副本事件；已保存的内容仍保留，已打开记录段可以更新结束状态。

| 设置 | 默认值 | 含义 |
| --- | --- | --- |
| 开启 Trace 数据采集 | 关闭 | 主开关；启用时至少选择一个埋点范围 |
| 模型调用、工具执行、失败事件、历史压缩 | 均选中 | 保存所选类型的调用信息；失败范围也包含中断。轮次边界用于保留记录结构 |
| 保存模型回复正文 | 关闭 | 保存之后收到的模型回复文本，不包含 reasoning block |
| 保存工具参数和结果 | 关闭 | 保存之后收到的工具参数与文本结果 |
| 数据保留时间 | 30 天 | 页面可选 7、30、90、365 天或“一直保留” |
| 自动检查间隔 | 每 24 小时 | 页面可选每 1、6、24 小时；Host 每分钟检查是否到期 |

“一直保留”关闭到期删除；手动预览也不会选择任何到期数据。保留期限按记录段的最近更新时间计算；不是对每个事件单独计时。Host 需运行才能执行自动清理；首次启动后的检查会处理已有到期数据。

管理页显示记录段数、事件数、数据占用、正在写入的数量、数据目录、最近写入、上次与下次检查，以及到期待清理数量。这里的“记录段”可能对应一个轮次、独立请求或历史压缩，不等于完整会话数。统计通过“刷新”更新。修改需要显式保存；如果配置在其他位置改变，页面会保留草稿并要求重新载入，避免覆盖新设置。

副本固定保存在当前 profile 的 `data/dsh-trace-viewer/`，与 DSH 原始会话分开。文件名使用会话 id 的哈希；文件内容仍包含原始会话 id、轮次和来源事件序号。默认只保存允许的调用信息，不保存完整请求配置、请求头、推理正文或压缩摘要。正文可能含文件内容、用户输入等敏感信息，正文开关只影响之后保存的数据，不会移除先前已保存的正文；它们不是通用脱敏规则。

“预览到期清理”先显示记录段数、事件数和大小；确认后才执行手动删除。预览有效期为 5 分钟，确认时重新检查保留设置、内容和活动状态，跳过正在写入或预览后变化的记录段。自动清理使用相同的到期和活动记录保护。清理仅删除本插件自有目录中识别的 Trace 副本，不删除 DSH 原始会话，也不管理旧 yiTrace 采集插件的数据。

设置保存、统计与清理需要宿主授权。只读连接不能保存；管理接口只接受当前 Host 所有者请求。数据目录由 profile 决定，管理页不接受任意文件路径。

## 数据含义

| 显示内容 | 来源与范围 |
| --- | --- |
| 调用与步骤 | 官方 `useTrajectory` 提供的已加载会话投影 |
| 工具父子关系 | 模型中的 call id、工具 parentCallId 或 subCalls；没有关系时不推测 |
| 时间 | 记录中的开始和结束时间；缺少终点时只显示起点 |
| 本轮耗时 | 完整轮次边界，无法取得时不以调用耗时之和代替 |
| 用量 | 已上报的模型用量；部分缺失时明确提示，不补零 |
| 模型输入 | 已记录的请求配置、系统提示与工具定义，不代表完整 messages 请求体 |
| 记录详情 | DSH 轨迹投影，不是磁盘中的原始事件文件 |

普通模型输出和记录详情不包含 assistant reasoning block。工具内容和其他已记录字段按原值展示为文本，不执行 HTML 或 Markdown。复制会复制当前标签的完整内容。

## 当前边界

- 仅查看当前会话；跨会话检索、跨运行比较和 Fuju 数据库查询尚未接入。
- 不推测宿主没有提供的子代理内部轨迹。
- 不改变模型请求、工具执行、原始会话文件或旧遥测后端配置。读取历史由宿主处理；新副本的采集与清理只作用于本插件的数据目录。
- 管理页暂不提供已保存副本的搜索、导出和详情浏览。会话中的瀑布仍读取 DSH 原始轨迹，不读取这些副本。
- 瀑布行使用虚拟列表，长详情默认折叠；这不等于已完成超大历史的性能基准。
- 已验收的 Desktop 范围包括真实新请求从运行中到完成，以及 25 轮历史的连续分页；同版本 Web 宿主也验证过分页。分页失败和重试由受控测试覆盖。本次开源整理没有重新执行桌面会话测试。

公开构建与包检查范围见 [独立开源验证记录](../../docs/reports/2026-10-26_standalone-open-source-verification.md)。历史桌面截图与原始验收证据不包含在公开源码快照中。

## English

A DSH conversation view with a shared waterfall, turn selection, model/tool metrics, search, failure filters and input/output details. It reads the official loaded trajectory and session hooks, preserves missing values and declared parent links, and follows DSH theme and locale. Focus mode temporarily hides the regular composer while preserving its draft, yields to pending interactions, and restores the composer when leaving Trace.

Open **Settings → Trace data** to manage optional Host-side recording across all sessions. The sidebar entry is hidden by default; its switch in Trace settings saves immediately on this device. Collection is off by default and records only future committed events, with no history backfill. Model calls, tools, failures/interruption and compaction can be selected independently; model response text and tool arguments/results are separately opt-in. The default retention is 30 days with a 24-hour check interval; indefinite retention disables expiry. Manual cleanup previews exact expired records before confirmation and rechecks their state. Both manual and automatic cleanup skip active segments and remove only this plugin's independent JSON copies under the current profile's `data/dsh-trace-viewer/`, preserving DSH's original sessions and the legacy exporter's data. Settings are persisted through DSH's official revision-checked profile configuration service. Content switches affect future copies only; previously saved content is retained.

Build from the repository root with `pnpm install --frozen-lockfile --ignore-scripts` and `pnpm run check`. Install this built package directory with `dsh plugin --profile web add -w link:/absolute/path/to/dsh-trace/packages/dsh-trace-viewer`, then open an existing conversation and select **Trace**. Keep the official Trajectory provider enabled. Tested SDK target: DSH `0.2.1-rc.2` and Cordis `4.0.5`. Source is BSD-3-Clause; the npm package is not yet published. No new database or legacy telemetry exporter is required. The repository root is a development workspace, not the plugin package.

## 许可证 / License

[BSD-3-Clause](LICENSE)。浏览器包包含的 TanStack Virtual 使用 MIT，完整声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

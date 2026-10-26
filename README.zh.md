# dsh-trace

[English](README.md) | 中文

为 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 提供瀑布工作台的社区插件，直接查看真实 DSH 会话，并在 **设置 → Trace 数据**中管理可选的本地副本。

这是独立项目，使用已发布的 DSH SDK，不需要 DSH 源码、yiTrace 服务、数据库或访问令牌。本项目由社区维护。

## 功能

- 在同一时间轴查看模型与工具调用、已记录的父子关系、耗时、用量和缓存读取。
- 搜索、失败筛选、轮次切换、长历史分页，以及输入、输出和记录详情。
- 随真实会话更新；没有记录的时间或用量明确显示为未采集。
- 专注查看时保留输入框草稿，宿主仍可展示审批和提问。
- 可选的 Host 侧采集，支持埋点范围、正文开关、保留时间和清理预览。
- 跟随 DSH 主题和中英文设置。管理入口放在设置中，侧边栏快捷入口默认关闭。

瀑布读取 DSH 已有会话。额外采集**默认关闭**；开启后保存独立副本，清理仅作用于本插件的副本。

## 兼容版本

| 组件 | 已验证版本 |
| --- | --- |
| DSH SDK | `0.2.1-rc.2` |
| Cordis | `4.0.5` |
| React / React DOM | `18.3.1`，由宿主提供 |
| Node.js | `^22.19.0` 或 `>=24.0.0` |
| pnpm | `11.7.0` |

请保持官方 Trajectory 插件启用。RC 接口可能变化，其他 DSH 版本需要重新验证。

## 构建与安装

源码已按开源项目整理；npm 包**尚未发布**。先在本地构建：

```sh
git clone https://github.com/vibeinging/dsh-trace.git
cd dsh-trace
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
```

在 DSH Desktop 中打开 **插件 → 添加插件**，输入构建后插件目录的绝对路径：

```text
link:/absolute/path/to/dsh-trace/packages/dsh-trace-viewer
```

启用后打开会话，选择顶部 **Trace**；在 **设置 → Trace 数据**管理采集与保留时间。如果新 Host 组件需要重启，请正常退出并重新打开 DSH。

DSH Web profile 可通过 CLI 安装：

```sh
dsh plugin --profile web add -w link:/absolute/path/to/dsh-trace/packages/dsh-trace-viewer
dsh --profile web
```

卸载时使用同一 profile：

```sh
dsh plugin --profile web remove -w @vibeinging/dsh-trace-viewer
```

仓库根目录是开发工作区。安装插件时应指定 `packages/dsh-trace-viewer`，当前不支持直接把仓库 URL 当作根插件安装。通过 CLI 修改 Desktop 的 profile 前，请先退出 Desktop。

## 数据默认值

| 设置 | 默认值 |
| --- | --- |
| 额外采集 | 关闭；只记录之后的新事件，不回填历史 |
| 开启后的埋点范围 | 模型调用、工具执行、失败与中断、历史压缩 |
| 模型回复正文 | 关闭 |
| 工具参数与结果 | 关闭 |
| 数据保留时间 | 30 天 |
| 到期检查 | Host 运行时每 24 小时检查 |

副本保存在当前 profile 的 `data/dsh-trace-viewer/`，包含会话标识与所选事件信息。正文开关只影响之后的写入，不会清除已保存内容，也不是通用脱敏规则。“一直保留”关闭到期删除。手动清理先预览再确认，跳过正在写入或预览后变化的记录段，始终保留 DSH 原始会话。

完整设置和字段含义见 [插件说明](packages/dsh-trace-viewer/README.md)。

## 开发

在根目录执行 `pnpm run check`，统一完成仓库边界检查、lint、Host 与浏览器类型检查、测试、构建和包检查。公开 CI 使用同一命令，无需私有 SDK 令牌。

```text
packages/dsh-trace-viewer/  当前插件：源码、测试、构建产物
docs/                      需求、设计与验收记录
legacy/yitrace-exporter/   旧 SDK 导出器，不参加默认工作区
```

旧导出器会替换遥测后端，使用另一套 SDK 和存储。本插件不依赖它，旧版固定提交仍可使用；详见 [归档说明](legacy/yitrace-exporter/README.zh.md)。

## 当前范围

当前查看单个会话，不提供跨会话搜索和多次运行对比。数据管理页暂不浏览或导出已保存副本。只有宿主提供子代理关系时才展示对应轨迹。支持长历史分页，尚未完成通用的大规模性能基准。

## 贡献与许可证

贡献流程见 [CONTRIBUTING.md](CONTRIBUTING.md)，问题报告见 [SECURITY.md](SECURITY.md)，版本记录见 [CHANGELOG.md](CHANGELOG.md)。

项目使用 [BSD-3-Clause](LICENSE)。浏览器包中的 TanStack Virtual 保留其 [MIT 许可证](packages/dsh-trace-viewer/THIRD_PARTY_NOTICES.md)。

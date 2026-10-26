# dsh-trace

**看清 DSH 会话里，每一步发生了什么。**

[English](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/README.md) · [npm](https://www.npmjs.com/package/@vibeinging/dsh-trace-viewer) · [使用说明](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/docs/usage.md) · [反馈问题](https://github.com/vibeinging/dsh-trace/issues)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供瀑布工作台的社区插件：在同一时间轴查看模型与工具调用，展开输入和输出，在设置中管理可选的本地 Trace 采集。

![DSH Trace 瀑布工作台：模型调用、工具调用与选中的工具结果](https://raw.githubusercontent.com/vibeinging/dsh-trace/v0.1.0/docs/assets/readme/workbench-zh.png)

*使用真实 Trace 组件和合成示例数据。图中的耗时与计数仅用于演示。*

## 安装

打开 **DSH Desktop → 插件 → 添加插件**，输入：

```text
@vibeinging/dsh-trace-viewer
```

安装并启用后，打开任意会话，选择顶部 **Trace**。不需要下载源码或自行构建。

DSH Web profile 也可以通过 CLI 安装：

```sh
dsh plugin --profile web add -w @vibeinging/dsh-trace-viewer
dsh --profile web
```

**兼容版本：**已验证 DSH SDK `0.2.1-rc.2`、Cordis `4.0.5` 和宿主的 React `18.3.1`。请保持官方 Trajectory 插件启用，其他 DSH 版本需要重新验证。如果新 Host 组件一直未就绪，请正常退出 DSH 后重新打开。通过 CLI 修改 Desktop 的 profile 前，先退出 Desktop。

## 快速定位问题

| 想看什么 | 怎么看 |
| --- | --- |
| 一轮请求的时间花在哪里 | 在统一瀑布中查看模型与工具的已记录耗时 |
| 某个工具究竟做了什么 | 点开输入、输出、错误和明确记录的父调用 |
| 一轮用了多少 token | 查看输入、输出和缓存读取；没有记录的值明确显示为未采集 |
| 哪一步失败了 | 使用搜索和失败筛选，保留父级上下文 |
| 正在运行或较长的会话 | 跟随实时更新，切换轮次，加载更早历史 |
| 输入框占用了查看空间 | 使用专注查看；草稿保留，审批与提问仍可显示 |

工作台直接读取 DSH 已有会话，额外采集关闭时也能使用。主题与中英文设置跟随宿主。

## 管理 Trace 数据

打开 **设置 → Trace 数据**。侧边栏快捷入口默认隐藏，可在这里打开。

- **额外采集默认关闭。**开启后，Host 记录之后的新事件，覆盖当前 Host 的会话，不回填旧历史。
- 模型调用、工具执行、失败与中断、历史压缩可分别选择。模型回复正文、工具参数与结果需要单独打开。
- 副本保存在当前 profile 的 `data/dsh-trace-viewer/`。默认保留 30 天，Host 运行时每 24 小时检查。
- 手动清理先预览再确认，跳过正在写入或预览后变化的记录段；只删除本插件的副本，保留 DSH 原始会话。

正文可能包含用户输入或文件内容。正文开关只影响之后的写入，不是通用脱敏规则；已经保存的内容会保留到清理时。[完整设置与字段说明 →](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/docs/usage.md)

## 更新与卸载

在原来的插件页面或同一 profile 中操作：

```sh
dsh plugin --profile web add -w @vibeinging/dsh-trace-viewer@latest
dsh plugin --profile web remove -w @vibeinging/dsh-trace-viewer
```

卸载插件不会清除已保存副本。从之前的本地开发版切换时，在同一 profile 中把 `link:` 依赖替换成 npm 包，保持同名插件只有一份启用。

## 当前范围

当前查看单个会话，暂不支持跨会话搜索、多次运行对比，以及浏览或导出已采集副本。子代理详情取决于 DSH 提供的数据。本插件不改变模型请求，也不替换宿主的遥测后端。

## 开发与贡献

```sh
git clone https://github.com/vibeinging/dsh-trace.git
cd dsh-trace
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
```

需要 Node.js `^22.19.0` 或 `>=24.0.0`，以及 pnpm `11.7.0`。[开发说明](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/docs/development.md) · [贡献](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/CONTRIBUTING.md) · [版本记录](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/CHANGELOG.md) · [问题报告](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/SECURITY.md)

本项目由社区独立维护。采用 [BSD-3-Clause](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/LICENSE)，浏览器包中的 TanStack Virtual 保留其 [MIT 声明](https://github.com/vibeinging/dsh-trace/blob/v0.1.0/packages/dsh-trace-viewer/THIRD_PARTY_NOTICES.md)。[旧 yiTrace 导出器](https://github.com/vibeinging/dsh-trace/tree/v0.1.0/legacy/yitrace-exporter) 已归档，使用本插件不需要它。

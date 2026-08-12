# @deepseek-ai/dsh-trace

[English](README.md) | 中文

`dsh-trace` 将 DeepSeek Harness 会话遥测存入本地嵌入式 yiTrace 数据库。它观察宿主 `telemetry/record` waterfall 处理后的记录，把每个 DSH 轮次投影为一条 yiTrace trace，并通过 yiTrace 的 Node-API 数据库写入 SDK 原生的开始、日志和结束事件。无需 HTTP 服务器、端口或 token。该插件需要主动启用，不会增加模型可见上下文，并独立于 DeepSeek Harness monorepo。

## 功能

- **嵌入式本地存储**：直接通过 `@yitrace/db` 写入；无需 HTTP 服务、端口或访问 token。
- **agent（智能体）的完整 trace 树**：每个 DSH 轮次记录一条根 trace，其下是模型步骤 span，每个步骤下再记录工具调用 span。
- **调试上下文**：保留模型身份、token 用量、消息和工具输入／输出、错误状态，以及轮次内的通用日志事件。
- **生命周期恢复**：标记从轮次中途开始的 trace，将未完成 span 标记为失败并关闭，在自然边界 flush，并在数据库重新打开时恢复已提交数据。
- **本地查询**：针对所配置目录提供 yiTrace trace、span、全文搜索和聚合 API。

本插件不提供查看器或内置脱敏规则。请使用兼容 yiTrace 的本地工具或 `@yitrace/db` 查询 API 检查所配置数据目录中的内容。

## 使用场景

- 重建一个 agent 轮次，查看哪个模型步骤或工具调用导致失败。
- 开发提示词或工作流时，对比 token 用量、模型输出和工具行为。
- 搜索本地历史 trace，查找重复错误消息、工具结果或会话属性。
- 不需要或不允许 HTTP 遥测服务时，将可观测性数据保留在同一台机器上。

## 前提

- Node.js `^22.19.0 || >=24.0.0` 和 pnpm `11.7.0`。
- 一个可写的 yiTrace 本地数据目录。
- 可读取私有插件仓库的 Git 凭据。
- 提供 Session Telemetry 和 invariant service 的兼容 DSH `web` 或 `headless` profile。

本包为私有包，不会发布到 npm registry。仓库中已提交的 `lib/` 运行时允许从私有 GitHub 仓库安装固定的 commit，不会针对未发布的 DSH 对等依赖执行依赖构建。DSH Profile 是 pnpm workspace 根目录，因此安装命令必须包含 `-w`。

## 快速上手

bundle 会禁用 DSH 自带的 OTLP 遥测后端，并用本地嵌入式 yiTrace 取代它。它可能存储用户和 assistant 文本、推理、工具参数与结果、会话 id 以及所配置的身份。请先确认本地保留和脱敏策略可接受，再启动该 profile。

1. 选择一个绝对本地数据目录：

```sh
export DSH_TRACE_DATA_DIR=/absolute/path/to/dsh-traces
export DSH_TRACE_TENANT_ID=1
mkdir -p "$DSH_TRACE_DATA_DIR"
```

2. 直接从私有 GitHub 仓库安装已审查的 commit：

```sh
dsh plugin --profile web add -w github:dsh-external/dsh-trace#<reviewed-commit>
```

本包的 `dsh.bundle.patch` 会禁用 `telemetry-otel`，加载 `dsh-trace`（数据目录来自 `DSH_TRACE_DATA_DIR`），并加载配套的 invariant 插件。使用同样的命令并指定 `--profile headless`，即可为该独立 profile 启用插件。

3. 启动 profile 前检查组合后的配置，然后启动 DSH：

```sh
dsh --profile web --dump-config
dsh --profile web
```

配置输出必须显示 `telemetry-otel` 已禁用，并包含 `dsh-trace` 和 `dsh-trace-invariant`。每个已完成轮次都会存入 `DSH_TRACE_DATA_DIR`；shutdown 还会关闭未完成的 span 并 flush 数据库。使用 `dsh plugin --profile web remove -w @deepseek-ai/dsh-trace` 移除 bundle。

4. DSH 释放数据目录后，使用 `@yitrace/db` 检查 trace：

```js
import { YiTraceDB } from '@yitrace/db'

const dataDir = process.env.DSH_TRACE_DATA_DIR
if (!dataDir) throw new Error('DSH_TRACE_DATA_DIR is required')

const tenantId = process.env.DSH_TRACE_TENANT_ID
const database = await YiTraceDB.open({
  dataDir,
  ...(tenantId ? { tenantId } : {}),
})

try {
  const traces = await database.traces()
  console.dir(traces, { depth: null })

  const first = traces[0]
  const traceId = first?.externalTraceId
    ?? first?.external_trace_id
    ?? first?.traceId
    ?? first?.trace_id
  if (traceId !== undefined) {
    console.dir(await database.trace(traceId), { depth: null })
  }

  console.dir(await database.search({ text: 'tool process exited' }), { depth: null })
} finally {
  await database.close()
}
```

写入和读取必须使用相同的 `tenantId`。示例 profile 写入 tenant `1`；运行查询脚本前，请设置 `DSH_TRACE_TENANT_ID=1`。

## 配置参考

| 字段 | 必填项或默认值 | 用途 |
|---|---|---|
| `database.dataDir` | 必填 | 本地 yiTrace 目录。插件加载时，相对路径从进程工作目录解析；服务部署请使用绝对路径。 |
| `database.tenantId` | 可选 | 写入时附加的 64 位无符号 tenant 作用域。查询时使用相同值。 |
| `database.maxBuffered` | `batchSize × 16` | 嵌入式 ingest 失败后保留在内存中的最大事件数；超过限制后丢弃最旧事件。 |
| `batchSize` | `256` | 每次串行嵌入式 ingest 前收集的事件数。 |
| `nodeId` | 由 yiTrace 派生 | `0..1023` 范围内的 Snowflake 节点 id。并行写入方不得共用显式值。 |
| `agentName` | Harness 产品身份 | 附加到每个 span 的 agent 名称。 |
| `shutdownTimeoutMillis` | `3000` | DSH 等待关闭的最长时间。截止时间无法取消正在执行的原生数据库调用。 |

数据目录为空、64 位无符号 tenant id 无效、节点 id 无效，或大小／截止时间不是正数，都会使插件在加载时失败。

遥测 seam 在每个 Cordis 上下文中只允许一个后端。同时加载本包与 `session-telemetry-otel` 时，会因服务重复而失败，不会重复记录。宿主级隐私开关必须禁用每一条已配置的遥测项；该插件不会绕过这项宿主策略。

## 验证与 CI

项目 `.npmrc` 选择私有 `@deepseek-ai/*` scope；pnpm 11 使用 `${NPM_TOKEN}` 认证映射，该映射来自受信任的用户级 `~/.npmrc`。请设置 `NPM_TOKEN`，然后运行 `pnpm install --ignore-scripts`。SDK 包固定为经过评审的 `0.0.1-rc.2` 版本组。不要将 DSH 源码链接或 checkout 到本仓库。`pnpm run check` 会检查仓库边界、运行源码 lint 和严格类型检查、针对真实嵌入式数据库和真实 YAML Loader profile 执行 7 个测试、构建生产入口、运行 `publint` 且不创建 tarball，并用纯 Node 导入构建后的入口。CI 会将 `NPM_TOKEN` secret 映射到 setup-node 的受信任用户配置。

## Trace 映射

| DSH 来源 | yiTrace 投影 | 重要字段 |
|---|---|---|
| `turn/start` … `turn/end` | 一个根 `dsh.turn` span 和一条 yiTrace trace | DSH 会话 id、轮次编号、结束原因、状态 |
| `step/start` … `step/end` | 子 `dsh.step` span | 提供方、模型、token 用量、最新系统提示词、该后端实例观察到的已脱敏消息历史、assistant 输出 |
| `tool/call` … `tool/result` | 子 `tool.<name>` span | 调用 id、工具名称、参数、结果、错误状态 |
| 已打开轮次内的其他账本事件 | 已打开步骤或轮次上的 yiTrace 日志事件 | 事件类型、来源 seq、已脱敏 body |
| `agent-error` | 错误日志，并将已打开的步骤／轮次标记为失败 | 规范化的错误名称和 body |
| `shutdown` | 将仍处于打开状态的所有 span 标记为失败并关闭，再 flush 并关闭数据库 | 不创建合成的独立 span |

适配器保留来源事件的时间戳，并根据其毫秒时间计算 span 持续时长。确定性事件 id、批处理和协议编码由 `@yitrace/trace-sdk` 负责；嵌入式预写式日志、恢复、持久读取模型和查询由 `@yitrace/db` 负责。DSH 的字符串会话 id 通过确定性的 FNV-1a 64 位哈希映射为 yiTrace 的数值 `session_id`；原始 id 仍保留在 `dsh.session.id` span 属性中。

## 数据与可靠性边界

每条记录都先经过 seam 的 `telemetry/record` waterfall（瀑布式事件），随后该后端才会读取。用户与 assistant 文本、推理（reasoning）、工具参数／结果、通用事件 body、会话 id，以及配置的 agent（智能体）／tenant 身份都可能存入 `database.dataDir`。seam 不附带任何脱敏规则，因此不得保留原始敏感值的部署必须先挂载自己的规则，再启用 yiTrace。数据始终留在所配置的目录中；该插件不会打开网络连接。

`emit()` 会创建 yiTrace SDK 事件并将其加入内存队列。轮次／会话 flush 提示会串行执行：每次排空 `BatchExporter`，重试有界的嵌入式写入缓冲区，再 flush 数据库。资源释放会关闭尚未完成的 span，排空同一条队列，flush yiTrace 的持久状态，并在配置的截止时间内关闭数据库。进程突然崩溃仍可能丢失尚未到达嵌入式数据库的事件；已经提交的 yiTrace 数据会在重新打开该目录时恢复。

## 模型体验

无，因为该插件只观察日志写入后的会话记录，绝不更改模型请求、工具 schema 或响应。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

- **私有 Git 分发**：本包不会发布到 registry。安装需要经授权的 GitHub 访问权限、pnpm `11.7.0`、已审查的 commit 和兼容的 DSH profile。
- **数据库是原生依赖**：`@yitrace/db` 目前为 macOS arm64／x64、glibc Linux arm64／x64 和 Windows x64 提供预构建包。本包当前的 lockfile 不覆盖其他操作系统、CPU 目标和 musl Linux。
- **只有一种本地存储模式**：该插件刻意不提供 HTTP 后端或跨机器传输。并发运行的 DSH 进程应使用各自独立的可写数据目录，除非 yiTrace 数据库已为该部署明确记录共享写入方配置。
- **遥测重载会分隔状态**：资源释放会将已打开的 span 标记为失败并关闭，同时重置适配器的消息累积器。后续带位置的事件（`turn`/`step`）会打开一个标记为 `dsh.recovered_segment` 的 span；其输入只包含该后端实例加载后观察到的已脱敏消息事件。单独一条 `user/message` 的 payload 中没有位置信息，无法自行重建缺失的步骤。
- **哈希后的会话身份**：yiTrace 的 TypeScript SDK 接受数值 `session_id`，而 DSH 持有不透明字符串 id。FNV-1a 使映射保持稳定，但理论上仍存在 64 位碰撞风险；未来 SDK 若提供字符串 id 接口，就能消除这一折中。

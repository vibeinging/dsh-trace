# @deepseek-ai/dsh-trace

[English](README.md) | 中文

`dsh-trace` 将 DeepSeek Harness 会话遥测存入本地嵌入式 yiTrace 数据库。它观察宿主 `telemetry/record` waterfall 处理后的记录，把每个 DSH 轮次投影为一条 yiTrace trace，并通过 yiTrace 的 Node-API 数据库写入 SDK 原生的开始、日志和结束事件。无需 HTTP 服务器、端口或 token。该插件需要主动启用，不会增加模型可见上下文，并独立于 DeepSeek Harness monorepo。

## 存储内容

- 每个 DSH 轮次对应一条根 trace。
- 模型步骤和工具调用对应子 span，其中包含模型身份、token 用量、工具输入／输出和错误状态。
- 遥测从活动轮次或步骤中途开始时，会添加恢复标记。
- 持久化本地数据，可通过 `@yitrace/db` 重新打开，以执行 trace、span、搜索和聚合查询。

本插件不提供查看器或内置脱敏规则。请使用兼容 yiTrace 的本地工具或 `@yitrace/db` 查询 API 检查所配置数据目录中的内容。

## 前提与状态

- Node.js `^22.19.0 || >=24.0.0` 和 pnpm `11.7.0`。
- 一个可写的 yiTrace 本地数据目录。
- 在 DSH 包尚未发布期间，需要拥有私有 `dsh2026/test-vibeinging` 仓库的读取权限。

npm 包已经能够构建并通过包检查，但由于其 `@deepseek-ai/dsh-*` 对等依赖尚未发布，目前还不能从公共 registry 安装。源码开发时，请将 Harness 仓库和插件仓库放在同一目录下：

```sh
git clone https://github.com/dsh2026/test-vibeinging.git
git clone https://github.com/dsh-external/dsh-trace.git

cd test-vibeinging
pnpm install --frozen-lockfile
pnpm run build

cd ../dsh-trace
pnpm install --frozen-lockfile
pnpm run check
```

## 运行配置

以下示例假设消费方 profile 的 resolver manifest 中已经存在 `@deepseek-ai/dsh-trace`。如果敏感值不得写入磁盘，请先挂载宿主的遥测脱敏策略，再启用该插件。

原始 Cordis 组合配置：

```yaml
- id: dsh-trace
  name: '@deepseek-ai/dsh-trace'
  config:
    database:
      dataDir: !!js process.env.DSH_TRACE_DATA_DIR
      tenantId: 1
      maxBuffered: 4096
    batchSize: 256
    nodeId: 7
    agentName: deepseek-harness
    shutdownTimeoutMillis: 3000
```

消费方 profile 会添加该插件，并显式替换当前的遥测选择：

```yaml
- id: telemetry-otel
  disabled: true

- id: dsh-trace
  disabled: false
  config:
    database:
      dataDir: !!js process.env.DSH_TRACE_DATA_DIR
      tenantId: !!js process.env.DSH_TRACE_TENANT_ID
```

`database.dataDir` 是必填项。插件加载时，相对路径按进程工作目录解析；服务部署使用绝对路径更安全。`batchSize` 默认为 `256`；`database.maxBuffered` 默认为 16 个批次。`nodeId` 可选，且必须位于 `0..1023`；省略时，yiTrace SDK 会根据进程派生节点 id。并行写入方不得共用显式指定的节点 id。`agentName` 默认为 Harness 产品身份。`shutdownTimeoutMillis` 默认为 `3000`，只限制 DSH 等待关闭的时长；它无法取消已经在执行的原生数据库调用。数据目录为空、64 位无符号 tenant id 无效、节点 id 无效，或大小／截止时间不是正数，都会使插件在加载时失败。

遥测 seam 在每个 Cordis 上下文中只允许一个后端。同时加载本包与 `session-telemetry-otel` 时，会因服务重复而失败，不会重复记录。宿主级隐私开关必须禁用每一条已配置的遥测项；该插件不会绕过这项宿主策略。

## 验证与 CI

`pnpm-workspace.yaml` 从相邻的 `../test-vibeinging` 检出链接开发依赖。包元数据保留普通的版本化对等依赖（peer dependency）和开发依赖；本地路径不会进入打包产物。

`pnpm run check` 会运行源码 lint、严格类型检查、针对真实嵌入式数据库和真实 YAML Loader profile 的 7 个测试、生产构建、`publint` 和纯 Node 导入 smoke。测试会关闭并重新打开 yiTrace 数据，覆盖持久的轮次／步骤／工具映射、flush 与 shutdown、错误恢复、会话隔离、配置校验、失败工具恢复和 profile 级脱敏。CI 通过检出私有 `dsh2026/test-vibeinging` 仓库复现 sibling 布局，因此需要名为 `DSH_REPOSITORY_TOKEN` 的仓库 secret。

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

- **DSH 对等依赖尚未公开**：本包已可打包，但在 `@deepseek-ai/dsh-*` 对等依赖发布之前，仍无法从公共 registry 干净安装。本地开发和 CI 暂时使用 sibling 检出。
- **数据库是原生依赖**：`@yitrace/db` 目前为 macOS arm64／x64、glibc Linux arm64／x64 和 Windows x64 提供预构建包。本包当前的 lockfile 不覆盖其他操作系统、CPU 目标和 musl Linux。
- **只有一种本地存储模式**：该插件刻意不提供 HTTP 后端或跨机器传输。并发运行的 DSH 进程应使用各自独立的可写数据目录，除非 yiTrace 数据库已为该部署明确记录共享写入方配置。
- **遥测重载会分隔状态**：资源释放会将已打开的 span 标记为失败并关闭，同时重置适配器的消息累积器。后续带位置的事件（`turn`/`step`）会打开一个标记为 `dsh.recovered_segment` 的 span；其输入只包含该后端实例加载后观察到的已脱敏消息事件。单独一条 `user/message` 的 payload 中没有位置信息，无法自行重建缺失的步骤。
- **哈希后的会话身份**：yiTrace 的 TypeScript SDK 接受数值 `session_id`，而 DSH 持有不透明字符串 id。FNV-1a 使映射保持稳定，但理论上仍存在 64 位碰撞风险；未来 SDK 若提供字符串 id 接口，就能消除这一折中。

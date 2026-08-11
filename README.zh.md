# @deepseek-ai/dsh-trace

[English](README.md) | 中文

`dsh-trace` 通过 HTTP 将 DeepSeek Harness 会话遥测导出到 yiTrace。它观察宿主 `telemetry/record` waterfall 处理后的记录，把每个 DSH 轮次投影为一条 yiTrace trace，并将 SDK 原生的开始、日志和结束事件发送到配置的 `/v1/ingest` 端点。该插件需要主动启用，不会增加模型可见上下文，并独立于 DeepSeek Harness monorepo。

## 导出内容

- 每个 DSH 轮次对应一条根 trace。
- 模型步骤和工具调用对应子 span，其中包含模型身份、token 用量、工具输入／输出和错误状态。
- 遥测从活动轮次或步骤中途开始时，会添加恢复标记。
- 通过官方 `@yitrace/trace-sdk` HTTP 流水线串行执行 flush 和 shutdown。

本插件不提供查看器、本地 trace 数据库或内置脱敏规则。请使用 yiTrace 服务存储和查看数据；如果数据将离开进程信任边界，必须先挂载部署自己的脱敏策略。

## 前提与状态

- Node.js `^22.19.0 || >=24.0.0` 和 pnpm `11.7.0`。
- 在 DSH 包尚未发布期间，需要拥有私有 `dsh2026/test-vibeinging` 仓库的读取权限。
- 一个可访问的 yiTrace HTTP ingest 端点，以及该部署要求的 token 和 tenant id。

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

以下示例假设消费方 profile 的 resolver manifest 中已经存在 `@deepseek-ai/dsh-trace`。在宿主遥测脱敏策略挂载完成之前，不要启用 exporter。

原始 Cordis 组合配置：

```yaml
- id: dsh-trace
  name: '@deepseek-ai/dsh-trace'
  config:
    exporter:
      url: http://127.0.0.1:7878/v1/ingest
      token: !!js process.env.DSH_TRACE_TOKEN
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
    exporter:
      url: !!js process.env.DSH_TRACE_URL
      token: !!js process.env.DSH_TRACE_TOKEN
      tenantId: !!js process.env.DSH_TRACE_TENANT_ID
```

`exporter.url` 是必填项，且必须是 HTTP(S) URL。`batchSize` 默认为 `256`；`exporter.maxBuffered` 默认为 16 个批次。`nodeId` 可选，且必须位于 `0..1023`；省略时，yiTrace SDK 会根据进程派生节点 id。并行进程不得共用显式指定的节点 id。`agentName` 默认为 harness 产品身份。`shutdownTimeoutMillis` 默认为 `3000`，只限制 DSH 等待 SDK 关闭的时长；它无法取消已经进入 SDK 的 HTTP 请求。token 为空、64 位无符号 tenant id 无效、节点 id 无效，或大小／截止时间不是正数，都会使插件在加载时失败。

遥测 seam 在每个 Cordis 上下文中只允许一个后端。同时加载本包与 `session-telemetry-otel` 时，会因服务重复而失败，不会重复导出。宿主级隐私开关必须禁用每一条已配置的遥测项；该插件不会绕过这项宿主策略。

## 验证与 CI

`pnpm-workspace.yaml` 从相邻的 `../test-vibeinging` 检出链接开发依赖。包元数据保留普通的版本化对等依赖（peer dependency）和开发依赖；本地路径不会进入打包产物。

`pnpm run check` 会运行源码 lint、严格类型检查、覆盖 HTTP／会话流水线与真实 YAML Loader profile 的 7 个测试、生产构建、`publint` 和纯 Node 导入 smoke。除正常映射、重试、错误恢复、配置校验和 profile 级脱敏外，测试还覆盖会话隔离与失败工具恢复。CI 通过检出私有 `dsh2026/test-vibeinging` 仓库复现 sibling 布局，因此需要名为 `DSH_REPOSITORY_TOKEN` 的仓库 secret。

## Trace 映射

| DSH 来源 | yiTrace 投影 | 重要字段 |
|---|---|---|
| `turn/start` … `turn/end` | 一个根 `dsh.turn` span 和一条 yiTrace trace | DSH 会话 id、轮次编号、结束原因、状态 |
| `step/start` … `step/end` | 子 `dsh.step` span | 提供方、模型、token 用量、最新系统提示词、该后端实例观察到的已脱敏消息历史、assistant 输出 |
| `tool/call` … `tool/result` | 子 `tool.<name>` span | 调用 id、工具名称、参数、结果、错误状态 |
| 已打开轮次内的其他账本事件 | 已打开步骤或轮次上的 yiTrace 日志事件 | 事件类型、来源 seq、已脱敏 body |
| `agent-error` | 错误日志，并将已打开的步骤／轮次标记为失败 | 规范化的错误名称和 body |
| `shutdown` | 将仍处于打开状态的所有 span 标记为失败并关闭，再排空 SDK | 不创建合成的独立 span |

适配器保留来源事件的时间戳，并根据其毫秒时间计算 span 持续时长。确定性 `event_id`、批处理、HTTP 标头、重试缓冲和协议编码由 yiTrace SDK 负责。DSH 的字符串会话 id 通过确定性的 FNV-1a 64 位哈希映射为 yiTrace 的数值 `session_id`；原始 id 仍保留在 `dsh.session.id` span 属性中。

## 数据与可靠性边界

每条记录都先经过 seam 的 `telemetry/record` waterfall（瀑布式事件），随后该后端才会读取。用户与 assistant 文本、推理（reasoning）、工具参数／结果、通用事件 body、会话 id，以及配置的 agent（智能体）／tenant 身份都可能离开进程。seam 不附带任何脱敏规则，因此向信任边界之外导出的部署必须先挂载自己的规则，再启用 yiTrace。

`emit()` 只创建 yiTrace SDK 事件并将其加入内存队列。轮次／会话 flush 提示会串行执行：每次先排空 `BatchExporter`，再重试 `HttpExporter` 的失败缓冲区。资源释放会关闭尚未完成的 span，并在配置的截止时间约束下，将 `BatchExporter.close()` 排在同一队列的前述工作之后。yiTrace SDK 会限制保留的失败事件数量；但进程突然崩溃仍可能丢失内存中的事件，本包不会添加第二条队列或持久 outbox。

## 模型体验

无，因为该插件只观察日志写入后的会话记录，绝不更改模型请求、工具 schema 或响应。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

- **DSH 对等依赖尚未公开**：本包已可打包，但在 `@deepseek-ai/dsh-*` 对等依赖发布之前，仍无法从公共 registry 干净安装。本地开发和 CI 暂时使用 sibling 检出。
- **仅通过 HTTP 发送**：本包刻意避开 `@yitrace/db` 及其原生运行时。只有当 DSH 部署需要在进程内查询 trace，而非使用 yiTrace 服务时，才会考虑嵌入式本地数据库后端。
- **遥测重载会分隔状态**：资源释放会将已打开的 span 标记为失败并关闭，同时重置适配器的消息累积器。后续带位置的事件（`turn`/`step`）会打开一个标记为 `dsh.recovered_segment` 的 span；其输入只包含该后端实例加载后观察到的已脱敏消息事件。单独一条 `user/message` 的 payload 中没有位置信息，无法自行重建缺失的步骤。
- **哈希后的会话身份**：yiTrace 的 TypeScript SDK 接受数值 `session_id`，而 DSH 持有不透明字符串 id。FNV-1a 使映射保持稳定，但理论上仍存在 64 位碰撞风险；未来 SDK 若提供字符串 id 接口，就能消除这一折中。

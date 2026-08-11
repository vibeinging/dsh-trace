# @deepseek-ai/dsh-trace

English | [中文](README.zh.md)

`dsh-trace` exports DeepSeek Harness session telemetry to yiTrace over HTTP. It observes records after the host's `telemetry/record` waterfall, projects each DSH turn into one yiTrace trace, and sends SDK-native start, log, and end events to a configured `/v1/ingest` endpoint. The plugin is opt-in, adds no model-visible context, and lives outside the DeepSeek Harness monorepo.

## What it exports

- One root trace for each DSH turn.
- Child spans for model steps and tool calls, including model identity, token usage, tool input/output, and error state.
- Recovery markers when telemetry begins in the middle of an active turn or step.
- Serialized flush and shutdown behavior through the official `@yitrace/trace-sdk` HTTP pipeline.

The plugin does not provide a viewer, a local trace database, or built-in redaction rules. Use a yiTrace server for storage and inspection, and mount the deployment's redaction policy before enabling export outside the process trust boundary.

## Prerequisites and status

- Node.js `^22.19.0 || >=24.0.0` and pnpm `11.7.0`.
- Read access to the private `dsh2026/test-vibeinging` repository while DSH packages remain unpublished.
- A reachable yiTrace HTTP ingest endpoint and, when required by that deployment, its token and tenant id.

The npm package is buildable and passes package checks, but it is not yet installable from the public registry because its `@deepseek-ai/dsh-*` peer packages are unpublished. For source development, keep the Harness and plugin repositories as siblings:

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

## Runtime configuration

The examples below assume `@deepseek-ai/dsh-trace` is already present in the consuming profile's resolver manifest. Do not enable the exporter until the host's telemetry redaction policy is mounted.

Raw Cordis composition:

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

A consuming profile adds the plugin and replaces its current telemetry choice explicitly:

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

`exporter.url` is required and must be an HTTP(S) URL. `batchSize` defaults to `256`; `exporter.maxBuffered` defaults to sixteen batches. `nodeId` is optional and must be in `0..1023`; omit it to let the yiTrace SDK derive the node id from the process. Parallel processes must not share an explicit node id. `agentName` defaults to the harness product identity. `shutdownTimeoutMillis` defaults to `3000` and bounds only how long DSH awaits SDK shutdown; it cannot cancel an HTTP request already inside the SDK. An empty token, invalid unsigned 64-bit tenant id, invalid node id, or non-positive size/deadline fails at plugin load.

The telemetry seam admits one backend per Cordis context. Loading this package together with `session-telemetry-otel` fails as a duplicate service instead of exporting twice. A host-level privacy switch must disable every configured telemetry row; the plugin does not bypass that host policy.

## Verification and CI

`pnpm-workspace.yaml` links development dependencies from the sibling `../test-vibeinging` checkout. Package metadata keeps ordinary versioned peer and development dependencies; local paths stay outside the packed artifact.

`pnpm run check` runs source linting, strict type checking, seven tests across the HTTP/session pipeline and a real YAML Loader profile, the production build, `publint`, and plain-Node import smokes. The tests cover session isolation and failed tool recovery in addition to normal mapping, retry, error recovery, configuration validation, and profile-level redaction. CI reproduces the sibling layout by checking out the private `dsh2026/test-vibeinging` repository and therefore requires a repository secret named `DSH_REPOSITORY_TOKEN`.

## Trace mapping

| DSH source | yiTrace projection | Important fields |
|---|---|---|
| `turn/start` … `turn/end` | One root `dsh.turn` span and one yiTrace trace | DSH session id, turn number, end reason, status |
| `step/start` … `step/end` | Child `dsh.step` span | provider, model, token usage, latest system prompt, redacted message history observed by this backend instance, assistant output |
| `tool/call` … `tool/result` | Child `tool.<name>` span | call id, tool name, arguments, result, error status |
| Other ledger events inside an open turn | yiTrace log event on the open step or turn | event type, source seq, redacted body |
| `agent-error` | Error log plus failed open step/turn | normalized error name and body |
| `shutdown` | Close any still-open spans as failed, then drain the SDK | no synthetic standalone span |

The adapter preserves source event timestamps and derives span duration from their millisecond times. The yiTrace SDK owns deterministic `event_id`, batching, HTTP headers, retry buffering, and wire encoding. DSH string session ids are mapped to yiTrace's numeric `session_id` through deterministic FNV-1a 64-bit hashing; the original id remains in `dsh.session.id` span attributes.

## Data and reliability boundary

Every record passes the seam's `telemetry/record` waterfall before this backend reads it. User and assistant text, reasoning, tool arguments/results, generic event bodies, the session id, and configured agent/tenant identity may leave the process. The seam ships no redaction rules, so a deployment exporting across a trust boundary mounts its own rule before enabling yiTrace.

`emit()` only creates yiTrace SDK events and enqueues them in memory. Turn/session flush hints are serialized: each drains `BatchExporter`, then retries the `HttpExporter` failure buffer. Disposal closes unfinished spans and queues `BatchExporter.close()` behind the same work and the configured deadline. The yiTrace SDK bounds retained failed events, but an abrupt process crash can lose in-memory events; this package adds no second queue or durable outbox.

## Model Experience

None, as the plugin observes post-log session records and never changes a model request, tool schema, or response.

#### KV Cache effect

None; this package neither assembles nor sends provider requests.

## Known Limitations and Deferred Work

- **DSH peers are not public yet** — the package is ready to pack, but a clean public-registry install remains blocked until the `@deepseek-ai/dsh-*` peer packages are published. Local development and CI use the sibling checkout instead.
- **HTTP emission only** — this package deliberately avoids `@yitrace/db` and its native runtime. An embedded local database backend is deferred until a DSH deployment requires in-process trace queries rather than a yiTrace server.
- **State is segmented across telemetry reloads** — disposal closes open spans as failed and resets the adapter's message accumulator. A later positioned event (`turn`/`step`) opens a span marked `dsh.recovered_segment`; its input includes only redacted message events observed after that backend instance loaded. A lone `user/message` has no position in its payload and cannot reconstruct a missing step by itself.
- **Hashed session identity** — yiTrace's TypeScript SDK accepts a numeric `session_id`, while DSH owns opaque string ids. FNV-1a makes the mapping stable but leaves a theoretical 64-bit collision risk; a future SDK string-id surface would remove this compromise.

# @deepseek-ai/dsh-trace

English | [中文](README.zh.md)

`dsh-trace` stores DeepSeek Harness session telemetry in a local embedded yiTrace database. It observes records after the host's `telemetry/record` waterfall, projects each DSH turn into one yiTrace trace, and writes SDK-native start, log, and end events through yiTrace's Node-API database. No HTTP server, port, or token is required. The plugin is opt-in, adds no model-visible context, and lives outside the DeepSeek Harness monorepo.

## What it stores

- One root trace for each DSH turn.
- Child spans for model steps and tool calls, including model identity, token usage, tool input/output, and error state.
- Recovery markers when telemetry begins in the middle of an active turn or step.
- Durable local data that can be reopened through `@yitrace/db` for trace, span, search, and aggregate queries.

The plugin does not provide a viewer or built-in redaction rules. Use yiTrace-compatible local tools or the `@yitrace/db` query API to inspect the configured data directory.

## Prerequisites and status

- Node.js `^22.19.0 || >=24.0.0` and pnpm `11.7.0`.
- A writable local directory for yiTrace data.
- Read access to the private `dsh2026/test-vibeinging` repository while DSH packages remain unpublished.

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

The examples below assume `@deepseek-ai/dsh-trace` is already present in the consuming profile's resolver manifest. Mount the host's telemetry redaction policy before enabling the plugin if sensitive values must not be written to disk.

Raw Cordis composition:

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

A consuming profile adds the plugin and replaces its current telemetry choice explicitly:

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

`database.dataDir` is required. Relative paths resolve from the process working directory when the plugin loads; an absolute path is safer for service deployments. `batchSize` defaults to `256`; `database.maxBuffered` defaults to sixteen batches. `nodeId` is optional and must be in `0..1023`; omit it to let the yiTrace SDK derive the node id from the process. Parallel writers must not share an explicit node id. `agentName` defaults to the Harness product identity. `shutdownTimeoutMillis` defaults to `3000` and bounds only how long DSH awaits shutdown; it cannot cancel a native database call already in progress. An empty data directory, invalid unsigned 64-bit tenant id, invalid node id, or non-positive size/deadline fails at plugin load.

The telemetry seam admits one backend per Cordis context. Loading this package together with `session-telemetry-otel` fails as a duplicate service instead of recording twice. A host-level privacy switch must disable every configured telemetry row; the plugin does not bypass that host policy.

## Verification and CI

`pnpm-workspace.yaml` links development dependencies from the sibling `../test-vibeinging` checkout. Package metadata keeps ordinary versioned peer and development dependencies; local paths stay outside the packed artifact.

`pnpm run check` runs source linting, strict type checking, seven tests against a real embedded database and a real YAML Loader profile, the production build, `publint`, and plain-Node import smokes. The tests close and reopen yiTrace data to cover durable turn/step/tool mapping, flush and shutdown, error recovery, session isolation, configuration validation, failed tool recovery, and profile-level redaction. CI reproduces the sibling layout by checking out the private `dsh2026/test-vibeinging` repository and therefore requires a repository secret named `DSH_REPOSITORY_TOKEN`.

## Trace mapping

| DSH source | yiTrace projection | Important fields |
|---|---|---|
| `turn/start` … `turn/end` | One root `dsh.turn` span and one yiTrace trace | DSH session id, turn number, end reason, status |
| `step/start` … `step/end` | Child `dsh.step` span | provider, model, token usage, latest system prompt, redacted message history observed by this backend instance, assistant output |
| `tool/call` … `tool/result` | Child `tool.<name>` span | call id, tool name, arguments, result, error status |
| Other ledger events inside an open turn | yiTrace log event on the open step or turn | event type, source seq, redacted body |
| `agent-error` | Error log plus failed open step/turn | normalized error name and body |
| `shutdown` | Close any still-open spans as failed, then flush and close the database | no synthetic standalone span |

The adapter preserves source event timestamps and derives span duration from their millisecond times. `@yitrace/trace-sdk` owns deterministic event ids, batching, and wire encoding; `@yitrace/db` owns the embedded write-ahead log, recovery, durable read models, and queries. DSH string session ids are mapped to yiTrace's numeric `session_id` through deterministic FNV-1a 64-bit hashing; the original id remains in `dsh.session.id` span attributes.

## Data and reliability boundary

Every record passes the seam's `telemetry/record` waterfall before this backend reads it. User and assistant text, reasoning, tool arguments/results, generic event bodies, the session id, and configured agent/tenant identity may be stored in `database.dataDir`. The seam ships no redaction rules, so a deployment that must not retain raw sensitive values mounts its own rule before enabling yiTrace. The data remains local to the configured directory; the plugin does not open a network connection.

`emit()` creates yiTrace SDK events and enqueues them in memory. Turn/session flush hints are serialized: each drains `BatchExporter`, retries the bounded embedded-write buffer, and flushes the database. Disposal closes unfinished spans, drains the same queue, flushes yiTrace's durable state, and closes the database within the configured deadline. An abrupt process crash can still lose events that had not reached the embedded database, while committed yiTrace data is recovered when the directory is reopened.

## Model Experience

None, as the plugin observes post-log session records and never changes a model request, tool schema, or response.

#### KV Cache effect

None; this package neither assembles nor sends provider requests.

## Known Limitations and Deferred Work

- **DSH peers are not public yet** — the package is ready to pack, but a clean public-registry install remains blocked until the `@deepseek-ai/dsh-*` peer packages are published. Local development and CI use the sibling checkout instead.
- **The database is a native dependency** — `@yitrace/db` currently supplies prebuilt packages for macOS arm64/x64, glibc Linux arm64/x64, and Windows x64. Other operating systems, CPU targets, and musl Linux are not covered by this package's current lockfile.
- **One local storage mode** — the plugin deliberately has no HTTP backend or cross-machine transport. Give concurrently running DSH processes separate writable data directories unless the yiTrace database documents a shared-writer setup for that deployment.
- **State is segmented across telemetry reloads** — disposal closes open spans as failed and resets the adapter's message accumulator. A later positioned event (`turn`/`step`) opens a span marked `dsh.recovered_segment`; its input includes only redacted message events observed after that backend instance loaded. A lone `user/message` has no position in its payload and cannot reconstruct a missing step by itself.
- **Hashed session identity** — yiTrace's TypeScript SDK accepts a numeric `session_id`, while DSH owns opaque string ids. FNV-1a makes the mapping stable but leaves a theoretical 64-bit collision risk; a future SDK string-id surface would remove this compromise.

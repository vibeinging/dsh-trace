# @deepseek-ai/dsh-trace

English | [中文](README.zh.md)

`dsh-trace` stores DeepSeek Harness session telemetry in a local embedded yiTrace database. It observes records after the host's `telemetry/record` waterfall, projects each DSH turn into one yiTrace trace, and writes SDK-native start, log, and end events through yiTrace's Node-API database. No HTTP server, port, or token is required. The plugin is opt-in, adds no model-visible context, and lives outside the DeepSeek Harness monorepo.

## Features

- **Embedded local storage** — writes directly through `@yitrace/db`; no HTTP service, port, or access token.
- **Complete agent trace tree** — records one root trace per DSH turn, model-step spans below it, and tool-call spans below each step.
- **Debugging context** — keeps model identity, token usage, message and tool input/output, error state, and generic in-turn log events.
- **Lifecycle recovery** — marks traces that begin mid-turn, closes unfinished spans as failed, flushes on natural boundaries, and recovers committed data when the database reopens.
- **Local queries** — supports yiTrace trace, span, full-text search, and aggregate APIs against the configured directory.

The plugin does not provide a viewer or built-in redaction rules. Use yiTrace-compatible local tools or the `@yitrace/db` query API to inspect the configured data directory.

## Use cases

- Reconstruct an agent turn to see which model step or tool call caused a failure.
- Compare token use, model output, and tool behavior while developing prompts or workflows.
- Search historical local traces for repeated error messages, tool results, or session attributes.
- Keep observability data on the same machine when an HTTP telemetry service is unnecessary or not allowed.

## Prerequisites

- Node.js `^22.19.0 || >=24.0.0` and pnpm `11.7.0`.
- A writable local directory for yiTrace data.
- Git credentials with read access to the private plugin repository.
- A compatible DSH `web` or `headless` profile that provides Session Telemetry and the invariant service.

The package is private and is not published to an npm registry. Its checked-in `lib/` runtime allows a pinned private GitHub commit to install without executing a dependency build against private DSH SDK packages. The install command must include `-w` because a DSH profile is a pnpm workspace root.

## Quick start

The bundle disables the shipped OTLP telemetry backend and replaces it with local embedded yiTrace. It can store user and assistant text, reasoning, tool arguments and results, session ids, and configured identities. Do not boot the profile until its local retention and redaction policy is acceptable.

1. Choose an absolute local data directory:

```sh
export DSH_TRACE_DATA_DIR=/absolute/path/to/dsh-traces
export DSH_TRACE_TENANT_ID=1
mkdir -p "$DSH_TRACE_DATA_DIR"
```

2. Install a reviewed commit directly from the private GitHub repository:

```sh
dsh plugin --profile web add -w github:dsh-external/dsh-trace#<reviewed-commit>
```

The package's `dsh.bundle.patch` disables `telemetry-otel`, loads `dsh-trace` from `DSH_TRACE_DATA_DIR`, and loads its invariant companion. Use the same command with `--profile headless` to enable that independent profile.

3. Inspect the composed profile before booting it, then start DSH:

```sh
dsh --profile web --dump-config
dsh --profile web
```

The dump must show `telemetry-otel` as disabled and include `dsh-trace` plus `dsh-trace-invariant`. Each completed turn is stored under `DSH_TRACE_DATA_DIR`; shutdown also closes unfinished spans and flushes the database. Remove the bundle with `dsh plugin --profile web remove -w @deepseek-ai/dsh-trace`.

4. After DSH releases the data directory, inspect traces with `@yitrace/db`:

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

Use the same `tenantId` for writing and reading. The example profile writes tenant `1`; set `DSH_TRACE_TENANT_ID=1` before running the query script.

## Configuration reference

| Field | Required or default | Purpose |
|---|---|---|
| `database.dataDir` | Required | Local yiTrace directory. Relative paths resolve from the process working directory at plugin load; use an absolute path for service deployments. |
| `database.tenantId` | Optional | Unsigned 64-bit tenant scope attached to writes. Use the same value when querying. |
| `database.maxBuffered` | `batchSize × 16` | Maximum events retained in memory after embedded ingest failures; the oldest events are dropped after the limit. |
| `batchSize` | `256` | Events collected before one serialized embedded ingest. |
| `nodeId` | Derived by yiTrace | Snowflake node id in `0..1023`. Parallel writers must not share an explicit value. |
| `agentName` | Harness product identity | Agent name attached to every span. |
| `shutdownTimeoutMillis` | `3000` | Maximum time DSH awaits shutdown. The deadline cannot cancel a native database call already in progress. |

An empty data directory, invalid unsigned 64-bit tenant id, invalid node id, or non-positive size/deadline fails at plugin load.

The telemetry seam admits one backend per Cordis context. Loading this package together with `session-telemetry-otel` fails as a duplicate service instead of recording twice. A host-level privacy switch must disable every configured telemetry row; the plugin does not bypass that host policy.

## Verification and CI

The project `.npmrc` selects the private `@deepseek-ai/*` scope; pnpm 11 reads its `${NPM_TOKEN}` authentication mapping from the trusted user-level `~/.npmrc`. Set `NPM_TOKEN` and run `pnpm install --ignore-scripts`. The SDK packages are pinned to the reviewed `0.0.1-rc.2` set. Do not link or check out DSH source into this repository. `pnpm run check` enforces the repository boundary, runs source linting and strict type checking, executes seven tests against a real embedded database and a real YAML Loader profile, builds the production entries, runs `publint` without creating a tarball, and imports the built entries with plain Node. CI maps the `NPM_TOKEN` secret into setup-node's trusted user configuration.

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

- **Private Git distribution** — the package is not published to a registry. Installation requires authorized GitHub access, pnpm `11.7.0`, a reviewed commit, and a compatible DSH profile.
- **The database is a native dependency** — `@yitrace/db` currently supplies prebuilt packages for macOS arm64/x64, glibc Linux arm64/x64, and Windows x64. Other operating systems, CPU targets, and musl Linux are not covered by this package's current lockfile.
- **One local storage mode** — the plugin deliberately has no HTTP backend or cross-machine transport. Give concurrently running DSH processes separate writable data directories unless the yiTrace database documents a shared-writer setup for that deployment.
- **State is segmented across telemetry reloads** — disposal closes open spans as failed and resets the adapter's message accumulator. A later positioned event (`turn`/`step`) opens a span marked `dsh.recovered_segment`; its input includes only redacted message events observed after that backend instance loaded. A lone `user/message` has no position in its payload and cannot reconstruct a missing step by itself.
- **Hashed session identity** — yiTrace's TypeScript SDK accepts a numeric `session_id`, while DSH owns opaque string ids. FNV-1a makes the mapping stable but leaves a theoretical 64-bit collision risk; a future SDK string-id surface would remove this compromise.

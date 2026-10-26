# dsh-trace

English | [中文](README.zh.md)

A community plugin for [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness): inspect real DSH sessions in a waterfall workbench, then manage optional local Trace copies from **Settings → Trace data**.

This is an independent project. It uses the published DSH SDK and does not require a DSH source checkout, yiTrace server, database, or access token. It is not an official DeepSeek product.

## Features

- Model and tool calls on one timeline, with recorded parent links, duration, token usage and cache reads.
- Search, failure filters, turn selection, long-history pagination and input/output details.
- Live updates from the active DSH session; missing timing or usage stays explicitly unavailable.
- A focus view that preserves the composer draft and still allows pending approvals and questions.
- Optional Host-side recording of future events, with capture scope, content switches, retention and cleanup preview.
- DSH themes and Chinese/English locale support. Trace settings live in Settings; the sidebar shortcut is optional and off by default.

The waterfall reads DSH's existing session data. Optional recording creates separate files and is **off by default**. Cleanup only affects this plugin's own copies.

## Compatibility

| Component | Tested version |
| --- | --- |
| DSH SDK | `0.2.1-rc.2` |
| Cordis | `4.0.5` |
| React / React DOM | `18.3.1`, provided by the host |
| Node.js | `^22.19.0` or `>=24.0.0` |
| pnpm | `11.7.0` |

Keep DSH's official Trajectory provider enabled. Other DSH versions require verification because the RC interfaces may change.

## Build and install

The source is open; the npm package has **not been published**. Build a local checkout:

```sh
git clone https://github.com/vibeinging/dsh-trace.git
cd dsh-trace
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
```

In DSH Desktop, open **Plugins → Add plugin** and enter the built package's absolute path:

```text
link:/absolute/path/to/dsh-trace/packages/dsh-trace-viewer
```

Enable the plugin, open a conversation and select **Trace**. Open **Settings → Trace data** for recording and retention. If the new Host component needs a restart, quit DSH normally and reopen it.

For a DSH Web profile:

```sh
dsh plugin --profile web add -w link:/absolute/path/to/dsh-trace/packages/dsh-trace-viewer
dsh --profile web
```

Use the same profile when removing it:

```sh
dsh plugin --profile web remove -w @vibeinging/dsh-trace-viewer
```

The repository root is a development workspace, not an installable DSH plugin. Install `packages/dsh-trace-viewer`; installing the repository URL as a root plugin is not supported. Close Desktop before changing its profile through the CLI.

## Data defaults

| Setting | Default |
| --- | --- |
| Recording | Off; future events only, no history backfill |
| Capture scope when enabled | Model calls, tools, failures/interruption and compaction |
| Model response text | Off |
| Tool arguments/results | Off |
| Retention | 30 days |
| Expiry check | Every 24 hours while the Host runs |

Copies live in the current profile's `data/dsh-trace-viewer/`. They contain session identifiers and selected event data. Content switches affect future writes; they do not remove previously recorded content or provide general redaction. Indefinite retention disables expiry. Manual cleanup requires a preview and confirmation; cleanup skips active or changed segments and never deletes original DSH sessions.

See the [plugin reference](packages/dsh-trace-viewer/README.md) for settings and data semantics.

## Development

Run `pnpm run check` from the repository root for boundary checks, lint, both Host and browser type checks, tests, build and package smoke checks. Public CI uses the same command and requires no private SDK token.

```text
packages/dsh-trace-viewer/  Active plugin: source, tests and runtime bundle
docs/                      Specifications and verification records
legacy/yitrace-exporter/   Archived exporter for the old SDK; outside the workspace
```

The old exporter replaces a telemetry backend and uses a different SDK and data store. It is not required by this plugin. Old pinned Git commits remain available; see its [archive notes](legacy/yitrace-exporter/README.md).

## Current limits

The viewer covers the current session, not cross-session search or run comparison. The data page does not yet browse or export saved copies. Child-agent traces only appear when the host supplies their relationship. Large-history pagination is supported; a general large-scale performance benchmark is not available.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and [CHANGELOG.md](CHANGELOG.md).

BSD-3-Clause; see [LICENSE](LICENSE). Bundled TanStack Virtual code retains its [MIT notice](packages/dsh-trace-viewer/THIRD_PARTY_NOTICES.md).

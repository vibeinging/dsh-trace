# Development

[Project home](../README.md)

Use Node.js `^22.19.0` or `>=24.0.0` and pnpm `11.7.0`:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
```

The root workspace delegates to `packages/dsh-trace-viewer`. Checks cover repository boundaries, lint, Host/browser types, tests, build and a packed-file smoke check. The published SDK comes from the public npm registry; no DSH source checkout or private registry token is required.

For local development, build and install the package path in an isolated DSH profile:

```sh
pnpm run build
dsh plugin --profile web add -w link:/absolute/path/to/dsh-trace/packages/dsh-trace-viewer
```

Do not install the workspace root as a plugin. Close Desktop before managing its profile through the CLI. Keep tests, accounts and raw session evidence separate from public demo fixtures.

## Public screenshots

`docs/demo/` renders the real Trace and settings components with synthetic data. Run:

```sh
node scripts/readme-demo.mjs
```

Open `http://127.0.0.1:64936/?lang=en`, `?lang=zh`, or `?view=settings&lang=en`. The demo never connects to a DSH profile. Stop the server after capturing images. `docs/assets/readme/` contains only these public examples.

## npm README

The npm package uses the same English README as the repository. After editing the root README:

```sh
node scripts/sync-package-readme.mjs
```

The boundary check rejects a stale copy. README images and documentation point to the release tag so the npm page remains readable independently of the workspace layout. See [releasing.md](releasing.md).

The archived yiTrace exporter in `legacy/` uses a different historical SDK and is outside the default workspace. Do not introduce its dependencies into the viewer.

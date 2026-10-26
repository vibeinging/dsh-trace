# Contributing

Issues and pull requests are welcome in Chinese or English. This repository is a community DSH plugin, maintained separately from DSH.

## Development

Use the Node.js and pnpm versions in `package.json`:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check
```

The active package is `packages/dsh-trace-viewer`. The root commands delegate to it. `legacy/yitrace-exporter` is archived and excluded from the workspace; it uses a different SDK and is not needed for viewer development.

Use published DSH SDK packages. Do not add local DSH source dependencies, SDK copies, credentials, raw session files or personal data. For bug reports, use a minimal synthetic example and include the DSH version, platform, expected result and actual result.

Add focused tests when changing event mapping, recording, cleanup, permissions or navigation behavior. Run the complete check before opening a pull request. Describe the user-visible change and distinguish automated checks from any actual Desktop/Web testing. Keep pull requests scoped; do not reformat unrelated files or update dependencies incidentally.

## Package distribution

The plugin manifest is ready for a public scoped npm package, but it has not been published. A repository checkout and local package link are the documented installation path. The root workspace is private to prevent publishing the workspace itself. Releases and npm publication are maintainer actions, not part of `pnpm run check` or CI.

Keep the package license and bundled third-party notices in any distribution. Keep `lib/` runtime output aligned with source changes.

Export a source snapshot for public review with:

```sh
node scripts/export-public-source.mjs /absolute/path/to/new-directory
```

This explicitly excludes local acceptance screenshots and raw evidence. It does not export Git history, create a commit or publish anything. For the first public viewer update, base the delivery on the clean snapshot rather than pushing local commits containing real-session screenshots.

## 中文

欢迎中文 Issue 和 PR。修改集中在当前插件中，使用官方已发布 SDK；请勿上传真实会话、密钥或个人信息。更改埋点、清理、权限和导航行为时补充有意义的测试，提交 PR 前运行 `pnpm run check`，并说明自动化测试与实际桌面/Web 验收的范围。npm 发布由维护者单独执行。

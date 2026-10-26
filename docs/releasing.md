# Releasing the npm package

The installable package is `@vibeinging/dsh-trace-viewer`; the root workspace remains private. Publishing needs npm permission for the `vibeinging` scope and the account's required authentication. Do not put registry credentials in repository files or command output.

1. Update root English/Chinese READMEs, version, changelog and the release-tag links. Sync the package README with `node scripts/sync-package-readme.mjs`.
2. Run `pnpm run check`. Inspect a real `npm pack --ignore-scripts` archive from `packages/dsh-trace-viewer` and install that archive into a clean consumer.
3. Commit the release source and publish a matching `v<version>` Git tag. Public screenshot fixtures must contain only synthetic data. Do not tag a local branch containing private session evidence.
4. Publish the exact reviewed tarball:

   ```sh
   npm publish /absolute/path/to/package.tgz --access public --tag latest --ignore-scripts --registry https://registry.npmjs.org/
   ```

5. Read the version, `dist-tags.latest`, tarball URL and integrity back from the registry. Install the registry version in a clean consumer/profile and verify both Host and browser entries. Do not infer success from a local dry run.

Use a new version for any subsequent change; an npm version cannot be replaced. npm authentication or a required interactive verification must be completed by the maintainer through npm's own flow. Keep release metadata and source review separate from publishing permission.

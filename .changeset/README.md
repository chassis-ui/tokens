# Changesets

A pull request that changes `@chassis-ui/tokens` adds a changeset: a Markdown file in this folder
that names the version bump (patch, minor or major) and the CHANGELOG text. Run `pnpm changeset`
to write one. For a release, a maintainer runs `pnpm changeset:version` on `develop`, which turns
the changesets into the new version and its CHANGELOG entry. Pushing that commit to `main`
publishes the version.

See [Releases](../.github/CONTRIBUTING.md#releases) in the contributing guide, and the
[Changesets documentation](https://changesets.dev).

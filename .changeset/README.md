# Changesets

A pull request that changes `@chassis-ui/tokens` adds a changeset: a Markdown file in this folder
that names the version bump (patch, minor or major) and the CHANGELOG text. Run `pnpm changeset`
to write one. On `main`, the release workflow turns the changesets into a "Version Packages" pull
request; merging it publishes the new version.

See [Releases](../.github/CONTRIBUTING.md#releases) in the contributing guide, and the
[Changesets documentation](https://changesets.dev).

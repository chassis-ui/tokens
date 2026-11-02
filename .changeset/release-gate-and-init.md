---
'@chassis-ui/tokens': minor
---

**Breaking.** The Android libraries of a release are named after the repository, as its zips: `chassis-tokens-<app>-<brand>-<version>.aar` becomes `<name>-android-<app>-<brand>-<version>.aar`, `<name>` being the name of `package.json` without its scope. `init --force` no longer writes over `package.json` or `CHANGELOG.md`; to take a new script, add it by hand. No file of `dist/` is added, removed or renamed.

- `chassis-tokens release-notes [version]` prints the entry of a version in `CHANGELOG.md`, and exits 1 without one. The workflows of `init` run it in CI and first in the release, and the body of the GitHub release is the entry, in place of `--generate-notes`.
- `init` writes `AGENTS.md` and `CLAUDE.md` and a script `release-notes`. `init --check` reports where a repository differs from what this version writes, and `init --only <file…>` writes those files.
- `engines` of the package asks for Node.js 22.12, as the workflows and a repository of tokens do.

A repository of tokens takes the gate with `chassis-tokens init --only AGENTS.md CLAUDE.md`, `--only .github/workflows/ci.yml .github/workflows/release.yml --force`, and the script `"release-notes": "chassis-tokens release-notes"`. An app that names the file of an Android library renames it.

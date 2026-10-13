---
'@chassis-ui/tokens': patch
---

The build configuration, `chassis.build`, is in the `package.json` at the root of the repository instead of `packages/tokens/package.json`, next to the token files in `source/`. The published `package.json` no longer has the `chassis` key. No token name, value or file changes, and an app that installs the package has nothing to change.

A repository that owns its tokens moves its `chassis` key to the root `package.json`. Until then the build stops with `Invalid package.json: missing required chassis.build configuration at the root of the repository`. `--config` still takes a path relative to `packages/tokens/`.

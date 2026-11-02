# __NAME__

The design tokens of __NAME__, in [Tokens Studio](https://tokens.studio) files, built with
[`@chassis-ui/tokens`](https://www.npmjs.com/package/@chassis-ui/tokens) into SCSS, Swift,
SwiftUI, Android resources and Jetpack Compose.

## Layout

```
source/$themes.json            The brand, app, theme and screen options, from Tokens Studio
source/<set>.json              The token sets, from Tokens Studio
dist/<platform>/<app>/<brand>/ The output of a build, committed and published
Package.swift                  The Swift package of the iOS output
package.json                   The brands, apps, themes and screens, in `chassis.build`
```

A designer syncs `source/` from Figma with Tokens Studio. The tokens of the first build are a
starting point: replace them with your own, and keep `chassis.build` in step with the options
of `$themes.json`.

## Commands

Once, with Node.js 22 or later:

```shell
__INSTALL__
```

| Command                 | What it does                                                         |
| ----------------------- | -------------------------------------------------------------------- |
| `__RUN__ build`         | Builds every brand, app and platform into `dist/`                    |
| `__RUN__ lint`          | Checks the token files in `source/`                                  |
| `__RUN__ verify`        | Checks that a fresh build equals the committed `dist/`               |
| `__RUN__ diff`          | Reports the tokens added, removed and changed against the `main` branch |
| `__RUN__ swift-package` | Writes `Package.swift` from `chassis.build`, when an app has iOS     |
| `__RUN__ swift-package:check` | Checks that `Package.swift` follows `chassis.build`            |
| `__RUN__ archive`       | Writes one zip per platform, app and brand of `dist/` to `archives/` |

`node_modules/.bin/chassis-tokens build --help` prints the options of the build: a part of the output with
`--brand`, `--app`, `--platform`, `--theme` and `--screen`, and a plan with `--dry-run`.

After a change to the tokens, run `__RUN__ build` and commit `source/` and `dist/` together.

## Releases

A release is a push to `main` with a new version in `package.json`, without a tag of its own, as
the workflow makes the tag. The first push releases the version that `init` wrote. For a later one:

1. Set the version in `package.json`, and add its entry to `CHANGELOG.md`.
2. `__RUN__ build`, which writes the version into the headers of `dist/`. `verify` ignores those
   lines, so it does not notice a build that was skipped.
3. `__RUN__ verify`.
4. Commit all of it, then `git push origin main`.

The release workflow stops when `CHANGELOG.md` has no entry for the version. It checks `dist/` against a fresh build, publishes the package to npm with
trusted publishing, and creates the tag `v<version>` and its GitHub release, whose body is the entry of the version, with one Android
library per app and brand, `<name>-android-<app>-<brand>-<version>.aar`, and one zip per platform,
app and brand, `<name>-<platform>-<app>-<brand>-<version>.zip`. `<name>` is the name of `package.json` without its scope. The Swift package is the repository
at the tag. A push whose version has a tag releases nothing, and a release that fails makes no
tag, so the next push tries again.

Before the first push to `main`, check that `repository` in `package.json` names this repository,
which npm compares with the provenance of the release and the file headers link to, add a
`LICENSE` file for the `license` of `package.json`, and add this repository and `release.yml`
as the trusted publisher of the package on npmjs.com.

`chassis-tokens init --check` reports where this repository differs from what the current
`chassis-tokens init` writes, and `chassis-tokens init --only <file…>` writes those files.

## Documentation

The [documentation of Chassis Tokens](https://chassis-ui.com/tokens/) describes the tokens, the
output of each platform and how a project uses it.

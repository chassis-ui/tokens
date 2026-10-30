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

`node_modules/.bin/chassis-tokens build --help` prints the options of the build: a part of the output with
`--brand`, `--app`, `--platform`, `--theme` and `--screen`, and a plan with `--dry-run`.

After a change to the tokens, run `__RUN__ build` and commit `source/` and `dist/` together.

## Releases

A release is a tag, `v<version>`, with the version of `package.json`:

1. Set the version in `package.json`, and add its entry to `CHANGELOG.md`.
2. `__RUN__ build`, which writes the version into the headers of `dist/`. `verify` ignores those
   lines, so it does not notice a build that was skipped.
3. `__RUN__ verify`.
4. Commit all of it, then `git tag v0.1.0 && git push origin main v0.1.0`.

The release workflow checks `dist/` against a fresh build, publishes the package to npm with
trusted publishing, and creates the GitHub release with one Android library per app and
brand, `chassis-tokens-<app>-<brand>-<version>.aar`. The Swift package is the repository at
the tag.

Before the first release, check that `repository` in `package.json` names this repository,
which npm compares with the provenance of the release and the file headers link to, add a
`LICENSE` file for the `license` of `package.json`, and add this repository and `release.yml`
as the trusted publisher of the package on npmjs.com.

## Documentation

The [documentation of Chassis Tokens](https://chassis-ui.com/tokens/) describes the tokens, the
output of each platform and how a project uses it.

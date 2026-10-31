# Chassis Tokens

> The builder of design tokens for the Chassis Design System: the `chassis-tokens` command turns a repository of Tokens Studio files into SCSS for the web, Swift for iOS and resources for Android, for many brands, themes and apps.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@chassis-ui/tokens)](https://www.npmjs.com/package/@chassis-ui/tokens)
[![Release](https://github.com/chassis-ui/tokens/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/chassis-ui/tokens/actions/workflows/release.yml)

## Overview

Chassis Tokens is the token module of Chassis UI, published to npm as [`@chassis-ui/tokens`](https://www.npmjs.com/package/@chassis-ui/tokens). A team installs it in a repository of its own tokens, in [Tokens Studio](https://tokens.studio) format and synced with Figma, and the `chassis-tokens` command builds them with [Style Dictionary](https://styledictionary.com) into files for each platform. The package holds no tokens of its own.

The tokens of the Chassis sites and apps are one such repository, [chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens), published as [`@chassis-ui/website-tokens`](https://www.npmjs.com/package/@chassis-ui/website-tokens); [Chassis CSS](https://github.com/chassis-ui/css) is built on it. This repository vendors it as a submodule, so that CI runs the build on real tokens. The [documentation site](https://chassis-ui.com/tokens/docs/getting-started/introduction/) covers the tokens and how to use them on each platform. [docs/decisions.md](docs/decisions.md) has the reasons for the split.

## Features

- **Brands, themes, apps and screen sizes**: each combination of token sets in Tokens Studio becomes its own set of files.
- **Web**: SCSS variables for Chassis CSS, and presets with plain SCSS variables in `rem`, `px` or `vw` for other CSS frameworks.
- **iOS**: Swift constants with `UIColor` values that follow dark mode, an icon asset catalog, and SwiftUI output, installed as a Swift package.
- **Android**: a resource tree with night and screen-size qualifiers, vector drawables for the icons, and Jetpack Compose output, installed as an Android library from a GitHub release.
- **References**: with `outputReferences`, a token names the token it references (a SCSS variable, a Swift constant or an Android resource) wherever that compiles and keeps the value.
- **Checked output**: a fresh build must equal the committed `dist/` of a repository of tokens, and the tests run on real tokens.

## Getting Started

### Your own tokens

`chassis-tokens init` writes a repository of tokens, with `@chassis-ui/tokens` as a development dependency:

```sh
npx --package @chassis-ui/tokens chassis-tokens init acme-tokens --brand acme --app site:web mobile:ios,android
cd acme-tokens
npm install
npm run build
```

[The command](#the-command) describes it.

### The tokens of the Chassis sites

Install the package for the SCSS, the same files of the other platforms included:

```sh
npm install @chassis-ui/website-tokens
```

```scss
@use '@chassis-ui/website-tokens/dist/web/docs/chassis/main' as tokens;

.card {
  padding: tokens.$cx-space-context-medium;
}
```

iOS apps add the Swift package https://github.com/chassis-ui/website-tokens.git at a tag, with the libraries `ChassisTokensDemoChassis` and `ChassisTokensDemoSinefil`. Android apps download `chassis-tokens-demo-<brand>-<version>.aar` from the [releases of website-tokens](https://github.com/chassis-ui/website-tokens/releases).

The guides for [web](https://chassis-ui.com/tokens/docs/use-in-project/web-applications/), [iOS](https://chassis-ui.com/tokens/docs/use-in-project/ios-applications/) and [Android](https://chassis-ui.com/tokens/docs/use-in-project/android-applications/) cover themes, screen sizes and setup in detail.

## Repository Layout

The repository is a [pnpm workspace](https://pnpm.io/workspaces) with two packages, in the layout of the other Chassis repositories such as [chassis-react](https://github.com/chassis-ui/react):

| Folder             | Package                          | Contents                                                                                        |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/tokens/` | `@chassis-ui/tokens` (published) | `build/` (the Style Dictionary build and the `chassis-tokens` command), `test/`, `CHANGELOG.md` |
| `packages/site/`   | `chassis-tokens-site` (private)  | The documentation site and its dependencies                                                     |

The root holds the `vendor/tokens` submodule, a checkout of chassis-ui/website-tokens with `source/`, `chassis.build`, `dist/` and `Package.swift`, on which the root scripts run the build of this checkout; the assets submodule in `vendor/assets`; the workspace configuration, the lint and format configurations with their dependencies, the CI workflows, the Changesets configuration in `.changeset/`, the repository scripts in `build/` (`sync-version-refs.js`, `release-notes.js`) and the site output in `_site/`. In the sections below, `build/` and `test/` are relative to `packages/tokens/`, and `source/` and `dist/` to the repository of tokens, `vendor/tokens` in this checkout.

## The command

The package has a command, `chassis-tokens`, that builds and checks a repository of tokens: a folder with `source/`, a `package.json` with the `chassis.build` block, and the committed output. A team installs `@chassis-ui/tokens` in a repository of its own tokens and runs it there. The `pnpm tokens:*` scripts of this repository run the same command on `vendor/tokens`, with `--cwd vendor/tokens`.

| Command                        | What it does                                                | Script here                 |
| ------------------------------ | ----------------------------------------------------------- | --------------------------- |
| `chassis-tokens build`         | Builds the tokens into the output folder                    | `pnpm tokens`               |
| `chassis-tokens verify`        | Checks that a fresh build equals the committed output       | `pnpm tokens:verify`        |
| `chassis-tokens diff`          | Reports the tokens added, removed and changed in the output | `pnpm tokens:diff`          |
| `chassis-tokens lint-source`   | Checks the token files in `source/`                         | `pnpm tokens:lint:source`   |
| `chassis-tokens swift-package` | Writes `Package.swift` from the output                      | `pnpm tokens:swift-package` |
| `chassis-tokens init [dir]`    | Writes the baseline of a repository of tokens into a folder |                             |

Each command takes `--help`. The native compile checks and the build of the Android libraries are scripts of this workspace for now (`pnpm tokens:native:ios`, `pnpm tokens:native:android`, `pnpm tokens:aar`), which name `vendor/tokens` too.

Every command but `init` works on one repository: `--cwd <dir>`, by default the nearest folder upward from the working directory whose `package.json` has a `chassis` block. In a repository of tokens `source/`, `dist/` and `Package.swift` are at its root. `chassis.dist` in that `package.json` moves the output folder. The version in the file headers is that of the nearest `package.json` with a version, from the output folder upward; the other header lines come from that repository's `package.json` as well: the title from `chassis.title` or `name`, the copyright from `chassis.copyright` or `author`, and the license and its link from `license` and `repository`.

`chassis-tokens init` writes a `package.json` with the `chassis.build` block and scripts that call the command, a README, a changelog, a CI workflow, a release workflow and a few Tokens Studio files, so that the first build has tokens to build. The release workflow runs on the tag `v<version>`, checks `dist/` against a fresh build, publishes to npm with trusted publishing and attaches the Android libraries, built with the Gradle project that comes with the package. `--brand`, `--app`, `--name`, `--pm`, `--repository`, `--license` (MIT by default) and `--author` fill it in, the last ones by default from the `origin` remote and `user.name` of git, and a field with no value is left out. `--dry-run` prints the files, and it writes nothing when a file exists unless `--force` is given. It never writes into a `source/` that holds files, with or without `--force`: it keeps them, writes no starter tokens and says so. The workflows install from the lockfile and run the package scripts, so commit the lockfile of the first install:

```sh
npx --package @chassis-ui/tokens chassis-tokens init acme-tokens --brand acme --app site:web mobile:ios,android
```

## Development

You need Node.js 22 or later and pnpm. Clone the repository, install the dependencies and check out the submodules; run every command from the root:

```sh
git clone https://github.com/chassis-ui/tokens.git chassis-tokens
cd chassis-tokens
pnpm install
pnpm vendor
```

`pnpm test` needs no submodule. `git submodule update --init vendor/tokens` is enough for the `tokens:*` scripts on the real tokens, and `pnpm vendor` also builds `vendor/assets`, for the site.

To work on the tokens without the site's dependencies, install only the tokens package (and the root's lint tools):

```sh
pnpm install --filter @chassis-ui/tokens
```

[CONTRIBUTING.md](.github/CONTRIBUTING.md) describes how to change the build and the site, and what a pull request needs. A change to the tokens is made in [chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens).

### Build the Tokens

```sh
pnpm tokens
```

This writes the files of every brand, app, theme, platform and screen in the configuration of `vendor/tokens` to `vendor/tokens/dist/<platform>/<app>/<brand>/`. Write nothing there that is meant to stay, unless it is committed in website-tokens. Filters build a part of it, and can be combined:

```sh
pnpm tokens --brand chassis
pnpm tokens --app docs --platform web
pnpm tokens --brand sinefil --platform ios android --screen large small
pnpm tokens --theme light dark --dry-run
```

| Option                      | Effect                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `--brand <brands...>`       | Only these brands, such as `chassis sinefil`                                                |
| `--theme <themes...>`       | Only these themes, such as `light dark`                                                     |
| `--app <apps...>`           | Only these apps, such as `docs demo`                                                        |
| `--platform <platforms...>` | Only these platforms, such as `web ios android`                                             |
| `--screen <screens...>`     | Only these screen sizes, such as `large medium small`                                       |
| `--cwd <dir>`               | Build this repository of tokens, instead of the one found upward from the working directory |
| `--out <dir>`               | Write to another output root instead of `dist`, such as `dist-next`                         |
| `--config <file>`           | Read the build configuration from a JSON file instead of `chassis.build` in `package.json`  |
| `--clean`                   | Delete the output directory of each selected brand, app and platform before building        |
| `--dry-run`                 | List the builds and the files each would write, without building                            |
| `--help`, `-h`              | Show the help                                                                               |
| `--version`, `-v`           | Show the version                                                                            |

The build writes files but deletes none, so a file it no longer writes stays in `dist/`, such as the number files of a removed screen. `--clean` deletes `dist/<platform>/<app>/<brand>/` of each selected build first; it fails with `--theme` or `--screen`, which rebuild only some files of a directory.

A filter value that the configuration does not have, such as `--brand chasis`, fails the build and names the configured values, and so do filters that together select nothing, such as `--app docs --platform ios`.

Each brand and app is built once per list of token sets, writing the files of every platform of the app; a full build runs 16 builds. Set `DEBUG=1` for verbose output with stack traces:

```sh
DEBUG=1 pnpm tokens --brand chassis
```

### Lint the Token Source

Check `source/` for mistakes the build would accept, before building:

```sh
pnpm tokens:lint:source
```

It reads the token sets that `source/$themes.json` selects and fails, naming the token set and the token, when:

- the options of the `theme` or `screen` group declare different names in their sets, as when one screen names a token `headers-gap` and the others `header-gap`
- a name has characters other than letters, digits and single hyphens, starts with a digit, or becomes the same SCSS, Swift, Android or Compose name as another token
- a font weight is not one the build knows (`Semi Bold`, `SemiBold` and `semi-bold` are all `600`; a style word such as `Italic` may follow)
- a token has no `$type`, or a value is not a token (such as `value` and `type` without `$`)
- two sets of one token-set list declare the same name with different types
- a letter spacing is in percent or in `em`, which Figma variables cannot hold: write it in pixels

### Verify the Output

Check that the committed `dist/` matches a fresh build of `source/`:

```sh
pnpm tokens:verify
```

The check builds into `dist-next/` and compares every file with `dist/`, ignoring the timestamp and version lines of the file headers. It fails when a token name appears twice in one file, and when a reference names nothing the output declares: an Android `@type/name` without a `<type name="name">` in the same file, or a SCSS `$name` that no SCSS file of the directory declares. It never writes to `dist/`.

```sh
# Build and check one platform only
pnpm tokens:verify --platform ios

# Compare the dist-next/ of the last run again without building, with the same --platform
pnpm tokens:verify --skip-build --platform ios
```

The [presets](#presets-for-other-css-frameworks) write nothing into `dist/`. Their reference output is in `test/golden/`, built from the fixture repository in `test/fixtures/repository/` and not from `vendor/tokens`, so a change to the tokens leaves it alone. The `default` baseline there holds the output of the default platforms, so that a change to it shows without the submodule. It is checked by:

```sh
pnpm tokens:verify:presets
```

After a change to the build that is meant to change the output, write the baselines again:

```sh
pnpm tokens:verify:update:presets
```

It builds every preset from the fixture and writes the files that differ into `test/golden/`; a file that differs in its header lines only is left as it is. It names each file it writes or deletes, and writes nothing when a name appears twice or a reference names nothing. Review the result with `git diff`. `pnpm tokens:verify:update` also writes `vendor/tokens/dist/`, for a change to be committed in website-tokens; see [Changing tokens](.github/CONTRIBUTING.md#changing-tokens).

```sh
# One baseline only
node packages/tokens/build/cli.js verify --update --preset web-px
```

### Token Diff Report

See what a change does to the tokens without reading `dist/`: the names added, removed and changed in value in each file, and a removed and an added name with the same value as a possible rename. Removed and renamed names are marked breaking. Header lines are ignored, and the icon assets are compared as whole files.

```sh
# The working vendor/tokens/dist/ against main of website-tokens
pnpm tokens:diff

# Against another branch, tag or commit of website-tokens; --head takes a ref or a directory too
pnpm tokens:diff --base v0.1.0
```

The report is Markdown. On a pull request that moves the `vendor/tokens` pointer, CI writes it to the job summary, between the two commits the pointer names.

### Tests

The tests use real tokens, copied into fixtures, and the output of the default platforms in `test/golden/default/`, not mocks of Style Dictionary. They need nothing outside `packages/tokens/`; the few that compare `source/` and the configuration of `vendor/tokens` with its `dist/` skip while the submodule is not checked out, and the check of `test:ci` skips without the workspace. They cover the golden check, the build plan, the command, `init`, the CLI and platform configurations, the value encoders for iOS, Android and web and their references, the web reference policies, the preprocessor, filters, transforms, token order and the token diff report.

```sh
pnpm tokens:test
```

See [packages/tokens/test/README.md](packages/tokens/test/README.md) for the test files, fixtures and preset baselines.

The build code is JavaScript with JSDoc types. TypeScript checks it (`checkJs`, not yet `strict`) against the types of Style Dictionary and Node.js 22:

```sh
pnpm tokens:typecheck
```

### Build Architecture

The build uses [Style Dictionary](https://styledictionary.com) 5.5 and [`@tokens-studio/sd-transforms`](https://github.com/tokens-studio/sd-transforms) 2.0 (type alignment, math, color modifiers and theme permutations). A build runs in three steps:

1. **Preprocess**: `preprocessor.js` aligns types, splits every font weight into weight and style, and numbers the tokens in source order.
2. **Transform**: Style Dictionary transforms only what is safe before references are resolved: names, math, color modifiers, `rem` sizes and CSS shadows.
3. **Format**: The formats print one line per resolved token. Platform values (`UIColor(…)`, ARGB colors, `sp`/`dp`, quoting, `em`, `var(--…)`, `$…`, `@type/…` and Swift constant references) come from pure functions in `values/` and the web reference policies, which run after resolution.

Key modules in `build/`:

- `cli.js`: The `chassis-tokens` command, a table of the commands below
- `root.js`: Finds the repository of tokens, its folders and the version of its output
- `init.js` and `init-templates/`: The baseline of a repository of tokens
- `build.js`: Build plan (one Style Dictionary instance per token-set list) and CLI
- `config/`: Platform configurations; the web presets share `webConfig()` from `web.js`
- `preprocessor.js`: Token preprocessing
- `filters.js`: Which tokens go into which file
- `transforms.js`: Custom value transforms that run before resolution (`rem`, `px` and `vw` sizes, CSS shadows)
- `formats.js` and `templates/`: Output formats; `templates/references.js` finds the token that an iOS or Android reference names
- `values/`: Value encoders for iOS, Android and web
- `reference-policy.js`: Which web tokens print a reference and which token it names, shared by both web formats
- `css-var-policy.js`: The `var(--…)` names of the Chassis CSS format
- `scss-var-policy.js`: The values and `$…` names of the SCSS variables format
- `icons.js`: The icon assets, an Xcode asset catalog and Android vector drawables, written by Style Dictionary actions from the SVG icon tokens
- `theme-colors.js`: The iOS `Color.swift` whose colors follow the appearance, written after the builds from the light and dark color files
- `verify.js`: Golden check against the committed output of a repository and the preset baselines
- `logger.js`: Logging
- `utils.js`: Token type groups and number formatting

[docs/architecture.md](docs/architecture.md) explains why the build works this way, and lists the output contract, the rules of every platform and the known oddities of the output.

## Configuration

### Token Sets

The token files are in Tokens Studio format, with one theme group per collection. `source/$themes.json` has these groups and options:

| Group    | Options                                             |
| -------- | --------------------------------------------------- |
| `brand`  | `default`, `chassis`, `sinefil`, `demo-a`, `demo-b` |
| `app`    | `docs`, `demo`                                      |
| `theme`  | `light`, `dark`                                     |
| `screen` | `large`, `medium`, `small`                          |

See the [Tokens Studio documentation](https://docs.tokens.studio) and the [Tokens Studio guide](https://chassis-ui.com/tokens/docs/getting-started/tokens-studio/) of this project.

### Build Options

The `chassis.build` key of the `package.json` of a repository of tokens defines which brands, themes, screens and apps the build writes:

```json
"chassis": {
  "build": {
    "brands": ["chassis", "sinefil"],
    "themes": ["light", "dark"],
    "screens": ["large", "medium", "small"],
    "apps": {
      "docs": ["web"],
      "demo": ["ios", "android"]
    }
  }
}
```

- **`brands`**: Brand names
- **`themes`**: Theme names, such as `light` and `dark`
- **`screens`**: Screen sizes for responsive tokens. Set to `[]` or omit to generate single number files without screen suffixes; they take the values of the first screen in `source/$themes.json` when it has a screen group
- **`apps`**: App names mapped to their platforms
- **`options`**: (Optional) Style Dictionary options by platform name, merged into the options of that platform, e.g. `{ "web-px": { "outputReferences": true } }`. The build fails when it names a platform that no app uses

The token sets of each file come from `source/$themes.json`. Color files use the sets of their theme, number files the sets of their screen, and every other file the sets of the first theme and the first screen listed here. Only the brands, themes, screens and apps listed here are built.

**Platforms:**

- `web`: SCSS variables for Chassis CSS (rem units, `var(--…)` references)
- `web-scss`, `web-px`, `web-vw`: SCSS variables for other CSS frameworks (see [below](#presets-for-other-css-frameworks))
- `ios`: Swift types, one caseless enum per file (PascalCase naming)
- `android`: XML resources (snake_case naming)
- `ios-swiftui`: Swift types with SwiftUI values (`Color`, `Font.Weight`), written to `dist/ios-swiftui/<app>/<brand>/`
- `android-compose`: Kotlin objects for Jetpack Compose (`Color`, `.dp`, `.sp`, `.em`, `FontWeight`), written to `dist/android-compose/<app>/<brand>/`, in the package `chassis.tokens` or `options["android-compose"].packageName`

**File names:**

- Web: `main.scss`, `color-light.scss`, `number-large.scss`
- iOS: `ChassisTokens.swift`, `ColorLight.swift`, `NumberLarge.swift` (types `ChassisTokens`, `ChassisTokensColorLight`, `ChassisTokensNumberLarge`), and `Color.swift` (`ChassisTokensColor`), whose colors follow the light and dark appearance
- Android: `main.xml`, `color_light.xml`, `number_large.xml`, and the same resources as a resource tree under `res/` (`values`, `values-night`, `values-sw600dp`, `values-sw840dp`; the screen folders are set with `options.android.screens`)

### Presets for Other CSS Frameworks

The default `web` platform writes SCSS for [Chassis CSS](https://github.com/chassis-ui/css): theme-aware values print the CSS custom properties that Chassis CSS generates, such as `var(--default-fg-main)`. A team with its own CSS framework needs plain SCSS variables instead. Select one of these platforms for a web app:

| Platform   | Format                | Sizes                 |
| ---------- | --------------------- | --------------------- |
| `web`      | `cx/scss-chassis-css` | `rem`                 |
| `web-scss` | `cx/scss-variables`   | `rem`                 |
| `web-px`   | `cx/scss-variables`   | `px`                  |
| `web-vw`   | `cx/scss-variables`   | `vw` (16 px is `1vw`) |

```json
"apps": {
  "docs": ["web-scss"]
}
```

All web platforms write the same files to `dist/web/<app>/<brand>/`. The SCSS variables format prints resolved values:

```scss
$cx-color-accordion-item-fg-color: #191b1c !default;
$cx-border-radius-accordion-main: 0.375rem !default;
```

With `outputReferences`, it prints the SCSS variable of the referenced token instead, where the Chassis CSS format prints a custom property (except shadows):

```json
"apps": { "docs": ["web-px"] },
"options": { "web-px": { "outputReferences": true } }
```

```scss
$cx-color-accordion-item-fg-color: $cx-color-context-default-fg-main !default;
$cx-border-radius-accordion-main: $cx-border-radius-context-medium !default;
```

With references, load a color file before `main.scss`: its color tokens reference variables of `color-<theme>.scss`. The other files use only variables they declare themselves. The build fails when a reference names a variable that no file declares.

`outputReferences` also works on `android`: tokens print `@color/…`, `@dimen/…` references to resources of the same file. A token prints its value instead when the reference would not compile or would change the value, for example a font size in `sp` that references a size in `dp`.

On `ios`, `outputReferences` names another constant of the same class:

```json
"options": { "ios": { "outputReferences": true } }
```

```swift
public static let SizeUnit4 = DimensionBase4
public static let ColorAccordionItemFgColor = ColorContextDefaultFgMain
```

iOS and Android follow the same rule: a token names a constant or resource of its own file only when that one has the same type and value. Base colors and sizes computed with math print their values. A Swift constant cannot name one of another file.

Each platform file in `build/config/` can also be edited directly; `web-px.js`, `web-vw.js` and `web-scss.js` each call `webConfig({ unit, format })` from `web.js`.

## Documentation Site

The documentation site in `packages/site/` is built with [Astro](https://astro.build/) and the shared `@chassis-ui/docs` package. It covers the token categories, the Tokens Studio and Style Dictionary setup, and guides for web, iOS and Android projects. Its pages are in `packages/site/content/`. It compiles `@chassis-ui/css` against the published `@chassis-ui/website-tokens` pinned in its `package.json`, not `vendor/tokens`.

```sh
# Check out the submodules, build the assets of the site and run it at http://localhost:4322/tokens/
pnpm dev

# Check out the submodules, build the assets and the site into _site/
pnpm build

# Build the site only
pnpm site:build
```

## Continuous Integration and Releases

Every pull request and every push to `develop` runs `.github/workflows/ci.yml`:

- **Tokens** (Node.js 22 and 24), with the submodules checked out: `tokens:lint`, `tokens:lint:source`, `tokens:typecheck`, `tokens:test`, `tokens:verify`, `tokens:verify:presets`
- **Site**: `lint:prettier` (the whole repository), `site:lint`, `check:astro`, `site:build`, `site:lint:html`
- **Audit**: `pnpm check:pnpm`, which is `pnpm audit --prod` for moderate advisories and above in what the package installs, and a report of `pnpm audit` on every dependency, which does not fail the job
- **Dependency Review**: on a pull request, fails when it adds a dependency with a known vulnerability of moderate severity or above
- **Token Diff**: on a pull request that moves the `vendor/tokens` pointer, the [token diff report](#token-diff-report) between the two commits, in the job summary
- **Changeset**: a pull request that changes `packages/tokens/build/` must add a changeset (`pnpm changeset`)
- **Native iOS** (macOS, Xcode): every Swift file of `vendor/tokens/dist/` and of the preset baselines type-checked against the iOS simulator SDK, the asset catalogs compiled with `actool`, and a sample built that depends on the libraries of the `Package.swift` of `vendor/tokens` and reads their tokens
- **Native Android**: the resources of `vendor/tokens/dist/` and of the preset baselines compiled and linked against the Android SDK, the Compose objects compiled against Jetpack Compose, and a sample app built that depends on the Android libraries and reads their resources, with the Gradle project in `test/native/android/`

`pnpm test:ci` runs the Tokens, Site and Audit checks locally in one command, without the report of `pnpm audit`.

The two native jobs run on a pull request or a push to `develop` only when it moves the `vendor/tokens` pointer or changes `build/`, the preset baselines or the checks themselves, and on every manual run of the workflow. A release needs both to have passed on its commit: the version commit changes `packages/tokens/package.json`, so they run on it by themselves, and a manual run does it for any other commit. See [Native compile checks](packages/tokens/test/README.md#native-compile-checks).

Releases use [Changesets](https://changesets.dev). A maintainer runs `pnpm changeset:version` on `develop`, which bumps the version and writes the CHANGELOG, and pushes the commit to `develop`, then to `main`. The checks run once, on `develop`. Pushing `main` runs `.github/workflows/release.yml`, which reads the results of those checks on the commit and stops unless they passed, the two native jobs included, publishes `@chassis-ui/tokens` to npm with trusted publishing and provenance, and creates a GitHub release from the CHANGELOG entry. The tag `v<version>` is the version of the package, not a Swift package: the Swift package and the Android libraries are released by website-tokens. See [Releases](.github/CONTRIBUTING.md#releases). Dependabot opens weekly pull requests for npm packages, GitHub Actions and the Gradle project of the native checks; the actions are pinned to commit SHAs.

## Chassis Ecosystem

This project is part of the Chassis Design System's multi-repository architecture:

| Project                                                                | Description                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| [chassis-website](https://github.com/chassis-ui/website)               | Main website and shared documentation package                |
| [chassis-css](https://github.com/chassis-ui/css)                       | CSS framework and component library                          |
| [chassis-react](https://github.com/chassis-ui/react)                   | React component library                                      |
| **chassis-tokens**                                                     | **Design token generation and management (this repository)** |
| [chassis-website-tokens](https://github.com/chassis-ui/website-tokens) | The design tokens of the Chassis sites and apps              |
| [chassis-icons](https://github.com/chassis-ui/icons)                   | Icon library and build toolkit                               |
| [chassis-assets](https://github.com/chassis-ui/assets)                 | Multi-platform asset management                              |
| [chassis-figma](https://github.com/chassis-ui/figma)                   | Figma component documentation                                |

All documentation sites share the `@chassis-ui/docs` package for consistent layouts, components, and styling.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](.github/CONTRIBUTING.md) covers the setup, the conventions and what a pull request needs; please follow the [Code of Conduct](.github/CODE_OF_CONDUCT.md). Report security vulnerabilities privately, as described in [SECURITY.md](.github/SECURITY.md).

## License

MIT License — see [LICENSE](LICENSE) file for details.

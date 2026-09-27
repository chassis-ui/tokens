# Chassis Tokens

> Design tokens for the Chassis Design System: multi-brand, multi-theme and multi-app tokens from Tokens Studio, built into SCSS for the web, Swift for iOS and resources for Android.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@chassis-ui/tokens)](https://www.npmjs.com/package/@chassis-ui/tokens)
[![Release](https://github.com/chassis-ui/tokens/actions/workflows/publish-release.yml/badge.svg?branch=main)](https://github.com/chassis-ui/tokens/actions/workflows/publish-release.yml)

## Overview

Chassis Tokens holds the design tokens of the Chassis Design System in [Tokens Studio](https://tokens.studio) format, synced with Figma, and a [Style Dictionary](https://styledictionary.com) build that turns them into files for each platform. The output is committed and published to npm as [`@chassis-ui/tokens`](https://www.npmjs.com/package/@chassis-ui/tokens); [Chassis CSS](https://github.com/chassis-ui/css) is built on it. The [documentation site](https://chassis-ui.com/tokens/docs/getting-started/introduction/) covers the tokens and how to use them on each platform.

Chassis Tokens is meant to be owned and customized: a team can clone it, change the tokens in Tokens Studio, and build its own brands, apps and platforms.

## Features

- **Brands, themes, apps and screen sizes**: each combination of token sets in Tokens Studio becomes its own set of files; the configured build writes two brands, light and dark themes and three screen sizes.
- **Web**: SCSS variables for Chassis CSS, and presets with plain SCSS variables in `rem`, `px` or `vw` for other CSS frameworks.
- **iOS**: Swift constants with `UIColor` values that follow dark mode, an icon asset catalog, and SwiftUI output.
- **Android**: a resource tree with night and screen-size qualifiers, vector drawables for the icons, and Jetpack Compose output.
- **References**: with `outputReferences`, a token names the token it references (a SCSS variable, a Swift constant or an Android resource) wherever that compiles and keeps the value.
- **Checked output**: a fresh build must equal the committed `dist/`, checked in CI and before every release, and the tests run on real tokens.

## Getting Started

### Installation

```sh
npm install @chassis-ui/tokens
```

The package holds the files of `packages/tokens/dist/`: `dist/web/docs/<brand>/` (SCSS), `dist/ios/demo/<brand>/` (Swift and `Icons.xcassets`) and `dist/android/demo/<brand>/` (the `res/` tree), for the brands `chassis` and `sinefil`.

### Usage

Web, with Sass modules:

```scss
@use '@chassis-ui/tokens/dist/web/docs/chassis/main' as tokens;

.card {
  padding: tokens.$cx-space-context-medium;
}
```

iOS: add the Swift files and `Icons.xcassets` of one app and brand to your target, then read `ChassisTokens.SpaceContextMedium` or `ChassisTokensColor.ColorContextDefaultBgMain`.

Android: add `dist/android/<app>/<brand>/res` as a resource folder of your module, then read `R.dimen.space_context_medium` or `R.color.color_context_default_bg_main`.

The guides for [web](https://chassis-ui.com/tokens/docs/use-in-project/web-applications/), [iOS](https://chassis-ui.com/tokens/docs/use-in-project/ios-applications/) and [Android](https://chassis-ui.com/tokens/docs/use-in-project/android-applications/) cover themes, screen sizes and setup in detail.

## Repository Layout

The repository is a [pnpm workspace](https://pnpm.io/workspaces) with two packages, in the layout of the other Chassis repositories such as [chassis-react](https://github.com/chassis-ui/react):

| Folder             | Package                          | Contents                                                                                                                                                      |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tokens/` | `@chassis-ui/tokens` (published) | `source/` (the Tokens Studio token files), `build/` (the Style Dictionary build), `test/`, `dist/`, the build configuration in `package.json`, `CHANGELOG.md` |
| `packages/site/`   | `chassis-tokens-site` (private)  | The documentation site and its dependencies                                                                                                                   |

The root holds the workspace configuration, the lint and format configurations with their dependencies, the CI workflows, the Changesets configuration in `.changeset/`, the repository scripts in `build/` (`sync-version-refs.js`, `release-notes.js`, `sync-submodules.js`, `html-validate.js`), the assets submodule in `vendor/assets` and the site output in `_site/`. Paths in the sections below (`source/`, `build/`, `test/`, `dist/`, `package.json`) are relative to `packages/tokens/`.

## Development

You need Node.js 22 or later and pnpm. Clone the repository and install the dependencies; run every command from the root:

```sh
git clone https://github.com/chassis-ui/tokens.git chassis-tokens
cd chassis-tokens
pnpm install
```

To work on the tokens without the site's dependencies, install only the tokens package (and the root's lint tools):

```sh
pnpm install --filter @chassis-ui/tokens
```

[CONTRIBUTING.md](.github/CONTRIBUTING.md) describes how to change tokens, the build and the site, and what a pull request needs.

### Build the Tokens

```sh
pnpm tokens
```

This writes the files of every brand, app, theme, platform and screen in the configuration to `dist/<platform>/<app>/<brand>/`. Filters build a part of it, and can be combined:

```sh
pnpm tokens --brand chassis
pnpm tokens --app docs --platform web
pnpm tokens --brand sinefil --platform ios android --screen large small
pnpm tokens --theme light dark --dry-run
```

| Option                      | Effect                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `--brand <brands...>`       | Only these brands, such as `chassis sinefil`                                               |
| `--theme <themes...>`       | Only these themes, such as `light dark`                                                    |
| `--app <apps...>`           | Only these apps, such as `docs demo`                                                       |
| `--platform <platforms...>` | Only these platforms, such as `web ios android`                                            |
| `--screen <screens...>`     | Only these screen sizes, such as `large medium small`                                      |
| `--out <dir>`               | Write to another output root instead of `dist`, such as `dist-next`                        |
| `--config <file>`           | Read the build configuration from a JSON file instead of `chassis.build` in `package.json` |
| `--dry-run`                 | List the builds and the files each would write, without building                           |
| `--help`, `-h`              | Show the help                                                                              |
| `--version`, `-v`           | Show the version                                                                           |

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

### Verify the Output

Check that the committed `dist/` matches a fresh build of `source/`:

```sh
pnpm tokens:verify
```

The check builds into `dist-next/` and compares every file with `dist/`, ignoring the timestamp and version lines of the file headers. It fails when a token name appears twice in one file, and when a reference names nothing the output declares: an Android `@type/name` without a `<type name="name">` in the same file, or a SCSS `$name` that no SCSS file of the directory declares. It never writes to `dist/`.

```sh
# Build and check one platform only
pnpm tokens:verify --platform ios

# Compare the dist-next/ of the last run again without building, with the same
# --platform (from packages/tokens/)
node build/verify.js --skip-build --platform ios
```

The [presets](#presets-for-other-css-frameworks) write nothing into `dist/`. Their reference output is in `test/golden/`, checked by:

```sh
pnpm tokens:verify:presets
```

### Token Diff Report

See what a change does to the tokens without reading `dist/`: the names added, removed and changed in value in each file, and a removed and an added name with the same value as a possible rename. Removed and renamed names are marked breaking. Header lines are ignored, and the icon assets are compared as whole files.

```sh
# The working dist/ against main's
pnpm tokens:diff

# Against another branch, tag or commit; --head takes a ref or a directory too
pnpm tokens:diff --base v0.5.3
```

The report is Markdown. On a pull request, CI writes it to the job summary.

After changing tokens, run `pnpm tokens`, commit the updated `dist/` and write the preset baselines again; [CONTRIBUTING.md](.github/CONTRIBUTING.md#changing-tokens) has the commands.

### Tests

The tests use real tokens and the committed `dist/`, not mocks of Style Dictionary. They cover the golden check, the build plan, the CLI and platform configurations, the value encoders for iOS, Android and web and their references, the web reference policies, the preprocessor, filters, transforms, token order and the token diff report.

```sh
pnpm tokens:test
```

See [packages/tokens/test/README.md](packages/tokens/test/README.md) for the test files, fixtures and preset baselines.

The build code is JavaScript with JSDoc types. TypeScript checks it (`checkJs`, not yet `strict`) against the types of Style Dictionary and Node.js 22:

```sh
pnpm tokens:typecheck
```

### Build Architecture

The build uses [Style Dictionary](https://styledictionary.com) 5.5 and [`@tokens-studio/sd-transforms`](https://github.com/tokens-studio/sd-transforms) 2.0 (type alignment, math, colour modifiers and theme permutations). A build runs in three steps:

1. **Preprocess**: `preprocessor.js` aligns types, splits every font weight into weight and style, and numbers the tokens in source order.
2. **Transform**: Style Dictionary transforms only what is safe before references are resolved: names, math, colour modifiers, `rem` sizes and CSS shadows.
3. **Format**: The formats print one line per resolved token. Platform values (`UIColor(…)`, ARGB colours, `sp`/`dp`, quoting, `em`, `var(--…)`, `$…`, `@type/…` and Swift constant references) come from pure functions in `values/` and the web reference policies, which run after resolution.

Key modules in `build/`:

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
- `theme-colors.js`: The iOS `Color.swift` whose colours follow the appearance, written after the builds from the light and dark colour files
- `verify.js`: Golden check against `dist/` and the preset baselines
- `logger.js`: Logging
- `utils.js`: Token type groups and number formatting

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

The `chassis.build` key of `package.json` defines which brands, themes, screens and apps the build writes:

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
- **`screens`**: Screen sizes for responsive tokens. Set to `[]` or omit to generate single number files without screen suffixes; `source/$themes.json` must then have no screen group
- **`apps`**: App names mapped to their platforms
- **`options`**: (Optional) Style Dictionary options by platform name, merged into the options of that platform, e.g. `{ "web-px": { "outputReferences": true } }`. The build fails when it names a platform that no app uses

The token sets of each file come from `source/$themes.json`. Colour files use the sets of their theme, number files the sets of their screen, and every other file the sets of the first theme and the first screen listed here. Only the brands, themes, screens and apps listed here are built.

**Platforms:**

- `web`: SCSS variables for Chassis CSS (rem units, `var(--…)` references)
- `web-scss`, `web-px`, `web-vw`: SCSS variables for other CSS frameworks (see [below](#presets-for-other-css-frameworks))
- `ios`: Swift types, one caseless enum per file (PascalCase naming)
- `android`: XML resources (snake_case naming)
- `ios-swiftui`: Swift types with SwiftUI values (`Color`, `Font.Weight`), written to `dist/ios-swiftui/<app>/<brand>/`
- `android-compose`: Kotlin objects for Jetpack Compose (`Color`, `.dp`, `.sp`, `.em`, `FontWeight`), written to `dist/android-compose/<app>/<brand>/`, in the package `chassis.tokens` or `options["android-compose"].packageName`

**File names:**

- Web: `main.scss`, `color-light.scss`, `number-large.scss`
- iOS: `ChassisTokens.swift`, `ColorLight.swift`, `NumberLarge.swift` (types `ChassisTokens`, `ChassisTokensColorLight`, `ChassisTokensNumberLarge`), and `Color.swift` (`ChassisTokensColor`), whose colours follow the light and dark appearance
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
$cx-color-accordion-item-fg-color: #161a1b !default;
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

With references, load a colour file before `main.scss`: its colour tokens reference variables of `color-<theme>.scss`. The other files use only variables they declare themselves. The build fails when a reference names a variable that no file declares.

`outputReferences` also works on `android`: tokens print `@color/…`, `@dimen/…` references to resources of the same file. A token prints its value instead when the reference would not compile or would change the value, for example a font size in `sp` that references a size in `dp`.

On `ios`, `outputReferences` names another constant of the same class:

```json
"options": { "ios": { "outputReferences": true } }
```

```swift
public static let SizeUnit4 = DimensionBase4
public static let ColorAccordionItemFgColor = ColorContextDefaultFgMain
```

iOS and Android follow the same rule: a token names a constant or resource of its own file only when that one has the same type and value. Base colours and sizes computed with math print their values. A Swift constant cannot name one of another file.

Each platform file in `build/config/` can also be edited directly; `web-px.js`, `web-vw.js` and `web-scss.js` each call `webConfig({ unit, format })` from `web.js`.

## Documentation Site

The documentation site in `packages/site/` is built with [Astro](https://astro.build/) and the shared `@chassis-ui/docs` package. It covers the token categories, the Tokens Studio and Style Dictionary setup, and guides for web, iOS and Android projects. Its pages are in `packages/site/content/`.

```sh
# Build the chassis tokens of the docs app and run the site at http://localhost:4322/tokens/
pnpm dev

# Build the tokens and the site into _site/
pnpm build

# Build the site only
pnpm site:build
```

## Continuous Integration and Releases

Every pull request runs `.github/workflows/ci.yml`:

- **Tokens** (Node.js 22 and 24): `tokens:lint`, `tokens:lint:source`, `tokens:typecheck`, `tokens:test`, `tokens:verify`, `tokens:verify:presets`
- **Site**: `lint:prettier` (the whole repository), `site:lint`, `check:astro`, `site:build`
- **Audit**: `pnpm audit` for moderate advisories and above
- **Token diff**: the [token diff report](#token-diff-report) of the pull request against its base branch, in the job summary
- **Changeset**: a pull request that changes `source/`, `build/` or `dist/` must add a changeset (`pnpm changeset`)
- **Native iOS** (macOS, Xcode): every Swift file of `dist/` and of the preset baselines type-checked against the iOS simulator SDK, the asset catalogs compiled with `actool`, and the iOS guide's `Package.swift` built
- **Native Android**: the resources of `dist/` and of the preset baselines compiled and linked against the Android SDK, and the Compose objects compiled against Jetpack Compose, with the Gradle project in `test/native/android/`

The two native jobs run on a pull request only when it changes `source/`, `build/`, `dist/`, the preset baselines or the checks themselves, and on every push to `main`. See [Native compile checks](packages/tokens/test/README.md#native-compile-checks).

Releases use [Changesets](https://changesets.dev). Pushing `main` runs the release workflow, after the same CI checks on that commit: pending changesets open or update a "Version Packages" pull request, which bumps the version and writes the CHANGELOG. Merging it publishes `@chassis-ui/tokens` to npm with trusted publishing and provenance, and creates a GitHub release from the CHANGELOG entry. See [Releases](.github/CONTRIBUTING.md#releases). Dependabot opens weekly pull requests for npm packages, GitHub Actions and the Gradle project of the native checks; the actions are pinned to commit SHAs.

## Chassis Ecosystem

This project is part of the Chassis Design System's multi-repository architecture:

| Project                                                  | Description                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| [chassis-website](https://github.com/chassis-ui/website) | Main website and shared documentation package                |
| [chassis-css](https://github.com/chassis-ui/css)         | CSS framework and component library                          |
| [chassis-react](https://github.com/chassis-ui/react)     | React component library                                      |
| **chassis-tokens**                                       | **Design token generation and management (this repository)** |
| [chassis-icons](https://github.com/chassis-ui/icons)     | Icon library and build toolkit                               |
| [chassis-assets](https://github.com/chassis-ui/assets)   | Multi-platform asset management                              |
| [chassis-figma](https://github.com/chassis-ui/figma)     | Figma component documentation                                |

All documentation sites share the `@chassis-ui/docs` package for consistent layouts, components, and styling.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](.github/CONTRIBUTING.md) covers the setup, the conventions and what a pull request needs; please follow the [Code of Conduct](.github/CODE_OF_CONDUCT.md). Report security vulnerabilities privately, as described in [SECURITY.md](.github/SECURITY.md).

## License

MIT License — see [LICENSE](LICENSE) file for details.

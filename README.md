

# Chassis Tokens

> Design token generation and management for the Chassis Design System, supporting multi-brand, multi-theme, multi-app, and multi-platform output.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version: 0.5.3](https://img.shields.io/badge/Version-0.5.3-blue.svg)](https://github.com/chassis-ui/tokens)

## Overview

**This repository contains:**
- Design tokens in [Tokens Studio](https://tokens.studio) format (`tokens/`)
- Style Dictionary 5 build scripts with custom extensions (`build/tokens/`)
- Platform-specific output for Web (SCSS), iOS (Swift), and Android (XML), committed in `dist/`
- A test suite on real tokens, and a golden check that compares a fresh build with `dist/`
- Documentation website (`site/`)

**Key features:**
- 🎨 Multi-brand, multi-theme support with Figma Variables integration
- 🚀 Fast selective builds with CLI filtering
- 📦 Self-contained platform configurations (no shared dependencies)
- 🧪 Comprehensive test coverage with Vitest
- 📊 Progress indicators and detailed build summaries
- 🔍 Dry-run mode for previewing builds
- ✅ Golden check against the committed `dist/`, also run before every release
- ⚡ Optional responsive screen layer
- 🛠️ Centralized logging with debug mode

> [!NOTE]
> This project is part of the Chassis UI ecosystem and handles design token generation and management. It provides tools to transform design tokens from Tokens Studio format into platform-specific output (Web SCSS, iOS Swift, Android XML) with multi-brand, multi-theme, and multi-app support.

> [!WARNING]
> This project uses `pnpm` for package management and needs Node.js 22 or later. Install pnpm globally with `npm install -g pnpm` before running the commands below.


## 🚀 Quick Start

### Clone Repository

Clone the repository and install dependencies:

```sh
git clone https://github.com/chassis-ui/tokens.git chassis-tokens
cd chassis-tokens
pnpm install
```

### Generate Distribution

Transform all design tokens into platform-specific formats:

```shell
pnpm tokens
```

This generates token files for all brands, themes, apps, platforms, and screens defined in your configuration. Output is written to `dist/[platform]/[app]/[brand]/` with platform-specific formats (SCSS for web, Swift for iOS, XML for Android).

### Selective Builds

Build only specific tokens using CLI filters. When filters are applied, only matching combinations are generated:

```shell
# Filter by brand
pnpm tokens --brand chassis

# Filter by theme
pnpm tokens --theme light dark

# Filter by app
pnpm tokens --app docs

# Filter by platform
pnpm tokens --platform web ios

# Filter by screen size
pnpm tokens --screen large medium

# Combine multiple filters
pnpm tokens --brand chassis --platform web --screen large small

# Build specific brand/app for production
pnpm tokens --brand chassis --app docs --platform web
```

**Benefits:**
- Faster builds during development
- Reduced output size for targeted deployments
- Optimized CI/CD pipelines

### Verify the Output

Check that the committed `dist/` matches a fresh build of `tokens/`:

```shell
pnpm tokens:verify
```

The check builds into `dist-next/` and compares every file with `dist/`, ignoring the timestamp and version lines of the file headers. It also fails when a token name appears twice in one file. It never writes to `dist/`.

```shell
# Build and check one platform only
pnpm tokens:verify --platform ios

# Compare an existing dist-next/ without building
node build/tokens/verify.js --skip-build
```

The check also fails when a reference in the output names nothing the output declares: an Android `@type/name` without a `<type name="name">` in the same file, or a SCSS `$name` that no SCSS file of the directory declares.

The release workflow runs `pnpm tokens:verify` before publishing, so a `dist/` that does not match `tokens/` cannot be released. After changing tokens, run `pnpm tokens` and commit the updated `dist/`.

The [presets](#presets-for-other-css-frameworks) write nothing into `dist/`. Their reference output is in `build/tokens/test/golden/`, checked by:

```shell
pnpm tokens:verify:presets
```

After changing tokens, write the preset baselines again; `build/tokens/test/README.md` has the commands.

## CLI Reference

### Available Options

All filter options accept space-separated values:

- `--brand <brands...>` — Filter by brand (e.g., `chassis test`)
- `--theme <themes...>` — Filter by theme (e.g., `light dark`)
- `--app <apps...>` — Filter by app (e.g., `docs test`)
- `--platform <platforms...>` — Filter by platform (e.g., `web ios android`)
- `--screen <screens...>` — Filter by screen size (e.g., `large medium small`)
- `--out <dir>` — Write to another output root instead of `dist` (e.g., `--out dist-next`)
- `--config <file>` — Read the build configuration from a JSON file instead of `chassis.build` in `package.json`
- `--dry-run` — List the builds and the files each would write, without building
- `--help, -h` — Show help message
- `--version, -v` — Show version number

### Build Features

- **One build per token-set list**: Each brand and app is built once per list of token sets, writing the files of every platform of the app. A full build runs 16 builds.
- **Progress indicators**: Shows build status (`[1/16]`, `[2/16]`, etc.)
- **Build summary**: Displays success/failure count and total duration
- **Error handling**: Detailed error messages with optional stack traces
- **Debug mode**: Set `DEBUG=1` for verbose output
- **Selective building**: Combine filters to build only what you need

### Additional Commands

```shell
# Run test suite
pnpm tokens:test

# Check dist/ against a fresh build
pnpm tokens:verify

# Check the presets against their baselines
pnpm tokens:verify:presets

# Update version
pnpm change-version <old_version> <new_version>
```

## Release Workflow

To update the version and publish new tokens:

```sh
# Update version in package.json
pnpm change-version <old_version> <new_version>

# Build tokens and check the result
pnpm tokens
pnpm tokens:verify

# (Optional) Build documentation site
pnpm site:build
```

Pushing to `main` publishes the version in `package.json` if it is not on npm yet. The workflow runs `pnpm tokens:verify` first and stops if `dist/` is out of date.

See package scripts for more commands and options.


## Tokens Studio Format & Figma Variables

Tokens are stored in [Tokens Studio](https://tokens.studio) format, compatible with Figma variables. Example structure:

| Collection | Mode 1 | Mode 2 |
| --- | --- | --- |
| Brand | chassis | test |
| Theme | light | dark |
| App | docs | test |

See [Tokens Studio Documentation](https://docs.tokens.studio) and [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/) for more details.

## Configuration

The `chassis` key in your `package.json` defines which brands, themes, screens, and apps/platforms are available for transformation:

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

### Configuration Details

- **`brands`**: Array of brand identifiers
- **`themes`**: Array of theme variants (light, dark, etc.)
- **`screens`**: Array of screen sizes for responsive tokens. Set to `[]` or omit to generate single number files without screen suffixes; `tokens/$themes.json` must then have no screen group
- **`apps`**: Object mapping app names to their target platforms
- **`options`**: (Optional) Style Dictionary options by platform name, merged into the options of that platform, e.g. `{ "web-px": { "outputReferences": true } }`. The build fails when it names a platform that no app uses

The token sets of each file come from `tokens/$themes.json`. Colour files use the sets of their theme, number files the sets of their screen, and every other file the sets of the first theme and the first screen listed here.

**Supported platforms:**
- `web`: SCSS variables for Chassis CSS (rem units, `var(--…)` references)
- `web-scss`, `web-px`, `web-vw`: SCSS variables for other CSS frameworks (see [below](#presets-for-other-css-frameworks))
- `ios`: Swift classes (PascalCase naming)
- `android`: XML resources (snake_case naming)

**File naming conventions:**
- Web: `main.scss`, `color-light.scss`, `number-large.scss`
- iOS: `Main.swift`, `ColorLight.swift`, `NumberLarge.swift`
- Android: `main.xml`, `color_light.xml`, `number_large.xml`

Only the collections and sets defined under `build` are processed.

### Presets for Other CSS Frameworks

Chassis Tokens is meant to be owned and customized. The default `web` platform writes SCSS for [Chassis CSS](https://github.com/chassis-ui/css): theme-aware values print the CSS custom properties that Chassis CSS generates, such as `var(--default-fg-main)`. A team with its own CSS framework needs plain SCSS variables instead. Select one of these platforms for a web app:

| Platform | Format | Sizes |
| --- | --- | --- |
| `web` | `cx/scss-chassis-css` | `rem` |
| `web-scss` | `cx/scss-variables` | `rem` |
| `web-px` | `cx/scss-variables` | `px` |
| `web-vw` | `cx/scss-variables` | `vw` (16 px is `1vw`) |

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
@objc public static let SizeUnit4 = DimensionBase4
@objc public static let ColorAccordionItemFgColor = ColorContextDefaultFgMain
```

iOS and Android follow the same rule: a token names a constant or resource of its own file only when that one has the same type and value. Base colours and sizes computed with math print their values. Every Swift file declares the class `ChassisTokens`, so a constant cannot name one in another file.

Each platform file in `build/tokens/config/` can also be edited directly; `web-px.js`, `web-vw.js` and `web-scss.js` each call `webConfig({ unit, format })` from `web.js`.

## Documentation Site

The documentation site (`site/`) provides guides, API documentation, and usage examples for working with tokens and transformation scripts. It is built with [Astro](https://astro.build/) and includes:

- How to extend or customize transforms
- How to structure tokens for brands/themes/apps/screens
- Advanced usage and troubleshooting
- Reference documentation for all build scripts
- Guides for integrating tokens into your design system

### Local Development

To run the documentation site locally:

```sh
pnpm dev
```

This will start Astro on [http://localhost:4322](http://localhost:4322) (default port). You can browse and edit documentation live.

### Building the Site

To build the static documentation site for deployment:

```sh
pnpm site:build
```

The output will be generated in the `_site/` directory.

### Keeping Documentation Up to Date

To ensure documentation references the latest tokens, build tokens before building the site:

```sh
pnpm build
```

This builds the `chassis` tokens for the `docs` app (`pnpm tokens:site`) and then the site.

### Editing Documentation

All documentation content is stored in `site/content/`. You can add or edit guides, API docs, and usage examples using Markdown or MDX files.

## Development & Testing

### Running Tests

The tests use real tokens and the committed `dist/`, not mocks of Style Dictionary:

```sh
# Run all tests, including the golden check
pnpm tokens:test
```

**Test coverage includes:**
- The golden check: a full build must match `dist/`
- The build plan, CLI filters and platform configurations
- The value encoders for iOS, Android and web, and their references
- The web `var(--…)` reference policy
- The preprocessor, filters, transforms and token order
- Logger output

See [build/tokens/test/README.md](build/tokens/test/README.md) for the test files and fixtures.

### Debugging

For verbose output with stack traces:

```sh
DEBUG=1 pnpm tokens --brand chassis
```

### Build Architecture

The build system uses:
- **Style Dictionary 5.5**: Token transformation engine (Node.js 22 or later)
- **Tokens Studio SD Transforms 2.0**: Type alignment, math, colour modifiers and theme permutations
- **Self-contained platform configs**: Each platform (web and its presets, iOS, Android) has its own configuration file
- **Vitest**: Testing framework
- **Pure Node.js**: No external CLI parsing dependencies

A build runs in three steps:

1. **Preprocess**: `preprocessor.js` aligns types, splits every font weight into weight and style, and numbers the tokens in source order.
2. **Transform**: Style Dictionary transforms only what is safe before references are resolved: names, math, colour modifiers, `rem` sizes and CSS shadows.
3. **Format**: The formats print one line per resolved token. Platform values (`UIColor(…)`, ARGB colours, `sp`/`dp`, quoting, `em`, `var(--…)`, `$…`, `@type/…` and Swift constant references) come from pure functions in `values/` and the web reference policies, which run after resolution.

**Key modules:**
- `build/tokens/build.js`: Build plan (one Style Dictionary instance per token-set list) and CLI
- `build/tokens/config/`: Platform-specific configurations
- `build/tokens/preprocessor.js`: Token preprocessing
- `build/tokens/filters.js`: Which tokens go into which file
- `build/tokens/transforms.js`: Custom value transforms that run before resolution (`rem`, `px` and `vw` sizes, CSS shadows)
- `build/tokens/formats.js` and `build/tokens/templates/`: Output formats; `templates/references.js` finds the token that an iOS or Android reference names
- `build/tokens/values/`: Value encoders for iOS, Android and web
- `build/tokens/reference-policy.js`: Which web tokens print a reference and which token it names, shared by both web formats
- `build/tokens/css-var-policy.js`: The `var(--…)` names of the Chassis CSS format
- `build/tokens/scss-var-policy.js`: The values and `$…` names of the SCSS variables format
- `build/tokens/verify.js`: Golden check against `dist/` and the preset baselines
- `build/tokens/logger.js`: Centralized logging utilities
- `build/tokens/utils.js`: Token type groups and number formatting

## Chassis Ecosystem

This project is part of the Chassis Design System's multi-repository architecture:

| Project | Description |
|---------|-------------|
| [chassis-website](https://github.com/chassis-ui/website) | Main website and shared documentation package |
| [chassis-css](https://github.com/chassis-ui/css) | CSS framework and component library |
| **chassis-tokens** | **Design token generation and management (this repository)** |
| [chassis-icons](https://github.com/chassis-ui/icons) | Icon library and build toolkit |
| [chassis-assets](https://github.com/chassis-ui/assets) | Multi-platform asset management |
| [chassis-figma](https://github.com/chassis-ui/figma) | Figma component documentation |

All documentation sites share the `@chassis-ui/docs` package for consistent layouts, components, and styling.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Build and test: `pnpm tokens && pnpm tokens:verify && pnpm tokens:test`
5. Commit your changes: `git commit -m "feat: add my feature"`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) file for details.


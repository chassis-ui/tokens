# Changelog

## [0.6.0] - 2026-09-27

The token build was rewritten on Style Dictionary 5.5, and the iOS and Android output was fixed so that it compiles and holds values the platforms can use. The web SCSS output is the same apart from one renamed token and one font style. The npm package now holds the iOS and Android files too.

### Breaking changes

Web:

- `$cx-space-website-content-headers-gap` in `number-small.scss` is now `$cx-space-website-content-header-gap`, the name the medium and large files use. Rename it where you use it
- `package.json` has an `exports` map, so Node and bundlers resolve only `@chassis-ui/tokens/dist/…` and `@chassis-ui/tokens/package.json`. Every `dist/` path works as before; import nothing else from the package

iOS:

- Each file declares its own type, and `Main.swift` is now `ChassisTokens.swift`. The types are `ChassisTokens` (main file), `ChassisTokensString`, `ChassisTokensColorLight`, `ChassisTokensColorDark`, `ChassisTokensNumber<Screen>` and the new `ChassisTokensColor`. They are caseless `enum`s without `@objc`, not classes. Replace `ChassisTokens.X` from a colour, number or string file with that file's type, such as `ChassisTokensColorLight.ColorContextDefaultBgMain`, or use `ChassisTokensColor` for colours that follow dark mode
- Font weights are `UIFont.Weight` (`UIFont.Weight.regular`), not `String` (`"regular"`). Pass them to `UIFont.systemFont(ofSize:weight:)` directly and remove any name-to-weight mapping
- Line heights that are a percentage in the design are points (`CGFloat(120)` for a 96 pt font at 125%), not the percentage (`CGFloat(125)`). Use the value as the line height
- Gradient tokens are an `…Angle`, and a `…Stop<N>Color` and `…Stop<N>Position` per stop. The single gradient constant, which held the first stop colour only, is gone

Android:

- Opacity and letter spacing tokens are `<item type="dimen" format="float">`, not `<integer>` (which did not compile). Read them with `ResourcesCompat.getFloat(resources, R.dimen.…)`, and reference them as `@dimen/…`
- Font weights are `<integer>` from 100 to 900 (`400`), not `<string>` (`regular`). Read them with `resources.getInteger(R.integer.…)`
- Letter spacing of typography tokens is in ems of the font size (`-0.0052`), not design pixels (`-0.5`). Pass it to `TextView.setLetterSpacing` or `android:letterSpacing` as it is. The standalone letter spacing scale stays in pixels
- Line heights that are a percentage in the design are `sp` (`120sp`), not the percentage (`125sp`)
- Gradient tokens are an `…_angle`, and a `…_stop_<n>_color` and `…_stop_<n>_position` per stop, instead of one colour resource

Build:

- The build needs Node.js 22 or later, and `engines` says so. npm and pnpm warn when a project that installs the package runs an older Node.js; they refuse only with `engine-strict`

### Presets for other CSS frameworks

The presets for teams that do not use Chassis CSS are kept, in the new structure: `web-px`, `web-vw`, the `cx/scss-variables` format, and `outputReferences` for SCSS and Android. Their output is the same as before, with these fixes:

- `web-px` typography maps divide the letter spacing by the base font size, as `web-vw` does: `-0.5px` prints `-0.0313em`, not `-0.5em`
- Android references are printed only when they compile and keep the value. 30 lines now print their value: 16 letter spacing references to a `<dimen>` as `@integer/…`, 8 font sizes in `sp` that referenced a size in `dp`, and 6 `rgba()` colours that referenced another element or lost their alpha
- A SCSS variables reference to a variable that no file declares fails the build

`outputReferences` now also works on iOS (new): a Swift constant names another constant of the same class, such as `SizeUnit4 = DimensionBase4`, with the same rule as Android.

### Changed

- Upgraded to Style Dictionary 5.5 and `@tokens-studio/sd-transforms` 2.0; the build now needs Node.js 22 or later
- Moved platform value encoding (`UIColor(…)`, ARGB colours, `sp`/`dp`, quoting, `em` units, `var(--…)` references) out of the output templates into tested modules (`build/values/` and the web reference policies), which run on fully resolved tokens
- Build one Style Dictionary instance per token-set list instead of one run per file group: a full build runs 16 builds instead of 36 and takes about 6 s instead of 20 s
- Replaced the copy of the sd-transforms preprocessor with the official type alignment plus the Chassis steps (letter spacing as a number, splitting every font weight into weight and style)
- The file header reads the version from `package.json`
- `--dry-run` lists the builds and the files each would write
- The build fails on a broken token reference, and when `source/$themes.json` has no token sets for a configured brand, app, theme or screen
- Replaced the mock-based tests with tests on real tokens and `dist/`
- The npm package holds all of `dist/`: the iOS and Android files (Swift, XML, the icon asset catalog and drawables) as well as the web SCSS. It held the SCSS files and the asset catalog's `Contents.json` files only
- `package.json` has an `exports` map: `@chassis-ui/tokens/dist/*` and `@chassis-ui/tokens/package.json`. Every `dist/` path resolves as before; other paths in the package no longer resolve through Node
- `pnpm check` fails when one of its steps fails; it ran them in the background and always passed
- Updated the dev dependencies within their ranges, among them Astro 7.3, so `pnpm audit` reports no advisory (it reported 39, one critical). The token build packages (Style Dictionary, sd-transforms, svg2vectordrawable, tinycolor2) and the Chassis CSS and docs packages the site uses kept their versions
- The release workflow publishes only after the CI checks pass on the same commit, installs with `--frozen-lockfile`, and pins its actions to commit SHAs
- Releases use Changesets: a pull request that changes the package adds a changeset, and the release workflow turns them into a "Version Packages" pull request that bumps the version and writes this CHANGELOG. The package is published with npm trusted publishing (no npm token) and provenance, and the GitHub release holds the CHANGELOG entry
- The repository is a pnpm workspace: this package is built and published from `packages/tokens/`, with only the build's dependencies, and the documentation site is a separate private package in `packages/site/`. The token files are in `source/`, the build in `build/` and its tests in `test/` of the package. The npm page shows a README for the package instead of the repository's. The package contents did not change

### Added

- `pnpm tokens:verify`: builds into `dist-next/` and compares every file with `dist/`; the release workflow runs it before publishing. It also fails on a reference that names nothing the output declares
- `--out <dir>` build option
- `web-scss` platform: SCSS variables with resolved values in rem units, for CSS frameworks other than Chassis CSS
- `chassis.build.options`: Style Dictionary options by platform, such as `outputReferences`
- `--config <file>` build option, to read the build configuration from a JSON file
- `pnpm tokens:verify:presets`: checks each preset against its baseline in `test/golden/`
- `ios-swiftui` and `android-compose` platforms: Swift files with SwiftUI values and Kotlin objects for Jetpack Compose, with the same tokens and values as `ios` and `android`, written to `dist/ios-swiftui/` and `dist/android-compose/`
- `outputReferences` for the iOS format: a constant names another constant of the same class when it has the same type and value; base colours and sizes computed with math print their values
- CI for pull requests (`.github/workflows/ci.yml`): token lint, tests and golden checks on Node.js 22 and 24, the site lint and build, and `pnpm audit`
- A Swift package: `Package.swift` at the root of the repository has one library for every app and brand with an iOS platform, `ChassisTokensDemoChassis` and `ChassisTokensDemoSinefil`, on the files of `dist/ios/` with the icon catalog as a resource. iOS apps install the tokens with Swift Package Manager from the repository's URL and the version's tag. `pnpm tokens:swift-package` writes the manifest from `chassis.build`
- An Android library: every GitHub release has the `res/` tree of each app and brand as `chassis-tokens-<app>-<brand>-<version>.aar`, with the resources in `chassis.tokens.R`. `pnpm tokens:aar` builds them
- Native compile checks, run in CI when the tokens, the build or the output change, and before every release: the Swift files against the iOS simulator SDK, the asset catalogs with `actool` and a sample that uses the Swift package (`pnpm tokens:native:ios`, needs Xcode), and the Android resources, the Compose objects and a sample app that uses the Android library against the Android SDK and Jetpack Compose (`pnpm tokens:native:android`, a Gradle project in `test/native/android/`)
- Type checking of the build code (`pnpm tokens:typecheck`, TypeScript `checkJs` on `build/`), run in CI
- A token source lint (`pnpm tokens:lint:source`, `build/lint-tokens.js`), run in CI: it names the token set and token when the themes or screens declare different names, a name is unusable on a platform or collides with another, a font weight is unknown, a token has no type, or one name has two types
- A token diff report (`pnpm tokens:diff`, `build/diff.js`): the names added, removed, renamed and changed in value in each `dist/` file against another branch or commit. CI writes it to the job summary of every pull request
- Dependabot for npm packages and GitHub Actions, weekly
- `pnpm lint:prettier`: Prettier on the whole repository

### Removed

- The unused `cx/typography/web` and `cx/test` transforms, the `cx/test` format and the `cx/colorTokens` filter
- The `site:lint:vnu` script and the `vnu-jar` dependency, which `html-validate` replaced, and the `tokens:zip` script
- The `check:lockfile` script and the `lockfile-lint` dependency: it read `package-lock.json`, which this pnpm repository does not have

### Fixed

- Android opacity and letter spacing tokens are float resources (`<item type="dimen" format="float">`) instead of `<integer>`. Android rejects fractions such as `0.4` in integer resources, so `main.xml` and the number files did not compile. Read them with `ResourcesCompat.getFloat`; references to them are `@dimen/…`
- Renamed `space.website.content.headers-gap` to `space.website.content.header-gap` in the small screen token set, so every screen declares the same name. On Android, the small screen had no value for `header-gap` in the default folder
- iOS and Android line heights that are a percentage in the design (`125%`, `150%`) are sizes of the typography token's font size: `FontContextJumboLineHeight` is `CGFloat(120)` and `font_context_jumbo_line_height` is `120sp`, not `125`. 9 typography tokens per file of `Main` and the number files
- Android letter spacing of typography tokens is in ems of their font size, which `TextView.setLetterSpacing`, `android:letterSpacing` and Compose's `em` take: `font_context_jumbo_letter_spacing` is `-0.0052`, not `-0.5`. The standalone letter spacing scale stays in design pixels
- iOS and Android font weights are weights instead of names: `UIFont.Weight.semibold` on iOS and `<integer>600</integer>` on Android, not `"semi-bold"`. They use the web's name map, so `Semi Bold` and `SemiBold`, which the tokens keep as each font's style name in Figma, are both 600. An unknown weight name fails the build
- iOS and Android gradient tokens are split into an angle and the colour and position of each stop (`GradientPrimitiveBlackL000Angle`, `…Stop1Color`, `…Stop1Position`; `gradient_primitive_black_l_000_angle` and so on). They held only the first colour stop, which is transparent for most gradients. The single gradient constant and resource are gone. With `outputReferences`, the stop colours name the colours they reference. A gradient that is not a `linear-gradient` with degrees or a side keyword fails the build
- Each iOS file declares its own type, so all seven files can be in one target: `ChassisTokens` in `ChassisTokens.swift` (was `Main.swift`, which Swift Package Manager took for an executable's entry point), and `ChassisTokensString`, `ChassisTokensColorLight`, `ChassisTokensColorDark` and `ChassisTokensNumber<Screen>` in the other files. Every file declared `class ChassisTokens`, so two files in one module did not compile. The types are caseless enums without `@objc`, which had no effect: the class was not visible to Objective-C. Write `ChassisTokensColorLight.ColorContextDefaultBgMain` instead of `ChassisTokensLight.ChassisTokens.ColorContextDefaultBgMain`
- New iOS file `Color.swift` with the type `ChassisTokensColor`: every theme colour once, and a colour that differs between the light and dark theme follows `userInterfaceStyle`. Apps no longer combine `ChassisTokensColorLight` and `ChassisTokensColorDark` themselves; both files stay. The build writes it after the other builds when the themes include `light` and `dark`, and fails when the two themes declare different colour constants
- The Android build also writes a resource tree under `res/`: `values` (strings, base colours in `color_base.xml`, light colours, small screen numbers), `values-night` (dark colours), `values-sw600dp` (medium) and `values-sw840dp` (large). Apps add it as a Gradle resource folder instead of copying files with a script. The screen folders are set with `chassis.build.options.android.screens`; the build fails when a screen has no folder or not exactly one screen is in the default folder. The flat files stay
- The icon tokens are also icon assets: `Icons.xcassets` for iOS, with one vector image set per icon rendered as a template, and one vector drawable per icon in `res/drawable/` for Android, converted with `svg2vectordrawable` (new dev dependency). The string tokens stay
- iOS box shadows have a `…Radius` constant after their blur, half the CSS blur, for `CALayer.shadowRadius` (`ShadowContextSmall1Radius = CGFloat(4)`). The shadow colour already carries the opacity: use it with `shadowOpacity = 1`
- The `sinefil` blockquote font weight is `Light Italic` instead of `Light Oblique`, the style name Figma and Google Fonts use for Source Serif 4. Its font style prints `italic` instead of `oblique` on web, iOS and Android
- Android string resources are escaped. The SVG icon tokens held raw markup, which Android's resource compiler drops, so every icon compiled to an empty string; now each compiles to its SVG text
- Rewrote the web, iOS and Android guides of the documentation site; their examples used token names and file setups that do not exist or do not compile

## [0.5.3] - 2026-09-25

### Fixed

- Removed the `modify.space` preset token and hardcoded `srgb` directly in each color's lighten/darken modifier, since Figma doesn't resolve token references inside a modifier's `space` property. `modify.lighten.*`/`modify.darken.*` value references are unaffected.

## [0.5.2] - 2026-09-24

### Changed

- Dark mode context base colors mapped to scale 40

## [0.5.1] - 2026-09-25

### Added

- Dedicated `borderRadius.base.*` tokens for the alert, dropdown (main/item), modal, and notification components, replacing shared `borderRadius.context.*` references
- Shared `modify.space`/`modify.lighten.*`/`modify.darken.*` preset tokens for color lighten/darken modifiers

### Changed

- Renamed the `example` brand to `sinefil` (`base/brand-example` → `brand-sinefil/brand-base`)
- Renamed the `metric-px` token set to `metric-source`
- Reworked brand color lighten/darken modify tokens to reference the shared `modify.*` presets instead of duplicating raw values per color
- Changed the segment component's active foreground/background colors from white/default-cue to the primary context's contrast/base colors

## [0.5.0] - 2026-09-19

### Added

- `demo-a` and `demo-b` brands, each with their own base, app, and (for `demo-b`) mobile/web/metric token sets
- `segment` component tokens (color, size, spacing, border-radius, and box-shadow) for a new segmented-control component
- `page.bg-body`/`page.bg-section` color tokens for the demo app

### Changed

- Set the default brand's `text`/`display` font families to Open Sans and Merriweather, and its `strong` font weight from Bold to SemiBold
- Abbreviated long-form scale-step names (e.g. `medium` → `md`, `xlarge` → `xl`) in generated `var(--...)` references for shadow, border-radius, and border-width tokens, matching chassis-css's own custom property names
- Reworked `alert`/context box-shadow tokens to reference shared `shadow.elevation.default.*` presets instead of duplicating drop-shadow layer definitions
- Corrected the package repository URL format in package.json (`git+https://...`)
- Upgraded `@chassis-ui/css` and `@chassis-ui/docs` to `0.5.0-0`

## [0.4.0] - 2026-08-25

### Changed

- Renamed `date-picker` component tokens to `datepicker` across base, brand, and theme token files
- Reduced datepicker day cell size from `size.unit.40` to `size.unit.32` and bound its border-radius tokens to a dedicated `borderRadius.base.datepicker` group instead of generic context tokens
- Renamed datepicker `menu-width` size token to `preset-width`
- Doubled the active pagination dot width (`dot-active-w`) from `size.unit.8` to `size.unit.16`
- Moved Pagefind's search index under a `tokens/pagefind` subdirectory (`site:pagefind` output and dev-server copy path) to match the site's production path prefix
- Reworked the dev-only Vite config in `site/src/libs/astro.ts` to alias `@chassis-ui/css` to its built JS entry and exclude `@chassis-ui/docs` from dependency optimization, preventing duplicate module instances during `astro dev`
- Replaced inline `<svg><use></svg>` icon markup in the homepage hero with the `@chassis-ui/docs` `Icon` shortcode
- Restructured `site/config.yml` social/org fields (`github_org`, `x` → `x_username`, added `figma_handle`) and updated the corresponding config schema
- Upgraded `@chassis-ui/docs` and other dependencies; bumped `pnpm/action-setup` and `softprops/action-gh-release` versions in the publish-release workflow

### Fixed

- Hero section "Get Started" clone command referencing the wrong repository

## [0.3.0] - 2026-07-04

### Added

- HTML validation build script (build/html-validate.js) replacing the vnu-jar based site:lint:vnu step
- Pagefind site search integration (pagefind.yml, site:pagefind script)
- Additional design token documentation content (border-radius, border-width, font, opacity, shadow, size, space, and typography tokens)
- `fg-active`/`bg-active` color tokens for every context role (default, alternate, primary, secondary, neutral, danger, success, warning, info, black, white)
- `4xlarge` border-radius scale step
- Explicit primary/secondary brand base colors for the chassis and example brands
- Alert component box-shadow token

### Changed

- Renamed homepage section components folder from sections/ to homepage/
- Refactored SCSS chassis-css and scss-variables build templates
- Reworked site/src/libs/astro.ts, config.ts, data.ts, and shortcode.ts helpers
- Replaced Prism code highlighting with Shiki
- Updated Astro, PostCSS, and TypeScript configuration for the docs site
- Renamed `color.*.palette.*` token group to `color.*.primitive.*` across base, theme, and effect tokens
- Consolidated pixel-based border-radius presets (`round`, `round-8` … `round-96`) into a single `full` token
- Updated breakpoint and container sizing scale to standard values (breakpoints 992/1200/1400 → 1024/1280/1536; containers 1140/1320 → 1200/1440)
- Replaced elevation-based box-shadow references (`shadow.elevation.default.*`) with semantic `shadow.context.small/medium/large` tokens
- Redesigned chevron-down icon asset used by the accordion indicator, button caret, and select caret
- Reassigned progress, tab, and edit component color roles from primary/neutral contexts to default/warning contexts
- Split `large-gap`/`small-gap` spacing tokens into `-main` and `-body` variants; adjusted dropdown and modal padding/gap values
- Regenerated all distribution files and token theme definitions for Android, iOS, and web platforms
- Refreshed getting-started and use-in-project documentation (Figma Variables, Style Dictionary, Tokens Studio, Android/iOS/Web application guides)

### Removed

- Unused site shortcodes and libs: Code.astro, Example.astro, ResponsiveImage.astro, chassis.ts, placeholder.ts, prism.ts, algolia-plugin.js
- Unused static scripts: example-mode.js, validate-forms.js
- `preview` root script (superseded by `astro:preview`)
- `brand` and `accent` semantic color contexts (primitive-level brand/accent color scales remain available)
- Chassis brand-specific modal spacing overrides (now inherit from base tokens)

## [0.2.0] - 2026-05-11

### Added

- GitHub Actions publish-release workflow (.github/workflows/publish-release.yml)
- Token distribution zip build script (build/zip-tokens.js) and `tokens:zip` script

### Changed

- Upgraded Astro, ESLint, and related devDependencies
- Switched `@chassis-ui/css` and `@chassis-ui/docs` from git branch references to published npm versions
- Refactored website sections and homepage copy
- Updated package descriptions and site configuration

### Removed

- Legacy release workflow (.github/workflows/release.yml)
- Unused site assets: application.js, color-modes.js, search.js, sidebar.js, snippets partials, Blockquote.astro, window.d.ts, docs-versions.yml, versions.astro

## [0.1.4] - 2026-04-16

### Added

- IntroSection component for homepage
- Brand-specific token configuration (brand-chassis/brand-base.json)

### Changed

- Reorganized website components into dedicated sections/ folder
- Renamed section components for consistency (SectionHero, SectionFeatures, SectionHow, etc.)
- Updated brand tokens structure and values
- Regenerated all distribution files for Android, iOS, and web platforms
- Improved README documentation
- Refactored homepage layout and structure

### Removed

- HOMEPAGE_COPY_REVIEW.md documentation file
- CoreSection component (replaced by IntroSection)
- Deprecated index2.astro page

## [0.1.3] - 2026-04-12

### Added

- Comprehensive homepage copy review and recommendations (HOMEPAGE_COPY_REVIEW.md)
- FeatureCard component implementation across all homepage sections

### Changed

- Standardized all homepage sections to use FeatureCard component
- Unified icon naming convention to cx- prefix (cx-clock, cx-check-circle, cx-code, etc.)
- Updated SectionTeams, SectionFeatures, SectionRoles, SectionHow, SectionTech to use Fragment slots
- Improved homepage copy to be pre-launch appropriate (removed customer claims)
- Enhanced hero messaging to emphasize automation and consistency

### Fixed

- Icon references from old naming (-outline suffix) to standardized cx- prefix
- Slot implementation from div to Fragment for proper Astro component usage

## [0.1.2] - 2026-04-11

### Fixed

- Website screen tokens font size and spacing references
- Token naming consistency for content layout gaps

### Changed

- Regenerated distribution files for Android and iOS platforms
- Updated example brand distribution files

## [0.1.1] - 2026-04-08

### Added

- Astro-based documentation site with comprehensive guides
- Documentation for Tokens Studio, Style Dictionary, Figma Variables
- Quick start guide and color tokens documentation
- Border radius base tokens
- Screen-specific tokens (small, medium, large)

### Changed

- Upgraded to Style Dictionary v4 with complete build system refactor
- Improved build system with enhanced format templates
- Updated SCSS variable and CSS templates with prefix support
- Changed build output path to `platform/app/brand/`
- Enhanced sync-submodules.js script
- Improved change-version.js with better error handling and validation
- Moved font weights and line heights to brand group
- Updated package name to `@chassis-ui/tokens`

### Fixed

- SCSS variables template font token output
- Mode switches for default brand
- Button color tokens
- Badge padding and size issues
- Unknown flag detection in version script
- File count summary to include package.json

## [0.1.0] - 2025-02-15

### Initiated

- Initial setup of project structure.
- Added basic configuration files.
- Created initial set of tokens.
- Set up version control with Git.
- Project licensed under the MIT license.

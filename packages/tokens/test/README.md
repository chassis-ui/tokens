# Token build tests

Tests for the token build in `build/` of the `@chassis-ui/tokens` package (`packages/tokens/` in the repository). Paths below are relative to that folder. Run them from the repository root:

```sh
pnpm tokens:test
```

The run takes about 10 seconds, most of it for the golden test, which builds every file and every preset.

## Principles

- **Real tokens, not mocks.** Tests use tokens from `source/`, resolved tokens captured from the real build, the real `package.json` configuration and `source/$themes.json`. No test mocks `style-dictionary`.
- **`dist/` is the reference.** Expected values come from the committed `dist/`. The build must not change what it writes, so a test that disagrees with `dist/` is a bug in the build, not in `dist/`.
- **Presets have baselines.** The presets for other CSS frameworks (`web-scss`, `web-px`, `web-vw`) write nothing into `dist/`. Their reference output, with and without `outputReferences`, is in `golden/`.
- **Pure functions first.** Value encoding, the web reference policy, the build plan and argument parsing are pure functions, tested without running Style Dictionary.

## Test files

| File                                                                 | What it checks                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `golden.test.js`                                                     | A full build into a temporary directory matches `dist/` file by file, apart from the timestamp and version header lines. Same check as `pnpm tokens:verify`. Every preset matches its baseline in `golden/`. Same check as `pnpm tokens:verify:presets`.                                                       |
| `verify.test.js`                                                     | The check that every `@type/name`, `$name` and Swift constant reference in the output names something the output declares.                                                                                                                                                                                     |
| `diff.test.js`                                                       | The token diff report: the declarations it reads from every `dist/` file, renames, value changes, additions and removals recreated from real commits (the `headers-gap` rename, Phases 14, 21 and 22), header-only rebuilds, icon assets and the Markdown report.                                              |
| `lint-tokens.test.js`                                                | The token source lint: the real `source/` passes, and each rule fails on a broken copy of `fixtures/lint-tokens.json`, among them the `headers-gap` mistake, with the token set and token named.                                                                                                               |
| `swift-package.test.js`                                              | The Swift package manifest: one library for every brand of every app with an iOS platform, named after app, brand and platform, with the icon catalog as a resource; the committed `Package.swift` at the root of the repository is the manifest of the real configuration; no type is named like its library. |
| `build.test.js`                                                      | The build plan: one build per brand, app and token-set list, the files it writes (exactly those of `dist/`), CLI filters and their unknown values, and that `brand-chassis/brand-base` overrides `base/brand-base`.                                                                                            |
| `cli.test.js`                                                        | Command line arguments of `build.js`, and reading the build configuration with its platform options.                                                                                                                                                                                                           |
| `config.test.js`                                                     | The Style Dictionary configuration of a build: source, preprocessor, error policy, output paths, and the file, filter and format of each output.                                                                                                                                                               |
| `preprocessor.test.js`                                               | Type alignment, the font weight and style split, the font weight path and the source order.                                                                                                                                                                                                                    |
| `filters.test.js`                                                    | Which tokens go into `main`, `color-*`, `number-*` and `string`, the shadows and their color parts, and the groups for Figma only.                                                                                                                                                                             |
| `transforms.test.js`                                                 | The `cx/size/rem`, `cx/size/px`, `cx/size/vw` and `cx/shadow/web` transforms, and `ts/resolveMath` without rounding on the web.                                                                                                                                                                                |
| `formats.test.js`                                                    | Tokens are printed in source order, including tokens that Style Dictionary expands. The SCSS template names variables of other files and throws when no file declares one. The Android and iOS templates print references only with `outputReferences`.                                                        |
| `values-ios.test.js`, `values-android.test.js`, `values-web.test.js` | The value encoders in `values/`, and when an Android or iOS token prints a reference.                                                                                                                                                                                                                          |
| `theme-colors.test.js`                                               | The iOS `Color.swift`: how light and dark constants combine, the checks on them, and which output directories get the file.                                                                                                                                                                                    |
| `values-swiftui.test.js`, `values-compose.test.js`                   | The SwiftUI and Compose encoders: every iOS and Android fixture case in SwiftUI and Kotlin form, strings, negative numbers, `em` and references.                                                                                                                                                               |
| `icons.test.js`                                                      | The icon assets: which tokens are icons, the Xcode image sets, the Android drawables, and which builds write them.                                                                                                                                                                                             |
| `values-shared.test.js`                                              | The gradient helpers both mobile encoders share: which tokens are gradients, reading a `linear-gradient(…)`, and the parts iOS and Android print for it.                                                                                                                                                       |
| `reference-policy.test.js`                                           | The rules both web reference policies share: which tokens print a reference and which token it names.                                                                                                                                                                                                          |
| `css-var-policy.test.js`                                             | Which web tokens print a `var(--…)` reference, the name of the custom property, and typography maps.                                                                                                                                                                                                           |
| `scss-var-policy.test.js`                                            | The values of the `cx/scss-variables` format: resolved values, resolved typography maps, the letter spacing of `web-px`, and SCSS variable references with `outputReferences`.                                                                                                                                 |
| `utils.test.js`                                                      | The token type groups.                                                                                                                                                                                                                                                                                         |
| `logger.test.js`                                                     | Log output.                                                                                                                                                                                                                                                                                                    |

## Fixtures

The files in `fixtures/` are snapshots taken from the real build on 2026-09-27. Each has a `source` field that says where its data comes from.

| Fixture                    | Used by                                                                    | Contents                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mobile-tokens.json`       | `values-ios`, `values-android`, `values-shared`, `theme-colors`, `formats` | Resolved iOS and Android tokens, with the lines `dist/` prints for them; Android and iOS tokens with outputReferences, their targets and the lines of their baselines; typography parts with the font size they are encoded with; gradient tokens with their parts in `dist/` and the baselines; light and dark constants of the color files |
| `web-tokens.json`          | `values-web`, `transforms`                                                 | Resolved web tokens and transform inputs, with the values `dist/` prints                                                                                                                                                                                                                                                                     |
| `css-var-tokens.json`      | `css-var-policy`                                                           | Web tokens under test with the lines `dist/` prints, and every token they look up                                                                                                                                                                                                                                                            |
| `filter-tokens.json`       | `filters`, `transforms`                                                    | One web token per type, color group and result, with the files of `dist/` that declare it                                                                                                                                                                                                                                                    |
| `preprocessor-tokens.json` | `preprocessor`                                                             | Token slices copied from `source/`, in source form                                                                                                                                                                                                                                                                                           |
| `lint-tokens.json`         | `lint-tokens`                                                              | The chassis brand, light and dark themes and three screens of `$themes.json` with the sets they enable, and slices of those sets: the font weights of both brand sets, six theme colors and the theme switches, and the four screen sets in full                                                                                             |
| `scss-var-tokens.json`     | `scss-var-policy`, `formats`                                               | Tokens of the `web-px`, `web-vw` and `web-scss` presets and of `web-px` with `outputReferences`, with the lines of their baselines and the variables they name                                                                                                                                                                               |

When tokens change, the fixtures stay valid: they hold their own copies. When the build is meant to change its output, which the rewrite plan does not allow, update the expected values from the new `dist/` in the same commit.

## Preset baselines

`golden/` holds the reference output of the presets, for the brand `chassis`:

| Entry           | Contents                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<preset>.json` | The build configuration of the check, in the form of `chassis.build` in `package.json`. A preset with this file is checked by `golden.test.js` and `pnpm tokens:verify:presets`. |
| `<preset>/`     | The files the preset must write.                                                                                                                                                 |

`web-px-references`, `android-references` and `ios-references` are `web-px`, `android` and `ios` with `outputReferences`, set in their configuration files under `options`.

Check one preset (from `packages/tokens/`), or all (from the repository root):

```sh
node build/verify.js --preset web-px
pnpm tokens:verify:presets
```

### Where the baselines come from

They were built on 2026-09-27 from the build before the rewrite: commit `a072bf9` of `main`, `style-dictionary` 4.4.0, `@tokens-studio/sd-transforms` 1.3.0, `tinycolor2` 1.6.0, Node 24. In an empty directory outside the repository, with `REPO` set to the path of the repository:

```sh
git -C "$REPO" archive a072bf9 build/tokens tokens package.json | tar -x
# In package.json, keep name, version, type and chassis, and set devDependencies to the
# three versions above. Then:
pnpm install --ignore-workspace
```

The archive has the layout of that commit (`build/tokens/`, `tokens/`). For each baseline, restore `build/tokens/config/` from the archive, make the changes of the table, run the build and keep `dist/`:

```sh
node build/tokens/build.js --brand chassis
```

| Baseline             | `chassis.build.apps`      | Change in `build/tokens/config/`                    |
| -------------------- | ------------------------- | --------------------------------------------------- |
| `web-px`             | `{ "docs": ["web-px"] }`  | none                                                |
| `web-vw`             | `{ "docs": ["web-vw"] }`  | none                                                |
| `web-scss`           | `{ "docs": ["web"] }`     | `web.js`: `format` is `'cx/scss-variables'`         |
| `web-px-references`  | `{ "docs": ["web-px"] }`  | `web-px.js`: `outputReferences: true` in `options`  |
| `android-references` | `{ "demo": ["android"] }` | `android.js`: `outputReferences: true` in `options` |

`ios-swiftui` and `android-compose` have no old output either. They were written on 2026-09-27 by the current build and accepted after every constant was compared with the same constant of `dist/ios` and `dist/android` (20589 each, none differ), and after compiling them: SwiftUI with `swiftc` against the macOS SwiftUI framework, Kotlin with `kotlinc` 2.4.20 against stand-ins with the signatures of `androidx.compose`.

Three baselines differ from the old output on purpose. In `main.scss` of `web-px` and `web-px-references`, three typography maps hold the letter spacing that `web-scss` and `web-vw` print. The old build printed the pixel number with `em`:

| Variable                         | Old build | Baseline    |
| -------------------------------- | --------- | ----------- |
| `$cx-font-context-jumbo`         | `-0.5em`  | `-0.0313em` |
| `$cx-font-website-hero-title`    | `-1em`    | `-0.0625em` |
| `$cx-font-website-section-title` | `-0.5em`  | `-0.0313em` |

In `android-references`, 30 lines print their value instead of the reference the old build printed, because the reference did not compile or changed the value. Each line is the line of `dist/android/demo/chassis/`:

| Tokens                                                                                                                                                            | Files              | Old build                          | Problem                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------- | ------------------------------------------ |
| `typography_letter_spacing_base_zero`, `font_context_jumbo_letter_spacing`, `font_website_hero_title_letter_spacing`, `font_website_section_title_letter_spacing` | `main`, `number_*` | `@integer/size_unit_…`             | the target is a `<dimen>`: no such integer |
| `font_context_jumbo_font_size`, `font_context_hero_font_size`                                                                                                     | `main`, `number_*` | `@dimen/size_unit_96`, `…_64`      | `96dp` instead of `96sp`                   |
| `bg_blur_default_color`, `bg_blur_alternate_color`                                                                                                                | `main`             | `@color/opacity_context_fg_subtle` | the target is not a `<color>`              |
| `bg_blur_default_color`, `bg_blur_alternate_color`                                                                                                                | `color_*`          | `@color/color_primitive_neutral_…` | the alpha of `rgba()` is lost              |

`ios-references` has no old output: the build before the rewrite had no iOS references. It was written on 2026-09-27 by the current build and accepted after a line-by-line comparison with `dist/ios/demo/chassis/`. Every line that prints a value equals the `dist/` line, and each of the 14237 lines that name a constant has, in `dist/`, the same value as the line that declares that constant in the same file.

### When tokens change

A change in `source/` changes `dist/` and the baselines. After the new `dist/` is built and reviewed, write each baseline again with the current build, from `packages/tokens/`, and review the difference as for `dist/`:

```sh
node build/build.js --config test/golden/web-px.json --out test/golden/web-px
```

## Native compile checks

`native/` compiles the iOS and Android output against the real SDKs. CI runs both checks (the **Native iOS** and **Native Android** jobs) on a pull request that changes `source/`, `build/`, `dist/`, the baselines or the checks, and on every push to `main`, so nobody has to install an SDK to contribute. Both checks find the output folders themselves: every folder of `dist/` and of the baselines in `golden/` with files of the platform, so a new brand, app or preset baseline is checked without a change here.

### iOS

```sh
pnpm tokens:native:ios
```

`native/ios/check.sh` needs Xcode; the command line tools alone have no iOS SDK and no asset compiler. It writes to a temporary folder only. Its steps can run alone: `native/ios/check.sh swift`, `assets` or `package`.

| Step      | What it checks                                                                                                                                                                                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `swift`   | The Swift files of each folder type-check together as one module against the iOS simulator SDK, with real UIKit and SwiftUI, for iOS 13, in the Swift 5 and the Swift 6 language mode: `dist/ios/`, and the `ios-references` and `ios-swiftui` baselines.                                                                                     |
| `assets`  | `actool` compiles each `Icons.xcassets`, and the compiled catalog holds every image set.                                                                                                                                                                                                                                                      |
| `package` | Swift Package Manager reads the `Package.swift` at the root of the repository, and the sample in `native/ios/sample/`, a package that depends on its libraries as an app does, builds for the iOS simulator with `xcodebuild`. One file of the sample reads tokens of one library, the other names two libraries that declare the same types. |

### Android

```sh
pnpm tokens:native:android
```

`native/android/` is a Gradle project. It needs a JDK (17 or later) and the Android SDK with platform 36, with `ANDROID_HOME` set or `sdk.dir` in a `local.properties` file in that folder; the Gradle wrapper downloads Gradle itself. The versions of the Android Gradle plugin, Kotlin and Compose are pinned in `gradle/libs.versions.toml`, and the Gradle version in `gradle/wrapper/gradle-wrapper.properties`; Dependabot updates them.

| Module      | What it checks                                                                                                                                                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resources` | An application module with one product flavor per check, because only an application links its resources against `android.jar`. For each output folder (`dist/android/<app>/<brand>/` and the `android-references` baseline): the `res/` tree with its drawables (`…Tree`), and each flat file alone as a values file (`…Main`, `…ColorLight`, …). |
| `compose`   | A library module with the Compose compiler: the Kotlin objects of each Compose folder (the `android-compose` baseline, and `dist/android-compose/` when an app selects the platform) compile against Jetpack Compose.                                                                                                                              |
| `library`   | A library module with one product flavor per app and brand: the `res/` tree of `dist/android/<app>/<brand>/` as an Android library. `./gradlew :library:aars` (`pnpm tokens:aar`) writes `chassis-tokens-<app>-<brand>-<version>.aar` to `library/build/aars/`; the release workflow attaches them to the GitHub release.                          |
| `sample`    | An application module that depends on each Android library, the AAR file, and reads its resources in a layout and in Kotlin, by the `R` class of the library, `chassis.tokens.R`.                                                                                                                                                                  |

`./gradlew compileTokens` runs every check; `./gradlew :resources:processDistDemoChassisTreeDebugResources` runs one.

## Checking that a test can fail

A new test should fail when the code it covers is wrong. While writing one, break the code on purpose (for example, drop an exception from the reference policy), run the test, and restore the code.

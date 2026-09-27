# Token build tests

Tests for the token build in `build/tokens/`. Run them from the repository root:

```sh
pnpm tokens:test
```

The run takes about 10 seconds, most of it for the golden test, which builds every file and every preset.

## Principles

- **Real tokens, not mocks.** Tests use tokens from `tokens/`, resolved tokens captured from the real build, the real `package.json` configuration and `tokens/$themes.json`. No test mocks `style-dictionary`.
- **`dist/` is the reference.** Expected values come from the committed `dist/`. The build must not change what it writes, so a test that disagrees with `dist/` is a bug in the build, not in `dist/`.
- **Presets have baselines.** The presets for other CSS frameworks (`web-scss`, `web-px`, `web-vw`) write nothing into `dist/`. Their reference output, with and without `outputReferences`, is in `golden/`.
- **Pure functions first.** Value encoding, the web reference policy, the build plan and argument parsing are pure functions, tested without running Style Dictionary.

## Test files

| File                                                                 | What it checks                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `golden.test.js`                                                     | A full build into a temporary directory matches `dist/` file by file, apart from the timestamp and version header lines. Same check as `pnpm tokens:verify`. Every preset matches its baseline in `golden/`. Same check as `pnpm tokens:verify:presets`. |
| `verify.test.js`                                                     | The check that every `@type/name` and `$name` reference in the output names something the output declares.                                                                                                                                               |
| `build.test.js`                                                      | The build plan: one build per brand, app and token-set list, the files it writes (exactly those of `dist/`), CLI filters, and that `brand-chassis/brand-base` overrides `base/brand-base`.                                                               |
| `cli.test.js`                                                        | Command line arguments of `build.js`, and reading the build configuration with its platform options.                                                                                                                                                     |
| `config.test.js`                                                     | The Style Dictionary configuration of a build: source, preprocessor, error policy, output paths, and the file, filter and format of each output.                                                                                                         |
| `preprocessor.test.js`                                               | Type alignment, the font weight and style split, the font weight path and the source order.                                                                                                                                                              |
| `filters.test.js`                                                    | Which tokens go into `main`, `color-*`, `number-*` and `string`.                                                                                                                                                                                         |
| `transforms.test.js`                                                 | The `cx/size/rem`, `cx/size/px`, `cx/size/vw` and `cx/shadow/web` transforms.                                                                                                                                                                            |
| `formats.test.js`                                                    | Tokens are printed in source order, including tokens that Style Dictionary expands. The SCSS template names variables of other files and throws when no file declares one. The Android template prints references only with `outputReferences`.          |
| `values-ios.test.js`, `values-android.test.js`, `values-web.test.js` | The value encoders in `values/`, and when an Android token prints a reference.                                                                                                                                                                           |
| `reference-policy.test.js`                                           | The rules both web reference policies share: which tokens print a reference and which token it names.                                                                                                                                                    |
| `css-var-policy.test.js`                                             | Which web tokens print a `var(--…)` reference, the name of the custom property, and typography maps.                                                                                                                                                     |
| `scss-var-policy.test.js`                                            | The values of the `cx/scss-variables` format: resolved values, resolved typography maps, the letter spacing of `web-px`, and SCSS variable references with `outputReferences`.                                                                           |
| `utils.test.js`                                                      | The token type groups.                                                                                                                                                                                                                                   |
| `logger.test.js`                                                     | Log output.                                                                                                                                                                                                                                              |

## Fixtures

The files in `fixtures/` are snapshots taken from the real build on 2026-09-27. Each has a `source` field that says where its data comes from.

| Fixture                    | Used by                                   | Contents                                                                                                                                                       |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mobile-tokens.json`       | `values-ios`, `values-android`, `formats` | Resolved iOS and Android tokens, with the lines `dist/` prints for them; Android tokens with outputReferences, their targets and the lines of their baseline   |
| `web-tokens.json`          | `values-web`, `transforms`                | Resolved web tokens and transform inputs, with the values `dist/` prints                                                                                       |
| `css-var-tokens.json`      | `css-var-policy`                          | Web tokens under test with the lines `dist/` prints, and every token they look up                                                                              |
| `filter-tokens.json`       | `filters`, `transforms`                   | One web token per type, colour group and result, with the files of `dist/` that declare it                                                                     |
| `preprocessor-tokens.json` | `preprocessor`                            | Token slices copied from `tokens/`, in source form                                                                                                             |
| `scss-var-tokens.json`     | `scss-var-policy`, `formats`              | Tokens of the `web-px`, `web-vw` and `web-scss` presets and of `web-px` with `outputReferences`, with the lines of their baselines and the variables they name |

When tokens change, the fixtures stay valid: they hold their own copies. When the build is meant to change its output, which the rewrite plan does not allow, update the expected values from the new `dist/` in the same commit.

## Preset baselines

`golden/` holds the reference output of the presets, for the brand `chassis`:

| Entry           | Contents                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<preset>.json` | The build configuration of the check, in the form of `chassis.build` in `package.json`. A preset with this file is checked by `golden.test.js` and `pnpm tokens:verify:presets`. |
| `<preset>/`     | The files the preset must write.                                                                                                                                                 |

`web-px-references` and `android-references` are `web-px` and `android` with `outputReferences`, set in their configuration files under `options`.

Check one preset, or all:

```sh
node build/tokens/verify.js --preset web-px
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

For each baseline, restore `build/tokens/config/` from the archive, make the changes of the table, run the build and keep `dist/`:

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

### When tokens change

A change in `tokens/` changes `dist/` and the baselines. After the new `dist/` is built and reviewed, write each baseline again with the current build, and review the difference as for `dist/`:

```sh
node build/tokens/build.js --config build/tokens/test/golden/web-px.json --out build/tokens/test/golden/web-px
```

## Checking that a test can fail

A new test should fail when the code it covers is wrong. While writing one, break the code on purpose (for example, drop an exception from the reference policy), run the test, and restore the code.

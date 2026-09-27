# Token build tests

Tests for the token build in `build/tokens/`. Run them from the repository root:

```sh
pnpm tokens:test
```

The run takes about 10 seconds, most of it for the golden test, which builds every file.

## Principles

- **Real tokens, not mocks.** Tests use tokens from `tokens/`, resolved tokens captured from the real build, the real `package.json` configuration and `tokens/$themes.json`. No test mocks `style-dictionary`.
- **`dist/` is the reference.** Expected values come from the committed `dist/`. The build must not change what it writes, so a test that disagrees with `dist/` is a bug in the build, not in `dist/`.
- **Pure functions first.** Value encoding, the web reference policy, the build plan and argument parsing are pure functions, tested without running Style Dictionary.

## Test files

| File                                                                 | What it checks                                                                                                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `golden.test.js`                                                     | A full build into a temporary directory matches `dist/` file by file, apart from the timestamp and version header lines. Same check as `pnpm tokens:verify`.                               |
| `build.test.js`                                                      | The build plan: one build per brand, app and token-set list, the files it writes (exactly those of `dist/`), CLI filters, and that `brand-chassis/brand-base` overrides `base/brand-base`. |
| `cli.test.js`                                                        | Command line arguments of `build.js`.                                                                                                                                                      |
| `config.test.js`                                                     | The Style Dictionary configuration of a build: source, preprocessor, error policy, output paths, and the file, filter and format of each output.                                           |
| `preprocessor.test.js`                                               | Type alignment, the font weight and style split, the font weight path and the source order.                                                                                                |
| `filters.test.js`                                                    | Which tokens go into `main`, `color-*`, `number-*` and `string`.                                                                                                                           |
| `transforms.test.js`                                                 | The `cx/size/rem` and `cx/shadow/web` transforms.                                                                                                                                          |
| `formats.test.js`                                                    | Tokens are printed in source order, including tokens that Style Dictionary expands.                                                                                                        |
| `values-ios.test.js`, `values-android.test.js`, `values-web.test.js` | The value encoders in `values/`.                                                                                                                                                           |
| `css-var-policy.test.js`                                             | Which web tokens print a `var(--…)` reference, the name of the custom property, and typography maps.                                                                                       |
| `utils.test.js`                                                      | The token type groups.                                                                                                                                                                     |
| `logger.test.js`                                                     | Log output.                                                                                                                                                                                |

## Fixtures

The files in `fixtures/` are snapshots taken from the real build on 2026-09-27. Each has a `source` field that says where its data comes from.

| Fixture                    | Used by                        | Contents                                                                                   |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `mobile-tokens.json`       | `values-ios`, `values-android` | Resolved iOS and Android tokens, with the lines `dist/` prints for them                    |
| `web-tokens.json`          | `values-web`, `transforms`     | Resolved web tokens and transform inputs, with the values `dist/` prints                   |
| `css-var-tokens.json`      | `css-var-policy`               | Web tokens under test with the lines `dist/` prints, and every token they look up          |
| `filter-tokens.json`       | `filters`, `transforms`        | One web token per type, colour group and result, with the files of `dist/` that declare it |
| `preprocessor-tokens.json` | `preprocessor`                 | Token slices copied from `tokens/`, in source form                                         |

When tokens change, the fixtures stay valid: they hold their own copies. When the build is meant to change its output, which the rewrite plan does not allow, update the expected values from the new `dist/` in the same commit.

## Checking that a test can fail

A new test should fail when the code it covers is wrong. While writing one, break the code on purpose (for example, drop an exception from the reference policy), run the test, and restore the code.

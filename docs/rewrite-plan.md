# Chassis Tokens Build Rewrite Plan

Written 2026-09-27. Author: Ozgur Gunes, with Claude. This replaces the plan of 2026-09-22 (commit `4d34eed`), which is superseded and must not be followed.

## What this rewrite is for

In priority order:

1. **Get value logic out of the templates.** Today the templates in `build/tokens/templates/` convert colours, units, font names, quoting and references while printing. That logic is untested, duplicated across platforms and hard to change. This is the main problem.
2. **Upgrade** to Style Dictionary 5.5 and sd-transforms 2.0.
3. **Simplify the build loop.** Secondary. It is done last and can be dropped.

The rewrite changes where logic lives, not what the build emits. Token JSON and output values, formats, file names and token order do not change, in any phase.

## Session protocol

When Ozgur says "continue", Claude does this:

1. Read the Status board and take the first phase that is not `Done`. If it is `In progress`, read its checklist and the last Session log entry, then run `git status` and `git log -5`.
2. Re-read Ground rules.
3. Do that one phase only. Tick checklist items in this file as they land.
4. Run the phase's acceptance check.
5. Commit as `rewrite(phase N): <summary>` with the co-author trailer. Include this file. Do not push.
6. Update the Status board (the Commit column holds the commit subject, because a commit cannot contain its own hash) and add a Session log entry: what was done, what was verified, what is left, surprises.
7. Stop. End with a short summary and ask whether to continue with the next phase.

If a phase is too large, split it into `Na`, `Nb` rows. If a fact in this file is wrong, fix the file first.

## Status board

| Phase | Scope | Model | Status | Commit | Date |
| --- | --- | --- | --- | --- | --- |
| 0 | Golden harness | Sonnet | Done | `rewrite(phase 0)` | 2026-09-27 |
| 1 | iOS and Android value encoders | Opus | Done | `rewrite(phase 1)` | 2026-09-27 |
| 2 | Web value encoder | Opus | Done | `rewrite(phase 2)` | 2026-09-27 |
| 3 | Web `var(--…)` policy | Fable | Done | `rewrite(phase 3)` | 2026-09-27 |
| 4 | Upgrade to SD 5.5 and sd-transforms 2.0 | Fable | Not started | | |
| 5 | Replace forked preprocessor (optional) | Opus | Not started | | |
| 6 | Build loop, cleanup, CI, docs | Sonnet | Not started | | |

## Ground rules

- **Branch:** `dev/rewrite`. One commit per phase. No pushes, no version bumps.
- **Frozen folders:** `tokens/`, `site/`, `dist/`. No phase changes them. If a phase cannot pass the golden diff without changing output, stop and ask Ozgur.
- **Never run the build into `dist/` during the rewrite.** Use `pnpm tokens:verify`, or pass `--out <dir>` when running `build/tokens/build.js` directly. Before committing, `git status --short dist` must be empty.
- **Golden diff:** every phase ends with `pnpm tokens:verify` green in strict mode. The check builds into `dist-next/` and compares against committed `dist/`, ignoring lines that contain `Generated on` or `Chassis - Tokens v`.
- **No legacy copy of the build.** Committed `dist/` is the reference output and git holds the old code.
- **Tests:** new unit tests use real tokens copied from `tokens/` as fixtures, never mocks of `style-dictionary`. The 99 existing mock-based tests stay green while the code they cover exists; when a phase removes that code, it removes the test.
- **Build config stays in `package.json` `chassis.build`:** brands `chassis` and `sinefil`; themes `light`, `dark`; screens `large`, `medium`, `small`; apps `docs` (web) and `demo` (ios, android).

## Facts verified on 2026-09-27

- The current build (SD 4.4.0, sd-transforms 1.3.0, Node 24) reproduces all 42 files in `dist/` exactly, apart from the timestamp line. It takes about 20 s for 36 runs and reports 200 to 256 token collisions per run.
- `pnpm tokens:test` passes: 8 files, 99 tests.
- Latest published versions: `style-dictionary` 5.5.5 (needs Node 22 or later), `@tokens-studio/sd-transforms` 2.0.3 (needs SD 5; its changelog lists no other breaking change).
- Style Dictionary accepts `source` and `include` only at the top level of the config, in both 4.4 and 5.5.5. All platforms of one instance share one token dictionary.
- The build uses four distinct token-set lists per (brand, app). They differ only in the theme set and the screen set:

| Token sets | Files |
| --- | --- |
| light + large | main, string, color-light, number-large |
| dark + large | color-dark |
| light + medium | number-medium |
| light + small | number-small |

- 564 colour tokens have the form `rgba({colour reference}, {opacity reference})`, and 180 colour tokens apply a lighten or darken modifier to a reference.
- In sd-transforms 1.3.0, `alwaysAddFontStyle` applies to typography tokens only. Plain `fontWeight` tokens without a style word are not split into `weight` and `style` by the official preprocessor. Recheck in 2.0.
- `web-px`, `web-vw`, the `scss-variables` template and the `cx/test` transform and format are not used by any configured app.
- The Android template's `@type/name` reference branch never runs, because `outputReferences` is never set.
- No token in the built sets has a description, and `dist/` contains no per-token comments.
- The token set `brand-chassis/app-base` is not selected by any theme in `$themes.json`, so it is never built.
- In SD 4.4 the `dictionary.tokens` that a format receives is already filtered by the file's filter. The web reference lookups therefore see only the tokens of the file being printed (`main.scss` has no `color.primitive.*`, for example). Recheck in SD 5.
- Of the web reference policy, current tokens reach only these rows: `color.context`, `shadow.context`, `borderRadius.context`, `borderWidth.context` and the `borderRadius.base.<component>` follow. No emitted token is a single reference to `color.primitive`, `space.context`, `opacity.context`, `opacity.level` or `<group>.base.context`, and there are no `borderWidth.base.*` tokens.
- Every object-valued typography token references its font family, weight and size. Line height is a reference (244) or a literal `125%` / `150%` (18). Every reference-valued typography token points at `font.text.<size>.<weight>`.
- Prototype, run in a scratch copy against the real tokens: the iOS value logic moved into a pure `encode(token)` function with a print-only template. All 14 iOS files came out identical to `dist/`.
- Counter-test: the same colour encoding registered as a Style Dictionary value transform fails the build with `Invalid color: rgba(UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 1), 0)`.

## Design decisions

### Platform encoding happens after resolution, in pure functions

Platform encoding means turning a resolved value into its final text: `UIColor(…)`, ARGB hex, `sp`/`dp`, `CGFloat(…)`, quoting.

This cannot be an ordinary Style Dictionary value transform. Style Dictionary transforms a referenced token before it resolves the tokens that point at it. If a base colour became `UIColor(…)` first, the 564 `rgba({…}, {…})` tokens and the 180 modifier tokens would receive `UIColor(…)` as input and fail.

So each platform gets an encoder module:

- `build/tokens/values/ios.js`, `android.js`, `web.js`
- Each exports pure functions that take a fully resolved token and return a string. They do not import `style-dictionary`.
- Formats become thin: header, one line per token using the encoder, footer.
- Style Dictionary transforms keep doing only what is safe before resolution: names, `ts/resolveMath`, `ts/color/modifiers`, `ts/color/css/hexrgba`, and the existing web `cx/size/rem` and `cx/shadow/web`.

### One instance per token-set list

Phase 6 builds one `StyleDictionary` instance per row of the token-set table above, with one SD platform per target platform of the app. That is 16 instances and 24 platform exports instead of 36 runs. Expect roughly a third off the build time.

Every instance lists its sets in `source`, in the order `permutateThemes` returns them, exactly as today. This keeps override precedence and token order unchanged.

## Output contract (frozen)

### Files

`dist/<platform>/<app>/<brand>/`, seven files each, 42 in total.

| Platform | Files |
| --- | --- |
| web | `main.scss`, `string.scss`, `color-<theme>.scss`, `number-<screen>.scss` |
| iOS | `Main.swift`, `String.swift`, `Color<Theme>.swift`, `Number<Screen>.swift` |
| Android | `main.xml`, `string.xml`, `color_<theme>.xml`, `number_<screen>.xml` |

### Filters

| File | Included types | Exclusions |
| --- | --- | --- |
| main | color, font group, gradient, number group, shadow, size group, string group | colours with `path[1]` in primitive, context, utility; size types with `path[1] == dimension` |
| color-* | color | `path[1]` in base, utility |
| number-* | duration, letterSpacing, number, opacity, size group | size types with `path[1] == dimension` |
| string | asset, content, fontFamily, fontStyle, fontWeight, string, text, textCase, textDecoration, type | none |

- font group: fontFamily, fontSize, fontStyle, fontWeight, letterSpacing, lineHeight, paragraphSpacing, textCase, textDecoration, typography
- size group: dimension, fontSize, lineHeight, paragraphSpacing
- Tokens typed `boolean` and `other` are never emitted.
- The `path[1] == dimension` exclusion matches nothing today: `dimension.base.*` tokens have `dimension` at `path[0]`, and all 71 are emitted. Keep this behaviour.

### Type alignment

Differences from stock sd-transforms: `letterSpacing` becomes `number`; `text` becomes `content`; every `fontWeight` token is split into `<name>.weight` and `<name>.style`; shadow `x`/`y` become `offsetX`/`offsetY`.

### Web values

SCSS, prefix `cx`, header line `$prefix: cx- !default;`, every token `!default`.

- Sizes: px divided by 16, in `rem`, no rounding. Zero prints `0rem`.
- `lineHeight` tokens: value divided by the fontSize token at the same path under `typography.fontSize`, `toFixed(3)`, trailing zeros trimmed, `em`.
- `letterSpacing` tokens (`path[1] == letterSpacing`) and typography `letter-spacing`: `parseFloat(value)` plus `em`.
- Colours: `#ffffff` or `rgba(0, 0, 0, 0.1)`.
- Shadows: `x y blur spread color[ inset]`, joined with `, `, sizes in rem.
- Assets: wrapped in double quotes.
- Typography: a Sass map with these keys in this order: `font-family`, `font-weight`, `font-size`, `line-height`, `font-style`, `letter-spacing`, `margin-bottom`, `text-transform`, `text-decoration`.

### Web reference policy

A token prints `var(--name)` when its original value is a single reference and `path[0]` is color, space, opacity, shadow, borderRadius or borderWidth. Exceptions that print the literal value:

- borderRadius and borderWidth tokens whose `path[1]` is `context` or `base`
- shadow tokens whose `path[2]` is idle, hover, press, disabled, focus or highlight

| Referenced path | Emitted |
| --- | --- |
| `color.context.X.Y`, `color.primitive.X.Y` | `--X-Y` |
| `space.context.X` | `--space-X` |
| `opacity.context.X`, `opacity.level.X` | `--opacity-X` |
| `shadow.context.X` | `--box-shadow-<abbr X>` |
| `borderRadius.context.X`, `borderRadius.base.context.X` | `--border-radius-<abbr X>` |
| `borderWidth.context.X`, `borderWidth.base.context.X` | `--border-width-<abbr X>` |
| `borderRadius.base.<component>.X`, `borderWidth.base.<component>.X` | follow one more reference; if it is the same `path[0]` and contains `context`, use its last segment |
| anything else | the resolved literal value |

Typography maps:

- Object-valued (`font.context.*`, `font.text.*`): `--font-family-<family>`, `--font-weight-<family>-<weight>`. Font size and line height print `--font-size-<group>-<abbr size>` and `--line-height-<group>-<abbr size>` when they reference fontSize or lineHeight tokens; otherwise the literal, with percent line heights converted to `em` (`125%` to `1.25em`).
- Reference-valued (`font.button.medium` = `{font.text.medium.strong}`): `--font-family-text`, `--font-weight-strong`, `--font-size-md`, `--line-height-md`, taken from the reference path.

Scale abbreviations: 4xsmall→4xs, 3xsmall→3xs, 2xsmall→2xs, xsmall→xs, small→sm, medium→md, large→lg, xlarge→xl, 2xlarge→2xl up to 6xlarge→6xl. Other names pass through.

### iOS

`import UIKit`, `public class ChassisTokens`, one `@objc public static let <PascalName> = …` per token. Typography and shadow tokens are expanded into sub-tokens (`FontContextJumboFontSize`, `ShadowContextSmall1Blur`).

- Colours: `UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 1)`, three decimals per channel, alpha as parsed.
- Number and size groups: `CGFloat(<parseFloat>)`.
- fontFamily: first family only, quotes stripped, then double-quoted.
- fontWeight: lowercase, first space replaced by a hyphen, double-quoted.
- Other string-group types: double-quoted.

### Android

`<resources>` with one element per token, snake_case names, same expansion as iOS.

- Element by type: size group → `dimen`, color → `color`, string group and content → `string`, number group and letterSpacing → `integer`, anything else → `string`.
- Colours: ARGB hex8 (`#80b7c0c2`).
- `sp` when the last path segment is fontSize, lineHeight or paragraphSpacing, or the type is fontSize or lineHeight, or `path[1]` is `paragraphSpacing`.
- Bare number when `path[1]` is `letterSpacing` or the type is `letterSpacing`.
- `dp` for the remaining size-group types.
- The order of these rules matters: colour, fontFamily, fontWeight, `sp`, letterSpacing, `dp`.

## Phase 0: golden harness

Goal: one command that proves a build output equals `dist/`. No change to build behaviour.

- [x] `build/tokens/verify.js`: compare a directory (default `dist-next/`) against `dist/` file by file, skipping the two header lines. Report missing, extra and differing files with the first differing lines. Exit non-zero on any difference.
- [x] In the same script, fail if a `$cx-*` name, a Swift `static let` name or an XML `name=""` appears twice in one file.
- [x] Add `--out <dir>` to the build so it can write somewhere other than `dist/`. Default stays `dist/`.
- [x] Scripts: `tokens:verify` runs the build into `dist-next/` and then the comparison. Add `dist-next/` to `.gitignore`.
- [x] `build/tokens/test/golden.test.js`: runs the same check under vitest.
- [x] Acceptance: `pnpm tokens:verify` green; `git status` shows `dist/` untouched.

Usage for later phases: `pnpm tokens:verify` checks all 42 files (about 20 s). `pnpm tokens:verify --platform ios` builds and checks one platform only (about 8 s). `node build/tokens/verify.js --skip-build` re-compares an existing `dist-next/`. The verifier deletes its output directory before building and refuses any directory that is or contains `dist/`.

## Phase 1: iOS and Android value encoders

Goal: the Swift and XML templates contain no value logic.

- [x] `build/tokens/values/ios.js`: `encode(token)` with the iOS rules from the contract.
- [x] `build/tokens/values/android.js`: `encode(token)` and `resourceType(token)` with the Android rules, in the stated order.
- [x] Templates call the encoders and do nothing else. Delete the dead Android reference branch and the empty gradient blocks.
- [x] The iOS template currently overwrites `token.$value` while printing colours. The encoder must not mutate the token.
- [x] Keep `tinycolor2` for colour parsing in this phase.
- [x] Unit tests with fixtures covering every branch: opaque and translucent colour, font family list, multi-word font weight, each `sp` rule, letter spacing, `dp`, expanded shadow and typography sub-tokens.
- [x] Acceptance: `pnpm tokens:verify` green; unit tests green.

Result: helpers used by both platforms live in `build/tokens/values/shared.js` (`parseColor`, `firstFontFamily`, `fontWeightName`). The fixture `build/tokens/test/fixtures/mobile-tokens.json` holds 25 resolved tokens per platform from the real build, one per branch reached by current tokens plus edge cases, with expected values copied from `dist/`.

## Phase 2: web value encoder

Goal: the SCSS template keeps only the reference policy; all other value logic moves out.

- [x] `build/tokens/values/web.js`: line height in `em`, letter spacing in `em`, asset quoting, and the typography map builder with its fixed key order.
- [x] The line-height rule needs the fontSize token at the same path. Pass the lookup in as an argument so the function stays pure.
- [x] Check whether the `cx/typography/web` transform is still needed: the template rebuilds typography from `token.original` and appears to ignore the transform's result. Remove it if the golden diff stays green.
- [x] Leave `resolveReferenceValue`, `resolveContextTypographyValue` and `resolveComponentTypographyValue` in the template, calling the new map builder.
- [x] Unit tests: percent line height, math letter spacing (`-0.5/16`), zero sizes, inset shadow, asset.
- [x] Acceptance: `pnpm tokens:verify` green; unit tests green.

Result: `values/web.js` exports `encode`, `typographyMap`, `percentToEm`, `lineHeightEm`, `letterSpacingEm`, and also `remSize` and `cssShadow`, which the `cx/size/rem` and `cx/shadow/web` transforms now call, so zero sizes and inset shadows are testable without Style Dictionary. Those two stay Style Dictionary transforms: they are safe before resolution and other tokens rely on their output. `cx/typography/web` was removed from the web config (output unchanged); its registration stays until Phase 6 because the dead `web-px` and `web-vw` configs still list it. `resolveOriginals` also stays in the template for Phase 3, since it resolves references.

## Phase 3: web `var(--…)` policy

Goal: the custom-property naming lives in one file as data plus small helpers.

- [x] `build/tokens/css-var-policy.js`: the policy table, the eligibility rule with its exceptions, the one-hop chain follow, the typography naming rules and the scale abbreviations.
- [x] Bound the chain follow and throw on a cycle.
- [x] The SCSS template becomes thin: header, one line per token, footer.
- [x] Remove from `utils.js` what is no longer used: `getFontWeight`, `getFontStyle`, `fontWeightMap`, and `abbreviateScale` / `scaleAbbreviations`, which moved to the policy module. `isReference` and `splitReference` stay until Phase 6, because the dead `scss-variables.template.js` still imports them.
- [x] Unit tests on real tokens for each table row, each exception, and `font.context.jumbo`, `font.context.lead`, `font.button.medium`, `font.text.medium.strong`.
- [x] Acceptance: `pnpm tokens:verify` green; unit tests green.

Result: `css-var-policy.js` exports the data (`referencingGroups`, `literalTokens`, `customProperties`, `followedGroups`, `MAX_HOPS`, `scaleAbbreviations`) and the functions `printsReference`, `customProperty` and `webValue`. `webValue(token, references)` is the only call the template makes; it returns a custom property, a typography map or the encoded value from `values/web.js`. The module does not import `style-dictionary`: the template passes in two lookups, `references.token(value)` and `references.value(value)`, built from `getReferences` and `resolveReferences` on the file's `dictionary.tokens`. The template went from 211 to 43 lines.

The fixture `build/tokens/test/fixtures/css-var-tokens.json` holds 34 emitted tokens with their values from `dist/`, plus every token they look up. Rows that no current token reaches are tested with a real token whose reference is replaced; the `borderWidth.base` cases use constructed targets.

Behaviour in cases that no current token reaches, where the old template printed broken text, is now an error that names the token:

| Case | Old template | Now |
| --- | --- | --- |
| Typography with a literal font size | `"font-size": undefined` | throws |
| Typography with a literal font family or weight | one character of the string in the name | throws |
| Reference-valued typography whose reference is not `font.<family>.<size>.<weight>` | `undefined` in the names | throws |
| Reference cycle in the chain follow | not checked | throws |

## Phase 4: upgrade to SD 5.5 and sd-transforms 2.0

Goal: same output on the new libraries, upgraded in place.

- [ ] `pnpm add -D style-dictionary@^5.5 @tokens-studio/sd-transforms@^2.0`. Add `"engines": { "node": ">=22" }` to `package.json`.
- [ ] Set `log.errors.brokenReferences` to `throw`.
- [ ] SD 5 allows references to tokens only, not to groups. Test whether `$extensions.chassis.originalFontWeight`, which holds a string like `{typography.fontWeight.text.mass}`, triggers this. That path is a group after the weight and style split. If it does, store the path in a form SD does not parse as a reference.
- [ ] Check math on references (`dimension.base.*`, letter spacing) for rounding changes.
- [ ] Record build time before and after in the Session log.
- [ ] Acceptance: `pnpm tokens:verify` green; all tests green.

## Phase 5: replace the forked preprocessor (optional)

Goal: use the official `tokens-studio` preprocessor plus a small `chassis/types` preprocessor for the documented differences.

- [ ] First check whether the official preprocessor in 2.0 splits plain `fontWeight` tokens. In 1.3.0 it does not. If it still does not, `chassis/types` must do the split itself.
- [ ] Do this phase only if the result is clearly smaller than the 236-line fork. If not, keep the fork, mark this phase `Done` with the reason, and move on.
- [ ] `chassis/types`: `letterSpacing` to `number`, `text` to `content`, the fontWeight split, the original font weight path for the policy module.
- [ ] Acceptance: `pnpm tokens:verify` green; all tests green.

## Phase 6: build loop, cleanup, CI, docs

Goal: the new build is simple, and a stale `dist/` cannot be published.

- [ ] Build one instance per token-set list (see Design decisions). Resolve the lists directly from `$themes.json`.
- [ ] Token order inside files must stay the same. If it changes, fix the set order; do not regenerate `dist/`.
- [ ] Do not split sets between SD `include` and `source`. Add a test that `brand-chassis/brand-base` values win over `base/brand-base`.
- [ ] Read the version for the file header from `package.json`. Remove `build/tokens/build.js` from `FILES` in `build/change-version.js`.
- [ ] Delete `web-px.js`, `web-vw.js`, `scss-variables.template.js`, the `cx/test` transform and format, the `cx/typography/web`, `cx/size/px` and `cx/size/vw` transforms (used only by `web-px` and `web-vw`), and the `cx/scss-variables` format. Then delete `isReference` and `splitReference` from `utils.js`.
- [ ] Replace `tinycolor2` only if the golden diff stays green; otherwise keep it. A replacement must also turn a `linear-gradient(…)` value into its first colour stop, as tinycolor does (see Known oddities).
- [ ] Replace the remaining mock-based tests with fixture tests. Rewrite `build/tokens/test/README.md`.
- [ ] `.github/workflows/publish-release.yml`: run `pnpm tokens:verify` before `npm publish`.
- [ ] README: new layout, CLI flags, how to verify. Remove `test:watch`, `build:astro` and `test:coverage`, which do not exist. Add a CHANGELOG entry.
- [ ] Acceptance: `pnpm tokens:verify` and `pnpm tokens:test` green; `pnpm tokens:site && pnpm astro:build` succeeds.

## Known oddities in the output (kept as they are)

These are part of the frozen contract. They are listed so nobody "fixes" them by accident.

- Android letter spacing prints as `<integer name="…letter_spacing">-0.5</integer>`.
- A `125%` line height prints as `CGFloat(125)` on iOS and `125sp` on Android.
- Font weight on iOS and Android is a name string such as `"bold"`.
- Android asset tokens hold raw `<svg>` markup inside `<string>`.
- The 88 `gradient.primitive.*` tokens are typed `color` with `linear-gradient(…)` values. Web prints the gradient. iOS and Android print only its first colour stop, because tinycolor parses the gradient string leniently: `linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, #000000 100%)` becomes `UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 0)` and `#00000000`.
- The `path[1] == dimension` filter matches nothing, so `dimension.base.*` is emitted.

## Risks

| Risk | Plan |
| --- | --- |
| An encoder differs from the template in rounding or branch order | Golden diff after every phase; fixtures cover every branch |
| SD 5 changes reference or math behaviour | Phase 4 is isolated, so a red diff has one cause |
| Token order changes with the new build loop | Phase 6 keeps the current set order; strict diff catches any change |
| `@chassis-ui/css` fails on duplicate `$cx-*` names | Harness checks uniqueness; Phase 6 runs the site build |

## Open decisions for Ozgur

- [x] Branch is `dev/rewrite` (confirmed 2026-09-27).
- [x] Token JSON and output do not change (confirmed 2026-09-27).
- [ ] Phase 5: do it, or keep the forked preprocessor.

## Session log

Append-only.

- 2026-09-27 (planning): Reviewed the plan of 2026-09-22 against the code, `dist/` and the published library versions. Found that per-platform `source` lists do not exist in Style Dictionary, that platform encoding cannot run as a value transform, and several stale facts. Rewrote the plan from scratch with template logic as the first priority. Proved the encoder approach with an iOS prototype (14 files identical to `dist/`) and confirmed the transform approach fails. Ozgur confirmed the branch and that output is frozen, so the output-change phase was removed. Next: Phase 0.
- 2026-09-27 (Phase 0, Opus 5.5): Added `build/tokens/verify.js`, `build/tokens/test/golden.test.js`, the `tokens:verify` script, `--out` on the build (threaded through `config/index.js` into every platform config as an `outDir` argument, default `dist`) and `dist-next` in `.gitignore`. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 100 tests (99 existing plus the golden test); `dist/` untouched. Negative checks: a changed value, a deleted file, an extra file and a duplicate XML name were each reported and failed the run; `--out dist`, `--out .` and `--out ./dist/` were refused. No new lint warnings; the two existing ones (unused `join` in `build.js`, unused function in `scss-variables.template.js`) are left for Phase 6. Surprise: `pnpm tokens:test` now takes about 21 s because the golden test runs the full build. Next: Phase 1.
- 2026-09-27 (Phase 1, Opus 5.5): Added `build/tokens/values/{shared,ios,android}.js`; the Swift and XML templates now only print. Removed the dead Android `@` reference branch, the unused `file.resourceType` / `file.resourceMap` overrides (no config sets them), the empty gradient blocks and the iOS `token.$value` overwrite. Added `values-ios.test.js` and `values-android.test.js` (56 tests) with a fixture of real resolved tokens. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 156 tests; no new lint warnings. Injected three regressions (colour rounding, a dropped `sp` rule, the old `$value` overwrite); each failed the intended test. Surprises: (1) gradient colour tokens print their first colour stop on mobile, a tinycolor quirk now recorded under Known oddities; the unparseable-colour fallback (warn, print raw) is still unused by current tokens and was kept unchanged. (2) One diagnostic `build.js` run without `--out` rewrote the timestamp line of six `dist/ios` files; only timestamps changed, the files were restored with `git checkout`, and a ground rule now forbids building into `dist/`. Next: Phase 2.
- 2026-09-27 (Phase 2, Opus 5.5): Added `build/tokens/values/web.js`. The SCSS template now calls `encode` for line height, letter spacing, assets and pass-through values, and `typographyMap` / `percentToEm` for typography maps; it keeps only the `var(--…)` policy and its reference resolution (250 to 211 lines). `cx/size/rem` and `cx/shadow/web` now call `remSize` / `cssShadow`. Removed `cx/typography/web` from the web config after the golden diff showed its output is never read. Added `values-web.test.js` (27 tests) with a fixture of real resolved tokens; shadow and rem inputs were captured from builds without those transforms, and every expected value matches `dist/`. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 183 tests; no new lint warnings; `dist/` untouched. Injected five regressions (line-height rounding, typography key order, dropped `inset`, rem rounding, wrong font-size path); each failed the intended tests. Surprise: jumbo's `-0.0313em` letter spacing comes from `size.unit.nd05`, rounded by `ts/resolveMath`, while `dimension.base.nd05` prints `-0.03125rem`; both are covered. Next: Phase 3.
- 2026-09-27 (Phase 3, Fable 5.1): Added `build/tokens/css-var-policy.js`; the SCSS template now prints one line per token through `webValue` and holds no policy (211 to 43 lines). The chain follow is a loop bounded by `MAX_HOPS = 1` that throws on a cycle. Removed `getFontWeight`, `getFontStyle` and `fontWeightMap` from `utils.js` with their 11 tests, and moved `abbreviateScale` and `scaleAbbreviations` from `utils.js` to the policy module with their tests. Added `css-var-policy.test.js` (129 tests) and a fixture of real tokens. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 299 tests; no new lint warnings; `dist/` untouched. Injected twelve regressions (missing abbreviation, four dropped exceptions, two hops, follow across groups, typography naming, percent line height, dropped literal fallback, no cycle check); each failed the intended tests. Surprises: (1) six of the ten table rows and the whole `borderWidth` follow are not reached by any current token, so their tests use constructed references. (2) The plan expected `splitReference` and `isReference` to become unused, but the dead `scss-variables.template.js` imports them; they stay until Phase 6. (3) Four unreachable cases that printed broken text now throw (see the Phase 3 result); this does not change any output. Next: Phase 4.

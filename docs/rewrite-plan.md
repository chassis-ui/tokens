# Chassis Tokens Build Rewrite Plan

As of 2026-09-22. Author: Ozgur Gunes. Executed with Claude across multiple sessions.

## Session protocol (read this first, every session)

This file is the single source of truth for a multi-session rewrite of `build/tokens`. Work happens on branch `develop`. When Ozgur says "continue" (optionally pointing at this file), Claude follows these steps exactly:

1. Read the **Status board** and pick the first phase whose status is not `Done`. If a phase is `In progress`, resume it: read its section, its checklist and the last **Session log** entry, then run `git status` and `git log -5` to see where the working tree is.
2. Re-read **Ground rules** and the **Output contract**. Never modify `tokens/`, `site/` or `dist/` to make the build easier. Never change token values.
3. Do only that one phase. Tick its checklist items in this file as they land (`- [x]`). Add a Session log entry when the phase starts.
4. Before declaring the phase done, run the acceptance check listed in the phase. From Phase 0 on, the golden diff (`pnpm tokens:verify`) must pass, or the phase must state explicitly why it is expected to fail and which later phase fixes it.
5. Commit on `develop` with the message format `rewrite(phase N): <summary>` and the Claude co-author trailer. Include this file in the commit. Do not push unless asked.
6. Update the Status board row (status `Done`, commit hash, date) and write the Session log entry: what was done, what was verified, what is left, anything surprising.
7. **Stop and wait.** End the turn with a two-line summary and the question "Continue with Phase N+1?". Do not start the next phase in the same session even if context remains. Ozgur reviews the commit between phases.

If a phase needs splitting, add sub-rows `Na`, `Nb` to the Status board rather than doing two phases in one commit. If something in this file is wrong (a file moved, a version changed), fix the file first, then continue.

## Status board

Claude updates this table at the end of every phase. Status values: Not started, In progress, Done, Blocked.

| Phase | Scope | Model | Status | Commit | Date |
| --- | --- | --- | --- | --- | --- |
| 0 | Golden harness and contract doc | Sonnet | Not started | | |
| 1 | SD 5.5 + sd-transforms 2.0, one dictionary per brand/app/platform | Fable (Opus acceptable) | Not started | | |
| 2 | Replace forked preprocessor | Opus | Not started | | |
| 3 | Value logic from templates into transforms | Opus (3b may use Sonnet) | Not started | | |
| 4 | Declarative `var(--…)` reference policy | Fable | Not started | | |
| 5 | Expand for iOS and Android | Sonnet | Not started | | |
| 6 | Tooling, CI, tests, docs, delete legacy | Sonnet | Not started | | |

Baseline verified 2026-09-22: the SD 4.4 build (`pnpm tokens:build`) reproduces the committed `dist/` byte-for-byte except the two header lines (timestamp and version). Committed `dist/` is the golden reference until Phase 6 regenerates it.

### Model choice rationale

The golden diff is a hard oracle: a wrong output fails loudly, so cheaper models are safe wherever the work is mechanical and the spec is complete. Stronger models pay off where the job is diagnosing behaviour differences in a library upgrade or designing an abstraction that has to cover many edge cases.

- **Sonnet** for Phases 0, 5, 6: well-specified scripts, config wiring, cleanup, documentation. Failure modes are caught by the harness or by tests.
- **Opus** for Phases 2 and 3: matching a third-party preprocessor's behaviour byte-for-byte and writing a dozen transforms whose rounding and formatting must be exact. Needs careful reading of library source, moderate design.
- **Fable** for Phases 1 and 4: Phase 1 is the Style Dictionary v5 migration with the group-reference breaking change and a new orchestration model; Phase 4 is the one piece of real domain logic (reference-chain walking, three typography variants, naming policy) where a wrong abstraction costs the most. Opus is acceptable for Phase 1 if Fable is unavailable.

Switch up a tier if a phase stalls for more than one session; switch down for sub-phases that turn out to be mechanical.

## Ground rules

- **Frozen folders:** `tokens/`, `site/`, `dist/`. `dist/` is only regenerated in Phase 6, and only after the golden diff passes. Token output order inside a file may change; file set, names and values may not.
- **Golden diff rule:** every phase from 0 on ends with `pnpm tokens:verify` green (new build into a temp dir, compared file-by-file against `dist/` ignoring the `Generated on` and `Chassis - Tokens v` header lines). Also assert every `dist/` file is produced and no extra files appear.
- **Targets:** `style-dictionary` 5.5.x, `@tokens-studio/sd-transforms` 2.0.x, Node 22+ (machine has 24). Both are ESM only. Remove `tinycolor2` when Phase 3 lands.
- **Legacy build:** Phase 1 moves the old build to `build/tokens-legacy/` (scripts `tokens:legacy:build`). It stays until Phase 6 deletes it, so any phase can regenerate the old output for comparison.
- **Consumer contract:** `@chassis-ui/css` forwards `@chassis-ui/tokens/dist/web/docs/chassis/main.scss`; the site's Vite importer resolves the same path to local `dist/`. Sass fails on duplicate `$cx-*` names, so the harness also checks name uniqueness per file.
- **Config source stays `package.json` `chassis.build`** (brands, themes, screens, apps to platforms). Only `chassis` and `example` brands are built even though `$themes.json` also defines `default`, `demo-a`, `demo-b`.
- **Commits:** one per phase on `develop`, `rewrite(phase N): …`, co-author trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` (use the actual model name of the session). No pushes, no version bumps, no `dist/` changes before Phase 6.
- **Tests:** unit tests use small real token fixtures (extracted from `tokens/`), never mocks of `style-dictionary`. Existing mock-based tests are deleted in Phase 6, not maintained.

## Output contract (frozen; extracted from the current templates and dist)

The rewrite must reproduce these rules. They are implicit in `build/tokens/templates/*.js` today; Phase 0 copies this section into `docs/token-output-contract.md`.

### Files

`dist/<platform>/<app>/<brand>/` with seven files per triple. Filenames: web `main.scss`, `string.scss`, `color-<theme>.scss`, `number-<screen>.scss`; iOS `Main.swift`, `String.swift`, `Color<Theme>.swift`, `Number<Screen>.swift`; Android `main.xml`, `string.xml`, `color_<theme>.xml`, `number_<screen>.xml`. Token sets per file come from `$themes.json`: base files use brand + app sets with the first theme and first screen; color files swap the theme set; number files swap the screen set.

| File | Included types | Exclusions |
| --- | --- | --- |
| main | color, font group, gradient, number group, shadow, size group, string group | colors with `path[1]` in primitive, context, utility; size types with `path[1] == dimension` |
| color-* | color | `path[1]` in base, utility |
| number-* | duration, letterSpacing, number, opacity, plus size group | size types with `path[1] == dimension` |
| string | asset, content, fontFamily, fontStyle, fontWeight, string, text, textCase, textDecoration, type | none |

Type groups (after Tokens Studio to DTCG alignment): font = fontFamily, fontSize, fontStyle, fontWeight, letterSpacing, lineHeight, paragraphSpacing, textCase, textDecoration, typography. size = dimension, fontSize, lineHeight, paragraphSpacing. Tokens typed `boolean` (`figma.switch.*`) and `other` (`motion.*`) are never emitted.

### Type alignment deviations from sd-transforms

`letterSpacing` becomes `number` (not dimension). `text` becomes `content`. `fontWeight` tokens are split into `<name>.weight` and `<name>.style` children (every fontWeight token gets both, so `string.scss` contains `-weight` and `-style` pairs). Shadow `x`/`y` become `offsetX`/`offsetY`.

### Web values

SCSS, prefix `cx`, `$prefix: cx- !default;` header line, every token `!default`.

- Sizes: `<px>/16 rem`, no rounding (`0.0625rem`). Zero prints `0rem`.
- `lineHeight` tokens: `em` = value divided by the fontSize token at the same path under `typography.fontSize`, `toFixed(3)` with trailing zeros trimmed (`1.273em`).
- `letterSpacing` tokens and typography `letter-spacing`: `parseFloat(value)em`; math like `-0.5/16` is rounded to 4 digits by `ts/resolveMath` first (`-0.0313em`).
- Colors: `ts/color/css/hexrgba`, so `#ffffff` or `rgba(0, 0, 0, 0.1)`.
- Shadows: `x y blur spread color[ inset]` joined with `, `, dimensions in rem.
- Assets: value wrapped in double quotes.
- Typography: a Sass map with exactly these keys in this order: `font-family`, `font-weight`, `font-size`, `line-height`, `font-style`, `letter-spacing`, `margin-bottom` (paragraphSpacing), `text-transform` (textCase), `text-decoration`. Percent line-heights become `em` (`125%` to `1.25em`).
- 8 tokens carry `$description`; it is appended as `// comment`.

### Web reference policy (`var(--…)`)

A token is emitted as `var(--name)` instead of its literal value when its original value is a single reference and `path[0]` is one of color, space, opacity, shadow, borderRadius, borderWidth, with these exclusions: borderRadius/borderWidth tokens whose `path[1]` is `context` or `base`; shadow tokens whose `path[2]` is one of idle, hover, press, disabled, focus, highlight. The referenced path decides the name:

| Referenced path | Emitted |
| --- | --- |
| `color.context.X.Y`, `color.primitive.X.Y` | `--X-Y` |
| `space.context.X` | `--space-X` |
| `opacity.context.X`, `opacity.level.X` | `--opacity-X` |
| `shadow.context.X` | `--box-shadow-<abbr X>` |
| `borderRadius.context.X`, `borderRadius.base.context.X` | `--border-radius-<abbr X>` |
| `borderWidth.context.X` | `--border-width-<abbr X>` |
| `borderRadius.base.<component>.X` | follow one more hop; if it lands on `borderRadius.base.context.Y` emit `--border-radius-<abbr Y>` |
| anything else | the resolved literal value |

Typography maps always use vars. Object-valued typography (`font.context.*`, `font.text.*`): `--font-family-<family>`, `--font-weight-<family>-<weight>`, `--font-size-<group>-<abbr size>` and `--line-height-<group>-<abbr size>` when fontSize/lineHeight are references to fontSize/lineHeight tokens, else the literal (rem for fontSize, `em` for percent line-height). Reference-valued component typography (`font.button.medium` = `{font.text.medium.strong}`): `--font-family-text`, `--font-weight-strong`, `--font-size-md`, `--line-height-md`, taken from the reference path segments. Scale abbreviations: 4xsmall→4xs, 3xsmall→3xs, 2xsmall→2xs, xsmall→xs, small→sm, medium→md, large→lg, xlarge→xl, 2xlarge→2xl … 6xlarge→6xl; other names pass through.

### iOS (Swift)

`import UIKit`, `public class ChassisTokens { @objc public static let <PascalName> = … }`. Composite typography and shadow tokens are expanded into sub-tokens (`FontContextJumboFontSize`, `ShadowContextSmall1Blur`, 1-based array index, keys offsetX/offsetY/blur/spread/color/type). Colors `UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 1)` with three-decimal channels. Numbers and sizes `CGFloat(<number>)` in px units, no rem. fontFamily keeps only the first family, unquoted inside the string. fontWeight is the lowercase hyphenated name (`semi-bold`), not a number. Other strings double-quoted.

### Android (XML)

`<resources>` with `dimen`, `color`, `string`, `integer` elements chosen by type group (size→dimen, color→color, string group and content→string, number/letterSpacing→integer). Colors ARGB hex8 (`#80b7c0c2`). `fontSize`, `lineHeight`, `paragraphSpacing` get `sp`; other sizes `dp`; letterSpacing is a bare number in an `<integer>`. No `@` references anywhere. Same expansion as iOS, snake_case names.

## Phase 0: golden harness

Model: Sonnet. Goal: a one-command check that any build output equals the committed `dist/` apart from header lines, plus the contract written into the repo. No production code changes.

- [ ] Add `build/tokens/verify.js`: takes an output directory (default `dist-next/`), walks the committed `dist/` file list, compares each file line-by-line after dropping lines containing `Generated on` or `Chassis - Tokens v`, reports missing, extra and differing files with the first few diff lines, exits non-zero on any difference.
- [ ] Also check per file that no `$cx-*` SCSS name, Swift `static let` name or XML `name=""` appears twice.
- [ ] Add a `--sorted` mode that compares the token line sets order-insensitively (needed while the new build's order differs), and a default strict mode for the end state.
- [ ] Add script `tokens:verify` (`node build/tokens/verify.js dist-next`) and make the old build accept an output root override (`--out`) so it can write to `dist-next/` without touching `dist/`. Add `dist-next/` to `.gitignore`.
- [ ] Add `build/tokens/test/golden.test.js` (vitest) that runs the build into a temp dir and calls the verify logic. Mark it as the acceptance test.
- [ ] Write `docs/token-output-contract.md` from the Output contract section of this file.
- [ ] Acceptance: `pnpm tokens:build --out dist-next && pnpm tokens:verify` passes in strict mode against the current SD 4.4 build; `git status` shows `dist/` untouched.

Estimated size: one session.

## Phase 1: upgrade and restructure the pipeline

Model: Fable (Opus acceptable). Goal: new build skeleton on Style Dictionary 5.5 and sd-transforms 2.0 that produces all 42 files with one dictionary per brand/app/platform, while still using the old templates and preprocessor so the golden diff can stay green. Restructure first, replace internals in later phases.

- [ ] `git mv build/tokens build/tokens-legacy`; keep it runnable as `tokens:legacy:build` (pin `style-dictionary@4` and `sd-transforms@1` under pnpm aliases, or give `build/tokens-legacy/` its own `package.json`). Decide which and note it in the Session log.
- [ ] `pnpm add -D style-dictionary@^5.5 @tokens-studio/sd-transforms@^2.0`. Confirm Node engine `>=22` in `package.json`.
- [ ] New `build/tokens/` layout: `cli.js` (args via `node:util` `parseArgs`: `--brand --app --platform --theme --screen --out --dry-run`), `config.js` (reads `package.json` `chassis.build` and `tokens/$themes.json`), `sets.js` (resolves source/include set lists per brand, app, theme, screen directly from `$themes.json` `selectedTokenSets`, mapping `source` sets to SD `include` and `enabled` sets to SD `source` so brand overrides stop producing collision warnings), `platforms/{web,ios,android}.js`, `hooks/` (preprocessors, transforms, filters, formats, fileHeader) registered through the v5 `hooks` config object, `build.js` (orchestrator).
- [ ] One `StyleDictionary` instance per (brand, app, platform). Inside it, one SD `platforms` entry per output file group: `base` (main + string), `color-<theme>` per theme, `number-<screen>` per screen, each with its own `source`/`include` lists. Target: 6 instances instead of 36 runs.
- [ ] Port the old templates, filters, transforms and preprocessor as-is into the new hooks (mechanical port only: v5 renames `matcher`→`filter`, `formatter`→`format`; `fileHeader` becomes async under `hooks.fileHeaders`; format options like `className` move under `file.options`).
- [ ] Handle v5 breaking change: references to non-token group nodes are errors. The `originalFontWeight` extension references `{typography.fontWeight.text.mass}`, which becomes a group after the weight/style split. Keep the split but make the reference resolvable (temporary shim allowed; permanent fix in Phase 2). Set `log.errors.brokenReferences` to `throw` so this cannot regress silently.
- [ ] File header reads the version from `package.json` at build time; remove `build/tokens/build.js` from `change-version.js` `FILES`.
- [ ] Acceptance: `pnpm tokens:build --out dist-next && pnpm tokens:verify --sorted` passes for all 42 files. Record wall time versus the 22 s baseline in the Session log. Strict order mode may fail; note it.

Estimated size: one to two sessions. If two, split into 1a (dependency upgrade, mechanical hook port, legacy folder) and 1b (one dictionary per triple, sets resolution).

## Phase 2: replace the forked preprocessor

Model: Opus. Goal: delete `preprocessor.js` (the copy of sd-transforms' alignTypes and addFontStyles) and use the official `tokens-studio` preprocessor plus one small chassis preprocessor for the documented deviations.

- [ ] Enable `preprocessors: ['tokens-studio', 'chassis/types']` globally. Register sd-transforms with `register(SD, { alwaysAddFontStyle: true, 'ts/color/modifiers': { format: 'hex' } })`.
- [ ] `chassis/types` preprocessor: `letterSpacing`→`number`, `text`→`content`, and record `$extensions.chassis.originalType` where the old code did (check whether anything downstream still reads it; if not, drop it).
- [ ] Font weight split: confirm sd-transforms 2.0 `addFontStyles` produces the same `<name>.weight` / `<name>.style` children with identical values (`Regular` stays `Regular` until `ts/typography/fontWeight` maps it to 400 on web). If it does not split when no style word is present, add that behaviour in `chassis/types`, because `string.scss` must keep every `-weight`/`-style` pair.
- [ ] Replace `originalFontWeight` with a resolvable approach: typography tokens' `fontWeight` reference is rewritten to `{….weight}` and a sibling `fontStyle` reference `{….style}` is added, so no template needs the extension. Remove the Phase 1 shim.
- [ ] Delete the forked preprocessor and its tests.
- [ ] Acceptance: `pnpm tokens:verify --sorted` green for all 42 files.

Estimated size: one session.

## Phase 3: value logic out of templates, into transforms

Model: Opus (3b may use Sonnet). Goal: formats become trivial (header, one line per token, footer). Every value rule in the Output contract lives in a named, unit-tested transform. Web reference naming is out of scope here (Phase 4); the temporary rule is "literal values everywhere", so the golden diff for `main.scss` is expected to fail on `var(--…)` lines only. `color-*`, `number-*`, `string` and all iOS/Android files must be green.

- [ ] Web transforms (`type: 'value'`, transitive where they touch references): `chassis/size/rem` (reuse SD `size/pxToRem` if it prints `0.0625rem` without rounding; otherwise custom), `chassis/lineHeight/em` (divide by the same-path fontSize; needs dictionary access, so implement as a preprocessor annotation or a transform reading the dictionary), `chassis/letterSpacing/em`, `chassis/shadow/css`, `chassis/asset/quote`, `chassis/typography/scss-map` (literal values for now, nine keys in contract order).
- [ ] iOS transforms: `chassis/color/uicolor` (three-decimal channels, `alpha` as given), `chassis/number/cgfloat`, `chassis/fontFamily/first`, `chassis/fontWeight/slug`, `chassis/string/quote`. Use SD `color/UIColorSwift` if its output matches byte-for-byte; otherwise custom.
- [ ] Android transforms: `chassis/color/argb` (or SD `color/hex8android`), `chassis/size/sp-dp` (sp for fontSize/lineHeight/paragraphSpacing, dp otherwise, bare number for letterSpacing), `chassis/fontFamily/first`, `chassis/fontWeight/slug`. Resource type selection becomes a pure function of `$type` used by the format.
- [ ] Formats: `chassis/scss`, `chassis/swift-class`, `chassis/android-xml`, each under 40 lines, no reference resolution, no `tinycolor2`. Remove `tinycolor2` from `package.json`.
- [ ] Unit tests per transform with fixture tokens copied from `tokens/` (a few dozen tokens covering each branch: percent line-height, math letter-spacing, inset shadow, asset, description comment).
- [ ] Acceptance: `pnpm tokens:verify --sorted` green for every file except `web/*/*/main.scss`; for `main.scss` the diff must consist only of lines whose committed value contains `var(--`. Record the count of such lines (expect roughly 1,100 per brand) in the Session log.

Estimated size: two sessions. Split as 3a (web) and 3b (iOS and Android) if needed.

## Phase 4: declarative `var(--…)` reference policy

Model: Fable. Goal: the chassis-css custom-property naming lives in one file, `build/tokens/hooks/css-var-policy.js`, as data plus two small helpers, replacing `resolveReferenceValue`, `resolveContextTypographyValue`, `resolveComponentTypographyValue` and `tokenToValue` from the old template.

- [ ] Policy table keyed by referenced-path prefix, exactly the table in the Output contract, plus the eligibility predicate (path[0] allow-list, borderRadius/borderWidth `context`/`base` exclusion, shadow state-name exclusion).
- [ ] A generic "follow the chain" helper: given a token whose original value is a single reference, walk `original.$value` references until a mapped prefix is hit or the chain ends; used for `borderRadius.base.<component>.X`. Bound the walk to 3 hops and throw on cycles.
- [ ] `chassis/css-var` transform (web only, runs after value transforms) that emits `var(--…)` for eligible tokens. Implemented as an SD `outputReferences` function plus a transform, or as a transform alone, whichever keeps the format free of reference logic. Note the decision in the Session log.
- [ ] Typography map references: extend `chassis/typography/scss-map` to consult the same policy for `font-family`, `font-weight`, `font-size`, `line-height` (object-valued versus reference-valued typography rules from the contract, including scale abbreviation and the percent line-height→`em` fallback).
- [ ] Scale abbreviation table moves next to the policy; delete `utils.js` leftovers (`isReference`, `splitReference`, `fontWeightMap`, `getFontWeight`, `getFontStyle`).
- [ ] Unit tests on real tokens for each policy row, the chain walk, and each typography variant (`font.context.jumbo`, `font.context.lead`, `font.button.medium`, `font.text.medium.strong`).
- [ ] Acceptance: `pnpm tokens:verify --sorted` green for all 42 files. Then try strict mode; if order differs, record where and decide in Phase 6 whether to sort output or accept the new order.

Estimated size: one to two sessions.

## Phase 5: expand for iOS and Android

Model: Sonnet. Goal: replace the two ad-hoc `expand.typesMap` configs with Style Dictionary's `expand` and sd-transforms' recommended `expandTypesMap`, and confirm the expanded sub-token names and values match the golden files.

- [ ] Platform-level `expand: { include: ['typography', 'shadow'], typesMap: { ...DTCGTypesMap, ...sdTransformsExpandTypesMap, letterSpacing: 'number' (iOS) / 'letterSpacing' (Android) } }`. Web keeps composites unexpanded.
- [ ] Verify shadow arrays expand with 1-based indices and keys `offsetX`, `offsetY`, `blur`, `spread`, `color`, `type`, and that `bg-blur` (typed boxShadow) expands too.
- [ ] Verify expanded `fontWeight` sub-tokens keep the name slug (`semi-bold`) and `lineHeight` sub-tokens get `sp` on Android and plain `CGFloat` on iOS.
- [ ] Delete the old `expand` objects from the platform configs.
- [ ] Acceptance: `pnpm tokens:verify --sorted` green for all 42 files; iOS and Android files also green in strict order mode if possible.

Estimated size: one session. May be folded into Phase 3b if Phase 3 already needed expand to pass; in that case mark this row Done with a note.

## Phase 6: tooling, CI, tests, docs, delete legacy

Model: Sonnet. Goal: the new build is the only build, the process cannot ship a stale `dist/`, and the repo documentation matches reality.

- [ ] Decide output order: either add a stable sort in the formats so strict mode passes, or accept the new natural order and regenerate `dist/`. Either way, after this phase `pnpm tokens:verify` runs in strict mode against the regenerated `dist/`.
- [ ] Regenerate `dist/` with the new build (this is the only commit that touches `dist/`). Diff it against the backup with `--sorted` one last time before committing.
- [ ] Delete `build/tokens-legacy/`, the `tokens:legacy:*` scripts, `web-px`, `web-vw`, `scss-variables`, the `cx/test` transform and format, and the mock-based tests (`build.test.js`, `cli.test.js`, `config.test.js`, `filters.test.js`, `logger.test.js`, `preprocessor.test.js`, `transforms.test.js`, `utils.test.js`). Keep the new unit tests and the golden test.
- [ ] Scripts: `tokens:build`, `tokens:verify`, `tokens:test`, `tokens:site`, `tokens:zip`; `test` runs unit tests plus golden. Remove references to `test:watch`, `build:astro`, `test:coverage` from README and `build/tokens/test/README.md` (rewrite that README to describe the fixture and golden approach).
- [ ] `.github/workflows/publish-release.yml`: add `pnpm install && pnpm tokens:build --out dist-next && pnpm tokens:verify` before `npm publish`, so a committed `dist/` that does not match the build fails the release.
- [ ] `change-version.js`: `FILES` no longer includes the build script (done in Phase 1); confirm and update its header comment.
- [ ] README: replace the build architecture section with the new layout (cli, config, sets, platforms, hooks, css-var-policy), CLI flags including `--out`, and a short "how to verify" paragraph. Add a CHANGELOG entry under an unreleased heading describing the rewrite and stating that output values and files are unchanged.
- [ ] Logger: keep a small one (`info`, `warn`, `error`, `debug` via `DEBUG=1`); drop progress and dry-run formatting the new orchestrator no longer needs, or keep them if the CLI still uses them.
- [ ] Acceptance: `pnpm tokens:build && pnpm tokens:verify` (strict) and `pnpm tokens:test` green; `pnpm tokens:site && pnpm astro:build` succeeds (proves `@chassis-ui/css` still compiles against `main.scss`); wall time recorded.

Estimated size: one session.

## Known risks and open decisions

| Risk or decision | Impact | Plan |
| --- | --- | --- |
| SD v5 rejects references to group nodes; `{typography.fontWeight.text.mass}` becomes a group after the weight/style split | Build fails at init | Phase 1 shim, Phase 2 rewrites references to `.weight` / `.style` |
| v5 transitive transform ordering differs from v4 on math over references (`dimension.base.*` = `4/{scale}rem`, letterSpacing `-0.5/16`) | Rounding or unit differences | Golden diff catches it; keep `ts/resolveMath` before size transforms, `mathFractionDigits` 4 |
| Line-height `em` needs the sibling fontSize token | Transform needs dictionary access | Preprocessor annotation or a transform receiving the dictionary; decide in Phase 3 |
| Output order changes with one dictionary per triple | Strict diff fails until Phase 6 | `--sorted` mode through Phases 1 to 5; decide sort versus regenerate in Phase 6 |
| `include` versus `source` set split changes override precedence | Wrong brand values | `sets.js` unit test asserting `brand-chassis` primitives win over `base/brand-base` |
| sd-transforms 2.0 `addFontStyles` may not split weights without a style word | Missing `-style` tokens in `string.scss` | Phase 2 checklist item; add to `chassis/types` if needed |
| Publishing workflow ships committed `dist/` without building | Stale package | Phase 6 adds build plus verify to CI |
| Site build depends on `dist/web/docs/chassis/main.scss` via `@chassis-ui/css` | Sass compile break on duplicate names | Harness checks name uniqueness; Phase 6 runs `astro:build` |

Open decisions for Ozgur (answer by editing this list):

- [ ] One commit per phase on `develop`, no pushes until asked. Confirm.
- [ ] Phase 6 regenerates `dist/` in the new natural order rather than sorting to match the old order. Confirm, or ask for sorting. Default if unanswered: regenerate.

## Session log

Append-only. One entry per session: date, phase, what was done, what was verified, what is next, surprises.

- 2026-09-22 (planning): Reviewed `build/tokens/`, `tokens/`, `dist/`, `site/`, CI. Confirmed committed `dist/` equals the SD 4.4 build output except header lines. Extracted the Output contract from the templates. Wrote this plan (first as a Claude Doc, then moved here; the Claude Doc is superseded). Next: Phase 0.

# Chassis Tokens Build Rewrite Plan

Written 2026-09-27. Author: Ozgur Gunes, with Claude. This replaces the plan of 2026-09-22 (commit `4d34eed`), which is superseded and must not be followed.

## What this rewrite is for

In priority order:

1. **Get value logic out of the templates.** Today the templates in `build/tokens/templates/` convert colours, units, font names, quoting and references while printing. That logic is untested, duplicated across platforms and hard to change. This is the main problem.
2. **Upgrade** to Style Dictionary 5.5 and sd-transforms 2.0.
3. **Simplify the build loop.** Secondary. It is done last and can be dropped.

The rewrite changes where logic lives, not what the build emits. Token JSON and output values, formats, file names and token order do not change, in any phase.

Added 2026-09-27, after Phase 7:

4. **Bring back the adopter presets.** Chassis Tokens is an "own and customize" package. Its defaults target Chassis CSS, but a team with its own CSS framework needs plain SCSS variables. The old build had presets for this (`web-px`, `web-vw`, the `cx/scss-variables` format) and an `outputReferences` option for SCSS and Android. Phases 1 and 6a deleted them as unused, because no configured app selects them. That was wrong: they are features for adopters. Phases 8 to 11 restore them in the new structure.

Added 2026-09-27, after Phase 11:

5. **iOS references.** A new adopter option: `outputReferences` on `ios` prints the name of another constant of the same Swift class, with the safe rule of the Android references. The old build never had it, so there is no old output to match. Phase 12 adds it.

Added 2026-09-27, after Phase 12:

6. **Fix the iOS and Android output.** Unlike Phases 0 to 12, these phases change `dist/` on purpose: values that are wrong on the platform (Phases 13 to 15), the file layout that stops the files from being used together (Phases 17 to 19), and native outputs the platforms lack (Phases 20 to 22). Phase 16 is housekeeping. Each change needs Ozgur's approval in Open decisions before its phase starts.

Added 2026-09-27, after Phase 22:

7. **Make the package production-ready.** The build is done and checked, but the repository around it is not: the npm package leaves out the iOS and Android output, no check runs on a pull request, `pnpm check` cannot fail, releases are a manual version bump, and there are no contributor docs. Phases 23 to 26 fix what is broken and merge the branch as 0.6.0. Phases 27 to 35 add what a maintained, contributor-friendly package needs. None of them changes the content of `dist/`.

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

| Phase | Scope                                                                       | Model  | Status                            | Commit                               | Date       |
| ----- | --------------------------------------------------------------------------- | ------ | --------------------------------- | ------------------------------------ | ---------- |
| 0     | Golden harness                                                              | Sonnet | Done                              | `rewrite(phase 0)`                   | 2026-09-27 |
| 1     | iOS and Android value encoders                                              | Opus   | Done                              | `rewrite(phase 1)`                   | 2026-09-27 |
| 2     | Web value encoder                                                           | Opus   | Done                              | `rewrite(phase 2)`                   | 2026-09-27 |
| 3     | Web `var(--…)` policy                                                       | Fable  | Done                              | `rewrite(phase 3)`                   | 2026-09-27 |
| 4     | Upgrade to SD 5.5 and sd-transforms 2.0                                     | Fable  | Done                              | `rewrite(phase 4)`                   | 2026-09-27 |
| 5     | Replace forked preprocessor (optional)                                      | Opus   | Done                              | `rewrite(phase 5)`                   | 2026-09-27 |
| 6a    | Cleanup, version header, CI guard                                           | Opus   | Done                              | `rewrite(phase 6a)`                  | 2026-09-27 |
| 6b    | Build loop                                                                  | Opus   | Done                              | `rewrite(phase 6b)`                  | 2026-09-27 |
| 6c    | Tests README, docs, final acceptance                                        | Opus   | Done                              | `rewrite(phase 6c)`                  | 2026-09-27 |
| 7     | Site docs                                                                   | Opus   | Done                              | `rewrite(phase 7)`                   | 2026-09-27 |
| 8     | Preset baselines, SCSS variable presets (resolved)                          | Fable  | Done                              | `rewrite(phase 8)`                   | 2026-09-27 |
| 9     | SCSS variable references (`outputReferences`)                               | Opus   | Done                              | `rewrite(phase 9)`                   | 2026-09-27 |
| 10    | Android references (`outputReferences`)                                     | Opus   | Done                              | `rewrite(phase 10)`                  | 2026-09-27 |
| 11    | Preset docs                                                                 | Opus   | Done                              | `rewrite(phase 11)`                  | 2026-09-27 |
| 12    | iOS references (`outputReferences`), new                                    | Opus   | Done                              | `rewrite(phase 12)`                  | 2026-09-27 |
| 13    | Mobile typography values: percent line height, Android letter spacing in em | Opus   | Done                              | `rewrite(phase 13)`                  | 2026-09-27 |
| 14    | Font weights as numbers                                                     | Opus   | Done                              | `rewrite(phase 14)`                  | 2026-09-27 |
| 15    | Gradients on mobile as parts                                                | Opus   | Done                              | `rewrite(phase 15)`                  | 2026-09-27 |
| 16    | Dead `dimension` filter condition                                           | Sonnet | Done                              | `rewrite(phase 16)`                  | 2026-09-27 |
| 17    | iOS type and file names                                                     | Opus   | Done                              | `rewrite(phase 17)`                  | 2026-09-27 |
| 18    | iOS colours that follow dark mode                                           | Fable  | Done                              | `rewrite(phase 18)`                  | 2026-09-27 |
| 19    | Android resource tree                                                       | Fable  | Done                              | `rewrite(phase 19)`                  | 2026-09-27 |
| 20    | SwiftUI and Compose outputs (optional)                                      | Opus   | Done                              | `rewrite(phase 20)`                  | 2026-09-27 |
| 21    | Icon assets (optional)                                                      | Opus   | Done                              | `rewrite(phase 21)`                  | 2026-09-27 |
| 22    | Platform shadow values (optional)                                           | Opus   | Done                              | `rewrite(phase 22)`                  | 2026-09-27 |
| 23    | Package contents and scripts                                                | Opus   | Done                              | `rewrite(phase 23)`                  | 2026-09-27 |
| 24    | Lint and audit clean                                                        | Sonnet | Done                              | `rewrite(phase 24)`                  | 2026-09-27 |
| 25    | CI for pull requests                                                        | Opus   | Done                              | `rewrite(phase 25)`                  | 2026-09-27 |
| 26    | Merge preparation and 0.6.0                                                 | Opus   | Done (merged locally, not pushed) | `rewrite(phase 26)`, merge `588874e` | 2026-09-27 |
| 27    | Workspace split: tokens and site (optional)                                 | Opus   | Done                              | `rewrite(phase 27)`                  | 2026-09-27 |
| 27b   | Align the layout with chassis-react                                         | Opus   | Done                              | `rewrite(phase 27b)`                 | 2026-09-27 |
| 28    | Contributor docs and README                                                 | Opus   | Done                              | `rewrite(phase 28)`                  | 2026-09-27 |
| 29    | Release automation                                                          | Opus   | Done                              | `rewrite(phase 29)`                  | 2026-09-27 |
| 30    | Token diff report on pull requests                                          | Opus   | Done                              | `rewrite(phase 30)`                  | 2026-09-27 |
| 31    | Token source lint                                                           | Opus   | Not started                       |                                      |            |
| 32    | Type checking of the build code                                             | Opus   | Not started                       |                                      |            |
| 33    | Native compile checks in CI                                                 | Fable  | Not started                       |                                      |            |
| 34    | Swift package and Android library (optional)                                | Fable  | Not started                       |                                      |            |
| 35    | Retire the plan                                                             | Sonnet | Not started                       |                                      |            |

## Ground rules

- **Branch:** `dev/rewrite`. One commit per phase. No pushes, no version bumps.
- **Frozen folders:** `tokens/`, `site/`, `dist/`. No phase changes them, except Phase 7, which Ozgur approved for the build pages of `site/content/docs/`, and Phases 13 to 22, which change `dist/` under the Output changes rule below and update the iOS, Android and Style Dictionary pages of `site/content/docs/` to match. If a phase cannot pass the golden diff without changing output, stop and ask Ozgur.
- **Never run the build into `dist/` during the rewrite.** Use `pnpm tokens:verify`, or pass `--out <dir>` when running `build/tokens/build.js` directly. Before committing, `git status --short dist` must be empty.
- **Golden diff:** every phase ends with `pnpm tokens:verify` green in strict mode. The check builds into `dist-next/` and compares against committed `dist/`, ignoring lines that contain `Generated on` or `Chassis - Tokens v`.
- **No legacy copy of the build.** Committed `dist/` is the reference output and git holds the old code.
- **Preset baselines (Phases 8 to 10):** the presets write nothing into `dist/`, so their reference output is built once from the old code on `main` and committed under `build/tokens/test/golden/<preset>/`. A preset phase ends with its preset check green and `pnpm tokens:verify` green. Lines that differ from the old output on purpose are listed in the phase result, one row per rule, and need Ozgur's approval first.
- **iOS reference baseline (Phase 12):** the old build has no iOS references, so the `ios-references` baseline is written by the new code. It is accepted only after a line-by-line comparison with committed `dist/ios/demo/chassis/`: every line that prints a value equals the `dist/` line, and every line that prints a name has, in `dist/`, the same value as the line that declares that name in the same file.
- **Output changes (Phases 13 to 22):** these phases change `dist/` on purpose, and only as Open decisions approved. The phase builds both brands into `dist-next/`, reviews the difference against `dist/`, and copies the changed files into `dist/`; every line outside the approved change must stay equal, which the header-insensitive diff shows. The iOS and Android preset baselines (`ios-references`, `android-references`) are rewritten the same way. The phase result lists each changed group of lines with a count and one example, and the CHANGELOG entry marks what breaks app code. `dist/` must compile: `swiftc` with the stand-in UIKit for every Swift file, and aapt2 for every Android file (aapt2 is downloaded to the session scratchpad, as on 2026-09-27; it is not in the repo). The Output contract section is updated in the same phase.
- **Tests:** new unit tests use real tokens copied from `tokens/` as fixtures, never mocks of `style-dictionary`. The 99 existing mock-based tests stay green while the code they cover exists; when a phase removes that code, it removes the test.
- **Build config stays in `package.json` `chassis.build`:** brands `chassis` and `sinefil`; themes `light`, `dark`; screens `large`, `medium`, `small`; apps `docs` (web) and `demo` (ios, android).
- **Production phases (23 to 35):**
  - Branch: Phases 23 to 25 commit on `dev/rewrite`. Phase 26 prepares the merge; Ozgur pushes, opens the pull request, merges and releases. Phases 27 to 35 commit on `dev/production`, created from `main` after the merge. One commit per phase, no pushes; Ozgur pushes.
  - Output: no phase changes the content of `dist/` or of the preset baselines. Every phase ends with `pnpm tokens:verify`, `pnpm tokens:verify:presets` and `pnpm tokens:test` green. The only `dist/` change is Phase 26's version header, if approved.
  - `tokens/` stays frozen. `site/` changes only where a phase says so.
  - Settings outside the repository (npm trusted publisher, GitHub branch protection, repository secrets, Vercel project settings) are Ozgur's. The phase writes the steps into its Result as a checklist, and Claude does not change them.
  - A workflow file cannot run until it is pushed. Its phase checks it with `actionlint` (downloaded to the session scratchpad, with approval) and runs each job's commands locally. The first real run is recorded in the next session's log entry.
  - Tools downloaded for a check (actionlint, aapt2, kotlinc) go to the session scratchpad, never into the repository, as in Phases 20 and 21.
  - After Phase 27b, the token files are in `packages/tokens/source/`, the build in `packages/tokens/build/`, its tests in `packages/tokens/test/` and the output in `packages/tokens/dist/`; the site is `packages/site/`. Later phases name the old paths (`tokens/`, `build/tokens/`, `site/`); read them in the new layout.

## Facts verified on 2026-09-27

- The SD 4.4.0 build (sd-transforms 1.3.0, Node 24) reproduces all 42 files in `dist/` exactly, apart from the timestamp line. It takes about 20 s for 36 runs. It reports 200 to 264 token collisions per light run and 3000 to 3064 per dark run.
- The SD 5.5.5 build (sd-transforms 2.0.3, Node 24), in place since Phase 4, reproduces the same 42 files in about 9.5 s with 36 runs, and in about 5.8 s with 16 instances since Phase 6b. It counts collisions differently: 21 to 34 per light run and 715 to 728 per dark run.
- `pnpm tokens:test` passes: 8 files, 99 tests.
- Latest published versions: `style-dictionary` 5.5.5 (needs Node 22 or later), `@tokens-studio/sd-transforms` 2.0.3 (needs SD 5; its changelog lists no other breaking change).
- Style Dictionary accepts `source` and `include` only at the top level of the config, in both 4.4 and 5.5.5. All platforms of one instance share one token dictionary.
- The build uses four distinct token-set lists per (brand, app). They differ only in the theme set and the screen set:

| Token sets     | Files                                   |
| -------------- | --------------------------------------- |
| light + large  | main, string, color-light, number-large |
| dark + large   | color-dark                              |
| light + medium | number-medium                           |
| light + small  | number-small                            |

- 564 colour tokens have the form `rgba({colour reference}, {opacity reference})`, and 180 colour tokens apply a lighten or darken modifier to a reference.
- In sd-transforms 1.3.0 and 2.0.3, `alwaysAddFontStyle` applies to typography tokens only. Plain `fontWeight` tokens without a style word are not split into `weight` and `style` by the official preprocessor.
- In sd-transforms 2.0.3 the official `addFontStyles` takes about 210 ms per run on the real token sets, against about 10 ms for the Chassis code, because it converts the whole dictionary to a map for every font weight it resolves. Over 36 runs that is about 8 s. The official `alignTypes` takes about 5 ms.
- `web-px`, `web-vw`, the `scss-variables` template, the `cx/test` transform and format, and the `cx/colorTokens` filter were not used by any configured app. They were deleted in Phase 6a. Correction of 2026-09-27: `web-px`, `web-vw` and `scss-variables` are adopter presets, not dead code (see Facts about the presets).
- The Android template's `@type/name` reference branch never runs, because `outputReferences` is never set. Correction of 2026-09-27: it is an adopter option; Phase 1 deleted it and Phase 10 restores it.
- No token in the built sets has a description, and `dist/` contains no per-token comments.
- The token set `brand-chassis/app-base` is not selected by any theme in `$themes.json`, so it is never built.
- The `dictionary.tokens` that a format receives is already filtered by the file's filter, in SD 4.4 and in SD 5.5. The web reference lookups therefore see only the tokens of the file being printed (`main.scss` has no `color.primitive.*`, for example).
- SD 5 resolves references in every token property except `original`, including `$extensions`, and fails the build on a reference to a group. SD 4.4 left such a reference as it was.
- SD 5 keeps tokens in a map. Expanding a typography or shadow token deletes it and appends its sub-tokens at the end, so expanded tokens come after all others. SD 4.4 expanded them in place.
- Resolved web token values, printed values and reference lookups are the same in SD 4.4 and SD 5.5 for all 14 web files, including math on references and letter spacing.
- Of the web reference policy, current tokens reach only these rows: `color.context`, `shadow.context`, `borderRadius.context`, `borderWidth.context` and the `borderRadius.base.<component>` follow. No emitted token is a single reference to `color.primitive`, `space.context`, `opacity.context`, `opacity.level` or `<group>.base.context`, and there are no `borderWidth.base.*` tokens.
- Every object-valued typography token references its font family, weight and size. Line height is a reference (244) or a literal `125%` / `150%` (18). Every reference-valued typography token points at `font.text.<size>.<weight>`.
- Prototype, run in a scratch copy against the real tokens: the iOS value logic moved into a pure `encode(token)` function with a print-only template. All 14 iOS files came out identical to `dist/`.
- Counter-test: the same colour encoding registered as a Style Dictionary value transform fails the build with `Invalid color: rgba(UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 1), 0)`.

### Facts about the presets

Verified on 2026-09-27 by building the old code: `git archive main build/tokens tokens package.json` into a scratch directory, `style-dictionary` 4.4.0, `@tokens-studio/sd-transforms` 1.3.0, `tinycolor2` 1.6.0, Node 24, brand `chassis`.

How the old build offered them:

- A preset was a platform name in `chassis.build.apps`, for example `"docs": ["web-px"]`. `config/index.js` knew `web`, `web-px`, `web-vw`, `ios` and `android`. All three web presets wrote to `dist/web/<app>/<brand>/`.
- `web` used the format `cx/scss-chassis-css` with `cx/size/rem`. `web-px` and `web-vw` used `cx/scss-variables` with `cx/size/px` and `cx/size/vw`. No preset combined rem with `cx/scss-variables`; an adopter changed the `format` constant in `config/web.js`.
- `outputReferences` was set by hand in the `options` object of a platform config. Only the `cx/scss-variables` and `cx/android-resources` templates read it. The iOS template did not.

What the old build printed:

| Build                         | Result                                                                                                                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web-px`, resolved            | 7 files, 6953 variables, no references, 472 KB                                                                                                                                                                                          |
| `web-vw`, resolved            | builds; `16px` prints `1vw`                                                                                                                                                                                                             |
| `web-px`, `outputReferences`  | 1238 of 6953 lines print `$cx-…`: 810 colours to `color-context`, 164 border radii, 72 border widths, 192 typography maps. Every name is defined in one of the 7 files, and every reference means the same value as the resolved build. |
| `android`, resolved           | identical to `dist/android`                                                                                                                                                                                                             |
| `android`, `outputReferences` | 14243 of 19885 lines print `@type/name`, 1.6 MB. 18 lines name a resource that does not exist, and 30 lines mean another value than the resolved build.                                                                                 |

- With SCSS references, 270 lines of `main.scss` use a variable that another file defines (`$cx-color-context-…` from `color-<theme>.scss`, border tokens from `number-<screen>.scss`). The adopter must load the colour and number files before `main.scss`.
- The old SCSS reference rule is narrower than its name: only single references in `color`, `space`, `opacity`, `borderRadius` and `borderWidth` print a variable, with the same exceptions as the `var(--…)` policy. Current tokens reach only colours and borders. The `opacity` rows would print `$cx-opacity-<step>`, which no file defines; no current token reaches them.
- Resolved typography maps quote the whole family list as one string (`"font-family": "Inter, system-ui, …"`). With references the map holds the variable, which is an unquoted list.
- Letter spacing prints the number of the size with `em`. With `cx/size/rem` and `cx/size/vw` the size is divided by 16 first (`-0.0313em`). With `cx/size/px` it is not: `font.context.jumbo` prints `"letter-spacing": -0.5em`.
- The 18 broken Android lines use the resource type of the referencing token, not of the target: `@integer/size_unit_0`, `@integer/size_unit_nd05` and `@integer/size_unit_n1` (the targets are `dimen`), and `@color/opacity_context_fg_subtle` (the target is not a colour).
- Correction of 2026-09-27 (Phase 10): the 18 lines are among the 30, so 30 lines are affected, not 48.
- The 30 Android lines with another meaning: font sizes that reference `size.unit.*` (`96sp` becomes `@dimen/size_unit_96`, which is `96dp`), letter spacing, and the `bg-blur` colours, whose `rgba({colour}, {opacity})` value prints a reference to the colour alone and loses the alpha (`#80b7c0c2` becomes `#ffb7c0c2`).

### Facts about iOS references

Measured on 2026-09-27 with a prototype in a scratch copy of the repository, brand `chassis`, app `demo`. The prototype template printed the name of the first token that the original value references, looked up in the file's own tokens as the Android template does, when that token encodes to the same Swift text and the value is not a size computed with math. It did not exclude base colours.

| File                                     | Lines that print a name | Value kept: target in another file | Value kept: target encodes differently | Value kept: math |
| ---------------------------------------- | ----------------------- | ---------------------------------- | -------------------------------------- | ---------------- |
| `Main.swift`                             | 4460 of 6487            | 300                                | 658                                    | 1                |
| `String.swift`                           | 577 of 1415             | 0                                  | 0                                      | 0                |
| `ColorLight.swift`, `ColorDark.swift`    | 741 of 1445 each        | 702 each                           | 2 each                                 | 0                |
| `NumberLarge.swift`, `…Medium`, `…Small` | 2811 of 3031 each       | 0                                  | 0                                      | 1 each           |

- A reference is the bare constant name: `@objc public static let SizeUnit4 = DimensionBase4`. Swift accepts an unqualified static member in a static property initializer, so the line does not depend on the class name, which `options.className` can change.
- All 7 files type-check with `swiftc -typecheck` (Swift 6.4) against a stand-in UIKit module (`@_exported import AppKit; public typealias UIColor = NSColor`). There is no Xcode on this machine.
- The value check is needed. The 660 lines whose target encodes differently are `rgba({colour}, {opacity.level.*})` colours, where the target has alpha 1 (`ColorBasePrimitiveLightPrimaryT5040` on `…Primary50`: alpha 0.4 against 1), and colours with a Tokens Studio lighten or darken modifier (`ColorBasePrimitiveLightSuccess90` on `…SuccessBase`).
- The colour files cannot name the base colours they reference, because `color.base.*` is only in `Main.swift`. Every file declares `ChassisTokens`, so a reference across files is not possible.
- 715 of the 4460 names in `Main.swift` are base colours naming base colours. The Android rule prints values for base colours, so with that rule `Main.swift` has 3745 names.
- `static let` is initialised lazily on first use, so a name costs one extra lookup the first time. A cycle would deadlock at run time, but Style Dictionary rejects circular token references before printing.
- File sizes change both ways: the colour files shrink from 167 KB to 143 KB, the number files grow from 215 KB to 239 KB (`DimensionBase16` is longer than `CGFloat(16)`), `Main.swift` grows from 566 KB to 571 KB. Type-checking `Main.swift` took 0.49 s against 0.74 s for the `dist/` file.

### Facts about the repository (Phases 23 to 35)

Measured on `dev/rewrite` at `rewrite(phase 22)`:

- Green: `pnpm tokens:test` (745 tests), `pnpm tokens:lint`, `pnpm tokens:verify` (114 files) and `pnpm tokens:verify:presets` (8 presets).
- `npm pack --dry-run` lists 37 files, 102.7 kB packed. The `files` glob `dist/**/*.{css,scss,json,js,ts}` keeps the 14 web SCSS files and the iOS asset catalog's `Contents.json` files, and drops every `.swift`, `.xml`, `.kt` and `.svg`. So no iOS or Android output reaches npm, and the asset catalog ships without its images. All 114 `dist/` files together are about 750 kB gzipped.
- The package description names a "token transformer, asset manager and icon generator", but `build/` is not published.
- The only workflow is `.github/workflows/publish-release.yml`, on push to `main`. It runs `pnpm install` without `--frozen-lockfile` and `pnpm tokens:verify`, then publishes with the long-lived `NPM_CHASSIS_UI` token. It runs no tests and no lint. Nothing runs on a pull request.
- `pnpm check` runs its steps as `a & b & c & wait`. A bare `wait` exits 0, so `check` passes when a step fails. `check:lockfile` reads `package-lock.json`, which does not exist in this pnpm repository, so it always fails; lockfile-lint reads npm and yarn lockfiles only.
- `pnpm site:lint` fails: Prettier reports 6 files under `site/src/components/homepage/`. `README.md`, `CHANGELOG.md` and `publish-release.yml` did not pass Prettier before the rewrite either (Phase 6a and Phase 11 logs).
- `pnpm audit` reports 39 advisories (1 critical, 27 high, 11 moderate), all in dev dependencies. Most come through Astro and `@astrojs/check`; the critical one is an Astro remote code execution in AVIF image optimisation. The site is built on Vercel, so it matters there.
- About 31 of the 53 dev dependencies are used only by `site/` (Astro and its plugins, Pagefind, `@chassis-ui/css`, `@chassis-ui/docs`, calendar, clipboard and StackBlitz libraries). A contributor who changes a token installs all of them.
- `site:lint:vnu`, `build/vnu-jar.js` and the `vnu-jar` dependency are still there, though the CHANGELOG says `html-validate` replaced them. Nothing in CI or the docs runs `tokens:zip` (`build/zip-tokens.js`).
- `build/` holds about 3,500 lines of JavaScript with no type checking (no `checkJs`, no `// @ts-check`), though `typescript` is a dev dependency and Style Dictionary ships types.
- `change-version.js` rewrites the version in `package.json`, `README.md` (a hardcoded badge) and `site/config.yml` (`current_version`).
- The README's CLI examples use a `test` brand and app that the configuration does not have, and it says the platform configs have "no shared dependencies", though `web-px`, `web-vw` and `web-scss` call `webConfig()` from `web.js`.
- There is no `CONTRIBUTING.md`, `SECURITY.md`, code of conduct, `CODEOWNERS`, issue or pull request template, or Dependabot or Renovate configuration.
- `dev/rewrite` is 37 commits ahead of `main`: 287 files, about 229,000 lines added and 48,000 removed, most of it `dist/` (9.7 MB) and the preset baselines (9.5 MB).
- The iOS and Android compile checks of Phases 13 to 22 ran by hand: `swiftc` with a stand-in UIKit, aapt2 and kotlinc from the scratchpad. The iOS SDK and `actool` need Xcode, which this machine does not have.

## Design decisions

### Presets are configuration, references are a policy

Added 2026-09-27 for Phases 8 to 10. The presets come back inside the structure of Phases 1 to 3. No value logic returns to a template, and there is no second SCSS template.

- **Selection stays as it was:** a platform name in `chassis.build.apps` (`web`, `web-px`, `web-vw`, and the new `web-scss`: rem with SCSS variables). `config/web.js` becomes a factory with two settings, `unit` (`rem`, `px`, `vw`) and `format` (`cx/scss-chassis-css`, `cx/scss-variables`). `web-px.js`, `web-vw.js` and `web-scss.js` are a few lines each that call it. Both format names, `cx/scss-chassis-css` and `cx/scss-variables`, stay registered, because adopters' own configs name them.
- **Units** are Style Dictionary transforms again (`cx/size/px`, `cx/size/vw`), backed by pure functions in `values/web.js`, like `cx/size/rem`. They are safe before resolution.
- **SCSS references** are a second policy module beside `css-var-policy.js`. The rules both share are in `reference-policy.js`: eligibility, which token a reference names, the chain follow and the typography maps. They differ in the name they print: `$<name of the named token>`. The format `cx/scss-variables` prints references when `options.outputReferences` is `true`, as in the old build; without it the preset prints resolved values. `chassis.build.options.<platform>` is merged into the Style Dictionary options of that platform, so `outputReferences` can be set without editing a config file.
- **Android references** are one pure function in `values/android.js` that takes the token and the token it references and returns `@type/name` or nothing. The template passes the lookup in, as the SCSS template does.
- **A reference is printed only when it is safe:** the target is emitted, the resource type of the target is used, and the encoded target equals the encoded token. This changes 48 Android lines of the old output. Ozgur confirmed it on 2026-09-27. (Phase 10: the target must be in the same file, as in the old build, and of the same element as the token, so the type printed is both. The change is 30 lines; the 18 broken lines are among the 30.)
- **iOS references** (added 2026-09-27, Phase 12) follow the Android design: one pure function `reference(token, target)` in `values/ios.js` that returns the constant name or nothing, with the target looked up in the file's own tokens by the template. The option is read from the platform options, so `"options": { "ios": { "outputReferences": true } }` in `chassis.build` sets it. Without it the output is `dist/` as it is.

### Platform encoding happens after resolution, in pure functions

Platform encoding means turning a resolved value into its final text: `UIColor(…)`, ARGB hex, `sp`/`dp`, `CGFloat(…)`, quoting.

This cannot be an ordinary Style Dictionary value transform. Style Dictionary transforms a referenced token before it resolves the tokens that point at it. If a base colour became `UIColor(…)` first, the 564 `rgba({…}, {…})` tokens and the 180 modifier tokens would receive `UIColor(…)` as input and fail.

So each platform gets an encoder module:

- `build/tokens/values/ios.js`, `android.js`, `web.js`
- Each exports pure functions that take a fully resolved token and return a string. They do not import `style-dictionary`.
- Formats become thin: header, one line per token using the encoder, footer.
- Style Dictionary transforms keep doing only what is safe before resolution: names, `ts/resolveMath`, `ts/color/modifiers`, `ts/color/css/hexrgba`, and the existing web `cx/size/rem` and `cx/shadow/web`.

### One instance per token-set list

Phase 6 builds one `StyleDictionary` instance per row of the token-set table above, with one SD platform per target platform of the app. That is 16 instances and 24 platform exports instead of 36 runs. Done in Phase 6b: the build time went from about 9.5 s to about 5.8 s.

Every instance lists its sets in `source`, in the order `permutateThemes` returns them, exactly as today. This keeps override precedence and token order unchanged.

## Output contract (frozen)

### Files

`dist/<platform>/<app>/<brand>/`, seven files each, 42 in total; since Phase 18 iOS has an eighth, `Color.swift`, so 44; since Phase 19 Android also has a resource tree of 7 files under `res/`, so 58; since Phase 21 the icons add `Icons.xcassets` (19 files) and 9 drawables per brand, so 114.

| Platform | Files                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| web      | `main.scss`, `string.scss`, `color-<theme>.scss`, `number-<screen>.scss`                                                                                                                                         |
| iOS      | `ChassisTokens.swift` (`Main.swift` until Phase 17), `String.swift`, `Color<Theme>.swift`, `Number<Screen>.swift`, and `Color.swift` when the themes include `light` and `dark` (since Phase 18)                 |
| Android  | `main.xml`, `string.xml`, `color_<theme>.xml`, `number_<screen>.xml`, and since Phase 19 `res/values/{string,color_base,color,number}.xml`, `res/values-night/color.xml` and `res/values-<qualifier>/number.xml` |

### Filters

| File     | Included types                                                                                  | Exclusions                                            |
| -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| main     | color, font group, gradient, number group, shadow, size group, string group                     | colours with `path[1]` in primitive, context, utility |
| color-*  | color                                                                                           | `path[1]` in base, utility                            |
| number-* | duration, letterSpacing, number, opacity, size group                                            | none                                                  |
| string   | asset, content, fontFamily, fontStyle, fontWeight, string, text, textCase, textDecoration, type | none                                                  |

- font group: fontFamily, fontSize, fontStyle, fontWeight, letterSpacing, lineHeight, paragraphSpacing, textCase, textDecoration, typography
- size group: dimension, fontSize, lineHeight, paragraphSpacing
- Tokens typed `boolean` and `other` are never emitted.
- `dimension.base.*` (71 tokens) is emitted in the main and number files on purpose: other sizes reference it, and with `outputReferences` they name it. Until Phase 16 both filters also excluded size types with `path[1] == dimension`, which matched no token.

### Type alignment

Types are aligned by `alignTypes` from sd-transforms, which also turns `text` into `content` and shadow `x`/`y` into `offsetX`/`offsetY`. Differences from stock sd-transforms 2.0: `letterSpacing` becomes `number` (stock: `dimension`), and every `fontWeight` token is split into `<name>.weight` and `<name>.style` (stock: only the ones that name a style).

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

| Referenced path                                                     | Emitted                                                                                             |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `color.context.X.Y`, `color.primitive.X.Y`                          | `--X-Y`                                                                                             |
| `space.context.X`                                                   | `--space-X`                                                                                         |
| `opacity.context.X`, `opacity.level.X`                              | `--opacity-X`                                                                                       |
| `shadow.context.X`                                                  | `--box-shadow-<abbr X>`                                                                             |
| `borderRadius.context.X`, `borderRadius.base.context.X`             | `--border-radius-<abbr X>`                                                                          |
| `borderWidth.context.X`, `borderWidth.base.context.X`               | `--border-width-<abbr X>`                                                                           |
| `borderRadius.base.<component>.X`, `borderWidth.base.<component>.X` | follow one more reference; if it is the same `path[0]` and contains `context`, use its last segment |
| anything else                                                       | the resolved literal value                                                                          |

Typography maps:

- Object-valued (`font.context.*`, `font.text.*`): `--font-family-<family>`, `--font-weight-<family>-<weight>`. Font size and line height print `--font-size-<group>-<abbr size>` and `--line-height-<group>-<abbr size>` when they reference fontSize or lineHeight tokens; otherwise the literal, with percent line heights converted to `em` (`125%` to `1.25em`).
- Reference-valued (`font.button.medium` = `{font.text.medium.strong}`): `--font-family-text`, `--font-weight-strong`, `--font-size-md`, `--line-height-md`, taken from the reference path.

Scale abbreviations: 4xsmall→4xs, 3xsmall→3xs, 2xsmall→2xs, xsmall→xs, small→sm, medium→md, large→lg, xlarge→xl, 2xlarge→2xl up to 6xlarge→6xl. Other names pass through.

### iOS

`import UIKit`, one `public static let <PascalName> = …` per token. Since Phase 17 each file declares its own `public enum`: `ChassisTokens` in `ChassisTokens.swift` and `ChassisTokens<File>` in the others; until then every file declared `public class ChassisTokens` and marked each constant `@objc`. Typography and shadow tokens are expanded into sub-tokens (`FontContextJumboFontSize`, `ShadowContextSmall1Blur`).

- Colours: `UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 1)`, three decimals per channel, alpha as parsed.
- Number and size groups: `CGFloat(<parseFloat>)`. Since Phase 13, a percentage line height is the percentage of the font size part of the same typography token, to three decimals (`125%` of `96` is `CGFloat(120)`).
- fontFamily: first family only, quotes stripped, then double-quoted.
- fontWeight: since Phase 14, a `UIFont.Weight` constant (`UIFont.Weight.semibold`), from the weight number of the web's name map, rounded to the nearest hundred from 100 to 900. It was the lowercase name, first space replaced by a hyphen, double-quoted.
- Other string-group types: double-quoted.
- Gradients (since Phase 15): a colour token with a `linear-gradient(…)` value prints as parts instead of one constant: `<Name>Angle` (CSS degrees from 0 to less than 360), and `<Name>Stop<N>Color` and `<Name>Stop<N>Position` (0 to 1) per stop.

### Android

`<resources>` with one element per token, snake_case names, same expansion as iOS.

- Element by type: size group → `dimen`, color → `color`, string group and content → `string`, number group → `integer`, anything else → `string`. Changed 2026-09-27 with Ozgur's approval: opacity and letter spacing (type `opacity` or `letterSpacing`, or `path[1] == letterSpacing`) → `<item type="dimen" format="float">`, because aapt2 rejects fractions in `<integer>`. References to them are `@dimen/…`. Since Phase 14, font weights → `<integer>` with the weight number of the web's name map (`600`); they were lowercase name strings.
- Colours: ARGB hex8 (`#80b7c0c2`).
- Gradients (since Phase 15): as on iOS, `<name>_angle`, `<name>_stop_<n>_color` and `<name>_stop_<n>_position`; the angle and positions are float items.
- `sp` when the last path segment is fontSize, lineHeight or paragraphSpacing, or the type is fontSize or lineHeight, or `path[1]` is `paragraphSpacing`. Since Phase 13, a percentage line height is the percentage of the font size part of the same typography token (`120sp`).
- Bare number when `path[1]` is `letterSpacing` or the type is `letterSpacing`. Since Phase 13, the letter spacing part of a typography token is in ems of its font size, to four decimals (`-0.0052`); the standalone scale keeps its px number.
- `dp` for the remaining size-group types.
- The order of these rules matters: colour, fontFamily, fontWeight, `sp`, letterSpacing, `dp`.
- String resources are escaped (since 2026-09-27, with Ozgur's approval): `&`, `<` and `>` become entities, `\`, `'` and `"` get a backslash, and so does a leading `@` or `?`.

## Phase 0: golden harness

Goal: one command that proves a build output equals `dist/`. No change to build behaviour.

- [x] `build/tokens/verify.js`: compare a directory (default `dist-next/`) against `dist/` file by file, skipping the two header lines. Report missing, extra and differing files with the first differing lines. Exit non-zero on any difference.
- [x] In the same script, fail if a `$cx-*` name, a Swift `static let` name or an XML `name=""` appears twice in one file.
- [x] Add `--out <dir>` to the build so it can write somewhere other than `dist/`. Default stays `dist/`.
- [x] Scripts: `tokens:verify` runs the build into `dist-next/` and then the comparison. Add `dist-next/` to `.gitignore`.
- [x] `build/tokens/test/golden.test.js`: runs the same check under vitest.
- [x] Acceptance: `pnpm tokens:verify` green; `git status` shows `dist/` untouched.

Usage for later phases: `pnpm tokens:verify` checks all 42 files (about 6 s since Phase 6b). `pnpm tokens:verify --platform ios` builds and checks one platform only (about 3 s). `node build/tokens/verify.js --skip-build` re-compares an existing `dist-next/`. The verifier deletes its output directory before building and refuses any directory that is or contains `dist/`.

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

| Case                                                                               | Old template                            | Now    |
| ---------------------------------------------------------------------------------- | --------------------------------------- | ------ |
| Typography with a literal font size                                                | `"font-size": undefined`                | throws |
| Typography with a literal font family or weight                                    | one character of the string in the name | throws |
| Reference-valued typography whose reference is not `font.<family>.<size>.<weight>` | `undefined` in the names                | throws |
| Reference cycle in the chain follow                                                | not checked                             | throws |

## Phase 4: upgrade to SD 5.5 and sd-transforms 2.0

Goal: same output on the new libraries, upgraded in place.

- [x] `pnpm add -D style-dictionary@^5.5 @tokens-studio/sd-transforms@^2.0`. Add `"engines": { "node": ">=22" }` to `package.json`.
- [x] Set `log.errors.brokenReferences` to `throw`.
- [x] SD 5 allows references to tokens only, not to groups. Test whether `$extensions.chassis.originalFontWeight`, which holds a string like `{typography.fontWeight.text.mass}`, triggers this. That path is a group after the weight and style split. If it does, store the path in a form SD does not parse as a reference.
- [x] Check math on references (`dimension.base.*`, letter spacing) for rounding changes.
- [x] Record build time before and after in the Session log.
- [x] Acceptance: `pnpm tokens:verify` green; all tests green.

Result: installed `style-dictionary` 5.5.5 and `@tokens-studio/sd-transforms` 2.0.3. Two things broke and were fixed in the build code; no value changed.

| Problem on SD 5                                                                                                      | Fix                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All 36 runs failed with 16 reference errors: `originalFontWeight` held references to groups                          | The preprocessor stores `$extensions.chassis.fontWeightPath` as path segments (`['typography', 'fontWeight', 'text', 'mass']`), only when the font weight is a single reference. `originalFontWeight` is gone. The policy module reads the segments. |
| 20 iOS and Android files had the same lines in another order: expanded typography and shadow tokens moved to the end | The preprocessor numbers every token in source order (`$extensions.chassis.sourceOrder`), after the weight and style split. Expanded sub-tokens inherit the number. The three formats sort by it with `inSourceOrder` from `formats.js`.             |

The dead `scss-variables.template.js` and `cx/test` transform still read `originalFontWeight`. They are not used by any configured app and go in Phase 6.

## Phase 5: replace the forked preprocessor (optional)

Goal: no copied sd-transforms code in the build; use the official code plus the documented differences.

- [x] First check whether the official preprocessor in 2.0 splits plain `fontWeight` tokens. In 1.3.0 it does not. If it still does not, the Chassis code must do the split itself.
- [x] Do this phase only if the result is clearly smaller than the fork (236 lines at planning time, 264 after Phase 4). If not, keep the fork, mark this phase `Done` with the reason, and move on.
- [x] Chassis additions: `letterSpacing` to `number`, the fontWeight split, and the two extensions the build relies on: `fontWeightPath` for the policy module and `sourceOrder` for the formats. `sourceOrder` must be given after the fontWeight split.
- [x] Acceptance: `pnpm tokens:verify` green; all tests green.

Result: `build/tokens/preprocessor.js` went from 264 to 131 lines and is still the single `cx/global` preprocessor, so `build.js` and the configs did not change. It calls the official `alignTypes` and then runs four small steps of its own: `addTypes`, `addFontStyles`, `addSourceOrder`, over one shared token walker.

Two variants were built and measured. Both pass the golden check and produce the same dictionary as the fork.

| Variant                                                                                        | Lines | Build time, 36 runs |
| ---------------------------------------------------------------------------------------------- | ----- | ------------------- |
| Fork                                                                                           | 264   | 9.5 s               |
| Official `alignTypes` and official `addFontStyles`, plus a split of the remaining font weights | 107   | 17.9 s              |
| Official `alignTypes`, own `addFontStyles` (chosen)                                            | 131   | 9.5 s               |

The official `addFontStyles` was not used because it is slow (see Facts) and because it does not split plain font weights, so Chassis code for the split is needed either way. To switch later, replace the own `addFontStyles` with the official one called with `alwaysAddFontStyle: true`, then split the `fontWeight` tokens it left whole.

Differences from the fork:

- The original type is stored where sd-transforms puts it, `$extensions['studio.tokens'].originalType`, not in `$extensions.chassis.originalType`. Nothing in the build reads it.
- A font weight reference that cannot be resolved throws in the preprocessor. The fork logged the error and went on; Style Dictionary then failed on the broken reference.
- A `fontWeight` token with an empty value is split like any other. The fork skipped it. No token has an empty font weight.

## Phase 6: build loop, cleanup, CI, docs

Goal: the new build is simple, and a stale `dist/` cannot be published.

Split on 2026-09-27 into three commits, because the items touch different files and each needs its own golden check.

### Phase 6a: cleanup, version header, CI guard

- [x] Delete `web-px.js`, `web-vw.js`, `scss-variables.template.js`, the `cx/test` transform and format, the `cx/typography/web`, `cx/size/px` and `cx/size/vw` transforms (used only by `web-px` and `web-vw`), and the `cx/scss-variables` format. Then delete `isReference` and `splitReference` from `utils.js`. Also delete the `cx/colorTokens` filter, which no config uses.
- [x] Read the version for the file header from `package.json`. Remove `build/tokens/build.js` from `FILES` in `build/change-version.js`.
- [x] Replace `tinycolor2` only if the golden diff stays green; otherwise keep it. A replacement must also turn a `linear-gradient(…)` value into its first colour stop, as tinycolor does (see Known oddities).
- [x] Replace the mock-based tests of `filters.js` and `transforms.js` with tests on real tokens.
- [x] `.github/workflows/publish-release.yml`: run `pnpm tokens:verify` before `npm publish`.
- [x] Acceptance: `pnpm tokens:verify` and `pnpm tokens:test` green; no new lint warnings.

Result: 877 lines deleted, 154 added. `filters.js` now exports `filters` (name to function) and `transforms.js` exports `transforms` (the two definitions); both register what they export. The golden check ignores the version header line, so the header was compared separately: all 42 files print `Chassis - Tokens v0.5.3`, as in `dist/`. The two lint warnings noted in Phase 0 are gone with the code that caused them.

`tinycolor2` is kept. The only replacement already installed, `colorjs.io` 0.5.2 (a dependency of sd-transforms), throws on the 88 `linear-gradient(…)` colour tokens and returns channels as fractions. Using it would need code to take the first colour stop and to round channels as tinycolor does, and a direct dependency of 8.1 MB instead of 312 KB. Nothing would get simpler.

The filter test takes its expected results from `dist/`: for every token of a real light-and-large web run (3559 tokens), the four filters agree with which of `main.scss`, `color-light.scss`, `number-large.scss` and `string.scss` declare it. The fixture `filter-tokens.json` keeps one token per type, per colour group and per result (36). The transform test uses the web config's own `basePxFontSize`.

The CI step runs on Node 22, as the workflow sets; the check was run locally on Node 24 only.

### Phase 6b: build loop

- [x] Build one instance per token-set list (see Design decisions). Resolve the lists directly from `$themes.json`.
- [x] Token order inside files must stay the same. If it changes, fix the set order; do not regenerate `dist/`.
- [x] Do not split sets between SD `include` and `source`. Add a test that `brand-chassis/brand-base` values win over `base/brand-base`.
- [x] Keep the CLI flags (`--brand`, `--app`, `--platform`, `--theme`, `--screen`, `--out`, `--dry-run`); `verify.js` relies on `--out` and `--platform`.
- [x] Replace the mock-based tests of `build.js` and `config/` (`build.test.js`, `cli.test.js`, `config.test.js`) with tests on real tokens.
- [x] Acceptance: `pnpm tokens:verify` and `pnpm tokens:test` green; build time recorded.

Result: `build.js` exports two pure functions. `planBuilds(sets, buildOptions, filters)` returns one build per brand, app and token-set list, with its platforms, its outputs and its token files. `parseArgs(args)` returns the filters and flags instead of exiting. `config/index.js` turns a build into one Style Dictionary configuration with `source` and one platform per target platform; each platform config takes a list of outputs (`{ kind: 'base' }`, `{ kind: 'color', theme }`, `{ kind: 'number', screen }`). `run()` builds each instance with `buildAllPlatforms`. The build takes about 5.8 s instead of 9.5 s.

The token-set list of an output is `<brand>_<app>_<theme>_<screen>` from `permutateThemes`, with the output's own theme or screen and the first configured one (`chassis.build.themes[0]`, `screens[0]`) otherwise. The old loop took the first `$themes.json` permutation that started with the brand and app, which is the same list today.

Behaviour changes, none of which changes a file the full build writes:

| Case                                          | Old loop                                    | Now                                                   |
| --------------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `--theme dark`                                | number files built from the dark token sets | built from the first theme's sets, as in a full build |
| `--screen` with no configured screen matching | a `number` file without a screen suffix     | no number file                                        |
| A token-set list missing from `$themes.json`  | built with no tokens                        | throws, naming the list                               |
| `--help`, `--version`                         | printed and exited inside `parseArgs`       | printed by `run()`; `--version` reads `package.json`  |
| `cleanPlatform` before each build             | called                                      | not called; it only deleted files the build rewrites  |
| `--dry-run`                                   | listed tasks                                | lists builds with the files of each platform          |

Filtered builds were compared with `dist/` file by file: `--theme dark` (36 files), `--screen small` (30), `--brand sinefil --platform android` (7), `--app docs --theme light --screen medium --brand chassis` (4) and `--platform ios --screen xlarge --brand chassis` (4). All match.

The new `build.test.js` takes its expectations from the real `package.json`, `tokens/$themes.json` and the file list of `dist/`: the plan writes exactly the 42 files of `dist/`, and each filter writes a subset of them. The precedence test builds a Style Dictionary instance from the planned `source` and checks that `typography.fontFamily.text` has the value of `brand-chassis/brand-base.json`, not of `base/brand-base.json`.

### Phase 6c: tests README, docs, final acceptance

- [x] Rewrite `build/tokens/test/README.md`.
- [x] README: new layout, CLI flags, how to verify. Remove `test:watch`, `build:astro` and `test:coverage`, which do not exist. Add a CHANGELOG entry.
- [x] Acceptance: `pnpm tokens:verify` and `pnpm tokens:test` green; `pnpm tokens:site && pnpm astro:build` succeeds.

Result: the tests README describes the principles, each test file and each fixture. The README describes Node 22, `pnpm tokens:verify` and the release guard, `--out`, the new `--dry-run`, the build steps and modules, and the real `chassis.build` configuration; `build:astro` became `site:build` or `pnpm build`, and `test:watch` is gone (`test:coverage` was not in the README). The CHANGELOG has an `[Unreleased]` entry; no version was bumped. `pnpm tokens:site` rewrote only the timestamp lines of the 7 `dist/web/docs/chassis` files, which were restored with `git checkout -- dist`; `pnpm astro:build` built 22 pages with no warnings.

The site documentation in `site/` is out of date, but `site/` is frozen, so it was not changed (see Open decisions).

## Phase 7: site docs

Goal: the site pages about the build describe the rewritten build. Approved by Ozgur on 2026-09-27, as an exception to the frozen `site/` folder.

- [x] `site/content/docs/getting-started/style-dictionary.mdx`: Node 22, the build files, the build steps, the real configuration, the CLI flags, `pnpm tokens:verify`, the web, iOS and Android output, filters, formats, the preprocessor, theme permutations and troubleshooting. Remove the deleted `cx/scss-variables` format, `cx/size/px`, `cx/size/vw` and `cx/typography/web` transforms and `cx/colorTokens` filter.
- [x] `site/content/docs/getting-started/quick-start.mdx`: Node 22, the `sinefil` brand, the CLI flags, the output file names and `pnpm tokens:verify`.
- [x] `site/content/docs/use-in-project/web-applications.mdx`: rem units only.
- [x] Acceptance: `pnpm astro:build` succeeds; the edited pages pass Prettier.

Result: every code example on the Style Dictionary page was replaced with lines from the committed `dist/`. The old examples showed names and formats the build never produced (`public class Tokens`, `UIColor(red: 0.00, …)`, `#0066FF` colours, `var(--#{$prefix}…)`). Other statements that were wrong before the rewrite were fixed on the lines being edited: the brand `example` (renamed `sinefil` in 0.5.1), the `cx/themeTokens` and `cx/allTokens` descriptions, the Android colour format, and `pnpm validate`, which does not exist.

Not changed, because they are outside the build pages: the quick start still shows `dist/css/` paths, which do not exist, and `web-applications.mdx` (marked as AI-generated) was not checked beyond the unit statements. The `dist/css/` paths were fixed on 2026-09-27, after Phase 11.

## Phase 8: preset baselines, SCSS variable presets (resolved)

Goal: `web-px` and `web-vw` build again and print what the old build printed, apart from the approved letter spacing of `web-px`. The new `web-scss` prints what the old build printed with `cx/scss-variables` and `cx/size/rem`. A check proves it.

- [x] Build the baselines from `main` as described under Facts about the presets, brand `chassis` only: `web-px`, `web-vw` and `web-scss` resolved, `web-px` with `outputReferences`, `android` with `outputReferences`. For `web-scss`, set the format of the old `config/web.js` to `cx/scss-variables`. Commit them under `build/tokens/test/golden/<preset>/` (about 3 MB). Record the exact commands in `build/tokens/test/README.md`. Check that `package.json` `files` keeps them out of the published package.
- [x] `verify.js --preset <name>`: build the preset into a scratch directory and compare it with its baseline, with the same header rules and duplicate-name check as the `dist/` comparison. The build needs a way to select a preset without editing `package.json`: the new build option `--config <file>` reads the build configuration from a JSON file.
- [x] `values/web.js`: `pxSize` and `vwSize` beside `remSize`. Register `cx/size/px` and `cx/size/vw` in `transforms.js`.
- [x] `config/web.js` becomes a factory (`unit`, `format`). Add `config/web-px.js`, `config/web-vw.js` and `config/web-scss.js` and list them in `config/index.js`. Register the format `cx/scss-variables`; it uses the thin SCSS template.
- [x] `web-px` letter spacing is the pixel value divided by `basePxFontSize`. Every letter spacing line of `web-px` must equal the same line of `web-scss`. The `web-px` baseline holds the corrected lines; record their number.
- [x] Resolved typography maps: built from resolved parts, with the family list quoted as the old build did.
- [x] Unit tests on real tokens for the two size functions and the resolved typography map.
- [x] Acceptance: `verify.js --preset web-px`, `--preset web-vw` and `--preset web-scss` green; `pnpm tokens:verify` green; all tests green; `dist/` untouched.

Result: three presets can be named in `chassis.build.apps`: `web-scss`, `web-px` and `web-vw`. Each is a file of one statement in `build/tokens/config/` that calls `webConfig({ unit, format })` from `config/web.js`. All write to `dist/web/<app>/<brand>/`, as `web` does.

| Preset     | Compared with the old build                                              |
| ---------- | ------------------------------------------------------------------------ |
| `web-vw`   | identical, 7 files                                                       |
| `web-scss` | identical, 7 files                                                       |
| `web-px`   | identical apart from 3 lines of `main.scss`, the approved letter spacing |

The three lines are the typography maps with a letter spacing other than zero: `font.context.jumbo` and `font.website.section-title` (`-0.5em` became `-0.0313em`) and `font.website.hero-title` (`-1em` became `-0.0625em`). All 193 letter spacing lines of `web-px/main.scss` equal those of `web-scss`. A letter spacing in px is divided by `basePxFontSize` and rounded to four decimals, which is how `ts/resolveMath` rounds the rem value.

New and changed modules:

- `build/tokens/scss-var-policy.js` exports `scssValue(token, references, platform)`, the values of the format `cx/scss-variables`. It has 31 lines and no reference logic yet; Phase 9 adds that.
- `values/web.js` has `pxSize`, `vwSize` and `resolvedTypographyMap`. The resolved map is built from the resolved `$value` of the token. The old template read `original` and looked every part up again, with the same result for all 192 typography tokens.
- `templates/scss-chassis-css.template.js` is now `templates/scss.template.js`. Both SCSS formats use it; the format passes in the function that returns the value of a token.
- `build.js` has `--config <file>`. `verify.js` has `--preset <name>`, with `all` for every preset, and refuses an output directory that is or contains `golden/`. The script `tokens:verify:presets` checks all presets. The release workflow does not run it, because the presets write nothing that is published.

The baselines are in `build/tokens/test/golden/`: 35 files, 3.5 MB, with the build configuration of each checked preset beside them. `package.json` `files` lists only `dist/`, so they are not published. `build/tokens/test/README.md` records how they were built and how to write them again when tokens change.

Behaviour in a case that no current token reaches: a typography token with a literal line height that is not a percentage prints the line height relative to the font size. The old template printed the literal.

## Phase 9: SCSS variable references

Goal: `outputReferences: true` on a SCSS variable preset prints `$cx-…` references as the old build did.

- [x] `build/tokens/scss-var-policy.js`: the `scss-var` naming. Move what both policies share (eligibility, exceptions, the chain follow, the typography parts) into functions both modules call; do not copy it.
- [x] Read `options.outputReferences` outside the template. (Changed while doing it: the format reads it from the platform options, and `chassis.build.options` sets it; see the result.)
- [x] Throw when a reference names a variable that no file of the build emits.
- [x] Unit tests on real tokens: one per referencing group, each exception, `font.context.jumbo`, `font.button.medium`.
- [x] Acceptance: `verify.js --preset web-px-references` green; `pnpm tokens:verify` green; all tests green.

Result: `outputReferences` on a SCSS variables preset prints `$cx-…` variables. The `web-px-references` baseline matches apart from the 3 approved letter spacing lines of `main.scss`, the same lines and rule as in `web-px`. All 1238 reference lines of the old build are reproduced. `outputReferences` on `web-scss` and `web-vw` builds too, with the same number of variable lines per file.

How it is set: `chassis.build.options` holds Style Dictionary options by platform name, and `config/index.js` merges them into the options of that platform. The build throws when `options` names a platform that no app uses.

```json
"apps": { "docs": ["web-px"] },
"options": { "web-px": { "outputReferences": true } }
```

The old way, adding `outputReferences: true` to the `options` of a platform config file, also works.

Modules:

| Module                       | Lines     | Contents                                                                                                                                                                                                                                       |
| ---------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference-policy.js` (new)  | 278       | `isReference`, `referencePath`, `startsWith`, `printsReference(token, groups)`, `referenceTarget`, the chain follow, `typographyObject`, `typographyReference`, and the data `literalTokens`, `referenceTargets`, `followedGroups`, `MAX_HOPS` |
| `css-var-policy.js`          | 330 → 141 | the Chassis CSS groups, custom property names, scale abbreviations                                                                                                                                                                             |
| `scss-var-policy.js`         | 31 → 99   | the SCSS variables groups (without `shadow`) and variable names                                                                                                                                                                                |
| `templates/scss.template.js` | 43 → 59   | adds `references.variable(path)`, which looks the token up in `dictionary.unfilteredTokens` and throws when no file filter selects it                                                                                                          |

`referenceTarget` returns the path of the token that a reference names. A reference to `<group>.base.context.<step>` and a followed `base.<component>` alias both name `<group>.context.<step>`. The two policies name that path: `var(--border-radius-lg)` and `$cx-border-radius-context-large`. `customProperties` lost its two `base.context` rows, which this rule covers.

Behaviour of the SCSS variables format in cases that no current token reaches, compared with the old template:

| Case                                                                                    | Old template                            | Now                                            |
| --------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| Reference to `opacity.context.X` or `opacity.level.X`                                   | `$cx-opacity-X`, which no file declares | `$cx-opacity-context-X`, `$cx-opacity-level-X` |
| Reference to `borderWidth.base.context.X`, or to a `borderWidth.base.<component>` alias | the value                               | `$cx-border-width-context-X`                   |
| Reference to a variable that no file declares                                           | printed                                 | throws, naming the token and the path          |
| Reference with more segments than the old name pattern                                  | segments dropped                        | the full name of the token                     |

## Phase 10: Android references

Goal: `outputReferences: true` on the Android config prints `@type/name` references that compile.

- [x] `values/android.js`: `reference(token, target)`, with the two old conditions (no references for `color.base`, none for math on sizes) and the safety rule from Design decisions if Ozgur approves it.
- [x] The template passes the reference lookup in and prints `reference(…) ?? encode(token)`.
- [x] Unit tests on real tokens: a plain reference, a `color.base` token, math on a size, and one token for each of the broken cases under Facts about the presets.
- [x] Acceptance: `verify.js --preset android-references` green, apart from the approved lines; every `@type/name` in the output names an element of that type in the same build; `pnpm tokens:verify` green.

Result: `outputReferences` on the Android config prints `@type/name` references again, set like the SCSS one: `"options": { "android": { "outputReferences": true } }`. Compared with the old build, 14213 references are the same and 30 lines print their value instead. Each of the 30 lines equals the line of the committed `dist/android/demo/chassis/`:

| Tokens                                                        | Files              | Lines | Old build                                   | Problem                                        |
| ------------------------------------------------------------- | ------------------ | ----- | ------------------------------------------- | ---------------------------------------------- |
| four letter spacing tokens                                    | `main`, `number_*` | 16    | `@integer/size_unit_0`, `…_nd05`, `…_n1`    | no such `<integer>`: the target is a `<dimen>` |
| `font_context_jumbo_font_size`, `font_context_hero_font_size` | `main`, `number_*` | 8     | `@dimen/size_unit_96`, `…_64`               | `96dp` instead of `96sp`                       |
| `bg_blur_default_color`, `bg_blur_alternate_color`            | `main`             | 2     | `@color/opacity_context_fg_subtle`          | no such `<color>`                              |
| `bg_blur_default_color`, `bg_blur_alternate_color`            | `color_*`          | 4     | `@color/color_primitive_neutral_30`, `…_70` | the alpha of `rgba()` is lost                  |

The rule, in `reference(token, target)`: the target is the first token that the original value references, looked up in the file's own tokens as before. There is no reference for a base colour, for a size computed with math, when the target is another element, or when the target encodes to another value. The element check changes no line of the current output, because every element mismatch also has another value, so only its unit test covers it.

The golden comparison now also fails when an `@type/name` names no `<type name="name">` of the same file, or a SCSS `$name` names no variable of the SCSS files in the same directory. `dist/` and all five baselines pass; the old Android output fails it with 18 references in 4 files.

The iOS format has no `outputReferences`, as before.

## Phase 11: preset docs

Goal: an adopter can find and use the presets.

- [x] README: the presets, how to select one in `chassis.build.apps`, `outputReferences`, and the file load order for SCSS references.
- [x] `site/content/docs/getting-started/style-dictionary.mdx`: bring back the `cx/scss-variables` section, the unit transforms and the `outputReferences` text that Phase 7 removed, with examples copied from the baselines. `site/content/docs/use-in-project/web-applications.mdx`: rem, px and vw again. This needs the same exception to the frozen `site/` folder as Phase 7.
- [x] CHANGELOG: remove the presets from the `Removed` entry of `[Unreleased]`; describe any approved difference in output.
- [x] Acceptance: `pnpm astro:build` succeeds; the edited pages pass Prettier.

Result: the README has a section "Presets for Other CSS Frameworks" with the four web platforms, `chassis.build.options`, both reference modes, the load order and the Android rule. It also lists `--config`, `pnpm tokens:verify:presets`, the undeclared-reference check and the new modules. The Style Dictionary page has the same presets section, `options` in the build options, `--config`, the preset check, `cx/size/px` and `cx/size/vw`, a `cx/scss-variables` section with both modes and the load order, and Android references under `cx/android-resources`. Every example is a line of a baseline in `build/tokens/test/golden/`. The web guide names rem, px and vw again and links to the presets. The CHANGELOG keeps the presets, lists the three changes in their output, and adds `web-scss`, `chassis.build.options`, `--config` and the preset check.

Load order, measured on the `web-px-references` baseline: only `main.scss` uses variables of another file, 270 colour variables of `color-<theme>.scss`. Every other file declares the variables it uses before it uses them.

Also corrected on the edited pages: the `config/web.js` transform list, which now leaves the size transform to `webConfig`, and the troubleshooting line about `basePxFontSize`, which the vw transform uses too.

## Phase 12: iOS references

Goal: `outputReferences: true` on `ios` prints the names of other constants of the same class where that is safe, and `dist/` does not change. This is a new option; the old build and the Phase 10 result say the iOS format prints values only.

- [x] `values/ios.js`: `reference(token, target)` returns the bare constant name of `target`, or `undefined` when there is no target, when the token is a base colour (the Android rule, confirmed 2026-09-27), when the value is a size computed with math, or when `encode(target) !== encode(token)`. Share the math pattern (`WITHOUT_MATH`) with `values/android.js` through `values/shared.js` instead of copying it. (Done as `isSizeWithMath` and `isBaseColor` in `shared.js`, which both platforms call.)
- [x] `formats.js` passes `settings.outputReferences` from the platform options to the iOS template, as it does for Android.
- [x] `templates/ios-swift-class.template.js` looks the target up in `dictionary.tokens` with `getReferences`, as the Android template does (moved into `templates/references.js`, which both templates call), and prints `reference(…) || encode(token)`.
- [x] `verify.js`: extend the undeclared-reference check to `.swift`. A right-hand side that is a bare name must be a `static let` of the same file.
- [x] Baseline `build/tokens/test/golden/ios-references.json` (`{ "demo": ["ios"] }`, `options.ios.outputReferences`) and `ios-references/`, written by the new code. Before committing it, run a one-off comparison with `dist/ios/demo/chassis/` (see Ground rules) and record the counts in the result.
- [x] Unit tests in `values-ios.test.js` on real tokens captured from the build: a plain colour reference, a number reference (`SizeUnit4` on `DimensionBase4`), a string reference, a base colour, an `rgba({colour}, {opacity})` colour, a colour with a modifier, a size with math, and a target of another Swift type. Template tests in `formats.test.js`: names only with `outputReferences`, values without it. A `verify.test.js` case for an undeclared Swift name.
- [x] Docs: `README.md` (replace "The iOS format prints values only"), the `cx/ios-swift-class` section of `site/content/docs/getting-started/style-dictionary.mdx`, `site/content/docs/use-in-project/ios-applications.mdx`, and the `[Unreleased]` CHANGELOG entry. Examples are copied from the baseline. Ozgur approved this exception to the frozen `site/` folder on 2026-09-27, as for Phases 7 and 11.
- [x] Acceptance: `node build/tokens/verify.js --preset ios-references` green; `pnpm tokens:verify:presets` green for all six presets; `pnpm tokens:verify` green, 42 of 42 files, `dist/` untouched; all tests green; lint clean; the 7 baseline files type-check with `swiftc -typecheck` against the stand-in UIKit module; the edited pages pass Prettier and `pnpm astro:build` succeeds.
- [x] Regressions to inject: no value check, no math rule, no base colour rule, `outputReferences` ignored, undeclared Swift check off. Each must fail a test.

Result: `"options": { "ios": { "outputReferences": true } }` makes a Swift constant name the constant of the first token its value references, in the same file, when both encode to the same Swift text. Without the option the output is `dist/` as before.

| File                                     | Lines that name a constant | Lines that print a value |
| ---------------------------------------- | -------------------------- | ------------------------ |
| `Main.swift`                             | 3745                       | 2742                     |
| `String.swift`                           | 577                        | 838                      |
| `ColorLight.swift`, `ColorDark.swift`    | 741 each                   | 704 each                 |
| `NumberLarge.swift`, `…Medium`, `…Small` | 2811 each                  | 220 each                 |

The 14237 names are as the prototype measured, minus the 715 base colours of `Main.swift` that the Android rule turns into values.

How the baseline was accepted, against `dist/ios/demo/chassis/`:

- A one-off script compared every line: the 5648 lines that print a value equal the `dist/` line, and each of the 14237 names has, in `dist/`, the same value as the line that declares it in the same file. The script found a name changed on purpose (`SizeUnit4 = DimensionBase8`).
- All 7 files type-check with `swiftc -typecheck` (Swift 6.4) against the stand-in UIKit module.
- `Main.swift`, `NumberLarge.swift`, `ColorLight.swift` and `String.swift` of the baseline and of `dist/` were built as two modules each and read by a program that compares every constant at run time: 12378 constants, none differ.

Modules:

| Module                                  | Change                                                                                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `values/shared.js`                      | `isBaseColor(token)` and `isSizeWithMath(token)`, the two conditions both platforms share; `WITHOUT_MATH` moved here from `android.js` |
| `values/ios.js`                         | `reference(token, target)`: the bare constant name, or `undefined`                                                                     |
| `values/android.js`                     | `reference` calls the shared conditions; no change in output                                                                           |
| `templates/references.js` (new)         | `firstReferencedToken(token, tokens)`, the lookup both mobile templates use                                                            |
| `templates/ios-swift-class.template.js` | prints `reference(…) \|\| encode(token)` with `settings.outputReferences`                                                              |
| `formats.js`                            | passes `settings.outputReferences` to the iOS template                                                                                 |
| `verify.js`                             | the undeclared-reference check reads Swift: a value that is a bare name must be a `static let` of the same file                        |

Real cases in the fixture cover a case the plan expected to construct: `BgBlurDefaultColor` in `Main.swift` references `OpacityContextFgSubtle` first, a `CGFloat`, so the target is another Swift type. The colours with a lighten or darken modifier are all base colours, so the base colour rule already prints their values; their test moves one to a context path to reach the value check. The math rule changes no current line either: `SizeDatepickerWeekWidth` (`{size.datepicker.day-width}*7`) also fails the value check, as on Android, so only its unit test covers it.

The docs describe the option in the README, the Style Dictionary page (iOS platform and `cx/ios-swift-class`), the iOS guide (a section "Constant References") and the CHANGELOG. Every Swift example is a line of the baseline.

## Phase 13: mobile typography values

Goal: typography parts on iOS and Android hold values the platform reads correctly.

Facts, measured on `dist/` of 2026-09-27 (both brands are the same):

- 9 typography tokens have a literal percentage line height: `font.context.jumbo` and `font.context.hero` (`125%`), and seven `font.website.*` tokens (`125%` or `150%`). Their line height part prints the percentage as a number: `FontContextJumboLineHeight = CGFloat(125)`, `font_context_jumbo_line_height` = `125sp`, in `Main` and in each number file (9 lines per file, 36 per brand and platform). Every other line height is in points.
- Android letter spacing is in design pixels. `TextView.setLetterSpacing` and `android:letterSpacing` take ems. 3 typography parts are not zero: `font_context_jumbo_letter_spacing` (`-0.5`), `font_website_hero_title_letter_spacing` (`-1`), `font_website_section_title_letter_spacing` (`-0.5`); 190 are `0`. The standalone scale token `typography.letterSpacing.base.zero` is `0`. iOS letter spacing is in points, which `NSAttributedString.Key.kern` takes, so iOS stays as it is.
- The parts of one typography token are expanded into the same file, so the font size part is available when the line height and letter spacing parts are printed.

- [x] `values/shared.js`: `lineHeightPoints(percent, fontSize)` and `letterSpacingEm(px, fontSize)`, pure, with the rounding decided below.
- [x] The iOS and Android templates pass the font size part of the same typography token to the encoders (look it up by path: the parent path plus `fontSize`), the same way the reference lookup is passed in. (Done as `encodingContext` in `templates/references.js`; `encode` and `reference` take the context.)
- [x] Line height: a percentage becomes points on iOS and `sp` on Android (`125%` of `96` is `120`).
- [x] Android letter spacing of a typography part: px divided by the font size of the part, in em. The standalone letter spacing scale keeps its value.
- [x] Unit tests on real tokens: jumbo, `font.website.hero-body` (`150%`), a line height in points (unchanged), the three letter spacing parts, a zero letter spacing, the standalone scale token.
- [x] Acceptance: the changed lines are exactly the ones listed above, both brands; all other lines equal `dist/`; `swiftc` and aapt2 pass; the Android and iOS guides describe the new units.

Result: 168 lines of `dist/` changed, and nothing else. Web output did not change.

| Change                           | Files                                             | Lines per file | Example                                                         |
| -------------------------------- | ------------------------------------------------- | -------------- | --------------------------------------------------------------- |
| Percentage line height in points | iOS `Main`, `Number*`, both brands (8 files)      | 9              | `FontContextJumboLineHeight = CGFloat(120)`, was `CGFloat(125)` |
| Percentage line height in `sp`   | Android `main`, `number_*`, both brands (8 files) | 9              | `font_context_jumbo_line_height` `120sp`, was `125sp`           |
| Letter spacing in em             | Android `main`, `number_*`, both brands (8 files) | 3              | `font_context_jumbo_letter_spacing` `-0.0052`, was `-0.5`       |

The values follow the font size of each screen: `font.website.hero-body` is `33` on large and `28.5` on small screens (`150%` of `22` and `19`), `font.website.hero-title` letter spacing is `-0.0156`, `-0.0208` and `-0.0313` em (`-1px` at `64`, `48` and `32`). The 190 zero letter spacings print `0` as before, and `font_context_hero_letter_spacing` still names `@dimen/typography_letter_spacing_base_zero` with `outputReferences`, since both are `0`.

The `ios-references` and `android-references` baselines changed in the same lines (9 and 12 per `Main`/`main` and number file); each changed line equals the new line of `dist/`.

Checked: all Swift files of both brands type-check (stand-in UIKit); aapt2 compiles and links the Android qualifier layout of the guide and `main.xml` alone, for both brands, and its resource dump shows `-0.0052` and `120.000000sp`.

A percentage line height or a letter spacing part without a font size in its file fails the build with the token path. No current token reaches it.

## Phase 14: font weights as numbers

Goal: font weights that the platforms take without a name map.

Facts: font weights print as names from the token source, lowercased with the first space replaced by a hyphen. The sources spell the same weight two ways, on purpose, because each is the style name of its font in Figma (confirmed by Ozgur, 2026-09-27); `tokens/` keeps them: `Semi Bold` becomes `semi-bold` and `SemiBold` becomes `semibold`. In `chassis`, the text font and the HTML cite weight are `semi-bold` and the display strong weight is `semibold`; in `sinefil`, all three are `semibold`. The 18 weight tokens per brand use `light`, `regular`, `medium`, `semi-bold`/`semibold` and `bold`. The weight is also a part of every typography token (`…FontWeight`). Font style parts (`normal`, `italic`) are separate and do not change.

- [x] One map in `values/shared.js` from every spelling to a number (the web output already turns the names into numbers; reuse its map if it fits). (Done as `fontWeightNumber`, which calls `transformFontWeight` of sd-transforms, the function behind the web's `ts/typography/fontWeight`, after replacing hyphens with spaces. The map also has 950 for ultra black; weights above 1000 fail.): thin 100, extra light 200, light 300, regular and normal 400, medium 500, semi bold 600, bold 700, extra bold 800, black 900. Spaces, hyphens and case do not matter. An unknown name fails the build with the token path.
- [x] Android: weights print as `<integer>` (`600`), for Compose `FontWeight(600)` and `Typeface.create(family, 600, italic)` (API 28).
- [x] iOS: the type decided below.
- [x] Unit tests: every spelling in the current tokens, an unknown name.
- [x] Acceptance: only weight lines change, both brands; compile checks pass; the guides show the new use.

Result: iOS and Android print weights, and the web, iOS and Android share one name map. 1680 lines of `dist/` changed: 210 in each `Main`/`main` and string file of both brands (18 weight tokens and 192 typography parts per file), and nothing else.

| Weight in the tokens                                 | Lines per platform | iOS                      | Android |
| ---------------------------------------------------- | ------------------ | ------------------------ | ------- |
| `Regular`                                            | 312                | `UIFont.Weight.regular`  | `400`   |
| `Semi Bold` (Inter)                                  | 114                | `UIFont.Weight.semibold` | `600`   |
| `SemiBold` (Archivo Narrow, DM Sans, Source Serif 4) | 158                | `UIFont.Weight.semibold` | `600`   |
| `Bold`                                               | 160                | `UIFont.Weight.bold`     | `700`   |
| `Light`                                              | 74                 | `UIFont.Weight.light`    | `300`   |
| `Medium`                                             | 22                 | `UIFont.Weight.medium`   | `500`   |

On Android the weights are `<integer>` elements; they stay in `string.xml` and `main.xml`, because the file filters select by type group and `fontWeight` is in the string group. Font style parts (`normal`, `italic`) did not change. No weight prints a reference with `outputReferences`: every weight part holds the resolved weight, not a reference. The two reference baselines changed in the same 210 lines per file, each equal to the new line of `dist/`.

`values/shared.js` imports `transformFontWeight` from `@tokens-studio/sd-transforms`, which loads `style-dictionary/utils`. The encoders still take plain tokens and return strings; the import keeps one name map for all platforms instead of a copy.

Checked: all Swift files of both brands type-check with the stand-in UIKit, which now also maps `UIFont` to `NSFont`; a program reading `String.swift` gets `NSFont.Weight.semibold` for both spellings (raw value 0.3). aapt2 compiles and links both brands and reads `integer/font_context_jumbo_font_weight` as `700`.

## Phase 15: gradients on mobile as parts

Goal: no gradient token prints a wrong colour on iOS or Android.

Facts: the 88 `gradient.primitive.*` tokens per colour file are typed `color` with `linear-gradient(<angle>deg, <colour> 0%, <colour> 100%)` values: two stops each, angles in steps of 45°. iOS and Android print the first stop only, because tinycolor parses the string leniently: `GradientPrimitiveBlackL000` is transparent black (`alpha: 0`, `#00000000`).

- [x] `values/shared.js`: parse a `linear-gradient(…)` value into an angle and a list of stops (colour, position). Fail the build on any other gradient form, with the token path.
- [x] Expand each gradient token on iOS and Android into parts, as shadows are expanded: `…Angle`, and `…Stop<N>Color` and `…Stop<N>Position` per stop (`GradientPrimitiveBlackL000Stop1Color`). Colours encode as colours; the angle and positions as numbers (Android: float items). Web output does not change.
- [x] Unit tests: a two-stop gradient, a stop colour with alpha, each angle, a value that is not a linear gradient.
- [x] Acceptance: in each colour file, 88 lines become the parts and nothing else changes; compile checks pass; the guides show how to build a `CAGradientLayer` and an Android `GradientDrawable` or Compose `Brush.linearGradient` from the parts.

Result: each gradient prints five parts on iOS and Android instead of one wrong colour. In each colour file of both brands, the 88 gradient lines became 440 part lines, and nothing else changed (8 files, 704 lines out, 3520 in). Web output did not change.

| Part          | iOS                                                                      | Android                                                                                  |
| ------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Angle         | `GradientPrimitiveBlackL000Angle = CGFloat(0)`                           | `<item name="gradient_primitive_black_l_000_angle" type="dimen" format="float">0</item>` |
| Stop colour   | `…Stop1Color = UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 0)` | `<color name="…_stop_1_color">#00000000</color>`                                         |
| Stop position | `…Stop1Position = CGFloat(0)`                                            | float item `0`                                                                           |

- The 12 gradients with a negative angle (`-45deg`, `-90deg`) print it from 0 to 360: `GradientPrimitiveBlackL315Angle` is `315`, which matches its name.
- All 3520 parts equal the gradient that the web prints for the same token, compared stop by stop (angle, colour through tinycolor, position).
- The stop colours keep the stops of the original value, so with `outputReferences` they name the colours they reference: `GradientPrimitiveBlackL000Stop1Color = ColorPrimitiveBlackTransparent`, `@color/color_primitive_black_transparent`. In the baselines, the 88 gradient lines per colour file named the first-stop colour; now 176 stop colours per file name a colour, and every name has the value of its line in the new `dist/` (14413 iOS and 14389 Android references checked).
- `parseColor` fails on a gradient, so no gradient can print as one colour again.

The parser reads `linear-gradient` with an angle in degrees, a side keyword (`to right`) or no direction (180), and stops with or without a percentage; stops without one get the positions CSS gives them. Corner keywords, `turn`, `rad`, other gradients and a single stop fail the build with the token path. The parts are built in the template, from `gradientParts` in `values/shared.js`, because one Style Dictionary instance serves the web and mobile platforms, so the preprocessor cannot expand gradients for mobile only.

Checked: the 21 Swift files of `dist/` and the baseline type-check; the iOS guide's `CAGradientLayer` example compiles against the new `ColorLight.swift` and gives the CSS directions for 0, 90, 180 and 315; aapt2 compiles and links both brands and the reference baseline. The guide's Kotlin example is not compiled (no Kotlin compiler here; Phase 20 downloads one).

## Phase 16: dead `dimension` filter condition

Goal: the filters say what they do. No output change.

Facts: the `path[1] == dimension` exclusion in the main and number filters matches nothing, because `dimension.base.*` tokens have `dimension` at `path[0]`. All 71 are emitted, and with `outputReferences` `SizeUnit…` names `DimensionBase…`, so removing them would break references.

- [x] Delete the condition from `filters.js` and the Filters table, keep the emitted tokens, and record in the Filters section that `dimension.base.*` is emitted on purpose.
- [x] Acceptance: `pnpm tokens:verify` and all preset checks green with no change; tests green.

Result: `cx/allTokens` and `cx/numberTokens` include every size-group token; the dead condition is gone from `filters.js`, the Filters table and Known oddities. No token set in `tokens/` has a `dimension` group at `path[1]`, so the output of both brands is unchanged. The test that kept the exclusion now requires the opposite: `dimension.base.0`, and a size token with `dimension` at `path[1]`, are in the main and number files. Putting the condition back fails it.

## Phase 17: iOS type and file names

Goal: the iOS files can be added to one target, and Swift Package Manager accepts every file.

Facts:

- Every file declares `public class ChassisTokens`, so two files in one module fail with `invalid redeclaration of 'ChassisTokens'`. The iOS guide works around it with one module per file.
- Swift Package Manager treats `Main.swift` as an executable entry point, so it cannot be in a library target.
- `@objc` has no effect: checked on 2026-09-27 with `-emit-objc-header-path`, the generated Objective-C header contains no constant, because `ChassisTokens` is not an `NSObject` subclass.
- The template already reads `options.className`, `objectType` and `accessControl`.

- [x] One type per file, named as decided below, set by the iOS config per file.
- [x] Rename `Main.swift` as decided below.
- [x] `objectType` and `@objc` as decided below.
- [x] `outputReferences` still names constants of the same type; the reference check of `verify.js` still passes.
- [x] Acceptance: all 7 files of each brand compile together in one module (stand-in UIKit), and as a Swift package library target; the iOS guide drops the one-module-per-file setup; all other lines equal `dist/` apart from the type line and `@objc`.

Result: every iOS file declares its own caseless enum, and the main file is `ChassisTokens.swift`.

| File                                                                                            | Type                                                  |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `ChassisTokens.swift` (was `Main.swift`)                                                        | `ChassisTokens`                                       |
| `String.swift`                                                                                  | `ChassisTokensString`                                 |
| `ColorLight.swift`, `ColorDark.swift`                                                           | `ChassisTokensColorLight`, `ChassisTokensColorDark`   |
| `NumberLarge.swift`, `NumberMedium.swift`, `NumberSmall.swift` (`Number.swift` without screens) | `ChassisTokensNumberLarge`, … (`ChassisTokensNumber`) |

In `dist/ios` of both brands, 41194 lines changed and nothing else: the `@objc ` prefix of every constant, the type line of each file, and the file name comment of the main file. Android and web did not change. The `ios-references` baseline changed the same way.

How it is set: the iOS config gives each file `options.className` and the platform `objectType: 'enum'`; Style Dictionary merges the file options into the options the format receives. The template marks constants `@objc` only for `objectType: 'class'`, since Swift rejects `@objc` in an enum. An adopter can still choose a class per file. The template's default name no longer depends on a trailing space: a custom `className` printed two spaces before `{`.

Checked:

- All 7 files of each brand type-check together in one module, and so do the 7 files of the `ios-references` baseline, where constants name others of their type.
- A Swift package with one library target holding the 7 files builds, and a program reads `ChassisTokensNumberLarge` and `ChassisTokensNumberSmall` sizes (`80`, `48`), both colour types and `ChassisTokens` side by side.
- The iOS guide's `Package.swift` validates with `swift package describe`; the same package with a stand-in UIKit target (which adds `UITraitCollection` and `UIColor(dynamicProvider:)` for the examples) builds an app from every token-using Swift block of the guide, and the gradient example runs. The SwiftUI block is not compiled: `Color(uiColor:)` exists only on iOS.

The iOS guide drops the one-module-per-file setup, the ambiguity and redeclaration workarounds and the `Main.swift` exclusion: files go into one target or one package library, and code writes the type (`ChassisTokensColorLight.ColorContextDefaultBgMain`).

## Phase 18: iOS colours that follow dark mode

Goal: one iOS colour type whose colours switch with the appearance, instead of a module per theme.

Facts: the light and dark colour files are written by two Style Dictionary instances (light + large, dark + large), so no single format call sees both themes. They declare the same names in the same order (1445 each for `chassis`).

- [x] A combine step in `build.js` after the instances of one brand and app: it reads the resolved colour tokens of the `light` and `dark` themes and writes one file where each colour is `UIColor { $0.userInterfaceStyle == .dark ? <dark> : <light> }`, with the values of `values/ios.js`. It runs only when the configured themes include `light` and `dark`.
- [x] Fail the build when the two themes do not declare the same names.
- [x] Keep or drop the per-theme files, as decided below. (Kept for one release.)
- [x] Unit tests: a colour that differs by theme, one that does not, a name missing in one theme.
- [x] Acceptance: every colour of the new file equals the light file's value in light mode and the dark file's in dark mode, checked at run time with the stand-in UIKit (`NSAppearance` stands in for the trait collection) or by comparing the printed values; compile checks pass; the iOS guide's dark mode section uses the new file.

Result: the build writes `dist/ios/<app>/<brand>/Color.swift` with `public enum ChassisTokensColor`, after all Style Dictionary instances have run. No other file changed; `dist/` has 44 files.

| Constant                       | Printed                                                         | `chassis` |
| ------------------------------ | --------------------------------------------------------------- | --------- |
| differs between light and dark | `UIColor { $0.userInterfaceStyle == .dark ? <dark> : <light> }` | 657       |
| the same in both themes        | as in the colour files                                          | 1140      |

How it works:

- The iOS config marks the colour files with `options.theme`. The format computes the constants once (`swiftConstants`, split out of the iOS template together with `swiftFile`) and, for a marked file, records them in `theme-colors.js` by output directory. After the loop, `build.js` calls `writeThemeColors`, which writes the file into every directory that received a `light` and a `dark` colour file. `planThemeColors` lists these files for the dry run and the tests.
- A constant compares by what it prints. With `outputReferences`, a constant that names the same constant in both themes prints that name, which is itself a constant of `ChassisTokensColor` and follows the appearance; a constant that prints differently uses the two values. In the `ios-references` baseline, 829 constants of `Color.swift` name another constant and 237 switch.
- The build fails when the two themes declare other constants, or when a constant that is not a colour differs (the gradient angles and positions do not).
- A build with one theme (`--theme light`) or without iOS writes no `Color.swift`.

Checked:

- Every constant of `Color.swift` equals the light and dark files as text (both brands: 657 switch, 1140 the same, 0 wrong).
- At run time, with a stand-in UIKit whose `UIColor(dynamicProvider:)` is AppKit's dynamic `NSColor` (the dark `NSAppearance` stands for `.dark`), all 1533 colours of `ChassisTokensColor` resolve to the `ChassisTokensColorLight` value in the light appearance and the `ChassisTokensColorDark` value in the dark one, for both brands and for the `ios-references` build.
- The 8 files compile as one package library, and the iOS guide's examples compile against it.

The guide's dark mode section now uses `ChassisTokensColor` instead of a hand-written `UIColor.token(light:dark:)` helper.

## Phase 19: Android resource tree

Goal: the build writes a `res/` tree an app can use as it is.

Facts, `chassis` on 2026-09-27:

- `main.xml` repeats the resources of `string.xml`, the large number file and the component colours of the light colour file. 409 dark colours, 27 medium-screen and 34 small-screen resources have another value in `main.xml`, so it cannot share a resource folder with those files (aapt2: `has a conflicting value`).
- Only the 1382 base colours (`color_base_*`) are in `main.xml` alone.
- Android picks a qualified folder (`values-sw600dp`) over `values`, so the default folder must hold the smallest screen.
- The Android guide copies files into `values`, `values-night` and `values-sw…dp` with a script.

- [x] Write `res/values/`, `res/values-night/` and one `res/values-<qualifier>/` per other screen under `dist/android/<app>/<brand>/`, with the qualifiers set in `chassis.build` as decided below. (Changed while doing it: the map is `chassis.build.options.android.screens`, next to the other Android options, instead of a new `chassis.build.android` key.)
- [x] Decide where the base colours go (see below). (`res/values/color_base.xml`, with a new filter `cx/baseColorTokens`.)
- [x] Keep or drop the flat files, as decided below. (Kept for one release.)
- [x] Acceptance: aapt2 compiles and links the tree for both brands; every resource of the flat files is in the tree with the value of its theme and screen; the Android guide drops the sync script.

Result: the Android build writes a resource tree next to the flat files, 7 files per brand. No existing file changed; `dist/` has 58 files.

| File                                                             | Contents                                             | Same as                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| `res/values/string.xml`                                          | strings, font families and weights, icons            | `string.xml`                            |
| `res/values/color_base.xml`                                      | the 1382 base colours, which were only in `main.xml` | new                                     |
| `res/values/color.xml`                                           | colours of the first theme                           | `color_light.xml`                       |
| `res/values/number.xml`                                          | numbers of the default screen                        | `number_small.xml`                      |
| `res/values-night/color.xml`                                     | colours of `dark`                                    | `color_dark.xml`                        |
| `res/values-sw600dp/number.xml`, `res/values-sw840dp/number.xml` | numbers of medium and large                          | `number_medium.xml`, `number_large.xml` |

The screen folders come from `options.android.screens`, by default `{ small: '', medium: 'sw600dp', large: 'sw840dp' }` (`DEFAULT_SCREEN_QUALIFIERS` in `config/android.js`). `loadConfig` checks them when an app builds Android: every screen needs a folder, and exactly one screen goes into the default folder. Without screens, the one number file goes into `values`. Themes other than the first and `dark` get no tree file. `planBuilds` now carries the configured `themes` and `screens`, which `config/index.js` passes to the platform configs with their options.

Checked:

- Each tree file equals its flat file, apart from the timestamp line, for both brands and the `android-references` baseline; `color_base.xml` prints values with `outputReferences`, since base colours never print references.
- aapt2 compiles and links each brand's `res/` folder as the build writes it, and its resource dump shows the qualified values, such as `size_website_section_icon` at `48dp`, `64dp` (`sw600dp`) and `80dp` (`sw840dp`), and `color_context_default_bg_main` at `#ffffffff` and `#ff111314` (`night`).
- Every resource of `main.xml` is in the tree with the same type and the value of the light theme and the large screen (6487 of 6487, both brands).

The Android guide adds the tree as a Gradle resource folder (`sourceSets["main"].res.srcDir(…)`), which is not compiled here (no Android SDK), or copies it; the sync script and its CI step are gone.

## Phase 20: SwiftUI and Compose outputs (optional)

Goal: native code outputs for apps that use SwiftUI or Jetpack Compose.

- [x] New opt-in platforms, selected in `chassis.build.apps` like the web presets: `ios-swiftui` (`Color(red:green:blue:opacity:)`, `CGFloat`, `Font.Weight`) and `android-compose` (a Kotlin `object` with `Color(0xAARRGGBB)`, `.dp`, `.sp`, `Float`, `FontWeight`). Values come from `values/ios.js` and `values/android.js` or siblings of them; no value logic in templates.
- [x] Baselines under `build/tokens/test/golden/`, as for the other presets.
- [x] Acceptance: the SwiftUI files compile (`swiftc`; SwiftUI is available on macOS); the Kotlin file compiles with `kotlinc`, which is not installed here and needs Ozgur's approval to download.

Result: two opt-in platforms, selected in `chassis.build.apps` like the web presets. Neither is in the repository's own configuration, so `dist/` did not change.

| Platform          | Folder                                | Files                                                                                      | Example                                                                                                  |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `ios-swiftui`     | `dist/ios-swiftui/<app>/<brand>/`     | the 7 Swift files of `ios`, same types                                                     | `public static let ColorContextDefaultBgMain = Color(red: 1.000, green: 1.000, blue: 1.000, opacity: 1)` |
| `android-compose` | `dist/android-compose/<app>/<brand>/` | `ChassisTokens.kt`, `String.kt`, `Color<Theme>.kt`, `Number<Screen>.kt`, one `object` each | `val fontContextJumboLetterSpacing get() = (-0.0052).em`                                                 |

- `values/swiftui.js` prints colours as `Color(…opacity:)` and weights as `Font.Weight`, and takes every other value, the part names and the reference rule from `values/ios.js` (equal UIKit text means equal SwiftUI text). `values/compose.js` prints the values of `values/android.js` in Kotlin: `Color(0xAARRGGBB)`, `16.dp`, `22.sp`, `(-0.0052).em` for letter spacing parts, `0.4f` for other floats, `FontWeight(600)`, and escaped string literals; references follow the Android rule and name the camelCase property.
- The constant loop of the iOS template moved to `templates/constants.js` (`tokenConstants`), which the Swift, SwiftUI and Compose formats call with their value module. `config/ios.js` became a factory, `swiftConfig`; only `ios` marks its colour files for `Color.swift`. The Swift configs set `accessControl: 'public'`, which the UIKit format had from `setSwiftFileProperties` and the SwiftUI format did not.
- Compose properties are getters. With `outputReferences`, 16 properties name one declared later in their file; as stored properties Kotlin refuses them ("variable must be initialized", checked). The plan's first reason, the JVM's 64 KB limit on an initializer, was wrong as stated: with stored properties the main object compiles and its initializer is 51411 bytes, about 78% of the limit.
- The Compose package is `chassis.tokens`, or `options["android-compose"].packageName`.

Checked:

- Every constant of both presets equals the constant of `dist/ios` or `dist/android` at the same place, in SwiftUI or Kotlin form: 20589 each, none differ (by kind for Compose: 8628 `dp`, 5107 colours, 2628 `sp`, 2410 strings, 768 `em`, 628 floats, 420 weights).
- The 7 SwiftUI files compile together against the SwiftUI framework of macOS (`swiftc -typecheck`, `arm64-apple-macos13`); so do the 7 files with `outputReferences` (14413 names).
- The 7 Kotlin files compile together with `kotlinc` 2.4.20 (downloaded to the session scratchpad from JetBrains' GitHub release, 89729132 bytes, as approved), against stand-ins with the signatures of `androidx.compose` (`Color(Long)`, `Color(Int)`, `Int`/`Double` `.dp`, `.sp`, `.em`, `FontWeight(Int)`), and so do the files with `outputReferences` and another package (14389 names). The real Compose libraries were not downloaded.
- Baselines `golden/ios-swiftui/` and `golden/android-compose/` (7 files each, 1.5 MB and 1.1 MB), written by the build and equal to the checked output; `pnpm tokens:verify:presets` checks 8 presets.

## Phase 21: icon assets (optional)

Goal: icons that iOS and Android can draw. Today the 9 icon tokens per brand are SVG text in strings.

- [x] iOS: write an asset catalog (`Icons.xcassets`) with one image set per icon, the SVG and a `Contents.json` with `preserves-vector-representation`.
- [x] Android: write one vector drawable per icon under `res/drawable/`, with the converter decided below.
- [x] Keep the string tokens.
- [x] Acceptance: `actool` is not available without Xcode, so the catalog is checked for structure and valid SVG; the drawables compile with aapt2.

Result: the 9 SVG icon tokens of each brand are also icon assets. The string tokens did not change; `dist/` gained 56 files (114 in all) and nothing else changed.

| Platform | Files                                                                                           | Content                                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `Icons.xcassets/Contents.json` and `Icons.xcassets/<Name>.imageset/{<Name>.svg, Contents.json}` | the SVG of the token; `preserves-vector-representation` and `template-rendering-intent: template`, so the icon scales and takes the tint colour |
| Android  | `res/drawable/<name>.xml`                                                                       | a vector drawable from `svg2vectordrawable` 2.9.1 (MIT, new dev dependency) with `fillBlack` and three decimals                                 |

- `build/tokens/icons.js` holds the pure parts (`iconTokens`, `iosImageSet`, `iosCatalog`, `androidDrawable`) and registers two Style Dictionary actions, `cx/ios-icons` and `cx/android-icons`. The iOS and Android configs run them only in the build of the main file, where the icon tokens are; the SwiftUI and Compose presets do not.
- The converter drops the `currentcolor` fill of the root `svg`, and a vector path without a fill colour draws nothing, so `fillBlack` fills every path black for a tint to replace. Its default of two decimals rounded the tokens' three (`1.205` became `1.2`); `floatPrecision: 3` keeps them.
- The converter also rewrites paths (absolute to relative coordinates, shorter commands), so 6 of 9 drawables have other numbers than their SVG. Rendered at 480 px (20x) with AppKit, each drawable path and its SVG differ by at most 5 of 255 in alpha, on anti-aliased edges only, for all 9 icons.

Checked:

- Every image set's SVG equals the icon token's text, every `Contents.json` is valid JSON with the expected keys, and the catalog has one image set per icon constant of `String.swift` (both brands). `actool` needs Xcode, so the catalog is not compiled here.
- aapt2 compiles every drawable of both brands. Linking drawables needs the framework attributes of `android.jar` (`android:height`, `android:viewportWidth`), which are not here; the values folders still link.
- A Swift package whose target folder holds `Icons.xcassets` makes `swift build` run `actool`, even without a `resources` entry, so it fails without Xcode. The iOS guide's `Package.swift` therefore excludes the catalog, which then goes into the app target; that package builds without Xcode.

## Phase 22: platform shadow values (optional)

Goal: shadow parts an app can apply directly.

Facts: shadow tokens are expanded into `OffsetX`, `OffsetY`, `Blur`, `Spread` and `Color` parts with CSS meanings. Core Animation takes a radius of about half the CSS blur, and has no spread; Android elevation takes none of these parts. Correction of 2026-09-27: Core Animation does not need the opacity separate from the colour (see the result).

- [x] iOS: add `…Radius` (blur divided by 2), `…Opacity` (the colour's alpha) and `…OpaqueColor` parts. (Changed while doing it: only `…Radius`; see the result.)
- [x] Keep the existing parts on both platforms.
- [x] Acceptance: only added lines; compile checks pass; the iOS guide's shadow example uses the new parts.

Result: every box shadow blur on iOS is followed by a `…Radius` constant with half its value, and nothing else changed.

- In `dist/ios`, 396 lines were added to each `ChassisTokens.swift` and number file of both brands (3168 in all): the 394 shadow blurs and the blurs of the two `bg-blur` tokens, which Tokens Studio types as `boxShadow` too. Colour files, `Color.swift`, Android, web and the SwiftUI and Compose presets did not change. The `ios-references` baseline changed in the same way; a radius always prints its value.
- A part is a shadow blur when its `$extensions['studio.tokens'].originalType` is `boxShadow` and its path ends in `blur`. `values/ios.js` exports `derivedConstants(token)`, and `tokenConstants` prints what it returns right after the token; the other value modules have none.
- `…Opacity` and `…OpaqueColor` were not added. Rendered with Core Animation on macOS, a shadow with the token colour and `shadowOpacity = 1` equals, pixel for pixel, one with the opaque colour and `shadowOpacity` set to the alpha (alpha 0.1 and 0.4), so the colour is enough. And 271 of the 394 shadow colours have another alpha in dark mode (`0.1` against `0.4`), so an `…Opacity` number would differ between the colour files, which `Color.swift` refuses for anything but colours. The token colour, through `ChassisTokensColor`, follows the appearance instead.
- The factor of one half is the usual conversion between a CSS blur and `shadowRadius`, which the iOS guide already used; it was not measured against a browser here.

Checked: all Swift files of both brands and of the `ios-references` build type-check in one module; the iOS guide's shadow example compiles in a package against the new files and sets a radius of 4, `shadowOpacity` 1 and the colour's alpha 0.1.

## Phase 23: package contents and scripts

Goal: the npm package holds every output the docs describe, and the package scripts fail when something is wrong.

- [x] `files`: publish every file of `dist/` (Swift, XML, Kotlin, SVG, JSON, SCSS), as decided below. Also `README.md`, `LICENSE` and `CHANGELOG.md`, which npm adds by default.
- [x] `exports`: add the map decided below. Every path that consumers use today must still resolve, above all `dist/web/docs/chassis/main.scss`, which `@chassis-ui/css` forwards.
- [x] `description`: replace it with text that says what the package holds (decided below).
- [x] `check`: remove `check:lockfile`, and run the other steps so that any failure fails `check`, in sequence or with a runner that returns the first failure.
- [x] Remove `site:lint:vnu`, `build/vnu-jar.js` and the `vnu-jar` dependency, and `tokens:zip` with `build/zip-tokens.js`, if approved.
- [x] Update the quick start and the README where they say that the package holds the web SCSS files only.
- [x] Acceptance:
  - `npm pack --dry-run` lists all 114 `dist/` files and no file outside `dist/` apart from `package.json`, `README.md`, `LICENSE` and `CHANGELOG.md`.
  - A consumer check in the scratchpad: install the packed tarball into an empty project, then compile `@use '@chassis-ui/tokens/dist/web/docs/chassis/main'` with Dart Sass through the `pkg:` importer and through a load path, and `require.resolve` one Swift file, one Android file and `package.json`.
  - `pnpm check` fails when one of its steps is made to fail, and passes otherwise.
  - The usual `dist/` and test checks from the ground rules.

Result: the npm package holds all of `dist/`, Node resolves only `dist/*` and `package.json`, and `pnpm check` fails when a step fails.

- `files` is `["dist", "CHANGELOG.md"]`; npm adds `package.json`, `README.md` and `LICENSE` itself. The tarball has 118 files, 691.6 kB packed and 9.9 MB unpacked (was 37 files, 102.7 kB): 46 XML, 18 SVG, 16 Swift, 20 JSON and 14 SCSS files. There is no Kotlin file, because no configured app uses `android-compose`.
- `exports` is `{ "./dist/*": "./dist/*", "./package.json": "./package.json" }`. The description is the approved text.
- `check` is `pnpm check:astro && pnpm check:pnpm`. It fails today, because `pnpm audit` reports 37 advisories (39 before; `lockfile-lint` brought 2); Phase 24 clears them.
- Removed `build/vnu-jar.js`, `build/zip-tokens.js`, the scripts `site:lint:vnu`, `tokens:zip` and `check:lockfile`, and the dependencies `vnu-jar` and `lockfile-lint`. `*.zip` stays in `.gitignore`.
- The quick start and the iOS and Android guides say the package holds the iOS and Android files; the README overview says `dist/` is published to npm. The web guide's sentence that the package holds the default output (not the presets) is still true and did not change.

Checked:

- `npm pack --dry-run` lists the 114 files of `git ls-files dist` exactly, and outside `dist/` only `CHANGELOG.md`, `LICENSE`, `README.md` and `package.json`.
- Consumer check in the scratchpad: the packed tarball installed offline into an empty project. Dart Sass compiled `@use "pkg:@chassis-ui/tokens/dist/web/docs/chassis/main"` with `NodePackageImporter`, and `@forward "@chassis-ui/tokens/dist/web/docs/chassis/main"` (the line `@chassis-ui/css` uses) with `node_modules` as load path; both print `1rem` for `$cx-space-context-medium`. `require.resolve` finds a SCSS, a Swift, an Android XML and an asset catalog SVG file, and `package.json`; `README.md` does not resolve.
- `pnpm check` exits 1 as it is (audit), 0 with `check:pnpm` replaced by `true`, and 1 with `check:astro` replaced by `false`; `package.json` was restored after each.
- `pnpm tokens:verify` passes, 114 of 114 files; the 8 preset checks pass; `pnpm tokens:test` passes, 745 tests; lint reports nothing; `pnpm site:lint` passes; `pnpm astro:build` built 22 pages, and the three changed sentences are in the built pages; `dist/` untouched.

## Phase 24: lint and audit clean

Goal: every lint and audit command the CI of Phase 25 will run passes.

- [x] Format the 6 files under `site/src/components/homepage/` with Prettier (formatting only; an exception to the frozen `site/` folder). Done by Ozgur on 2026-09-27; `pnpm site:lint` passes.
- [x] Format `README.md`, `CHANGELOG.md` and `publish-release.yml` with Prettier.
- [x] Update Astro, `@astrojs/check` and the other packages in the audit report to versions without the advisories. For an advisory with no fixed version, add a `pnpm.auditConfig.ignoreGhsas` entry with the reason in the Result.
- [x] Acceptance: `pnpm site:lint`, `pnpm check` (Phase 23's version), `prettier -c` on the repository, `pnpm astro:build` with the page count unchanged (22), and the usual `dist/` and test checks. The Result lists every updated package with its old and new version, and every ignored advisory.

Result: `pnpm audit` reports no advisory, and Prettier, `site:lint` and `pnpm check` pass on the whole repository.

- Prettier: formatted `README.md`, `CHANGELOG.md`, `publish-release.yml`, and also `docs/rewrite-plan.md`, `pagefind.yml` and `vercel.json`, which `prettier -c .` reported too. Ignoring whitespace, the only text change in the Markdown files is one table separator row; the YAML files changed quotes and `vercel.json` joined two arrays onto one line. Added `pnpm-lock.yaml` to `.prettierignore`, since pnpm writes it.
- Audit: 37 advisories (39 before Phase 23), all with a fixed version, so no `ignoreGhsas` entry was needed. `pnpm update --depth Infinity` within the existing ranges, excluding the four packages that produce `dist/` (`style-dictionary`, `@tokens-studio/sd-transforms`, `svg2vectordrawable`, `tinycolor2`), cleared 35. The other two were `qs` under `style-dictionary`, which the exclusion held back; `qs` alone went from 6.15.3 to 6.16.0, inside its parent's `^6.12.3`, and the four packages kept their versions.
- The update also moved `@chassis-ui/css` from 0.5.0-0 to 0.5.2, which changes Chassis CSS files the site copies (for example `--cx-primary-60`), and `@chassis-ui/docs` to 0.5.0. Neither was needed for the audit, so both are back at 0.5.0-0 with their `^` ranges. Updating them is Ozgur's call, outside this phase.
- Direct dev dependencies updated: `@astrojs/check` 0.9.9 → 0.9.10, `@astrojs/markdown-remark` 7.2.1 → 7.3.1, `@astrojs/mdx` 7.0.2 → 7.0.8, `@astrojs/sitemap` 3.7.3 → 3.7.4, `@floating-ui/dom` 1.7.6 → 1.8.0, `@shikijs/transformers` 4.3.1 → 4.4.3, `astro` 7.0.6 → 7.3.5, `autoprefixer` 10.5.2 → 10.6.1, `eslint` 10.6.0 → 10.11.0, `globals` 17.7.0 → 17.12.0, `globby` 16.2.0 → 16.2.4, `html-validate` 11.5.5 → 11.16.0, `js-yaml` 5.2.1 → 5.4.2, `postcss` 8.5.16 → 8.5.28, `prettier` 3.9.4 → 3.9.9, `sass` 1.101.0 → 1.105.0, `typescript-eslint` 8.62.1 → 8.70.1, `vanilla-calendar-pro` 3.1.0 → 3.4.0, `vitest` 4.1.9 → 4.1.11, `zod` 4.4.3 → 4.6.5. `package.json` ranges now start at these versions.

Checked:

- `pnpm audit`: no known vulnerabilities. `pnpm check` exits 0 (`astro check`: 0 errors, 0 warnings, 0 hints). `pnpm site:lint` and `prettier -c .` pass. `pnpm install --frozen-lockfile` passes.
- The site built with the old dependencies (a scratch worktree at `rewrite(phase 23)`, `--frozen-lockfile`) and with the new ones: 22 pages each. Of 3911 files (Pagefind left out), 3886 are identical once hashed asset names are normalised, 18 pages differ only in whitespace between tags, the docs stylesheet gains `-webkit-user-select` and `-moz-user-select` (newer autoprefixer data), and 6 bundled JavaScript chunks differ (newer Vite and libraries).
- Astro 7.3 prints 17 Vite warnings, one per MDX page, that the module-level directive `use astro:head-inject` "may not be preserved when bundling". The old build printed none. The built HTML is the same, including the stylesheet link in every head, so the warnings change nothing here.
- `pnpm tokens:verify` passes, 114 of 114 files; the 8 preset checks pass; `pnpm tokens:test` passes, 745 tests; `tokens:lint` reports nothing; `dist/` untouched.

## Phase 25: CI for pull requests

Goal: every pull request and every push runs the checks, and the release cannot publish without them.

- [x] `.github/workflows/ci.yml`, on `pull_request` and on `push` to any branch (changed while doing it: on `pull_request`, `workflow_dispatch` and `workflow_call`; see the result):
  - `tokens` job, on the Node versions decided below: `pnpm install --frozen-lockfile`, `tokens:lint`, `tokens:test`, `tokens:verify`, `tokens:verify:presets`.
  - `site` job: `site:lint`, `check:astro`, `astro:build`.
  - `audit` job: `check:pnpm`.
  - Concurrency group per branch, cancelling older runs; `permissions: contents: read`.
- [x] `publish-release.yml`: `--frozen-lockfile`, and it publishes only after the CI jobs pass on the same commit (a reusable workflow call or `needs`).
- [x] `.github/dependabot.yml` for npm and GitHub Actions, as decided below.
- [x] Pin actions as decided below.
- [x] Acceptance: `actionlint` passes on both workflows; each job's commands run green locally in a clean clone with `pnpm install --frozen-lockfile`; the Result lists the branch protection settings for Ozgur to set on `main` (required checks: the job names).

Result: every pull request runs three jobs, and a push to `main` publishes only after the same jobs pass on that commit.

| Job                                    | Node.js | Steps                                                                                                    |
| -------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `Tokens (Node 22)`, `Tokens (Node 24)` | 22, 24  | `pnpm install --frozen-lockfile`, `tokens:lint`, `tokens:test`, `tokens:verify`, `tokens:verify:presets` |
| `Site`                                 | 22      | install, `lint:prettier`, `site:lint`, `check:astro`, `site:build`                                       |
| `Audit`                                | 22      | `check:pnpm`, without installing                                                                         |

- Triggers: `ci.yml` runs on `pull_request`, `workflow_dispatch` and `workflow_call`, not on every push. With `push` to any branch as planned, every push to a pull request branch ran CI twice (the `push` and `pull_request` events have different refs, so one concurrency group cannot merge them), and a push to `main` ran it twice as well, once directly and once inside the release. `publish-release.yml` calls `ci.yml` as its first job (`needs: ci`), so every push to `main` runs CI exactly once and nothing publishes without it. A branch without a pull request can run CI by hand (`workflow_dispatch`).
- The Site job runs `site:build` instead of `astro:build`: the site needs `vendor/assets/dist/`, which the assets submodule does not commit; `site:build` initialises the submodule, pulls its `app/docs` branch, builds it, and then runs Astro and Pagefind, the same command as Vercel.
- Added `pnpm lint:prettier` (`prettier -c --cache .`), so the repository-wide Prettier check of Phase 24 stays green; the Site job runs it.
- Concurrency: `ci-<workflow>-<branch>`, cancelling older runs only for pull requests; when the release calls CI, `github.workflow` is the release's name, so the two groups never meet. The release has its own group, `publish-release`, which never cancels.
- Permissions: `contents: read` for every job; only `publish-tokens` has `contents: write`, for the GitHub release. Every checkout sets `persist-credentials: false`. The release passes the version to its shell step through `env` instead of an inline expression.
- Actions are pinned to the latest release of the major version already in use, with the version in a comment: `actions/checkout` v5.1.0, `pnpm/action-setup` v6.1.0, `actions/setup-node` v5.0.0, `softprops/action-gh-release` v3.0.3. Newer majors exist (`checkout` and `setup-node` v7); Dependabot will propose them.
- `.github/dependabot.yml`: npm and GitHub Actions, weekly on Monday. Minor and patch updates of dev dependencies come as one grouped pull request, except the packages that produce `dist/` (`style-dictionary`, `@tokens-studio/sd-transforms`, `svg2vectordrawable`, `tinycolor2`) and `@chassis-ui/*`, which get one pull request each, so a golden check that fails names its cause. Major updates come one by one. Actions come as one grouped pull request.
- README (release and a new CI section) and CHANGELOG updated.

Checked:

- `actionlint` 1.7.12 (downloaded to the scratchpad from its GitHub release, checksum verified; `shellcheck` checks the `run` scripts): 0 errors in both workflows. A copy with a wrong `needs` and an undefined matrix key fails with `job-needs` and `expression` errors.
- `dependabot.yml` validates against the SchemaStore Dependabot schema (with `ajv` in the scratchpad); a copy with an unknown update type fails.
- In a clean clone with this phase's changes: the Tokens job's commands pass on Node.js 22.19.0 and on 24.18.0 (745 tests, 114 files, 8 presets); the Site job's commands pass on 22.19.0, including `site:build`, which initialised the submodule from GitHub, built 3834 asset files and 22 pages and indexed them with Pagefind; `pnpm check:pnpm` passes without `node_modules`.
- In the working repository: `pnpm tokens:verify`, the 8 preset checks, 745 tests, lint, `lint:prettier` and `pnpm check` pass; `dist/` untouched.
- Not checked: a real GitHub Actions run, which needs a push. The first run is recorded in the next session log.

Settings for Ozgur on GitHub, after the first CI run (the check names appear only once they have run):

1. Settings → Branches → add a rule (or ruleset) for `main`: require a pull request before merging; require status checks `Tokens (Node 22)`, `Tokens (Node 24)` and `Site`; require branches to be up to date. (Changed on 2026-09-27: Ozgur merges locally and pushes `main` directly, without pull requests, so do not require a pull request; a required status check would also reject direct pushes, so leave branch protection off, or allow Ozgur to bypass it.)
2. Leave `Audit` out of the required checks (recommended): a new advisory in any dev dependency fails it on every pull request, whatever the pull request changes. It still shows as a failed check.
3. Settings → Code security: turn on Dependabot alerts and security updates. `dependabot.yml` covers version updates only.

## Phase 26: merge preparation and 0.6.0

Goal: `dev/rewrite` merges into `main` and is released as one version.

- [x] Move the `[Unreleased]` CHANGELOG entry to the version decided below. Add a "Breaking changes" section first: Node 22, the iOS type and file names (Phase 17), font weights (Phase 14), line heights and letter spacing (Phase 13), gradients (Phase 15), Android float resources, and the files added to the npm package (Phase 23). Each with the change an app must make.
- [x] Bump the version with `pnpm change-version`. Rebuild `dist/` for the new header, if approved: only the version and timestamp lines may change, which `pnpm tokens:verify` shows.
- [x] Write the pull request description into the Result: what changed, how it was checked, and the breaking changes, taken from the CHANGELOG.
- [x] Ozgur pushes `dev/rewrite`, opens the pull request, waits for the CI of Phase 25, merges and lets the release workflow publish. Claude does not push. (Changed: Ozgur chose to merge locally without a pull request; see the note below.)
- [ ] Acceptance: before the push, every local check of Phase 25 passes in a clean clone; `npm pack --dry-run` shows the new version. After the release, the next session records the CI run, the npm version and the GitHub release in the log.

Result: `dev/rewrite` is ready to merge as 0.6.0. Waiting for Ozgur to push, open the pull request, merge and release.

- `CHANGELOG.md`: `[Unreleased]` is `[0.6.0] - 2026-09-27`, with a new introduction and a "Breaking changes" section first, by platform (web 2, iOS 4, Android 5, build 1), each with what an app must change. The preset paragraphs, which followed the introduction, have their own heading now. Every example value in the section was checked against `dist/` and `main`; the first draft named `semi-bold` weights, but the old output printed `regular` for the example tokens, and was corrected.
- Not listed as breaking, because nothing an app uses changes: the `sinefil` blockquote style (`oblique` to `italic`, a value), the added iOS `Color.swift`, `…Radius` constants and icon catalog, the Android `res/` tree and drawables, the escaped Android strings (they compiled to empty strings before), and the added npm files.
- `pnpm change-version 0.5.3 0.6.0` changed `package.json`, the README badge and `site/config.yml`. `pnpm tokens` rebuilt `dist/`: 58 files changed (the 56 icon files have no header), and every changed line is a `Chassis - Tokens v0.6.0` or `Generated on` line. The preset baselines keep their 0.5.3 headers, which the checks ignore.
- The branch is 43 commits ahead of `main` with this one: 311 files, about 231,700 lines added and 50,100 removed.

Checked:

- In a clean clone with this phase's changes: every CI command passes on Node.js 22.19.0 (install, `tokens:lint`, `tokens:test` 745 tests, `tokens:verify` 114 files, `tokens:verify:presets` 8 presets, `lint:prettier`, `site:lint`, `check:astro`, `site:build` 22 pages with the submodule build, `check:pnpm`), and the Tokens job's commands on 24.18.0.
- `npm pack --dry-run`: `chassis-ui-tokens-0.6.0.tgz`, 118 files, 693.1 kB.

Steps for Ozgur:

1. `git push -u origin dev/rewrite`
2. Open the pull request from `dev/rewrite` into `main` with the title and description below (for example `gh pr create --base main --head dev/rewrite --title "Rewrite the token build and release 0.6.0" --body-file <file>`).
3. Wait for CI (the first real run of `ci.yml`), then merge with **Create a merge commit**, as decided.
4. The push to `main` runs the release: CI, then `npm publish` of 0.6.0 and the GitHub release `v0.6.0`. The `NPM_CHASSIS_UI` secret must still be valid.
5. Set the branch protection of Phase 25 once the check names exist.
6. Tell Claude how it went; the next session records the CI run, the npm version and the GitHub release, marks this phase Done and creates `dev/production` from `main` for Phase 27.

Title: `Rewrite the token build and release 0.6.0`

```markdown
## Summary

Rewrites the token build on Style Dictionary 5.5 and sd-transforms 2.0, fixes the iOS and Android output so that it compiles and holds values the platforms can use, keeps the presets for other CSS frameworks, and makes the repository ready to release: CI on pull requests, the whole of `dist/` in the npm package, and a clean audit. Version 0.6.0.

The web SCSS output is the same apart from one renamed token and one font style. The iOS and Android output has breaking changes, listed below and in `CHANGELOG.md`.

## What changed

- **Build:** platform value encoding (`UIColor`, ARGB, `sp`/`dp`, quoting, `em`, references) moved out of the templates into tested pure functions in `build/tokens/values/`, which run on resolved tokens. One Style Dictionary instance per token-set list: 16 builds in about 6 s, instead of 36 runs in about 20 s.
- **Web:** `headers-gap` is `header-gap` in the small screen file, and the `sinefil` blockquote style is `italic` instead of `oblique`. Nothing else in `dist/web/` changed.
- **iOS:** one type per file (`ChassisTokens.swift`, `ChassisTokensColorLight`, …), `Color.swift` with colours that follow dark mode, `UIFont.Weight` weights, line heights in points, gradients as angle and stop parts, a `…Radius` for box shadows, and an `Icons.xcassets` catalog.
- **Android:** float resources for opacity and letter spacing (the `<integer>` files did not compile), integer weights, letter spacing in ems, line heights in `sp`, gradients as parts, escaped strings (icons compiled to empty strings), a `res/` tree with `values-night` and `values-sw…dp`, and vector drawables for the icons.
- **Presets:** `web-scss`, `web-px`, `web-vw` and `outputReferences` for SCSS, Android and iOS; new `ios-swiftui` and `android-compose` platforms. Each has a baseline in `build/tokens/test/golden/`.
- **Package:** the npm package holds all of `dist/` (118 files, 693 kB packed; it held the web SCSS only), an `exports` map for `dist/*` and `package.json`, and a new description.
- **Repository:** CI on pull requests (`.github/workflows/ci.yml`), a release that runs CI first, Dependabot, actions pinned to commit SHAs, `pnpm audit` clean (was 39 advisories, 1 critical), Prettier clean, `pnpm check` that can fail.
- **Docs:** the web, iOS and Android guides were rewritten and their examples compiled; the Style Dictionary page documents the build and the presets.

## Breaking changes

- **Web:** `$cx-space-website-content-headers-gap` → `$cx-space-website-content-header-gap` (small screen). Paths outside `dist/` no longer resolve through Node.
- **iOS:** `Main.swift` → `ChassisTokens.swift`; every file declares its own `enum` type instead of `class ChassisTokens`; no `@objc`. Weights are `UIFont.Weight`; percentage line heights are points; gradients are parts.
- **Android:** opacity and letter spacing are `<item type="dimen" format="float">` (read with `ResourcesCompat.getFloat`); weights are `<integer>`; typography letter spacing is in ems; percentage line heights are `sp`; gradients are parts.
- **Build:** Node.js 22 or later.

`CHANGELOG.md` says what an app must change for each.

## How it was checked

- `pnpm tokens:verify`: a fresh build equals the committed `dist/`, all 114 files, ignoring the version and timestamp header lines. `pnpm tokens:verify:presets`: all 8 preset baselines.
- `pnpm tokens:test`: 745 tests on real tokens, without mocks of Style Dictionary.
- iOS: every Swift file type-checked with `swiftc` (a stand-in UIKit; SwiftUI against the macOS SDK), and the guides' examples ran. Android: aapt2 compiled and linked the resources; the Compose output compiled with `kotlinc` against stand-ins. Compile checks against the real iOS and Android SDKs in CI come in a later phase.
- The site builds 22 pages; before and after the dependency updates, every file is the same apart from whitespace, two CSS vendor prefixes and bundled JavaScript.
- Every CI job's commands pass in a clean clone on Node.js 22 and 24.

## After merging

- The release workflow runs CI, then publishes `@chassis-ui/tokens@0.6.0` to npm and creates the GitHub release `v0.6.0`.
- `docs/rewrite-plan.md` stays until the last planned phase replaces it with `docs/architecture.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Merged on 2026-09-27, differently from the steps above: Ozgur asked whether a pull request was needed and chose to merge locally and continue in the same session. `main` was equal to `origin/main` (`a072bf9`, checked with `git fetch`), and `git merge --no-ff dev/rewrite` made the merge commit `588874e`, whose tree equals `dev/rewrite`. Nothing was pushed: pushing `main` runs the release (CI, then npm 0.6.0 and the GitHub release), which Ozgur starts when ready. Until then no CI run has happened on GitHub, and every later phase merged before that push ships in 0.6.0. The pull request description above is unused.

## Phase 27: workspace split, tokens and site (optional)

Goal: a contributor who changes tokens installs and runs only the token build; the site keeps its own dependencies.

- [x] A pnpm workspace with a private root: `packages/tokens/` holds `tokens/`, `build/`, `dist/`, its tests and the published `package.json`; `site/` becomes a workspace package with its own `package.json` and the site-only dependencies. The `vendor/assets` submodule moves with the site, if it is only the site's.
- [x] Inside the published tarball, paths do not change: `dist/` stays at the package root, so consumers see no difference.
- [x] Root scripts call the packages (`pnpm --filter`), so `pnpm tokens`, `pnpm test` and `pnpm dev` still work from the root.
- [x] Update the CI and release workflows, `vercel.json`, the lint configs, `.gitignore`, the README and the site pages that name repository paths.
- [x] Acceptance: `npm pack --dry-run` in `packages/tokens/` lists the same file names as before the split; `pnpm install` in the tokens package alone installs no site dependency; every check of Phase 25 passes; `pnpm astro:build` builds 22 pages; the Result lists the Vercel setting to change, if any.

Result: the repository is a pnpm workspace. `packages/tokens/` is the published `@chassis-ui/tokens` with only the build's dependencies; `site/` is a private package with its own; the root is private. The npm file names, `dist/` and the site output did not change.

Before the phase, Ozgur was asked to choose between this full split and a smaller one that kept the site at the root, because all five Chassis repositories (assets, css, figma, icons, tokens) run `astro build --root site` from the root, and `@chassis-ui/docs` and the site code assume it. Ozgur chose the full split; this repository's site layout now differs from the others.

| Folder             | Package                              | Holds                                                                                                                                                                                    | Dev dependencies                                           |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| root               | `chassis-tokens-workspace` (private) | `pnpm-workspace.yaml`, `.prettierrc.json`, `.prettierignore`, `build/change-version.js`, `.github/`, `docs/`, `vercel.json`, `README.md`, `LICENSE`                                      | `prettier`, `prettier-plugin-astro`                        |
| `packages/tokens/` | `@chassis-ui/tokens`                 | `tokens/`, `build/tokens/`, `dist/`, `package.json` with `chassis.build`, `CHANGELOG.md`, a new `README.md` for npm, `LICENSE`, `eslint.config.js`                                       | 11: the four build packages, `vitest`, ESLint and Prettier |
| `site/`            | `chassis-tokens-site` (private)      | the site, `vendor/assets` (the submodule, moved), `scripts/sync-submodules.js` and `scripts/html-validate.js` (from `build/`), `eslint.config.js`, `stylelint.config.js`, `pagefind.yml` | 47, including `@chassis-ui/tokens` as `workspace:*`        |

- Moves use `git mv`: 309 files are exact renames; 4 are renames with edits (`CHANGELOG.md`, the tests README, the two lint configs). `git mv` of the submodule updated `.gitmodules` and its gitdir link; it stays at commit `04fd3a7`.
- The token build needed no change: it reads `package.json`, `tokens/` and `dist/` from its package folder. Its package scripts are `build`, `build:site`, `clean`, `lint`, `test`, `verify`, `verify:presets`; `repository.directory` is `packages/tokens`.
- The site runs Astro from `site/` now. Changed: `src/libs/config.ts` and `src/libs/data.ts` read `./config.yml` and `./data/` (were `./site/…`); `config.yml` has `docsDir: "."`; `src/libs/path.ts` reads the tokens from `node_modules/@chassis-ui/tokens/dist/web/docs` (the workspace link); `astro.config.ts` writes to `_site` inside `site/`, loads Chassis CSS from `site/node_modules`, and its `@chassis-ui/tokens` importer points at the workspace package; `tsconfig.json` excludes `_site` and `vendor`, since the submodule's own site now sits under `site/`.
- Root scripts keep the names CI and the docs use (`tokens*`, `site:build`, `site:lint`, `check*`, `lint:prettier`, `dev`, `build`, `change-version`) and call the packages with `pnpm --filter`. Removed from the root: `astro:dev`, `astro:build`, `astro:preview` (now `site:preview`), `site:pagefind`, `site:lint:eslint`, `site:lint:fusv`, `site:lint:prettier`, `site:lint:stylelint`, `sync-submodules`; they are scripts of the site package.
- ESLint: one config per package; ESLint 10 uses the nearest config to each file. The token build's config has the core recommended rules, Prettier and Node globals: of the old config's rules for its files, only Astro and JSX accessibility rules (which apply to Astro templates and JSX, not plain JavaScript) and two `unicorn` rules that were off are gone. The site's config is the old one with site-relative ignores; its effective config for a `.ts`, `.astro`, `.js` and the Astro config file is identical to before. Its Prettier rule reads the root `.prettierignore` (`fileInfoOptions.ignorePath`), which excludes `site/src/assets`.
- Prettier: `prettier-plugin-astro` moved into the `*.astro` override, so formatting JavaScript does not need it; `.prettierignore` names `packages/tokens/tokens` and `site/vendor`. The site's `lint:prettier` reads the root ignore files.
- `change-version.js` reads and bumps `packages/tokens/package.json` (`npm version` in that folder) and still rewrites `README.md` and `site/config.yml`.
- CI: the Tokens job installs only the tokens package (`--filter @chassis-ui/tokens`), so a build that needs a site package fails there. The release reads the version from `packages/tokens/package.json`, installs the tokens package only and runs `npm publish` in `packages/tokens/`. `vercel.json` writes to `site/_site`.
- Docs: a layout section in `README.md` and the new paths; the quick start's directory table and paths; a note on the Style Dictionary page that its paths are relative to `packages/tokens/`; the Tokens Studio sync path `packages/tokens/tokens/` and every token file path on that page; the submodule paths in the iOS and Android guides, and the iOS guide's root `Package.swift` target path; the tests README. Also fixed a Phase 23 miss: the web guide's "Package Contents" said the package holds the web output only.
- `pnpm install` re-resolved two transitive packages: `sax` 1.6.0 → 1.6.1 (under `svgo` 2.8.4 of `svg2vectordrawable`, within its range) and `which-typed-array` 1.1.22 → 1.1.24 (under the lint plugins). Every other resolved package is the same (1046 before, 1044 after, the two old versions gone).

Checked:

- `npm pack --dry-run` in `packages/tokens/` lists the same 118 file names as before the split (687.4 kB instead of 691.6 kB: the new README is shorter).
- In a clean clone: `pnpm install --frozen-lockfile --filter @chassis-ui/tokens` installs 294 packages and nothing into `site/`: no Astro, Pagefind, stylelint or Chassis package. Two packages that are not the build's arrive anyway: the root's `prettier-plugin-astro` (with `@astrojs/compiler` and `sass-formatter`) and `sass`, an optional peer of `vite` that the lockfile resolves once for the workspace. With it, the Tokens job passes on Node.js 22.19.0 and 24.18.0 (745 tests, 114 files, 8 presets). With a full install, the Site and Audit jobs pass on 22.19.0: `lint:prettier`, `site:lint`, `check:astro` (36 files, 0 errors; the 4 new files are the two moved scripts and two configs; the one hint, a deprecated Zod type in `data.ts`, was there before), `site:build` (submodule, 22 pages, Pagefind) and `check:pnpm`.
- The site built before and after: all 3911 files (Pagefind aside) exist in both; every file is identical once hashed asset names are normalised, including the 7 bundled assets by content; Pagefind wrote 33 files each time.
- `astro dev` from the site package: the colour tokens page renders with its sidebar and styles, and the console has no errors.
- `pnpm tokens:verify`, 8 preset checks, 745 tests and lint pass in the working copy; `change-version --dry-run` finds the version in `packages/tokens/package.json`, `README.md` and `site/config.yml`; `actionlint` passes.

Found and not fixed: the "View on GitHub" link of every docs page is `https://github.com/chassis-ui/tokens/blob/<id>.mdx`, without a branch or the content folder, so it leads nowhere, before and after the split. It is built in `DocsLayout.astro` of `@chassis-ui/docs`, which the other Chassis sites share, so the fix belongs there.

Settings for Ozgur, outside the repository:

1. Tokens Studio: change the sync file path from `tokens` to `packages/tokens/tokens` before the next pull or push from Figma, or the plugin reads nothing and writes to the old folder.
2. Vercel: `vercel.json` sets the output to `site/_site`. If the project's settings override the output directory or the root directory, update them; the install runs at the root and the build command is still `pnpm site:build`.
3. npm: the package's page on npmjs.com shows `packages/tokens/README.md` from the next release on.

## Phase 27b: align the layout with chassis-react

Goal: the workspace of Phase 27 follows the layout that `chassis-react` and `chassis-website` already use, and its folder names read well.

Why: Phase 27 followed the plan's wording (`site/` as a package) without checking the sibling repositories. Ozgur pointed out that `../chassis-react` and `../chassis-website` already have `packages/<library>` and `packages/site`, with repository tooling, the assets submodule, the site output and the lint configurations at the root, and that `packages/tokens/tokens` and `build/tokens` read badly.

Decisions (Ozgur, 2026-09-27):

- Build code in `packages/tokens/build/` (was `build/tokens/`), tests, fixtures and baselines in `packages/tokens/test/`.
- Token JSON in `packages/tokens/source/` (was `tokens/`). The Tokens Studio sync path becomes `packages/tokens/source`.
- The site in `packages/site/`, with the root layout of `chassis-react`: `vendor/assets`, `build/sync-submodules.js`, `build/html-validate.js`, `pagefind.yml`, `stylelint.config.js` and the `_site` output at the root.
- One ESLint configuration at the root, as in the siblings. A tokens-only install then also installs the root's lint packages.
- Issues found in sibling packages are drafted for their repositories and filed only after Ozgur approves the text.

- [x] Move the folders with `git mv`; update the build's paths (`source/`, the package root in `verify.js` and the tests), the package scripts and the root scripts.
- [x] Move the lint and tooling dependencies to the root; the tokens package keeps the build packages and `vitest`, the site its Astro and page dependencies.
- [x] Site paths relative to `packages/site/`: `../../vendor/assets`, `outDir: '../../_site'`, the Pagefind copy in `src/libs/astro.ts`.
- [x] Root `eslint.config.js`, `stylelint.config.js`, `.prettierignore` and `.prettierrc.json` with repository paths; `vercel.json` writes to `_site` again.
- [x] Update `change-version.js`, CI, the READMEs, the tests README, the CHANGELOG line and the site pages.
- [x] Acceptance: the npm file names, `dist/` (exact renames) and the site output equal the Phase 27 baselines; the effective ESLint configuration of the six sample files equals the one before Phase 27; every CI job passes in a clean clone; the dev server renders a page.

Result: the repository has the layout of `chassis-react`. `dist/`, the npm file names and the site output did not change, and the ESLint configuration of every checked file is the one from before Phase 27.

| Folder             | Holds                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| root               | `package.json` (private, 20 dev dependencies: ESLint, Prettier, stylelint, `find-unused-sass-variables`, `html-validate`, `globby`, `picocolors`, `pagefind`, `typescript`), `pnpm-workspace.yaml`, `eslint.config.js`, `stylelint.config.js`, `.prettierrc.json`, `.prettierignore`, `pagefind.yml`, `build/` (`change-version.js`, `sync-submodules.js`, `html-validate.js`), `vendor/assets`, `_site/` (output), `.github/`, `docs/`, `vercel.json` |
| `packages/tokens/` | `@chassis-ui/tokens`: `source/`, `build/`, `test/` (with `fixtures/` and `golden/`), `dist/`, `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE`; 5 dev dependencies (the four build packages and `vitest`)                                                                                                                                                                                                                                        |
| `packages/site/`   | `chassis-tokens-site`: the site; 27 dev dependencies and `@chassis-ui/tokens` from the workspace                                                                                                                                                                                                                                                                                                                                                       |

- Moves use `git mv`: 223 exact renames, including all of `dist/` and `source/`; the others changed paths or imports. The submodule is back at `vendor/assets` at commit `04fd3a7`.
- The build: `build.js` reads `source/$themes.json` and `source/<set>.json` (the error message names `source/$themes.json`); `verify.js` finds the package root at `../` and the baselines at `../test/golden`; the usage texts say `node build/build.js`. The tests import from `../build/`, and their root is `../`. Package scripts: `build`, `build:site`, `clean`, `test` (`vitest run --dir test`), `verify`, `verify:presets`. Lint is a root script: `tokens:lint` runs ESLint on `packages/tokens/build` and `packages/tokens/test`.
- The root configurations are the pre-Phase 27 files with repository paths (`packages/site/…`); the Phase 27 workarounds are gone: the Prettier Astro plugin is a top-level plugin again, ESLint's Prettier rule has no ignore path, and `packages/site/tsconfig.json` equals the pre-Phase 27 file.
- The site: `outDir: '../../_site'`, the assets at `../../vendor/assets/dist/web/docs`, and the Pagefind copy in `src/libs/astro.ts` from `../../_site`, as in `chassis-react`. Its package scripts are `dev`, `build`, `preview`, `check`, `clean`. Root scripts run the submodule sync, Pagefind and the site lint (`site:build` is sync, Astro, Pagefind). `vercel.json` writes to `_site` again, as before Phase 27. `.gitignore` names `packages/site/dist` and `packages/site/public`.
- `change-version.js` rewrites `README.md` and `packages/site/config.yml`.
- Docs: the README layout section, the tests README (its steps for the old commit `a072bf9` keep that commit's paths, with a note), the quick start, the Style Dictionary, Tokens Studio, iOS and Android pages, and the 0.6.0 CHANGELOG entries, which name `source/`, `build/` and `test/`, since the split ships in 0.6.0.

Checked:

- `npm pack --dry-run` in `packages/tokens/`: the same 118 file names as before Phase 27. The lockfile resolves the same 1044 packages as after Phase 27.
- `eslint --print-config` for `build/build.js`, `test/build.test.js` and four site files (`.ts`, `.astro`, browser `.js`, the Astro config): each equals the pre-Phase 27 configuration of the same file, byte for byte.
- The site output equals the pre-Phase 27 build except the six guide pages whose text changed: 3911 files, 3900 identical, the 7 bundled assets identical by content, 33 Pagefind files. `check:astro` is back to 32 files, 0 errors and the old hint.
- In a clean clone: the Tokens job passes on Node.js 22.19.0 and 24.18.0 with `--filter @chassis-ui/tokens` (745 tests, 114 files, 8 presets); the Site and Audit jobs pass on 22.19.0, `site:build` included (submodule sync, 22 pages, Pagefind).
- A tokens-only install now has 551 packages: the build's and every root tool (ESLint with its Astro plugins, stylelint, Pagefind, `html-validate`, TypeScript), as decided. The site's own packages (Astro, `@astrojs/*`, the Chassis packages, Zod, the Pagefind UI) are not installed; `sass` still is, as the optional peer of `vite`. Correction to Phase 27: its count of 294 was taken from a long-format directory listing and is off by about one.
- `astro dev` from the site package: the Tokens Studio page renders with its sidebar, fonts, both images from `vendor/assets` and the path `packages/tokens/source/`; no console errors. `actionlint` passes; `change-version --dry-run` finds all three files.

Settings for Ozgur, replacing those of Phase 27:

1. Tokens Studio: the sync file path becomes `packages/tokens/source` (it was `tokens`).
2. Vercel: nothing to change; the output is `_site` again, as before Phase 27.

## Phase 28: contributor docs and README

Goal: someone new can change a token, a platform or the site and open a correct pull request without asking.

- [x] `CONTRIBUTING.md`: setup; the token flow (edit in Tokens Studio, sync, `pnpm tokens`, commit `dist/`); when and how to rewrite the preset baselines; the native compile checks; the output-change rule (a change to `dist/` needs a CHANGELOG line and says what breaks); commit and branch conventions; how a release happens (after Phase 29).
- [x] `SECURITY.md` and `CODE_OF_CONDUCT.md`, as decided below.
- [x] `.github/CODEOWNERS`, issue templates (bug, token change, platform request) and a pull request template with the checklist of `CONTRIBUTING.md`.
- [x] README: npm and CI badges instead of the hardcoded version badge (then remove `README.md` from `change-version.js`); CLI examples with the brands and apps of the configuration; no "no shared dependencies" claim; replace the emoji feature list with install, use, customize and release sections; link to `CONTRIBUTING.md` and the site.
- [x] Acceptance: every command in `CONTRIBUTING.md` and the README runs as written in a clean clone; every link resolves; Prettier passes; the issue template YAML is valid (GitHub's issue forms schema).

Result: the repository has the contributor files of `chassis-react`, in `.github/`, and a README organised like the `chassis-react` one.

- Before writing, filed the two issues drafted in Phase 27b, with Ozgur's approval: [chassis-ui/website#1](https://github.com/chassis-ui/website/issues/1) (the "View on GitHub" link of `@chassis-ui/docs`) and [chassis-ui/react#41](https://github.com/chassis-ui/react/issues/41) (the `image-size` audit ignores).
- Followed `chassis-react`, which is the only sibling with these files: they live in `.github/` (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/`), and the issue templates are Markdown templates with a `config.yml`, not the YAML issue forms the phase named. `CODE_OF_CONDUCT.md` is the `chassis-react` copy of the Contributor Covenant 2.1 with this repository's advisory link. `SECURITY.md` follows the `chassis-react` text, stating that the package holds generated files only and has no runtime dependencies.
- `CODEOWNERS`: asked again, since no sibling has one and Ozgur merges without pull requests; Ozgur chose `* @ozgurgunes`.
- `CONTRIBUTING.md`: setup (full and tokens-only install), commit conventions taken from this repository's history, changing tokens (Tokens Studio path, `pnpm tokens`, reviewing `dist/`, `pnpm tokens:verify`, a loop that writes every preset baseline again, a CHANGELOG line under `## [Unreleased]`), changing the build (templates only print; tests use real tokens; iOS and Android output checked in an app until Phase 33), changing the site, what a pull request needs, releases (the current `change-version` flow; Phase 29 replaces it) and the issue tracker.
- Issue templates: bug report (version, platform, app and brand, file and token), token change (with the note that renaming breaks apps), platform or output request; `config.yml` links the documentation, Chassis CSS and private security reporting. They use the repository's existing `bug` and `enhancement` labels. The pull request template has the checks of `CONTRIBUTING.md`.
- `README.md`: the npm badge and a status badge of the release workflow replace the hardcoded version badge (the release workflow, because CI runs on `main` only inside it); an overview, accurate features, installation and usage, the repository layout, development (build with the real brands and apps in the examples and an option table, verify, tests, architecture without the "no shared dependencies" claim), configuration (the real Tokens Studio groups: `brand` with 5 options, `app`, `theme`, `screen`), presets, the site, CI and releases, the ecosystem (with `chassis-react` added) and contributing links. The emoji feature list and the build-feature marketing are gone. `README.md` left `change-version.js`, which now rewrites `packages/site/config.yml` only.

Checked:

- Every relative link and anchor in the README, the package README and the `.github/` documents resolves (a script with GitHub's heading slugs); 27 of 28 external links return 200, and the npm page, which answers scripted requests with 403, exists (`npm view`: `@chassis-ui/tokens` 0.5.3).
- `ISSUE_TEMPLATE/config.yml` validates against the SchemaStore schema for GitHub issue configuration (with `ajv`; a broken copy fails); each template has `name`, `about`, `title`, `labels` and `assignees` front matter; both labels exist.
- In a clean clone, every command of the README and `CONTRIBUTING.md` runs as written: the tokens-only install, `pnpm tokens` with each filter example, `--dry-run`, `DEBUG=1`, `tokens:verify` (also with `--platform ios`), `node build/verify.js --skip-build --platform ios`, the baseline loop (64 files rewritten, only header lines changed) followed by `tokens:verify:presets`, `tokens:lint`, `tokens:test`, the full install, `site:lint`, `check:astro`, `site:build`, `build` and `change-version --dry-run`. `pnpm dev` was checked in the preview in Phase 27b and not changed since. The first run found that the README's `--skip-build` example failed after `--platform ios`, since it compares the last run's `dist-next/`; the example now passes the same platform.
- Prettier passes on the repository.

Settings for Ozgur on GitHub:

1. Settings → Code security → **Private vulnerability reporting: enable**. It is off (`gh api .../private-vulnerability-reporting` returns `enabled: false`), and `SECURITY.md`, the Code of Conduct and the issue template link to it.
2. Settings → Code security → Dependabot alerts and security updates (from Phase 25; still off).

## Phase 29: release automation

Goal: versions and CHANGELOG entries come from pull requests, and npm publishes with provenance and without a long-lived token.

- [x] Add the tool decided below (Changesets recommended). With Changesets: a pull request adds a changeset file; on `main`, the Changesets action opens a "Version Packages" pull request that bumps the version and writes the CHANGELOG; merging it publishes.
- [x] The version step also writes `current_version` in `site/config.yml`, which `change-version.js` does today. Then remove `change-version.js` and its script, if approved.
- [x] Publish with npm trusted publishing (OIDC, `id-token: write`) and `--provenance`, then create the GitHub release with the CHANGELOG entry as its body.
- [x] The CI of Phase 25 fails a pull request that changes `tokens/`, `build/` or `dist/` without a changeset.
- [x] Result: the steps for Ozgur: add the trusted publisher on npmjs.com, then delete the `NPM_CHASSIS_UI` secret after the first release with provenance. Corrected below: `NPM_CHASSIS_UI` is not a secret of this repository.
- [x] Acceptance: `actionlint` passes; `pnpm changeset status` works; a dry run of the version step on a scratch branch bumps `package.json`, writes the CHANGELOG and `site/config.yml`; `npm publish --dry-run` lists the files of Phase 23.

Result: releases use Changesets 3, set up like `chassis-react`, and the package is published with npm trusted publishing and provenance.

- `@changesets/cli` 3.0.3 at the root. `.changeset/config.json` follows `chassis-react` (default changelog, `access: public`, `baseBranch: main`, the private site in `ignore`) and adds `changedFilePatterns: ["source/**", "build/**", "dist/**"]`, so only those folders of `packages/tokens/` count as a change to the package. `.changeset/README.md` points to the contributing guide.
- Root scripts: `changeset` and `changeset:version` (`changeset version`, then `build/sync-version-refs.js`). `build/sync-version-refs.js`, adapted from `chassis-react`, writes `current_version` in `packages/site/config.yml` and rebuilds `dist/` when a `Chassis - Tokens v…` header names another version, so the published headers show the new version, as Phase 26 did by hand. A version step with only empty changesets leaves `dist/` alone instead of rewriting 58 timestamps. `build/change-version.js` and its script are removed, as decided.
- `build/release-notes.js` prints one version's CHANGELOG entry, for both heading styles: `## 0.7.0` (Changesets) and `## [0.6.0] - 2026-09-27` (the hand-written entries). It fails when the entry is missing or empty.
- `publish-release.yml`, on a push to `main` after `ci.yml` passes: `detect-changes` (now only on `main`, so a manual run on another branch stops there) reports pending changesets and whether the version is on npm. `version` runs `changesets/action/version` v2.1.2 with `pnpm changeset:version` (full history, for the commit links in the CHANGELOG; `contents` and `pull-requests: write` on that job only). `publish-tokens` runs on Node.js 24 (npm 11, which trusted publishing needs), verifies `dist/`, extracts the release notes before publishing, runs `npm publish --provenance --access public` with `id-token: write` and no token, and creates the release `v<version>` with the CHANGELOG entry as its body. The tag format `v<version>` is kept.
- Why not `changeset publish` or the combined `changesets/action`: it would publish through `pnpm publish` of pnpm 10, whose support for trusted publishing is not confirmed (pnpm's release notes describe it for pnpm 11), and it would switch the tags to `@chassis-ui/tokens@<version>`. `npm publish` keeps the tested path of the old workflow.
- `ci.yml` has a `Changeset` job, on pull requests only and not on the `changeset-release/` branch: `pnpm changeset status --since origin/<base>` after a root-only install.
- New CHANGELOG entries have the Changesets format (`## 0.7.0`, `### Minor Changes`, `- <commit>: <text>`), like `chassis-react`; the entries up to 0.6.0 keep theirs. The 0.6.0 entry (not released yet) has a line about the new release process.
- `CONTRIBUTING.md`: changesets replace the `## [Unreleased]` CHANGELOG line; a Changesets section with the bump rules (while the version is `0.x`, a breaking change is a minor bump, as 0.6.0 was, since `^0.6.0` does not take 0.7.0; a major changeset would release 1.0.0); a Releases section for the workflow and for versioning locally without the pull request. The README (layout, CI and releases), the pull request template and the CHANGELOG link to it.
- `pnpm-workspace.yaml` listed `site`, left over from Phase 27; Changesets reads the workspace, so the entry is removed. The lockfile's projects did not change.

Checked:

- `actionlint` 1.7.12 (scratchpad, checksum verified; `shellcheck` checks the `run` scripts): 0 errors. The `changesets/action/version` input `script` was checked against its `action.yml` at v2.1.2 (actionlint does not know the action).
- `pnpm changeset status --since base` on scratch branches of a clean clone: exit 0 for a change in `test/`, in the package README and CHANGELOG, in a `package.json` dev dependency (a Dependabot pull request) and in the site; exit 1 for a change in `build/`, `source/` and `dist/`; exit 0 again once an empty or a patch changeset is added. The root-only install (`--filter chassis-tokens-workspace`) installs the Changesets CLI and no package's dependencies. In the working repository, `pnpm changeset status` fails against `main`, correctly: Phases 27 and 28 changed `packages/tokens/` without a changeset.
- Version step dry run, on a scratch branch with a minor and a patch changeset: `pnpm changeset:version` removed both changesets, bumped `package.json` to 0.7.0, wrote the CHANGELOG entry above 0.6.0, set `current_version` to 0.7.0 and rebuilt `dist/`: 58 files, every changed line a header line. Prettier passes on the result, `tokens:verify` passes, and `release-notes.js` prints the entry. Running `sync-version-refs.js` again changes nothing. With only an empty changeset, the step removed it and changed nothing else.
- `npm publish --dry-run --access public` (also with `--provenance`) in `packages/tokens/` after the bump: 118 files, the same names as the Phase 23 and 27b lists.
- In the clean clone, every CI job's commands pass: `tokens:lint`, `tokens:test` (745 tests), `tokens:verify`, `tokens:verify:presets`, the full install, `lint:prettier`, `site:lint`, `check:astro` (32 files, 0 errors), `site:build` (3944 files, as before) and `check:pnpm` (no advisories with the 25 new packages). `git status --short packages/tokens/dist` is empty.

Steps for Ozgur, before pushing `main`:

1. npmjs.com → `@chassis-ui/tokens` → Settings → Trusted publishing → GitHub Actions: organization `chassis-ui`, repository `tokens`, workflow `publish-release.yml`, no environment. Do this before the first push of `main`: the publish job has no npm token, and the next push publishes 0.6.0 (not on npm yet).
2. GitHub → Settings → Actions → General → Workflow permissions: tick **Allow GitHub Actions to create and approve pull requests**. It is off (`can_approve_pull_request_reviews: false`), and the version job needs it to open the Version Packages pull request.
3. After the first release shows its provenance on npm: this repository has one secret, `NPM_TOKEN`, last used by a workflow replaced in May 2026; delete it. `NPM_CHASSIS_UI`, which the old publish step used, is an organization secret that `chassis-css` and `chassis-react` still use: do not delete it; if its repository access lists `tokens`, remove `tokens` from it.
4. Optional, after step 3: npm package settings → Publishing access → require two-factor authentication and disallow tokens, so only the trusted publisher can publish.

Notes: the Version Packages pull request is opened with the workflow token, so GitHub runs no workflow on it; merging it pushes `main`, whose run passes `ci.yml` before publishing. Versioning locally (`pnpm changeset:version`, commit, push) works without the pull request.

## Phase 30: token diff report on pull requests

Goal: a reviewer sees what a pull request does to the tokens without reading `dist/`.

- [x] `build/tokens/diff.js`: compares two `dist/` trees and reports, by platform and file, the names added, removed and changed in value, and a removed and an added name with the same value in the same file as a possible rename. It marks removed and renamed names as breaking.
- [x] CI: build the base branch's `dist/` into a scratch folder, run the diff against the pull request's `dist/`, and write the report as the job summary (and as a pull request comment, if approved). Done without a build; see the Result.
- [x] Tests on real `dist/` fixtures.
- [x] Acceptance: run on real commits of this branch, the report shows: for the `headers-gap` rename, one possible rename in each of the 6 small-screen files; for Phase 22, 3168 added iOS lines and nothing else; for Phase 14, value changes on weight lines only. A pull request with no token change reports nothing.

Result: `packages/tokens/build/diff.js` writes a Markdown report of the token changes between two `dist/` trees, and CI writes it to the job summary of every pull request.

- It reads each declaration file into an ordered map of name to printed value: SCSS `$name: value !default;`, Swift `static let Name = value` (also the `@objc` class form before Phase 17), and Android `<type name="…" …>value</type>`, whose value keeps the element and attributes (`<integer>400`), so a changed resource type is a changed value. Header lines are not declarations, so a rebuild that only changes them reports nothing. Files without declarations (the Android drawables and the Xcode asset catalog, 56 files) are compared whole: added, removed (breaking) or changed.
- Per file it lists names added, removed and changed, and pairs a removed and an added name with the same value as a possible rename, in file order when several share a value. The report has a summary line, a "Breaking" line when names or files are removed or renamed, a table per file, an asset table, and a collapsed list per file with at most 25 names per category ("…and N more").
- `--base` and `--head` take a directory or a git ref (default: `main` and the package's `dist/`). A ref is read with `git archive` from `packages/tokens/dist/`, or from `dist/` for commits before Phase 27. Scripts: `diff` in the package, `tokens:diff` at the root.
- CI (`Token diff` in `ci.yml`, pull requests only): the base side is the committed `dist/` of the first parent of GitHub's test merge commit, and the head side the merge commit's own `dist/`. Instead of building the base branch as the phase said: the Tokens job already checks that the committed `dist/` equals a fresh build on both sides, so reading it gives the same report without installing or building (the job checks out two commits and runs Node.js only). When a pull request changes `source/` without rebuilding `dist/`, the report shows nothing and the Tokens job fails.
- Job summary only, as decided; no pull request comment and no write permission.
- With no change, the report is its heading and one line, "No token changes in `dist/`.", so the summary says the check ran.
- Documented in the README (a Token diff report section and the CI list), `CONTRIBUTING.md` (step 1 of changing tokens), the test README and the 0.6.0 CHANGELOG entry.

Checked:

- Real commits (reading `dist/` of each commit and its parent): 16a5317 reports 6 possible renames, one in each small-screen file (`number-small.scss`, `NumberSmall.swift`, `number_small.xml`, for both brands), and nothing else. Phase 22 (ae959f4) reports 3168 added names in 8 iOS files and nothing else. Phase 14 (d398fcd) reports 1680 changed values, all on names that contain `weight` (`<string>regular` → `<integer>400`, `"regular"` → `UIFont.Weight.regular`), and nothing else. `dist/` against `main` and a commit against itself report no change. Also Phase 21: 56 added asset files; Phase 17: `Main.swift` as a removed file and `ChassisTokens.swift` as an added one.
- Since v0.5.3: 88 possible renames per colour file are the gradient constants of Phase 15, whose value (the first stop colour) moved to `…_stop_1_color`, so pairing them is right.
- `test/diff.test.js`, 16 tests on the committed `dist/`: every declaration of every `dist/` file is read (counted as `verify.js` counts names), the 56 asset files, and the changes of the real commits recreated on copies of `dist/` (the rename, the Phase 14 weights, the Phase 22 radii, removed names and files, icon assets, a header-only rebuild).
- The CI job's command in a clone of depth 2 without `node_modules`, at a `--no-ff` merge commit like GitHub's: a pull request that renamed a token in `source/` and changed its value, rebuilt with `pnpm tokens`, reported 8 removed and 8 added names in the 8 small-screen files and ignored the 50 files whose headers alone changed; a pull request that changed the README and rebuilt `dist/` (59 files) reported no token change.
- `actionlint` passes; `tokens:lint`, `tokens:test` (761 tests), `tokens:verify`, `tokens:verify:presets` and Prettier pass; `dist/` is unchanged.

Known limit: a renamed file shows as a removed and an added file, with all its names; renames are paired within a file only, as the phase asked.

## Phase 31: token source lint

Goal: mistakes in `tokens/` fail before a build, with a message that names the token set and the token.

- [ ] `build/tokens/lint-tokens.js` and `pnpm tokens:lint:source`, run in CI. Rules, as decided below:
  - the sets of one group (themes, screens) declare the same names; the `headers-gap` mistake would have failed here
  - names use the case and characters the platforms need
  - every font weight name is one that `fontWeightNumber` knows
  - every token has a type
  - no two sets of one list declare the same name with different types
- [ ] Tests with fixtures copied from `tokens/`, and one broken fixture per rule.
- [ ] Acceptance: passes on `tokens/`; each rule fails on its broken fixture; putting `headers-gap` back into the small screen set of a scratch copy fails with the set and token named.

## Phase 32: type checking of the build code

Goal: type errors in `build/` fail CI.

- [ ] A `tsconfig.json` for `build/` with `allowJs`, `checkJs` and `noEmit`, at the strictness decided below; `pnpm tokens:typecheck`, run in CI.
- [ ] Fix what it reports with JSDoc types, using the types Style Dictionary ships. No behaviour change.
- [ ] Acceptance: `pnpm tokens:typecheck` passes; the usual `dist/` and test checks; the Result lists the kinds of errors found and any that were real bugs.

## Phase 33: native compile checks in CI

Goal: CI compiles the iOS and Android output against the real SDKs, which this machine cannot do.

- [ ] iOS job on a macOS runner with Xcode: type-check every Swift file of `dist/ios/` and of the `ios-swiftui` and `ios-references` baselines against the iOS simulator SDK (real UIKit and SwiftUI); compile each `Icons.xcassets` with `actool`; build the guide's `Package.swift` example.
- [ ] Android job: a small Gradle project under `build/native/android/` that compiles the `res/` tree and the `android-compose` baseline against the real Android SDK and Compose, and links the drawables against `android.jar`. Dependencies are pinned; Gradle caches in CI.
- [ ] Both jobs run on pull requests that change `tokens/`, `build/` or `dist/`, as decided below.
- [ ] Acceptance: `actionlint` passes; the Android job runs locally if the SDK is downloaded with approval, else its first CI run is the check; the macOS job's first CI run is the check. Both are recorded in the next session log. A deliberately broken Swift and XML file fails each job on a scratch branch.

## Phase 34: Swift package and Android library (optional)

Goal: mobile apps install the tokens with their package manager instead of copying files.

- [ ] iOS: a `Package.swift` at the repository root (Swift Package Manager reads only the root), with one library product per app and brand, as decided below, pointing at `dist/ios/<app>/<brand>/`, with the asset catalog as a resource. Apps depend on a git tag.
- [ ] Android: a library module that packages the `res/` tree (and the Compose objects, if selected) as an AAR, published where decided below.
- [ ] Update the iOS and Android guides with the install steps.
- [ ] Acceptance: in CI (Phase 33's jobs), a sample app target resolves the Swift package and reads a token; a sample Gradle app depends on the AAR and reads a resource. `swift package describe` passes locally.

## Phase 35: retire the plan

Goal: the repository keeps what a contributor needs from this plan and drops the session protocol.

- [ ] Write `docs/architecture.md`: the design decisions, the output contract, the platform rules and the known oddities, updated to the final code. Link it from `CONTRIBUTING.md` and the README.
- [ ] Delete `docs/rewrite-plan.md` (git history keeps it), or move it, as decided below.
- [ ] Acceptance: every fact in `docs/architecture.md` matches the code and `dist/`; every link resolves; Prettier passes.

## Known oddities in the output (kept as they are)

These are part of the frozen contract. They are listed so nobody "fixes" them by accident. Added 2026-09-27: Phases 13 to 16 change the letter spacing, line height, font weight and gradient items and remove the dead filter condition, each only after Ozgur approves it in Open decisions.

- Fixed in Phase 13: Android letter spacing printed its number in design pixels (`-0.5`), and a `125%` line height printed as `CGFloat(125)` on iOS and `125sp` on Android.
- Fixed in Phase 14: font weight on iOS and Android was a name string such as `"bold"`.
- Android asset tokens hold SVG markup inside `<string>`. It was raw markup, which aapt2 dropped, so the icons compiled to empty strings; since 2026-09-27 it is escaped and compiles to the SVG text.
- Fixed in Phase 15: the 88 `gradient.primitive.*` tokens are typed `color` with `linear-gradient(…)` values. Web prints the gradient. iOS and Android printed only its first colour stop, because tinycolor parses the gradient string leniently: `linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, #000000 100%)` becomes `UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 0)` and `#00000000`.
- Removed in Phase 16: the `path[1] == dimension` filter condition, which matched nothing. `dimension.base.*` is emitted, as before.

## Risks

| Risk                                                             | Plan                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| An encoder differs from the template in rounding or branch order | Golden diff after every phase; fixtures cover every branch          |
| SD 5 changes reference or math behaviour                         | Phase 4 is isolated, so a red diff has one cause                    |
| Token order changes with the new build loop                      | Phase 6 keeps the current set order; strict diff catches any change |
| `@chassis-ui/css` fails on duplicate `$cx-*` names               | Harness checks uniqueness; Phase 6 runs the site build              |

## Open decisions for Ozgur

- [x] Branch is `dev/rewrite` (confirmed 2026-09-27).
- [x] Token JSON and output do not change (confirmed 2026-09-27).
- [x] Phase 5: do it (confirmed 2026-09-27).
- [x] The site documentation describes code that no longer exists, and `site/` is frozen. `site/content/docs/getting-started/style-dictionary.mdx` mentions Node 18, px and vw units, the `cx/scss-variables` format, the `cx/size/px`, `cx/size/vw` and `cx/typography/web` transforms and the `cx/colorTokens` filter. `site/content/docs/use-in-project/web-applications.mdx` says the SCSS supports rem, px and vw units. Update these pages, or leave them? Update them (confirmed 2026-09-27; done in Phase 7).

Added 2026-09-27 for the presets. Ozgur confirmed all six on 2026-09-27.

- [x] Restore the presets in the new structure (Phases 8 to 11), not by copying the old files back from `main`. The old `scss-variables` template is 320 lines of value logic, which is what this rewrite removed.
- [x] SCSS output, resolved and with references: identical to the old build, line for line, apart from the next item.
- [x] `web-px` letter spacing: divide by 16, as the rem and vw presets do (`-0.0313em`). The old build printed the pixel number with `em` (`-0.5em`), which is 48 px of negative spacing on a 96 px heading.
- [x] Android references: print a reference only when it is safe. This turns 18 lines that do not compile and 30 lines with another value into literals.
- [x] Add a ready-made preset for rem with SCSS variables (`web-scss`), which the old build did not have.
- [x] Update the site docs again in Phase 11.

Added 2026-09-27 for Phase 12, iOS references. Ozgur confirmed all three on 2026-09-27.

- [x] Base colours: print values for `color.base.*`, as the Android rule does (`Main.swift`: 3745 names), or let them name other base colours where the value check allows it (4460 names)? The Android rule, so both platforms follow one rule and the docs describe it once.
- [x] Reference form: the bare name (`= DimensionBase4`), which works with any `className`, or qualified (`= ChassisTokens.DimensionBase4`)? The bare name.
- [x] Update `README.md`, `CHANGELOG.md` and the two site pages in Phase 12, with the same exception to the frozen `site/` folder as Phases 7 and 11? Yes.

Added 2026-09-27 for Phases 13 to 22. Ozgur confirmed all recommendations on 2026-09-27, except the Tokens Studio spelling in Phase 14.

- [x] Phase 13, line height: a percentage becomes points and `sp` (the font size times the percentage; recommended), or a separate multiplier part (`…LineHeightMultiple = 1.25`) next to the absolute ones? Points and `sp`.
- [x] Phase 13, Android letter spacing: ems for typography parts, rounded to four decimals as the web rounds (recommended), and the standalone scale stays in px? Yes.
- [x] Phase 14, iOS weight type: `UIFont.Weight.semibold` (recommended; the constant's type changes from `String`), or a `CGFloat` weight (`600`)? `UIFont.Weight`. The source spelling stays as it is: Ozgur pointed out that it is the style name of each font in Figma (Inter `Semi Bold`, Archivo Narrow, Raleway, DM Sans and Source Serif 4 `SemiBold`), and a name that does not match breaks the font in Figma. The map ignores spaces, hyphens and case, so both spellings become `600`.
- [x] Phase 15, gradients: expand into parts (recommended), or leave gradient tokens out of the iOS and Android files? Parts.
- [x] Phase 17, type names: `ChassisTokens` for the main file and `ChassisTokens<File>` for the others (`ChassisTokensColorLight`, `ChassisTokensNumberLarge`, `ChassisTokensString`; recommended), or one `ChassisTokens` type split with `extension` across files, which only works when a target holds one theme and one screen? `ChassisTokens<File>`.
- [x] Phase 17, main file name: `ChassisTokens.swift` (recommended), or another name? `ChassisTokens.swift`.
- [x] Phase 17, type kind: a caseless `public enum` without `@objc` (recommended, the Swift way to group constants), or `public final class …: NSObject` with `@objc`, which makes the constants visible to Objective-C? The enum.
- [x] Phase 18: keep `ColorLight.swift` and `ColorDark.swift` next to the new dynamic file (recommended for one release, so apps can move over), or replace them? Keep them for one release.
- [x] Phase 19, qualifiers: a map in `chassis.build`, such as `"android": { "screens": { "small": "", "medium": "sw600dp", "large": "sw840dp" } }`, with the smallest screen in the default folder (recommended)? Yes.
- [x] Phase 19, base colours: in `res/values/color_base.xml` (recommended), or left out of the tree, since context colours hold resolved values? `color_base.xml`.
- [x] Phase 19: keep the flat files next to `res/` for one release (recommended), or replace them? Keep them for one release.
- [x] Phases 20 to 22: do them, or drop them? Do them.
- [x] Phase 20: download `kotlinc` into the session scratchpad to compile the Compose output? Yes.
- [x] Phase 21, Android converter: add the `svg2vectordrawable` npm package as a dev dependency (recommended), or write a converter for the subset of SVG the icons use? `svg2vectordrawable`.

Added 2026-09-27 for Phases 23 to 35. Ozgur confirmed all recommendations on 2026-09-27.

- [x] Order: merge after Phase 25, then do Phases 27 to 35 on `dev/production` (recommended, so `main` stops lagging 37 commits behind), or do every phase on `dev/rewrite` and merge last? Merge after Phase 25.
- [x] Phase 23, package contents: publish all of `dist/` (recommended; 114 files, about 750 kB gzipped instead of 103 kB), or keep the web files only and say so in the iOS and Android guides? All of `dist/`.
- [x] Phase 23, `exports`: `{ "./dist/*": "./dist/*", "./package.json": "./package.json" }` (recommended; every current path keeps working and nothing outside `dist/` resolves), or no `exports` field? That map.
- [x] Phase 23, description: "Design tokens for the Chassis Design System, built from Tokens Studio into SCSS, Swift, SwiftUI, Android resources and Jetpack Compose" (recommended), or other text? That text.
- [x] Phase 23: remove `site:lint:vnu`, `build/vnu-jar.js` and `vnu-jar` (recommended; `html-validate` replaced them)? Remove them.
- [x] Phase 23: remove `tokens:zip` and `build/zip-tokens.js` (recommended; nothing runs it and the npm tarball and GitHub release already hold the files), or keep it? Remove them.
- [x] Phase 24: format the 6 homepage components in the frozen `site/` folder with Prettier (formatting only)? Recommended: yes. Yes; Ozgur formatted them on 2026-09-27, committed as `style(site): format the homepage components with Prettier`.
- [x] Phase 24: update the site dependencies to clear the audit, including Astro, and ignore only advisories with no fix, each with a reason? Recommended: yes. Yes.
- [x] Phase 25, Node versions: the `tokens` job on Node 22 and 24, the other jobs on 22 (recommended)? Yes.
- [x] Phase 25, action versions: pin each action to a commit SHA with the version in a comment, updated by Dependabot (recommended), or use version tags? Pin to commit SHAs.
- [x] Phase 25, dependency updates: Dependabot, weekly, one grouped pull request for dev dependencies and one for actions (recommended), or Renovate? Dependabot, weekly, grouped.
- [x] Phase 26, version: 0.6.0 (recommended; under 1.0 a minor version marks breaking changes), or 1.0.0? 0.6.0.
- [x] Phase 26, merge: a merge commit that keeps the phase commits (recommended; each is one checked step), or a squash? A merge commit.
- [x] Phase 26: rebuild `dist/` so the file headers show the new version (only header lines change)? Recommended: yes. Yes.
- [x] Phase 27: do the workspace split (recommended), or drop the phase? Do it.
- [x] Phase 28, code of conduct: Contributor Covenant 2.1 (recommended)? Security reports: GitHub private vulnerability reporting (recommended; no email address in the repository), or an email address? Contributor Covenant 2.1 and GitHub private vulnerability reporting.
- [x] Phase 28, `CODEOWNERS`: Ozgur for everything, or other owners for `tokens/` and `site/`? Ozgur for everything (no other owner was named; the recommendations did not cover this one, so Phase 28 confirms it before writing the file).
- [x] Phase 29, release tool: Changesets (recommended; versions and CHANGELOG entries come from pull requests, and it fits one package), or release-please (versions from conventional commit messages)? Changesets.
- [x] Phase 29: remove `change-version.js` once the version step writes `site/config.yml` (recommended)? Yes.
- [x] Phase 30, where the diff appears: the job summary only (recommended; needs no write permission and works for pull requests from forks), or also a pull request comment? The job summary only.
- [x] Phase 31, rules: all five listed in the phase, as errors (recommended), or some as warnings? All five, as errors.
- [x] Phase 32, strictness: `checkJs` without `strict` first (recommended), then `strict` in a later phase, or `strict` at once? `checkJs` without `strict` first.
- [x] Phase 33, when the native jobs run: only on pull requests that change `tokens/`, `build/` or `dist/`, and on `main` (recommended; macOS minutes cost ten times Linux minutes), or on every pull request? Only when those folders change, and on `main`.
- [x] Phase 34: do it, or drop it? If done: which app and brand pairs become Swift products (recommended: every pair in `chassis.build.apps` with an iOS platform), and where the AAR is published (GitHub Packages, Maven Central, or no AAR and only the Swift package)? Do it: every app and brand pair with an iOS platform becomes a Swift product. The AAR has no recommended destination yet; Phase 34 asks before publishing it.
- [x] Phase 35: delete `docs/rewrite-plan.md` after writing `docs/architecture.md` (recommended), or move it to `docs/history/`? Delete it.

## Session log

Append-only.

- 2026-09-27 (planning): Reviewed the plan of 2026-09-22 against the code, `dist/` and the published library versions. Found that per-platform `source` lists do not exist in Style Dictionary, that platform encoding cannot run as a value transform, and several stale facts. Rewrote the plan from scratch with template logic as the first priority. Proved the encoder approach with an iOS prototype (14 files identical to `dist/`) and confirmed the transform approach fails. Ozgur confirmed the branch and that output is frozen, so the output-change phase was removed. Next: Phase 0.
- 2026-09-27 (Phase 0, Opus 5.5): Added `build/tokens/verify.js`, `build/tokens/test/golden.test.js`, the `tokens:verify` script, `--out` on the build (threaded through `config/index.js` into every platform config as an `outDir` argument, default `dist`) and `dist-next` in `.gitignore`. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 100 tests (99 existing plus the golden test); `dist/` untouched. Negative checks: a changed value, a deleted file, an extra file and a duplicate XML name were each reported and failed the run; `--out dist`, `--out .` and `--out ./dist/` were refused. No new lint warnings; the two existing ones (unused `join` in `build.js`, unused function in `scss-variables.template.js`) are left for Phase 6. Surprise: `pnpm tokens:test` now takes about 21 s because the golden test runs the full build. Next: Phase 1.
- 2026-09-27 (Phase 1, Opus 5.5): Added `build/tokens/values/{shared,ios,android}.js`; the Swift and XML templates now only print. Removed the dead Android `@` reference branch, the unused `file.resourceType` / `file.resourceMap` overrides (no config sets them), the empty gradient blocks and the iOS `token.$value` overwrite. Added `values-ios.test.js` and `values-android.test.js` (56 tests) with a fixture of real resolved tokens. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 156 tests; no new lint warnings. Injected three regressions (colour rounding, a dropped `sp` rule, the old `$value` overwrite); each failed the intended test. Surprises: (1) gradient colour tokens print their first colour stop on mobile, a tinycolor quirk now recorded under Known oddities; the unparseable-colour fallback (warn, print raw) is still unused by current tokens and was kept unchanged. (2) One diagnostic `build.js` run without `--out` rewrote the timestamp line of six `dist/ios` files; only timestamps changed, the files were restored with `git checkout`, and a ground rule now forbids building into `dist/`. Next: Phase 2.
- 2026-09-27 (Phase 2, Opus 5.5): Added `build/tokens/values/web.js`. The SCSS template now calls `encode` for line height, letter spacing, assets and pass-through values, and `typographyMap` / `percentToEm` for typography maps; it keeps only the `var(--…)` policy and its reference resolution (250 to 211 lines). `cx/size/rem` and `cx/shadow/web` now call `remSize` / `cssShadow`. Removed `cx/typography/web` from the web config after the golden diff showed its output is never read. Added `values-web.test.js` (27 tests) with a fixture of real resolved tokens; shadow and rem inputs were captured from builds without those transforms, and every expected value matches `dist/`. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 183 tests; no new lint warnings; `dist/` untouched. Injected five regressions (line-height rounding, typography key order, dropped `inset`, rem rounding, wrong font-size path); each failed the intended tests. Surprise: jumbo's `-0.0313em` letter spacing comes from `size.unit.nd05`, rounded by `ts/resolveMath`, while `dimension.base.nd05` prints `-0.03125rem`; both are covered. Next: Phase 3.
- 2026-09-27 (Phase 3, Fable 5.1): Added `build/tokens/css-var-policy.js`; the SCSS template now prints one line per token through `webValue` and holds no policy (211 to 43 lines). The chain follow is a loop bounded by `MAX_HOPS = 1` that throws on a cycle. Removed `getFontWeight`, `getFontStyle` and `fontWeightMap` from `utils.js` with their 11 tests, and moved `abbreviateScale` and `scaleAbbreviations` from `utils.js` to the policy module with their tests. Added `css-var-policy.test.js` (129 tests) and a fixture of real tokens. Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 299 tests; no new lint warnings; `dist/` untouched. Injected twelve regressions (missing abbreviation, four dropped exceptions, two hops, follow across groups, typography naming, percent line height, dropped literal fallback, no cycle check); each failed the intended tests. Surprises: (1) six of the ten table rows and the whole `borderWidth` follow are not reached by any current token, so their tests use constructed references. (2) The plan expected `splitReference` and `isReference` to become unused, but the dead `scss-variables.template.js` imports them; they stay until Phase 6. (3) Four unreachable cases that printed broken text now throw (see the Phase 3 result); this does not change any output. Next: Phase 4.
- 2026-09-27 (Phase 4, Fable 5.1): Upgraded in place to `style-dictionary` 5.5.5 and `@tokens-studio/sd-transforms` 2.0.3; added `engines.node >= 22` and an explicit `log.errors.brokenReferences: 'throw'`. Fixed the two breaks described in the Phase 4 result: the font weight path is stored as segments (`fontWeightPath`), and tokens are numbered in source order (`sourceOrder`) and sorted in the formats. Added 7 tests (`formats.test.js`, a block in `preprocessor.test.js` with source tokens copied from `tokens/`) and regenerated `css-var-tokens.json` from the SD 5.5 build; only the extension key changed in it. Build time for 36 runs: 19.7 s before, 9.5 s after (two runs each). Verified: `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 306 tests; no new lint warnings; `dist/` untouched; a scratch token with a missing reference fails the build. Compared a dump of all web tokens between SD 4.4 and SD 5.5: resolved values, printed values and lookups are identical, so math and rounding did not change. Injected three regressions (no sort, numbering before the weight split, font weight kept as a reference); each failed the intended tests, and the first and third also failed the golden check. Surprises: (1) SD 5 moves expanded tokens to the end, which the plan did not foresee. (2) The collision counts in the facts were wrong for dark runs and are corrected. (3) `pnpm add` reported two peer warnings for ESLint plugins that want ESLint 9 or lower; they exist without this change. Not checked: whether sd-transforms 2.0 splits plain `fontWeight` tokens, which is the first item of Phase 5. Next: Phase 5, which needs Ozgur's decision.
- 2026-09-27 (Phase 5, Fable 5.1): Checked sd-transforms 2.0.3: it still does not split plain `fontWeight` tokens. Rewrote `build/tokens/preprocessor.js` on the official `alignTypes` with own steps for letter spacing, font styles, `fontWeightPath` and `sourceOrder` (264 to 131 lines). Built the variant with the official `addFontStyles` as well (107 lines) and rejected it: it raised the build time from 9.5 s to 17.9 s. Extended `preprocessor-tokens.json` with real letter spacing, text and shadow tokens and added 15 tests; regenerated `css-var-tokens.json`, in which only the place of `originalType` changed. Verified: `pnpm tokens:verify` passes, 42 of 42 files, in 9.5 s; `pnpm tokens:test` passes, 321 tests; no new lint warnings; `dist/` untouched. Compared the fork and the new preprocessor on the real merged dictionaries of two token-set lists: equal, in the same key order, apart from where `originalType` is stored. Compared both on 15 font weight spellings: equal except for the empty string. Compared a dump of all web tokens before and after: identical. Injected four regressions (letter spacing as dimension, plain weights not split, style not lowercased, weight not resolved); each failed the intended tests and the golden check. Surprise: the official `addFontStyles` is about 20 times slower than the fork. The Model column says Opus for this phase; it was done with Fable because the session continued. Next: Phase 6.
- 2026-09-27 (Phase 6 split, Opus 5.5): Split Phase 6 into 6a (cleanup, version header, CI guard), 6b (build loop) and 6c (tests README, docs, final acceptance), since the items touch different files and each needs its own golden check.
- 2026-09-27 (Phase 6a, Opus 5.5): Deleted `web-px.js`, `web-vw.js`, `scss-variables.template.js`, the transforms `cx/test`, `cx/typography/web`, `cx/size/px`, `cx/size/vw`, the formats `cx/test`, `cx/scss-variables`, the unused filter `cx/colorTokens`, and `isReference` / `splitReference` from `utils.js`. The file header reads the version from `package.json`; `change-version.js` no longer rewrites `build.js`. The release workflow runs `pnpm tokens:verify` before `npm publish`. Kept `tinycolor2` (see the 6a result). Replaced the 9 mock-based tests of `filters.js` and `transforms.js` with 52 tests on real tokens and a new fixture. Verified: `pnpm tokens:verify` passes, 42 of 42 files, in 9.6 s; header lines match `dist/`; `pnpm tokens:test` passes, 364 tests; lint reports no warnings (two before); `dist/` untouched. Injected four regressions (utility colours in the theme file, fonts dropped from main, shadow transform on every type, rem transform not transitive); each failed the intended test. Surprises: (1) `cx/colorTokens` was unused and not in the plan's list. (2) `publish-release.yml` was already not Prettier-formatted before this change; left as it was. Next: Phase 6b.
- 2026-09-27 (Phase 6b, Opus 5.5): Replaced the 36-run loop with one Style Dictionary instance per token-set list: 16 instances, 24 platform exports, 42 files. `build.js` now exports `planBuilds` and `parseArgs`; the platform configs take a list of outputs; `logger.dryRun` lists builds and their files. Replaced the mock-based `build.test.js`, `cli.test.js` and `config.test.js` with tests on the real configuration, `$themes.json` and `dist/` file list, added the precedence test, and updated the dry-run tests in `logger.test.js`. Build time: 9.5 s before, 5.8 s after (three runs). Verified: `pnpm tokens:verify` passes, 42 of 42 files; `--platform ios` and `--platform web` pass; five filtered builds match `dist/` for every file they write; `pnpm tokens:test` passes, 360 tests; lint reports no warnings; `dist/` untouched. Injected five regressions (base from the last theme, one instance per output, token sets reversed, platform filter ignored, and an earlier malformed variant of the second); each failed the intended tests, and the first and third also failed the golden check. The one-instance-per-output regression passes the golden check, since output is the same, and is caught only by the plan test. Surprises: (1) `transforms.test.js` called the web config with the old signature and failed to load; fixed. (2) The old `--theme dark` build used dark token sets for number files; output is the same either way. Next: Phase 6c. Note for 6c: its acceptance runs `pnpm tokens:site`, which writes into `dist/`; restore the timestamp lines with `git checkout dist` afterwards.
- 2026-09-27 (Phase 6c, Opus 5.5): Rewrote `build/tokens/test/README.md`, updated `README.md` and added an `[Unreleased]` CHANGELOG entry. Verified: `pnpm tokens:verify` passes, 42 of 42 files, in 5.8 s; `pnpm tokens:test` passes, 360 tests; lint reports no warnings; `pnpm tokens:site` succeeds and changed only timestamp lines in `dist/`, which were restored; `pnpm astro:build` built 22 pages with no warnings. Surprises: (1) The site docs are out of date and `site/` is frozen; recorded under Open decisions. (2) Between the 6b commit and the start of this phase, the timestamp lines of all 21 `sinefil` files in `dist/` were rewritten at 03:50:51, as a `--brand sinefil` build into `dist/` would do. Content was identical. No command of this session builds into `dist/` without `--out`, two full test runs (including the one running at that time) left `dist/` untouched, and the terminal showed no command; the repository is in a Dropbox folder. The files were restored with `git checkout -- dist`, and `dist/` stayed clean through every later step. The Model column said Sonnet for this phase; it was done with Opus. All phases are done.
- 2026-09-27 (Phase 7, Opus 5.5): Ozgur approved updating the site docs. Rewrote the build parts of `style-dictionary.mdx` with examples from `dist/`, updated `quick-start.mdx` and two statements in `web-applications.mdx`, and relaxed the frozen-folder rule for this phase. Verified: the three pages pass Prettier, as before; `pnpm astro:build` built 22 pages with no warnings; the rendered Style Dictionary page contains the new sections and none of the deleted names, and its tables and code blocks render (checked in the browser); `dist/` untouched. Left for later: the `dist/css/` paths in the quick start and a full check of `web-applications.mdx`.
- 2026-09-27 (preset planning, Fable 5.1): Ozgur pointed out that the rewrite dropped the adopter presets: `web-px`, `web-vw`, the `cx/scss-variables` format and `outputReferences` for SCSS and Android. Built the old code from `main` in a scratch directory with each preset and measured the output (see Facts about the presets). The SCSS presets work, resolved and with references. The Android reference output has 18 lines that name missing resources and 30 that change the value. Added Phases 8 to 11, a design decision and six open decisions. Nothing in `build/` changed. Not committed. Next: Ozgur's answers to the open decisions, then Phase 8.
- 2026-09-27 (preset decisions): Ozgur confirmed all six open decisions. The plan was committed as `rewrite(plan): add phases 8 to 11 for the adopter presets`.
- 2026-09-27 (Phase 8, Fable 5.1): Built five baselines from `main` (`a072bf9`) with a script and committed them under `build/tokens/test/golden/`. Added the presets `web-scss`, `web-px` and `web-vw`, the transforms `cx/size/px` and `cx/size/vw`, the format `cx/scss-variables` with resolved values, `--config` on the build and `--preset` on the verifier. Renamed the SCSS template to `scss.template.js`. Added `scss-var-policy.test.js` (43 tests) with a fixture of real tokens of the three presets, and tests for the size functions, the transforms, the configurations, `--config` and the preset baselines. Verified: `pnpm tokens:verify:presets` passes, 7 of 7 files for each of the three presets; `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 445 tests; lint reports no warnings; `dist/` untouched. Injected five regressions (px letter spacing not divided, family list not quoted, vw not divided, preset format ignored, line height not relative); each failed the intended tests. Surprises: (1) only 3 lines of `web-px` have a letter spacing other than zero. (2) The plan named a `references` setting for the factory; the code uses `format`, because the old interface selects references with `options.outputReferences`, and the plan was corrected. (3) The baselines depend on `tokens/`, so a token change needs new baselines; the tests README says how. Next: Phase 9.
- 2026-09-27 (Phase 9, Opus 5.5): Moved the rules both web reference policies share into `build/tokens/reference-policy.js`; `css-var-policy.js` keeps only the Chassis CSS names (330 to 141 lines). Added `outputReferences` to `scss-var-policy.js` with SCSS variable names, `references.variable` in the SCSS template, `chassis.build.options` for Style Dictionary options by platform, and the `web-px-references` check. Added `reference-policy.test.js`, reference cases in `scss-var-policy.test.js` (34 captured from the real build, 5 constructed), template tests in `formats.test.js`, `loadConfig` tests and a config test; moved the `isReference` and `referencePath` tests. Verified: `pnpm tokens:verify:presets` passes, 7 of 7 files for each of the four presets; `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 517 tests; lint reports no warnings; `dist/` untouched. Injected seven regressions (shadow in the SCSS groups, no `base.context` rule, follow naming `base.context`, font style as a value, no declared-variable check, `outputReferences` ignored, platform options not merged); each failed the intended tests. Surprises: (1) the old SCSS format named followed border radii `<group>.context.<step>`, not the `base.context` token the chain ends at, which is also what the Chassis CSS names mean; this became the shared `referenceTarget`. (2) The target of a SCSS reference is usually in another file (`color-<theme>.scss`, `number-<screen>.scss`), which the file's own dictionary does not hold, so the variable lookup uses `dictionary.unfilteredTokens`. (3) The plan asked to read `outputReferences` in the web config factory; it is read from the platform options instead, which the old interface used and `chassis.build.options` can set. Next: Phase 10.
- 2026-09-27 (Phase 10, Opus 5.5): Added `reference(token, target)` to `values/android.js` with the two old conditions and the safe-reference rule; the Android template looks the target up in the file's tokens and prints the reference only with `outputReferences`. Added the `android-references` check and wrote the 30 approved lines into its baseline. Added the undeclared-reference check to `verify.js`. Added 19 tests in `values-android.test.js` with 12 cases captured from the real build, Android template tests in `formats.test.js`, and `verify.test.js`. Verified: all 30 changed lines equal the `dist/` lines; the 14213 references left each name an element of the same type in the same file with the same value; `pnpm tokens:verify:presets` passes for the five presets; `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 544 tests; lint reports no warnings; `dist/` untouched. Injected seven regressions (no value check, no element check, no base colour rule, no math rule, `outputReferences` ignored, undeclared check off twice); each failed the intended tests. Surprises: (1) the plan counted 48 affected lines; the 18 broken ones are among the 30 with another value, so 30 lines changed. (2) Removing the element check changes no output line, because each mismatch also changes the value. (3) Old Android references only reach tokens of the same file, because Style Dictionary gives the format the filtered tokens; this was kept, so `main.xml` colours that reference theme colours print values. Next: Phase 11.
- 2026-09-27 (Phase 11, Opus 5.5): Documented the presets in `README.md`, `site/content/docs/getting-started/style-dictionary.mdx` and `site/content/docs/use-in-project/web-applications.mdx`, and updated the `[Unreleased]` CHANGELOG entry. Measured the SCSS load order on the `web-px-references` baseline. Verified: `pnpm astro:build` built 22 pages with no warnings; the two site pages pass Prettier, as before; the built Style Dictionary page has the anchors `#presets-for-other-css-frameworks`, `#cxscss-variables`, `#cxandroid-resources`, `#cxsizepx` and `#cxsizevw`, and every link to them resolves, including the one from the web guide; `dist/` untouched. `README.md` and `CHANGELOG.md` did not pass Prettier before this phase either and were left as they were. Still open from Phase 7: the `dist/css/` paths in the quick start and a full check of `web-applications.mdx`. All phases are done.
- 2026-09-27 (after Phase 11, Opus 5.5): At Ozgur's request, replaced the `dist/css/` paths in `quick-start.mdx` with `dist/web/<app>/<brand>/` and said that the npm package holds the web SCSS files only (checked with `npm pack --dry-run`). Also corrected two statements on the same page that named CSS and JavaScript output, which the build does not produce. Verified: the page passes Prettier; `pnpm astro:build` built 22 pages with no warnings. Still open: a full check of `web-applications.mdx`.
- 2026-09-27 (after Phase 11, Opus 5.5): At Ozgur's request, checked `site/content/docs/use-in-project/web-applications.mdx` in full and rewrote it. The check compiled every SCSS example with Dart Sass 1.101 against `dist/web/docs/chassis/`: 12 of 21 failed (14 of 20 variable names did not exist), and the theme and screen examples compiled but kept the light and large values, because every variable is `!default` and `@import` shares one scope. The page also described output that does not exist (TypeScript, JavaScript, `var(--cx-…)` properties, a `$prefix` that renames variables, bundle optimizations for variables that emit no CSS) and did not say that the default output needs Chassis CSS. The new page loads the files as Sass modules with `@use` and namespaces, separates the Chassis CSS output from the presets, and covers typography maps, themes (including a `meta.module-variables` loop), screen sizes, a forwarding token layer, bundler setup, and troubleshooting, including `outputReferences` output, which needs `@import` after a colour file. Verified: all 12 SCSS blocks compile, and the 4 stated outputs equal the compiled CSS; every variable named exists in `dist/`; the three JavaScript blocks parse; the Vite `additionalData` setup was built with Vite 8.1; the page passes Prettier; `pnpm astro:build` built 22 pages with no warnings, and every link and anchor on the page resolves. Not run: the webpack, Next.js and Astro setups, which are not installed here.
- 2026-09-27 (after Phase 11, Opus 5.5): Compiled the Android output with aapt2 2.20 (from AGP 9.4.1, downloaded from Google's Maven repository with Ozgur's approval): `main.xml` and the number files failed with `invalid integer`, because 23 opacity and letter spacing values are fractions in `<integer>` elements. With Ozgur's approval, opacity and letter spacing tokens are now float resources, `<item type="dimen" format="float">`, whole values included, so that a token's resource type does not depend on its value; references to them are `@dimen/…`. `values/android.js` has `resourceKind` and `resourceTag`; the template prints the tag. `dist/android` changed in 8 files, 1736 lines, each an `<integer>` line becoming a float item with the same name and value; the `android-references` baseline changed in 868 lines the same way. `verify.js` reads the type of float items for the reference check. Verified: all Android files of both brands compile, and the qualifier layout of the Android guide and `main.xml` alone link with aapt2; `pnpm tokens:verify` passes, 42 of 42 files; all five preset baselines pass; `pnpm tokens:test` passes, 550 tests; lint reports no warnings. Removing the float rule failed 12 tests. Found and not fixed: aapt2 drops the SVG markup of the 9 Android icon strings, so they compile to empty strings; escaping the markup and apostrophes keeps it (checked with aapt2). Found in `tokens/` and not fixed: `space.website.content.header-gap` is named `headers-gap` in the small screen set.
- 2026-09-27 (after Phase 11, Opus 5.5): At Ozgur's request, checked and rewrote `ios-applications.mdx` and `android-applications.mdx`. Every token name in both guides was wrong (26 on iOS, 20 on Android: a `DesignTokens` class and `cx` prefixes that do not exist, and invented tokens), and their setups did not compile. On iOS, every generated file declares `public class ChassisTokens`, so two files in one module fail with `invalid redeclaration`; on Android, `main.xml` repeats the resources of the other files, so it cannot share a resource folder with them. The new iOS guide adds `Main.swift` alone to an app target, or gives each string, colour and number file its own module with a `Package.swift` (Swift Package Manager treats `Main.swift` as an executable entry point, so it is left out). The new Android guide copies `main.xml` alone, or the string, colour and number files into `values`, `values-night` and `values-sw…dp` folders with a script. Verified on iOS with Swift 6.4 and a stand-in for UIKit: each file compiles alone and two in one module fail; the guide's `Package.swift` validates with `swift package describe`, and the same package with a stand-in UIKit target builds and runs, reading light and dark colours and small and large sizes side by side; `Main.swift` compiles in an app with `@main`; the five snippets that use tokens type-check against the real token modules. Not compiled: SwiftUI and other UIKit calls, which need Xcode. Verified on Android with aapt2: the guide's sync script produces a layout that links (5892 resources, both brands), `main.xml` alone links, `main.xml` with a colour file fails with `has a conflicting value`, the layout XML compiles, and every resource the guide names exists with that type. Not compiled: Kotlin, Compose and Gradle. Both pages pass Prettier; `pnpm astro:build` built 22 pages with no warnings, and every link and anchor on them resolves.
- 2026-09-27 (after the guides, Opus 5.5): With Ozgur's approval, escaped Android string resources in `values/android.js` (`escapeString`), so aapt2 keeps the SVG markup of the icon tokens as text instead of dropping it. Only the 9 icon strings of each brand contain characters that need escaping, so `dist/android` changed in 36 lines (`string.xml` and `main.xml` of both brands) and the `android-references` baseline in 18. Verified with aapt2: each of the 9 icons compiles to exactly the SVG that the iOS file prints; `&`, both quotes, a backslash and a leading `@` or `?` stay literal text. `pnpm tokens:verify` passes, 42 of 42 files; all five preset baselines pass; `pnpm tokens:test` passes, 560 tests; lint reports no warnings. Removing the entity escaping, the quote escaping or the call in `encode` failed 5 to 7 tests each. Still open: `space.website.content.headers-gap` in the small screen set of `tokens/`.
- 2026-09-27 (Ozgur, committed by Opus 5.5): Ozgur renamed `space.website.content.headers-gap` to `header-gap` in `tokens/screen-website/screen-small.json` (the frozen `tokens/` folder, changed by its owner). The build changed one line in each of the 6 small-screen files of `dist/` and in each of the 5 preset baselines, the rename and nothing else. Removed the limitation from the iOS and Android guides. Verified: `pnpm tokens:verify` passes, 42 of 42 files; all five preset baselines pass; `pnpm tokens:test` passes; aapt2 links the Android qualifier layout, and every number file now declares the same names.

- 2026-09-27 (Phase 12 planning, Opus 5.5): Ozgur asked whether iOS could have `outputReferences` like Android. Built a prototype template in a scratch copy and measured it (see Facts about iOS references): 4460 of 6487 lines of `Main.swift` print a name, and all 7 files type-check with a stand-in UIKit. The value check keeps 660 lines as values that would otherwise lose an alpha or a colour modifier. Added Phase 12, a design decision, a ground rule for its baseline and three open decisions. Nothing in `build/` changed. Next: Ozgur's answers to the open decisions, then Phase 12.
- 2026-09-27 (Phase 12 decisions): Ozgur confirmed all three open decisions: the Android base colour rule, bare constant names, and the docs update with an exception to the frozen `site/` folder. The plan was committed as `rewrite(plan): add phase 12 for iOS references`. Next: Phase 12.
- 2026-09-27 (Phase 12, Opus 5.5): Added `reference(token, target)` to `values/ios.js`, with the Android rule: same file, no base colours, no math on sizes, same encoded Swift text. Moved the shared conditions into `values/shared.js` and the target lookup into `templates/references.js`; the Android output did not change. The iOS format reads `outputReferences` from the platform options. Extended the undeclared-reference check of `verify.js` to Swift. Wrote the `ios-references` baseline with the new code and accepted it after a line-by-line comparison with `dist/ios/demo/chassis/`, a type check of all 7 files and a run-time comparison of 12378 constants. Added 9 real cases to `mobile-tokens.json` (`iosReferences`), 17 tests in `values-ios.test.js`, 2 template tests in `formats.test.js` and 2 Swift cases in `verify.test.js`. Updated `README.md`, `CHANGELOG.md`, the tests README and the two site pages. Verified: `node build/tokens/verify.js --preset ios-references` passes; `pnpm tokens:verify:presets` passes for all six presets; `pnpm tokens:verify` passes, 42 of 42 files; `pnpm tokens:test` passes, 582 tests; lint reports no warnings; `build/tokens` passes Prettier; the two site pages pass Prettier and `pnpm astro:build` built 22 pages; `dist/` untouched. Injected five regressions (no value check, no math rule, no base colour rule, `outputReferences` ignored, Swift undeclared check off); each failed 1 to 7 tests. Surprises: (1) a real token references a target of another Swift type (`BgBlurDefaultColor` on an opacity), so that case needs no construction. (2) All modifier colours are base colours, and the math token also fails the value check, so neither rule changes a current line on its own; unit tests cover both. (3) The number files grow (`DimensionBase16` is longer than `CGFloat(16)`) while the colour files shrink. All phases are done.
- 2026-09-27 (Phases 13 to 22 planning, Opus 5.5): Ozgur asked how to fix the iOS and Android issues and oddities, then asked for them as phases. Measured the facts on `dist/` for both brands: 9 percent line heights per file, 3 Android letter spacing parts other than zero, two spellings of semi bold, 88 gradients per colour file printing their first stop, `main.xml` conflicting with 409 dark colours and 61 screen values, 1382 base colours only in `main.xml`, and no constant in the Objective-C header despite `@objc`. Added Phases 13 to 22, a ground rule for approved output changes and 14 open decisions. Nothing in `build/` or `dist/` changed. Next: Ozgur's answers, then Phase 13.
- 2026-09-27 (Phases 13 to 22 decisions, Opus 5.5): Ozgur confirmed all recommendations except making the semi bold spelling consistent in Tokens Studio: each spelling is the style name of its font in Figma, and the Phase 14 map accepts both. The check of the style names found `Light Oblique` for the `sinefil` blockquote weight, where the other brands use `Light Italic`; Source Serif 4 names its italic styles `Italic`. At Ozgur's request it was changed in `tokens/brand-sinefil/brand-base.json` and committed as `fix(tokens): use Light Italic for the sinefil blockquote weight`: 11 lines in 6 `sinefil` files of `dist/` changed from `oblique` to `italic`, nothing else; `pnpm tokens:verify`, the six preset checks and 582 tests pass. Not checked against Figma's own font list, because no Figma file was given. The plan was committed as `rewrite(plan): add phases 13 to 22 for the iOS and Android output`. Next: Phase 13.
- 2026-09-27 (Phase 13, Opus 5.5): Added `percentLineHeight` and `letterSpacingEm` to `values/shared.js`, a font size context to `encode` and `reference` of both mobile encoders, and `encodingContext` to `templates/references.js`, which the iOS and Android templates call. Rebuilt both brands into the scratchpad and copied the 16 changed files into `dist/` and the 8 changed baseline files into `golden/`; every changed line is a line height or letter spacing part (168 lines in `dist/`). Added contexts to 6 fixture cases, 9 `typographyParts` cases captured from the build, 16 tests in `values-ios.test.js` and `values-android.test.js`, and 2 template tests in `formats.test.js`. Updated the iOS and Android guides, the Style Dictionary page, the CHANGELOG and the tests README. Verified: `pnpm tokens:verify` passes, 42 of 42 files; the six preset checks pass; `pnpm tokens:test` passes, 601 tests; lint and Prettier report nothing; `swiftc` and aapt2 pass for both brands; `pnpm astro:build` built 22 pages. Injected six regressions (template drops the context, Android letter spacing in px, iOS percentage kept, three-decimal rounding, reference without context, context lookup finds nothing); each failed 1 to 7 unit tests. Surprises: (1) font size parts are `96px` in some files and `22` without a unit in others; `parseFloat` reads both. (2) A bare `> file` in zsh waits for input, which stalled a diff command; the harness moved it to the background and it was stopped. Next: Phase 14.
- 2026-09-27 (Phase 14, Opus 5.5): Replaced `fontWeightName` with `fontWeightNumber` in `values/shared.js`, which uses the web's map through `transformFontWeight` and fails on an unknown name. iOS prints `UIFont.Weight.<name>` at the nearest hundred; Android prints `<integer>` weights. Copied the 8 changed files into `dist/` and the 4 changed baseline files into `golden/`; every changed line is a weight line (1680 in `dist/`), and both spellings of semi bold give 600. Updated 5 fixture cases from `dist/`, added 19 weight tests, and updated the iOS and Android guides, the Style Dictionary page and the CHANGELOG. Verified: `pnpm tokens:verify` passes, 42 of 42 files; the six preset checks pass; `pnpm tokens:test` passes, 619 tests; lint and Prettier report nothing; `swiftc` (type check and a run-time weight check) and aapt2 pass for both brands; `pnpm astro:build` built 22 pages. Injected five regressions (Android weight as a string element, hyphen spelling not read, no unknown-name check, iOS rounding down, `thin` and `ultraLight` swapped); each failed 1 to 3 tests. Surprises: (1) no weight prints a reference, because typography parts hold the resolved weight. (2) The sd-transforms map gives `ultra black` 950, which iOS rounds to `.black`. Next: Phase 15.
- 2026-09-27 (Phase 15, Opus 5.5): Added `isGradient`, `parseLinearGradient` and `gradientParts` to `values/shared.js`, `partName` to both mobile encoders, float items for the number parts on Android, and a gradient guard in `parseColor`. The iOS and Android templates print a gradient as its parts. Copied the 8 changed colour files into `dist/` and the 4 changed baseline files into `golden/`; only gradient lines changed, and all 3520 parts equal the web gradients. Replaced the two first-stop fixture cases with a `gradients` section (two real tokens, their stop colours and the expected lines), added `values-shared.test.js` and template and part name tests (24 tests). Updated both guides with gradient examples, the Style Dictionary page, the CHANGELOG and the tests README. Verified: `pnpm tokens:verify` passes, 42 of 42 files; the six preset checks pass; `pnpm tokens:test` passes, 643 tests; lint and Prettier report nothing; `swiftc` and aapt2 pass; the iOS guide example runs; `pnpm astro:build` built 22 pages. Injected six regressions (template does not expand, angle not normalised, positions in percent, stop colours without references, Android parts as integers, no gradient guard); each failed 1 to 11 tests. Surprises: (1) the gradient sources reference colours, so the stop colours can print references, and in the old reference baselines each gradient named its first-stop colour. (2) 12 gradients have negative angles. (3) My first cross-check script dropped the angle when splitting the list, reporting every part as different; the output was right. Next: Phase 16.
- 2026-09-27 (Phase 16, Opus 5.5): Removed the `path[1] !== 'dimension'` condition from the main and number filters, after checking that no token set has a `dimension` group at `path[1]`; the filter comment now says why `dimension.base.*` is emitted. Replaced the test that kept the exclusion. Verified: `pnpm tokens:verify` passes, 42 of 42 files, with no change; the six preset checks pass; `pnpm tokens:test` passes, 643 tests; lint and Prettier report nothing; putting the condition back failed the new test. The site docs do not mention the condition, so they did not change. Next: Phase 17.
- 2026-09-27 (Phase 17, Opus 5.5): The iOS config names each file's type (`swiftFile` in `config/ios.js`) and makes the types enums; the template prints `@objc` only for classes. `Main.swift` became `ChassisTokens.swift` in `dist/` and the `ios-references` baseline, with `git mv`. Every changed line is an `@objc` prefix, a type line or the main file's name comment (41194 lines). Updated the config, build, format and verify tests and the fixture labels, and added config and template tests (638 unit tests, 646 with the golden ones). Rewrote the setup parts of the iOS guide and updated the Style Dictionary page, the introduction, the quick start, the README and the CHANGELOG. Verified: `pnpm tokens:verify` passes, 42 of 42 files; the six preset checks pass; all tests pass; lint and Prettier report nothing; all files compile in one module and as one package library, and the guide's examples compile; `pnpm astro:build` built 22 pages. Injected four regressions (always `@objc`, one type name for every file, classes again, the old main file name); each failed 1 to 8 tests. Surprises: (1) the template's default class name had no trailing space but a custom one did, so a custom `className` printed `X  {`; fixed. (2) Swift allows a module and a type both named `ChassisTokens`; `ChassisTokens.SpaceContextMedium` resolves to the type, which the package check confirmed. Next: Phase 18.
- 2026-09-27 (Phase 18, Opus 5.5): Split the iOS template into `swiftConstants` and `swiftFile`, added `theme-colors.js` (collect, combine, write), the `theme` mark on the iOS colour files, the collection in the iOS format, `planThemeColors` and the write step in `build.js`, and the extra files in the dry run. Added `Color.swift` to `dist/` for both brands and to the `ios-references` baseline; nothing else changed. Added a `themeColors` fixture (real light and dark constants), `theme-colors.test.js` and plan tests; `golden.test.js` expects 8 files for `ios-references`. Updated the iOS guide, the Style Dictionary page, the README, the CHANGELOG and the tests README. Verified: `pnpm tokens:verify` passes, 44 of 44 files; the six preset checks pass; `pnpm tokens:test` passes, 658 tests; lint and Prettier report nothing; the run-time check above passes for 1533 colours per build; the package and the guide's examples compile; `pnpm astro:build` built 22 pages. Injected five regressions (same constants printed as values, no name check, light and dark swapped, the plan ignoring the themes, the format not collecting); each failed 1 to 3 tests, the last one only in the golden test. Surprises: (1) no current token names a constant in one theme but a value in the other, so that rule is tested on a constructed variant of a real pair. (2) The first run-time check of the references build covered only the 704 constants that print a `UIColor` directly; it was repeated with all 1533 colour names. Next: Phase 19.
- 2026-09-27 (Phase 19, Fable 5.1 per the Model column; done with Opus 5.5): Added the resource tree to `config/android.js` (`screenQualifiers`, `DEFAULT_SCREEN_QUALIFIERS`, `resourceFile`), the `cx/baseColorTokens` filter, the screen folder check in `loadConfig`, and `themes` and `screens` on each planned build. Copied the 14 new files into `dist/` and 7 into the `android-references` baseline; no existing file changed. Updated the config, build, filter and golden tests, and added tree, qualifier and `loadConfig` tests (666 tests). Rewrote the setup of the Android guide and updated the Style Dictionary page, the README and the CHANGELOG. Verified: `pnpm tokens:verify` passes, 58 of 58 files; the six preset checks pass; all tests pass; lint and Prettier report nothing; aapt2 links both trees as built and the references tree; `pnpm astro:build` built 22 pages. Injected six regressions (dark colours in the default folder, numbers ignoring the qualifiers, no base colours, no default folder check, `options.android.screens` ignored, the base colour filter taking all colours); each failed 1 to 19 tests. Surprise: the tree files equal the flat files byte for byte apart from the timestamp, because the Android format prints no file name. Next: Phase 20, which needs `kotlinc` downloaded to the scratchpad (approved in Open decisions).
- 2026-09-27 (Phase 20, Opus 5.5): Added `values/swiftui.js`, `values/compose.js`, `templates/constants.js`, `templates/compose-object.template.js`, the formats `cx/swiftui` and `cx/compose-object`, the configs `ios-swiftui.js` and `android-compose.js`, and `swiftConfig` in `config/ios.js`; exported `colorChannels` and `fontWeightConstant` from `values/ios.js` and `encodeValue` from `values/android.js`. Downloaded `kotlinc` 2.4.20 to the scratchpad. Added two baselines and 65 tests (`values-swiftui.test.js`, `values-compose.test.js`, template, config and golden tests). Documented the presets in the README, the Style Dictionary page, both guides and the CHANGELOG. Verified: `pnpm tokens:verify` passes, 58 of 58 files, unchanged; 8 preset checks pass; `pnpm tokens:test` passes, 731 tests; lint and Prettier report nothing; the value comparison and compile checks above pass; `pnpm astro:build` built 22 pages and the new anchors resolve. Injected six regressions (SwiftUI `alpha:`, `UIFont.Weight` in SwiftUI, stored Compose properties, negatives without parentheses, letter spacing as `Float`, no `$` escape); each failed 1 to 5 tests. Surprises: (1) the SwiftUI files first lacked `public`, because only the UIKit format called `setSwiftFileProperties`; the config now sets it. (2) The 64 KB reason for getters did not hold (51411 bytes); the forward references are the reason that does. (3) A stored-property check first compiled unchanged code, because macOS `sed` has no `\w`; it was redone with `perl`. Next: Phase 21, which adds `svg2vectordrawable` as a dev dependency (approved in Open decisions).
- 2026-09-27 (Phase 21, Opus 5.5): Added `svg2vectordrawable` 2.9.1 as a dev dependency, `build/tokens/icons.js` with the actions `cx/ios-icons` and `cx/android-icons`, and the actions in the iOS and Android configs for the main file's build. Copied the 56 new files into `dist/` and the icons into the two reference baselines. Added `icons.test.js` and icon checks in `build.test.js`; `golden.test.js` expects 27 and 23 files for the reference presets. Documented the icons in both guides, the Style Dictionary page, the README, the CHANGELOG and the tests README, and changed the guide's `Package.swift` to exclude the catalog. Verified: `pnpm tokens:verify` passes, 114 of 114 files; 8 preset checks pass; `pnpm tokens:test` passes, 739 tests; lint and Prettier report nothing; the image set, drawable, rendering and aapt2 checks above; `pnpm astro:build` built 22 pages. Injected five regressions (no black fill, two decimals, no template rendering, icons in every iOS build, every asset taken as an icon); each failed a test. Surprises: (1) the converter's defaults drop the fill and round to two decimals; (2) linking drawables needs `android.jar`, unlike values; (3) an asset catalog in a SwiftPM target folder needs Xcode even when not declared. Next: Phase 22.
- 2026-09-27 (Phase 22, Opus 5.5): Added `derivedConstants` to `values/ios.js` (the `…Radius` of a box shadow blur) and its hook in `templates/constants.js`. Measured that Core Animation multiplies the colour's alpha by `shadowOpacity` and that 271 shadow colours change alpha in dark mode, so `…Opacity` and `…OpaqueColor` were dropped from the phase. Copied the 8 changed files into `dist/` and 4 into the `ios-references` baseline; only `Radius` lines were added (3168). Added a `shadowParts` fixture (three real parts with their Tokens Studio extensions) and 6 tests. Rewrote the iOS guide's shadow section and updated the Style Dictionary page and the CHANGELOG. Verified: `pnpm tokens:verify` passes, 114 of 114 files; 8 preset checks pass; `pnpm tokens:test` passes, 745 tests; lint and Prettier report nothing; the Swift files type-check and the guide's example runs; `pnpm astro:build` built 22 pages. Injected three regressions (radius equal to the blur, a radius for every blur, the template dropping derived constants); each failed 1 to 4 tests. Surprises: (1) the `bg-blur` tokens are box shadows in Tokens Studio, so they get a radius too. (2) The opacity parts the plan asked for would have been redundant and could not follow dark mode. All phases are done.
- 2026-09-27 (Phases 23 to 35 planning, Opus 5.5): Ozgur asked what the package lacks to be production-ready and contributor-friendly, then asked for the answer as phases. Measured the repository (see Facts about the repository): the npm package holds 37 files and no iOS or Android output; no workflow runs on a pull request; `pnpm check` cannot fail; `site:lint` fails on 6 files; `pnpm audit` reports 39 advisories, 1 critical in Astro; about 31 of 53 dev dependencies serve only the site. Added Phases 23 to 35, a ground rule for them and 25 open decisions. Nothing in `build/`, `dist/`, `tokens/` or `site/` changed. Next: Ozgur's answers, then Phase 23.
- 2026-09-27 (Phases 23 to 35 decisions): Ozgur confirmed all recommendations. `CODEOWNERS` had no recommendation; the plan assumes Ozgur for everything and Phase 28 confirms it. Phase 34's AAR destination had no recommendation; Phase 34 asks before publishing. Ozgur formatted the 6 homepage components with Prettier (class attributes joined onto one line, nothing else); `pnpm site:lint` passes, and that item of Phase 24 is ticked. The plan was committed as `rewrite(plan): add phases 23 to 35 for production readiness`. Next: Phase 23.
- 2026-09-27 (Phase 23, Opus 5.5): Set `files` to all of `dist/` plus `CHANGELOG.md`, added the `exports` map and the new description, made `check` sequential with `&&`, and removed the vnu, zip and lockfile-lint scripts, files and dependencies. Updated the quick start, the iOS and Android guides, the README overview and the CHANGELOG. Verified: the packed file list equals `git ls-files dist` plus four files; the consumer check above (Sass `pkg:` importer, load path, Node resolution, blocked path); `pnpm check` fails and passes as it should; `pnpm tokens:verify`, the 8 preset checks, 745 tests, lint, `site:lint` and `astro:build` (22 pages) pass; `dist/` untouched. Surprises: (1) the tarball grows to 691.6 kB packed, below the plan's estimate of about 750 kB. (2) Removing `lockfile-lint` also removed 2 of the 39 audit advisories. (3) `pnpm check` now fails on the audit until Phase 24. Next: Phase 24.
- 2026-09-27 (Phase 24, Opus 5.5 per session; the Model column says Sonnet): Formatted six files with Prettier and ignored `pnpm-lock.yaml`; updated the dev dependencies within their ranges except the four build packages, then `qs` alone; pinned `@chassis-ui/css` and `@chassis-ui/docs` back to 0.5.0-0. Verified: `pnpm audit` clean, `pnpm check`, `site:lint`, `prettier -c .`, `pnpm tokens:verify`, 8 preset checks, 745 tests and lint pass; the site built with old and new dependencies differs only as listed in the Result; `dist/` untouched. Surprises: (1) a broad update also upgrades `@chassis-ui/css`, which changes the Chassis CSS files the site serves; it was reverted. (2) Astro 7.3 prints 17 harmless Vite warnings about `use astro:head-inject`. (3) Every advisory had a fixed version, so no ignore list was needed. Next: Phase 25.
- 2026-09-27 (Phase 25, Opus 5.5): Added `.github/workflows/ci.yml` (Tokens on Node 22 and 24, Site, Audit), `.github/dependabot.yml` and `pnpm lint:prettier`; the release calls CI first, installs with `--frozen-lockfile` and pins its actions. Downloaded `actionlint` 1.7.12 and `ajv` to the scratchpad. Verified: `actionlint` clean with shellcheck, and it fails on two injected errors; `dependabot.yml` matches the SchemaStore schema; every job's commands pass in a clean clone (Tokens on Node 22.19.0 and 24.18.0, Site with the submodule build, Audit without `node_modules`); the usual checks pass; `dist/` untouched. Surprises: (1) the planned `push` trigger on every branch would run CI twice per pull request push, so CI runs on pull requests and inside the release instead. (2) The site cannot build from a clean clone with `astro:build` alone: it needs the assets submodule built, so the Site job runs `site:build`, as Vercel does. (3) Newer majors of `checkout` and `setup-node` (v7) exist; the pins keep the majors in use. Next: Phase 26, which ends with Ozgur pushing, opening the pull request and merging.
- 2026-09-27 (Phase 26, Opus 5.5): Moved the CHANGELOG entry to 0.6.0 with a Breaking changes section, bumped the version to 0.6.0 with `change-version`, rebuilt `dist/` (header lines only, 58 files) and wrote the pull request description into the Result. Verified: every CI command passes in a clean clone on Node.js 22 and the Tokens job on 24; `npm pack` shows 0.6.0; every changed `dist/` line is a header line. Surprise: the first draft of the breaking changes used `semi-bold` weights as the example, but the example tokens printed `regular`; corrected after checking `main`. Next: Ozgur pushes, opens the pull request, merges and releases; then Phase 27 on `dev/production`.
- 2026-09-27 (after Phase 26): Ozgur asked why a pull request was needed and chose to merge locally. Merged `dev/rewrite` into `main` with `git merge --no-ff` (`588874e`, tree equal to `dev/rewrite`) after checking with `git fetch` that `main` equalled `origin/main`. Not pushed; pushing `main` is the 0.6.0 release. Created `dev/production` from `main`. The Phase 25 branch protection advice was corrected: no required pull request.
- 2026-09-27 (Phase 27, Opus 5.5): Asked Ozgur first, because the full split makes this site's layout differ from the other four Chassis repositories; Ozgur chose the full split. Moved the tokens package to `packages/tokens/` and the site's submodule, scripts and configs into `site/` with `git mv`, wrote three `package.json` files and `pnpm-workspace.yaml`, split the ESLint config, moved the Prettier Astro plugin into its override, made the site's paths relative to `site/`, pointed `change-version.js`, CI, the release and Vercel at the new folders, wrote a README for the npm package and updated the docs. Verified: the npm file names, `dist/` (309 exact renames) and the site output (3911 files) are unchanged; every CI job passes in a clean clone, the Tokens job with a tokens-only install; the dev server renders a page without errors. Surprises: (1) the site's data loader also read `./site/…`, found by the first build. (2) `astro check` type-checked the submodule's own site once it sat under `site/`, with 4 errors; `tsconfig.json` excludes `vendor`. (3) ESLint's Prettier rule looked for `.prettierignore` in `site/`, so `src/assets` was no longer ignored. (4) The root's Prettier plugin and `sass` still arrive with a tokens-only install. (5) The "View on GitHub" links were broken before the split; not fixed here. Next: Phase 28.
- 2026-09-27 (Phase 27b, Opus 5.5): Ozgur asked why `build/tokens` and `packages/tokens/tokens` were kept, why the site was not under `packages/`, and asked for sibling-package issues to be filed in their repositories. Checked `chassis-react` and `chassis-website`: both have `packages/<name>` and `packages/site` with tooling, submodule, output and lint configurations at the root. Ozgur chose `build/` + `test/`, `source/`, `packages/site` with that root layout, one root ESLint configuration, and issue drafts. Moved everything with `git mv`, restored the pre-Phase 27 root configurations with repository paths, moved the lint and tooling dependencies to the root, and updated the build paths, tests, scripts, CI comment, `change-version.js`, `vercel.json`, `.gitignore` and the docs. Verified: npm file names, `dist/`, the resolved packages, the ESLint configuration of six files (equal to before Phase 27) and the site output are unchanged; every CI job passes in a clean clone; the dev server renders without errors. Surprises: (1) `git mv` into a missing `vendor/` failed and Finder recreated `.DS_Store` files that blocked `rmdir`; both handled. (2) `.gitignore` still named `site/public`, so Prettier checked the site's generated `public/`; fixed. (3) `ls` is aliased to the long format here, which made two anchored package counts read zero; recounted with `command ls -1`. Next: the issue drafts for Ozgur, then Phase 28.
- 2026-09-27 (Phase 28, Opus 5.5): Filed the two sibling issues (chassis-ui/website#1, chassis-ui/react#41) as approved. Wrote `.github/CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md` and three Markdown issue templates with `config.yml`, following `chassis-react`, and rewrote the README on the `chassis-react` outline. Verified: links and anchors, the issue configuration schema, and every documented command in a clean clone. Surprises: (1) the siblings use Markdown issue templates, not issue forms; followed them. (2) Private vulnerability reporting is off on GitHub, though the new documents rely on it. (3) The README's `--skip-build` example failed right after a `--platform` run; fixed. Next: Phase 29.
- 2026-09-27 (Phase 29, Opus 5.5): Followed `chassis-react`'s Changesets setup (it uses Changesets 3 and `changesets/action` v2, both newer than the plan). Added the CLI, `.changeset/`, `changeset:version` with `build/sync-version-refs.js` (site version and `dist/` headers), `build/release-notes.js`, a version job and an OIDC publish with provenance in `publish-release.yml`, and a Changeset job in `ci.yml`; removed `change-version.js`; updated `CONTRIBUTING.md`, the README, the pull request template and the CHANGELOG. Verified: actionlint; nine `changeset status` cases; the version step with real and with empty changesets; `npm publish --dry-run` (118 files); every CI job's commands in a clean clone. Surprises: (1) Changesets would publish through pnpm 10, whose trusted publishing support is unconfirmed, so the publish stays `npm publish` on Node.js 24. (2) `NPM_CHASSIS_UI` is an organization secret shared with two other repositories; this repository's own secret is an unused `NPM_TOKEN`; the Result corrects the plan's step. (3) Rebuilding `dist/` on every version step would rewrite 58 timestamps for an empty changeset; it now rebuilds only when the headers name another version. (4) GitHub Actions may not create pull requests in this repository yet. Next: Phase 30.
- 2026-09-27 (Phase 30, Opus 5.5): Wrote `build/diff.js` (declarations of SCSS, Swift and Android values files, whole-file icon assets, possible renames by equal value in file order, Markdown report capped at 25 names per category), its 16 tests on the committed `dist/`, `tokens:diff`, and the `Token diff` CI job, which compares the committed `dist/` of the test merge commit and its first parent instead of building the base. Verified: the three acceptance commits, a no-change run, Phases 17 and 21, the job's command in a depth-2 clone at a simulated merge commit, and every token check. Surprises: (1) two of Phase 22's 3168 lines are `BgBlur…Radius`, not shadow radii; the test recreates both. (2) Since v0.5.3 the report pairs 88 gradient constants per colour file as possible renames; they are the Phase 15 gradient parts, so the pairing is right. Next: Phase 31.

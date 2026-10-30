# AGENTS.md

Instructions for AI coding agents working in this repository. It holds the rules an agent
breaks without being told; the docs it links to explain the rest.

## Project

Chassis Tokens builds the design tokens of the Chassis Design System from Tokens Studio files
into SCSS, Swift, SwiftUI, Android resources and Jetpack Compose, with Style Dictionary 5. It is
a pnpm workspace in the layout of `chassis-react`:

```
source/          # Tokens Studio token files
packages/
  tokens/        # @chassis-ui/tokens, published to npm, with the chassis-tokens command
    build/       # the Style Dictionary build and the command (JavaScript with JSDoc types)
    test/        # Vitest tests, fixtures, preset baselines (golden/), native checks (native/)
    dist/        # the build output, committed and published
  site/          # chassis-tokens-site, the Astro documentation site (private)
build/           # repository scripts (version references, release notes)
docs/            # architecture.md
vendor/assets    # git submodule of chassis-ui/assets
Package.swift    # written by `pnpm tokens:swift-package`
```

## Setup and commands

- Package manager: **pnpm**, with Node.js 22 or later. Do not use npm or yarn.
- Run every command from the repository root.
- `pnpm tokens` builds `dist/`; `--brand`, `--app`, `--platform`, `--theme` and `--screen`
  build a part of it, and `--dry-run` prints the plan.
- The `pnpm tokens:*` scripts run the `chassis-tokens` command (`packages/tokens/build/cli.js`)
  on this workspace. The command works on one repository of tokens: `--cwd <dir>`, by default
  the nearest folder upward whose `package.json` has a `chassis` block. Here `chassis.dist` keeps
  the output in `packages/tokens/dist/`.
- `pnpm dev` runs the site at `http://localhost:4322/tokens/`.
- `pnpm test:ci` runs every check of `.github/workflows/ci.yml` except the changeset check,
  the token diff, the dependency review and the native compiles, in one run, the site build
  included. `pnpm test` runs only the token tests.

## Before a task is done

Run the checks of the area you changed, or `pnpm test:ci` for all of them, and report the ones
that fail.

| Area changed                               | Run                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `packages/tokens/build/` or `test/`        | `pnpm tokens:lint`, `pnpm tokens:typecheck`, `pnpm tokens:test`, `pnpm tokens:verify`, `pnpm tokens:verify:presets` |
| `source/`                                  | `pnpm tokens:lint:source`, `pnpm tokens:verify:update`, `pnpm tokens:diff`, then the row above                      |
| `packages/site/`                           | `pnpm site:lint`, `pnpm check:astro`, `pnpm site:build`, `pnpm site:lint:html`                                      |
| Any Markdown, JSON or configuration file   | `pnpm lint:prettier`                                                                                                |
| `chassis.build` in the root `package.json` | `pnpm tokens`, `pnpm tokens:swift-package`                                                                          |
| `.github/workflows/ci.yml`                 | `pnpm tokens:test`: a script that a step of `ci.yml` runs is part of `test:ci` in the root `package.json`           |

## Rules

- **Never edit `packages/tokens/dist/` or the baselines in `test/golden/<preset>/` by hand.**
  They are the reference that `tokens:verify` and `tokens:verify:presets` compare a fresh build
  with. Change the source or
  the build, write both again with `pnpm tokens:verify:update`, and review the result with
  `pnpm tokens:diff` and `git diff`. The steps are in
  [CONTRIBUTING.md](.github/CONTRIBUTING.md#changing-tokens). `dist/` is built from `source/`,
  and the baselines from the copy in `test/fixtures/repository/`, which does not follow it: a
  change to `source/` leaves the baselines alone.
- **Templates only print.** Platform values (`UIColor(…)`, ARGB colors, `sp` and `dp`, quoting,
  references) come from the pure functions in `build/values/` and the reference policies, which
  run on resolved tokens. Do not encode a value in a template, and do not register an encoder
  as a Style Dictionary value transform: it breaks every token that references another.
- **Token names, file names and formats are the public API.** Renaming or removing one breaks
  the apps that use it. While the version is `0.x` this is a minor bump whose changeset says
  that it breaks.
- **The presets and `outputReferences` are features for adopters.** `web-scss`, `web-px`,
  `web-vw`, `ios-swiftui` and `android-compose` are built by no app of this repository, and
  only `test/golden/` covers them. Do not remove them as unused.
- **Keep the known oddities.** The list in
  [docs/architecture.md](docs/architecture.md#known-oddities) is part of the output contract;
  for example `Semi Bold` and `SemiBold` are both right in the source. The token collisions
  that Style Dictionary logs in every build are expected too.
- **Tests use real tokens.** Copy fixtures from `source/` and `dist/`; do not mock
  Style Dictionary. `pnpm test` needs nothing outside `packages/tokens/`: a test that reads the
  real `source/` or the root `package.json` runs only with `WORKSPACE_DIR` of `test/helpers.js`.
- **Types are JSDoc.** The build code is JavaScript checked with `checkJs`; do not convert it
  to TypeScript.
- **Add a changeset** (`pnpm changeset`) to a change in `source/`, `build/` or
  `dist/`, and an empty one (`pnpm changeset --empty`) when it releases nothing.
- **Do not install Xcode, a JDK or the Android SDK**, and do not make a local check need them.
  CI compiles the native output. Run `pnpm tokens:native:ios` and `pnpm tokens:native:android`
  only where the tools are already installed.

## Documentation

- The pages of the site are in `packages/site/content/docs/`, in the sections
  `getting-started/`, `use-in-project/` and `design-tokens/`. Shared callouts are in
  `packages/site/content/callouts/`.
- Style guide: [WRITING.md](WRITING.md). Instructive voice (no `you`, `your`, `we`, `our`) for
  the token reference pages, tutorial voice (`you` and `your` allowed) for the getting-started
  and use-in-project pages. Headings are in sentence case, under about 25 characters, each
  followed by a sentence.
- **The guide is the reference, not the existing pages.** Most pages are older than the guide
  and break its rules. Do not copy a convention from a page.
- Every token name and value in a page must exist in `source/` or
  `packages/tokens/dist/` as written. Copy generated code from `dist/`; do not retype it.
- Run `pnpm site:lint`, `pnpm site:build` and `pnpm site:lint:html` after editing
  `packages/site/`.
- The site compiles `@chassis-ui/css` against the published `@chassis-ui/tokens` pinned in its
  `package.json`, not the workspace package, so a breaking token change does not wait for a
  css release. Do not set it back to `workspace:*`. Move the pin with a css release that
  reads the new names.

## Cautions

- Work on `develop` or on a branch made from it, never on `main`. `main` holds released
  versions only. `develop` reaches it as the same commit, with `git push origin develop:main`,
  when the maintainer releases: no merge commit, nothing merged back, and the ruleset of `main`
  blocks a force push. Check the branch before the first edit of a task.
- A finished branch is merged locally into `develop`. A branch of one commit is
  fast-forwarded (`git merge --ff-only`), as in the sibling repositories; a feature of several
  commits gets a merge commit (`git merge --no-ff`). Do not open a pull request unless asked.
- Never commit, merge or push without being asked, and never merge into `main`. Pushing `main`
  starts the release workflow, which publishes `@chassis-ui/tokens` to npm when the version is
  new.
- Do not edit generated or fetched files: `_site/`, `dist-next/`, `.cache/`, `.build/`,
  `node_modules/` and `vendor/assets` (a submodule; changes belong in `chassis-ui/assets`).
- `Package.swift` and the version references are written by scripts
  (`pnpm tokens:swift-package`, `pnpm changeset:version`). Do not edit them by hand.
- `@chassis-ui/docs` and the other Chassis packages are separate repositories. Report a bug
  in one of them there; do not work around it here.
- Commits follow `<type>(<scope>): <description>`, as described in
  [CONTRIBUTING.md](.github/CONTRIBUTING.md#branch-and-commit-conventions).

## Reference docs

Read the doc of an area before working in it, rather than deriving it from the code:

- [README.md](README.md): the commands and their options, the configuration and the presets
- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md): changing tokens, the build and the site;
  changesets and releases
- [docs/architecture.md](docs/architecture.md): the design decisions, the output contract of
  every platform and the known oddities
- [packages/tokens/test/README.md](packages/tokens/test/README.md): the tests, fixtures, preset
  baselines and native compile checks
- [WRITING.md](WRITING.md): the style guide of the documentation

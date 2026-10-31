# Contributing to Chassis Tokens

Thanks for taking the time to contribute. This doc covers dev setup, conventions, and what a pull
request needs before it can be merged. For the build and test details it links to the docs that
are kept up to date, rather than repeating them.

## Dev setup

You need Node.js 22 or later and pnpm (the version in `packageManager` of the root
`package.json`; `corepack enable` picks it up).

```sh
git clone https://github.com/chassis-ui/tokens.git chassis-tokens
cd chassis-tokens
pnpm install
pnpm vendor
```

`pnpm vendor` checks out the submodules and builds the assets of the site. The tests need neither; `git submodule update --init vendor/tokens` is enough for the `tokens:*` scripts.

This repo is a pnpm workspace with two packages:

- [`packages/tokens`](../packages/tokens/) — `@chassis-ui/tokens`, the published package: the
  Style Dictionary build in `build/` and its tests in `test/`. It ships no tokens.
- [`packages/site`](../packages/site/) — `chassis-tokens-site`, the Astro documentation site. It
  is never published to npm. It takes `@chassis-ui/website-tokens` and `@chassis-ui/css` from npm at the versions in its
  `package.json`, not from `vendor/tokens`.

The token files that the build reads are in the `vendor/tokens` submodule, a checkout of
[chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens), pinned to a commit of its `main`, on which the
`pnpm tokens:*` scripts run the build of this checkout with `--cwd vendor/tokens`.

The root also holds the lint and format configurations, the repository scripts in `build/`, the
assets submodule in `vendor/assets` (the site needs it; `pnpm dev` and `pnpm site:build` check
it out at the pinned commit and build it, and `pnpm sync-submodules` moves the pin to the latest
`app/docs`) and the CI workflows. Run every command from the root.

To work on the tokens only, install the tokens package and the root's lint tools without the
site's dependencies:

```sh
pnpm install --filter @chassis-ui/tokens
```

## Branch and commit conventions

`develop` is the integration branch: branch from it, and open pull requests against it. `main`
holds released versions only; pushing it publishes to npm (see [Releases](#releases)). `staging`
is for previews of the site: a maintainer pushes `develop` to it when one is wanted, and no
workflow runs on it.

Commits follow a loose `<type>(<scope>): <description>` convention:

- **Types in use**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.
- **Scopes in use**: a platform (`web`, `ios`, `android`), `tokens` for token files, `site` for
  the documentation site; omitted for changes that span several or none of them.
- Examples from this repo's history: `fix(tokens): use Light Italic for the sinefil blockquote
weight`, `fix(android): ...`, `style(site): format the homepage components with Prettier`.

Branch names aren't templated; name yours descriptively (for example `fix/android-letter-spacing`).

## Changing tokens

The tokens of the Chassis sites and apps are in [chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens), a repository of tokens with its own changelog and releases; its README has the steps. Do not edit `vendor/tokens/` from here: it is a checkout of that repository. A new commit there reaches this one by moving the pointer:

```sh
git -C vendor/tokens fetch origin main
git -C vendor/tokens checkout origin/main
git add vendor/tokens
pnpm tokens:lint:source
pnpm tokens:verify
pnpm tokens:diff --base <the previous commit>
```

CI runs the checks and the native compiles on a pull request that moves the pointer, and writes the token diff report to its job summary. A pointer move changes no published package, so it takes an empty changeset only when the build changes with it.

A change to the build that changes the output of the default platforms fails `pnpm tokens:verify` on `vendor/tokens` until website-tokens has the new output. Make both changes together: run `pnpm tokens:verify:update`, which also writes `vendor/tokens/dist/`, commit that on a branch of website-tokens, and point `vendor/tokens` at it for the pull request. See [Changing the build](#changing-the-build).

## Changing the build

The build in `packages/tokens/build/` follows three rules; please keep them. The reasons, the
output contract and the known oddities of the output are in
[docs/architecture.md](../docs/architecture.md).

- **Templates only print.** Platform values (`UIColor(…)`, ARGB colors, `sp` and `dp`, quoting,
  references) come from pure functions in `build/values/` and the web reference policies, which
  run on fully resolved tokens. They are not Style Dictionary value transforms, because
  referenced tokens would be encoded before the tokens that reference them.
- **Tests use real tokens.** Fixtures are copied from the `source/` and `dist/` of a repository
  of tokens; no test mocks Style Dictionary, and `pnpm test` needs nothing outside
  `packages/tokens/`, no submodule included. See [`packages/tokens/test/README.md`](../packages/tokens/test/README.md) for
  the test files, the fixtures and the preset baselines.
- **Types in JSDoc.** `pnpm tokens:typecheck` runs TypeScript's `checkJs` on `build/` (not yet
  `strict`), with the types Style Dictionary ships and those of Node.js 22, the oldest version
  the package supports. Describe parameters and return values with JSDoc, as the existing code
  does.

After a change, run:

```sh
pnpm tokens:lint
pnpm tokens:lint:source
pnpm tokens:typecheck
pnpm tokens:test
pnpm tokens:verify
pnpm tokens:verify:presets
```

A change to the build that is meant to change the output also writes the preset baselines again
(`pnpm tokens:verify:update:presets`), moves `vendor/tokens` to a commit with the new `dist/`, as
in [Changing tokens](#changing-tokens), and adds a changeset.

CI compiles the iOS and Android output of your pull request against the real SDKs: the Swift
files of `vendor/tokens`, the asset catalogs and a sample that uses its Swift package with Xcode, and the Android
resources, the Compose objects and a sample app that uses the Android library with Gradle. You
don't have to install anything for this. To run the checks
yourself, with Xcode or with a JDK and the Android SDK installed, see
[Native compile checks](../packages/tokens/test/README.md#native-compile-checks):

```sh
pnpm tokens:native:ios
pnpm tokens:native:android
```

## Changing the site

The pages are in `packages/site/content/`. [WRITING.md](../WRITING.md) is their style guide:
voice, section order, headings, token names and code blocks. Run the site locally at
`http://localhost:4322/tokens/` with:

```sh
pnpm dev
```

Before opening a pull request:

```sh
pnpm site:lint
pnpm check:astro
pnpm site:build
pnpm site:lint:html
```

## What a pull request needs before merge

- **Passing CI**: `.github/workflows/ci.yml` runs on every pull request and every push to
  `develop`. Its jobs are Tokens (the token lint, tests and golden checks, on Node.js 22 and 24),
  Site (Prettier on the whole repository with `pnpm lint:prettier`, the site lint, `astro check`,
  the site build and the HTML validation of its output), Changeset, Audit (`pnpm check:pnpm`,
  which is `pnpm audit --prod` and fails on a moderate advisory in what the package installs; the
  audit of the tooling is reported and doesn't fail), Token Diff and Dependency Review on a pull
  request, and Native iOS and Native Android when the change moves the `vendor/tokens` pointer or
  touches the build or the native checks, and on every manual run. The commands above run the same checks
  locally. `pnpm test:ci` runs all of them in one command except Changeset, Token Diff,
  Dependency Review and the two native jobs; `tokens:test` fails when `ci.yml` runs a script
  that `test:ci` doesn't.
- **A changeset** for anything that changes the published package: file names, formats, the
  output of a platform or the package contents. CI fails a pull request or a push to `develop`
  that changes `build/` without one; for such a change that releases
  nothing, such as a build refactor with the same output, add an empty changeset. A pull request
  that only touches the site, the docs, the tests or the tooling doesn't need one.
- **The written baselines** with any change to the build that changes the output.

## Changesets

A changeset is a Markdown file in [`.changeset/`](../.changeset/) that names the version bump and
the text of the CHANGELOG entry. Write one with:

```sh
pnpm changeset
```

Pick `@chassis-ui/tokens` and the bump, then write the entry: what changed and what a repository
of tokens or an app has to change, if anything. Commit the file with your change. The bump follows
semver, with the names the build writes as the public API:

- **major**: a file, format or naming rule is renamed or removed, or a value changes type (for example
  a `String` becomes a `UIFont.Weight`). While the version is `0.x`, use **minor** for these and
  say in the entry that it breaks.
- **minor**: new files, platforms, commands or options.
- **patch**: a fixed value, or a change that apps don't have to act on.

For a change that releases nothing, add an empty changeset instead:

```sh
pnpm changeset --empty
```

## Releases

A release is a version commit on `develop` that reaches `main`. The checks of a commit run
once, on `develop`; pushing the same commit to `staging` or `main` doesn't run them again.

1. On `develop`, a maintainer runs `pnpm changeset:version`. It removes the changesets, bumps
   the version in `packages/tokens/package.json`, writes the CHANGELOG entry, updates
   `currentVersion` in `packages/site/config.yml`. The maintainer reviews the result, commits it and pushes `develop`.
2. CI runs on that commit. The version commit changes `packages/tokens/package.json`, so the
   Native iOS and Native Android jobs run too. The Changeset job skips the push, since it changes the version. A
   release needs the native jobs to have run on the commit that reaches `main`: when another
   commit is pushed on top of the version commit and doesn't move the tokens or change the build
   or the native checks, run CI by hand on `develop` (**Run workflow** on the CI page
   of the Actions tab, or `gh workflow run ci.yml --ref develop`), which always runs them.
3. When CI has passed, the maintainer pushes the same commit to `main`
   (`git push origin develop:main`), never a merge commit of `develop`. The ruleset of `main`
   requires the checks `Tokens (Node 22)`, `Tokens (Node 24)` and `Site` on the commit, and
   blocks a force push and a deletion.
4. The push runs `.github/workflows/release.yml`, in three jobs:
   - **Detect Version** reads the version and asks npm whether it has it. When it has, the
     workflow stops: a push to `main` without a new version publishes nothing.
   - **Checks Passed** reads the check-runs of the commit by name. It stops unless
     `Tokens (Node 22)`, `Tokens (Node 24)`, `Site`, `Native iOS` and `Native Android` passed
     on it. A skipped native job doesn't count.
   - **Publish** publishes `@chassis-ui/tokens` with npm trusted publishing and provenance (no
     npm token), and creates the GitHub release `v<version>` with the CHANGELOG entry as its body.
     The release is the package, its tag and its notes: the tag is not a Swift package, and the
     Swift package and the Android libraries are released by chassis-ui/website-tokens, which
     takes a new version of the builder from npm.

`develop` and `main` are at the same commit after a release, so nothing is merged back.

A version without a CHANGELOG entry is not published. A prerelease goes to the npm dist-tag of
its first identifier, so `0.7.0-next.0` goes to `next`, and its GitHub release is marked as a
prerelease; every other version goes to `latest`.

The workflow can also be run by hand, on `main` only: a run on another branch stops in its
first job. Two names are tied to settings outside the repository, so change them together:

- The file name `release.yml` is the trusted publisher of `@chassis-ui/tokens` on npmjs.com.
  Renaming the file breaks publishing until the trusted publisher names the new file.
- The job names `Tokens (Node 22)`, `Tokens (Node 24)` and `Site` are the required checks of
  the ruleset of `main`, and they are in the `REQUIRED` list of `release.yml` with `Native iOS`
  and `Native Android`. The ruleset can't require the native jobs, since they are skipped on
  some pushes.

## Using the issue tracker

Search existing (including closed) issues first, then
[open a new one](https://github.com/chassis-ui/tokens/issues/new/choose) if your bug or idea isn't
already covered. For a security vulnerability, don't open a public issue; see
[`SECURITY.md`](SECURITY.md). Everyone taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md).

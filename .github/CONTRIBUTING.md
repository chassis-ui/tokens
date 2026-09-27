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
```

This repo is a pnpm workspace with two packages:

- [`packages/tokens`](../packages/tokens/) — `@chassis-ui/tokens`, the published package: the
  token files in `source/`, the Style Dictionary build in `build/`, its tests in `test/` and the
  output in `dist/`.
- [`packages/site`](../packages/site/) — `chassis-tokens-site`, the Astro documentation site. It
  is never published to npm.

The root holds the lint and format configurations, the repository scripts in `build/`, the
assets submodule in `vendor/assets` (the site needs it; `pnpm dev` and `pnpm site:build` fetch
and build it) and the CI workflows. Run every command from the root.

To work on the tokens only, install the tokens package and the root's lint tools without the
site's dependencies:

```sh
pnpm install --filter @chassis-ui/tokens
```

## Branch and commit conventions

Commits follow a loose `<type>(<scope>): <description>` convention:

- **Types in use**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.
- **Scopes in use**: a platform (`web`, `ios`, `android`), `tokens` for token files, `site` for
  the documentation site; omitted for changes that span several or none of them.
- Examples from this repo's history: `fix(tokens): use Light Italic for the sinefil blockquote
weight`, `fix(android): ...`, `style(site): format the homepage components with Prettier`.

Branch names aren't templated; name yours descriptively (for example `fix/android-letter-spacing`).

## Changing tokens

The token files in `packages/tokens/source/` are in [Tokens Studio](https://tokens.studio)
format. Edit them in Figma with Tokens Studio, synced to this repository with the file path
`packages/tokens/source`, or edit the JSON directly. Then:

1. Lint the token source, rebuild the output and review every changed line:

   ```sh
   pnpm tokens:lint:source
   pnpm tokens
   pnpm tokens:diff
   ```

   `pnpm tokens:lint:source` names the token set and the token of mistakes the build would
   accept: a name that one theme or screen declares and another does not, a name the platforms
   cannot use, an unknown font weight, a token without a type, or one name with two types.

   `pnpm tokens:diff` lists the token names added, removed, renamed and changed in value in each
   file of `dist/`, against `main`; `git diff packages/tokens/dist` shows the lines. CI adds the
   same report to the job summary of the pull request.

2. Check that `dist/` matches a fresh build:

   ```sh
   pnpm tokens:verify
   ```

3. Write the preset baselines again, since they are built from the same tokens, and review their
   difference the same way:

   ```sh
   cd packages/tokens
   for config in test/golden/*.json; do
     node build/build.js --config "$config" --out "test/golden/$(basename "$config" .json)"
   done
   cd ../..
   pnpm tokens:verify:presets
   ```

4. Add a changeset (see [Changesets](#changesets)) that says what changed and what an app has to
   change, if anything.

Token names are the public API: renaming or removing a token breaks every app that uses it.

After a change to the brands or apps of `chassis.build` in `packages/tokens/package.json`, build
the tokens and write the Swift package manifest at the root of the repository again, which has
one library for every app and brand with an iOS platform:

```sh
pnpm tokens
pnpm tokens:swift-package
```

`pnpm tokens:test` fails while `Package.swift` differs from the configuration. The Android
libraries need no such step: the release builds one for every `res/` tree in `dist/android/`.

## Changing the build

The build in `packages/tokens/build/` follows three rules; please keep them. The reasons, the
output contract and the known oddities of the output are in
[docs/architecture.md](../docs/architecture.md).

- **Templates only print.** Platform values (`UIColor(…)`, ARGB colours, `sp` and `dp`, quoting,
  references) come from pure functions in `build/values/` and the web reference policies, which
  run on fully resolved tokens. They are not Style Dictionary value transforms, because
  referenced tokens would be encoded before the tokens that reference them.
- **Tests use real tokens.** Fixtures are copied from `source/` and `dist/`; no test mocks
  Style Dictionary. See [`packages/tokens/test/README.md`](../packages/tokens/test/README.md) for
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

A change that is meant to change the output also updates `dist/` (`pnpm tokens`), the preset
baselines (see [Changing tokens](#changing-tokens)) and adds a changeset.

CI compiles the iOS and Android output of your pull request against the real SDKs: the Swift
files, the asset catalogs and a sample that uses the Swift package with Xcode, and the Android
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
```

## What a pull request needs before merge

- **Passing CI**: `.github/workflows/ci.yml` runs the token lint, tests and golden checks on
  Node.js 22 and 24, the site lint, `astro check` and site build, Prettier on the whole repository
  (`pnpm lint:prettier`) and `pnpm audit`. The commands above run the same checks locally.
- **A changeset** for anything that changes the published package: token names or values, file
  names, formats or the package contents. CI fails a pull request that changes
  `packages/tokens/source/`, `build/` or `dist/` without one; for such a change that releases
  nothing, such as a build refactor with the same output, add an empty changeset. A pull request
  that only touches the site, the docs, the tests or the tooling doesn't need one.
- **The rebuilt `dist/`** committed with any change to tokens or the build that changes the
  output.

## Changesets

A changeset is a Markdown file in [`.changeset/`](../.changeset/) that names the version bump and
the text of the CHANGELOG entry. Write one with:

```sh
pnpm changeset
```

Pick `@chassis-ui/tokens` and the bump, then write the entry: what changed and what an app has to
change, if anything. Commit the file with your change. The bump follows semver, with token names
as the public API:

- **major**: a token, file or format is renamed or removed, or a value changes type (for example
  a `String` becomes a `UIFont.Weight`). While the version is `0.x`, use **minor** for these and
  say in the entry that it breaks.
- **minor**: new tokens, files, platforms or options.
- **patch**: a fixed value, or a change that apps don't have to act on.

For a change that releases nothing, add an empty changeset instead:

```sh
pnpm changeset --empty
```

## Releases

Releases are made from `main` by `.github/workflows/publish-release.yml`, after the CI checks pass
on the pushed commit:

1. When `main` has changesets, the workflow opens or updates a "Version Packages" pull request. It
   runs `pnpm changeset:version`, which removes the changesets, bumps the version in
   `packages/tokens/package.json`, writes the CHANGELOG entry, updates `current_version` in
   `packages/site/config.yml` and rebuilds `dist/`, so its headers name the new version.
2. Merging that pull request pushes `main` again. The version is not on npm yet, so the workflow
   runs `pnpm tokens:verify`, publishes `@chassis-ui/tokens` with npm trusted publishing and
   provenance (no npm token), and creates the GitHub release `v<version>` with the CHANGELOG entry
   as its body and the Android library of every app and brand attached
   (`chassis-tokens-<app>-<brand>-<version>.aar`). Swift Package Manager resolves the tag of the
   release, so the Swift package needs no publishing step.

A maintainer can also run `pnpm changeset:version` locally, review and commit the result and push
`main`; the workflow then publishes without a pull request. A version without a CHANGELOG entry
is not published.

## Using the issue tracker

Search existing (including closed) issues first, then
[open a new one](https://github.com/chassis-ui/tokens/issues/new/choose) if your bug or idea isn't
already covered. For a security vulnerability, don't open a public issue; see
[`SECURITY.md`](SECURITY.md). Everyone taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md).

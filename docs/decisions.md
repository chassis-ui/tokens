# Decisions

The decisions behind the split of the repository into the token module of Chassis UI and a
repository of tokens, each with its reason. The other documents cite them by number, so a
number never changes. The decisions of the build itself are in
[architecture.md](architecture.md), and the ones of the earlier rewrite in the git history.

## Adding a decision

A new decision gets the next number, as an entry at the end: the question, the outcome with
its reason, who took it and the date. An entry that amends an earlier one says so, and the
earlier one gets a sentence that names it. A decision that changes a token name, a file name,
a format or the output of a default build is the maintainer's; see
[AGENTS.md](../AGENTS.md#rules).

## The decisions

All are decided. "The maintainer" took the decision on a proposal of a session.

- **D1. What is `@chassis-ui/tokens`?** The token module of Chassis UI: the build and the
  management of design tokens, published to npm with the `chassis-tokens` command, so that a
  team installs it in a repository of its own tokens and runs it there, as a team does with
  `@chassis-ui/assets`. Every command of today belongs to it: `build`, `verify`, `diff`,
  `lint-source`, `swift-package`, the native compile checks and the build of the Android
  libraries, as the static font instancer belongs to the assets package. `init` writes a
  repository of tokens. The package ships no tokens of its own: `dist/` leaves the package
  once the consumers of D2 have moved. The build finds its repository with `--cwd`, by default
  the nearest folder upward whose `package.json` has a `chassis` block, as the assets build
  does, and the tests run on fixtures, so `pnpm test` needs no repository of tokens and no
  submodule. The maintainer, 2026-10-30. Amended by D11: `init` writes the token system.
- **D2. Where do the tokens of the Chassis sites and apps live?** In a repository of their own,
  a repository of tokens made with `chassis-tokens init` and holding `source/`, the
  `chassis.build` block, the committed `dist/` and `Package.swift`, with the history of
  `source/` and `dist/` filtered from `develop` of this repository, as the repository of the
  Chassis site assets was made from the assets repository. It publishes its tokens to npm, since
  `@chassis-ui/css` compiles against the token SCSS and the sites and the sibling packages
  install it; its Swift package is the repository at a tag, and the Android libraries are
  attached to its GitHub release. This repository vendors it as the submodule `vendor/tokens`,
  pinned to `main`, so that CI runs the lint, the build, the verification, the diff and the
  native compiles on the real files, and the site reads the built output and the source for
  the token reference. A team names and scopes its own package as it likes; the name is not
  part of the build. The maintainer, 2026-10-30.
- **D3. How is the repository of D2 versioned?** From 0.1.0, with a fresh changelog, as the
  repository of the Chassis site assets: the version in `package.json` is set by hand, the release runs on the tag
  `v<version>`, verifies `dist/` against a fresh build, publishes to npm with trusted
  publishing and attaches the Android libraries. The changelog is written by hand in the
  commit of the version, one entry per release, in the Keep a Changelog form: a repository
  of tokens has one package and one kind of change, so Changesets, which earns its place in
  the workspace of this repository, would add a bot and a folder for nothing. The history of
  the token values before 0.1.0 stays in the changelog of this repository, which the README
  of that repository links. `@chassis-ui/tokens` goes on from its current version. The
  maintainer, 2026-10-30.
- **D4. What may a command write into a repository of tokens?** Only what Tokens Studio
  reads back, the token set files, `$themes.json` and `$metadata.json`, and the
  `chassis.build` block of `package.json`. No manifest, declaration or list beside the
  source: the designer's sync from Figma has to keep working after `create brand`,
  `create app` or `create scale` has run, and a file that only the command knows would be
  lost at the next sync. The rule of the assets build, file-driven, applied to tokens. The
  maintainer, 2026-10-30.
- **D5. Where do the MCP tools live?** On a programmatic API of the package: every management
  command is a function that the command calls, and an MCP tool wraps a function one to one.
  The tools act on files on disk, so they need a local server, which the hosted server of
  `chassis-ui/mcp` is not; where that server ships is decided when the first tool is built.
  Until then the package carries no MCP dependency. The maintainer, 2026-10-30.
- **D6. In which order does the split run?** In five steps, each of which leaves every
  consumer working. First, the package becomes location-independent with `--cwd`, the
  `chassis-tokens` command, `init` and fixture-based preset baselines, in this repository as
  it is. Second, the repository of D2 is made and publishes 0.1.0 while this package still ships
  `dist/`. Third, the consumers move, `@chassis-ui/css` first and the sites, packages and
  examples after its release. Fourth, this package drops `dist/`, vendors the repository of D2,
  runs CI on it, and the site is written again for two repositories. Fifth, the management
  features of D4 and D5. The maintainer, 2026-10-30. Note: step four is done, 2026-10-31.
- **D7. How does a native app take the tokens of one brand without a package?** From a zip per
  platform, app and brand on the GitHub release, written by `chassis-tokens archive`, as
  `chassis-assets archive` does for the assets of a repository, under the same form of name. An app
  then takes its tokens and its assets the same way, by a repository, a version and a file name,
  checked against the digest of the release, with no npm package holding the output of every
  platform. npm stays for the web, and the Swift package and the Android libraries stay for the
  projects that install them. `archives/` is not committed. The maintainer, 2026-11-01.
- **D8. What starts the release of a repository of tokens?** A push to `main` with a new version,
  in place of the tag of D3, as in a repository of assets. The `release.yml` that `init` writes
  reads the version of `package.json`, and when it has no tag `v<version>` it verifies, publishes,
  and creates the tag and the GitHub release with the Android libraries and the archives. Swift
  Package Manager resolves that tag as before. A release that fails makes no tag, so the next push
  tries again, and leaves out the publish when npm has the version. Raising the version is the
  deliberate step: changes still reach `main` without a release. The first push of a new repository
  tries to release the version `init` writes, and fails at the publish, with no tag, until npm
  trusts the repository. A tag pushed by hand ends the release of its version. The maintainer,
  2026-11-01.
- **D9. How is a release named, and what is its text?** Every file of a release starts with the
  name of the repository, the name of `package.json` without its scope: the zips, and the Android
  libraries since this entry, `<name>-android-<app>-<brand>-<version>.aar` in place of
  `chassis-tokens-<app>-<brand>-<version>.aar`, which named this package in the repository of any
  team. The Swift names stay: an app imports them in its code. The text of the GitHub release is
  the entry of its version in `CHANGELOG.md`, with `chassis-tokens release-notes`, in CI and first
  in the release, so a version without an entry fails and is not published: `--generate-notes`
  wrote only a link, as these repositories push to `main` and it lists pull requests. The release
  of this package has the title `v<version>`, as chassis-ui/assets. The maintainer, 2026-11-02.
- **D10. How does a repository made earlier take what `init` writes now?** With `init --check`,
  which reports what differs, and `init --only <file…>`, which writes those files. `package.json`
  and `CHANGELOG.md` are never written over, as the token files were not. `init` also writes
  `AGENTS.md` and `CLAUDE.md`, since a release follows from a push; they guide, and D9 enforces.
  chassis-ui/assets has the same commands by its own decision, and no check compares the two.
  The maintainer, 2026-11-02.
- **D11. What token sets does `init` write?** The token sets of the Chassis token system, which
  this package ships in `templates/source/base/`, with the groups `brand`, `app` and
  `theme`, and no `screen` group: screens are an option a repository adds. They were taken once
  from the repository of tokens of the Chassis sites, which from then on is one repository of
  tokens among others. `init` writes them once, and they are the repository's: no later version
  of this package writes over its values. A change to the structure of the system, such as a new
  type of token, is released here, and a repository takes it by a migration it chooses, which
  changes the structure and never a value, or keeps the version it has. Amends D1, under which
  the package shipped no tokens and `init` wrote seven starter sets of names that no Chassis
  package reads. The maintainer, 2026-11-03.

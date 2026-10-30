---
'@chassis-ui/tokens': minor
---

Add the `chassis-tokens` command, so that the package builds and checks a repository of tokens wherever it runs: `build`, `verify`, `diff`, `lint-source` and `swift-package` work on the repository that `--cwd <dir>` names, by default the nearest folder upward whose `package.json` has a `chassis` block. `source/`, `dist/` and `Package.swift` are at its root; `chassis.dist` moves the output folder. `chassis-tokens init [dir]` writes a new repository: a `package.json` with the `chassis.build` block, a README, a changelog, a CI workflow, a release workflow on the tag `v<version>` and a few Tokens Studio files, which it writes only into a `source/` that holds none, with or without `--force`. `--repository`, `--license` and `--author` fill in `package.json`, by default from git.

The header of every file comes from the `package.json` of the repository it is built in: the title from `chassis.title` or `name`, the copyright from `chassis.copyright` or `author`, and the license line from `license` and `repository`. The headers of this package's files stay as they were.

The package now holds `build/` and the Gradle project of the Android libraries, and its build dependencies are `dependencies`, so installing it also installs Style Dictionary, `@tokens-studio/sd-transforms`, `svg2vectordrawable` and `tinycolor2`. The output and the token names do not change. Only the comment at the top of `Package.swift` now names the command.

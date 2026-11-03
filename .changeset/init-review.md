---
'@chassis-ui/tokens': patch
---

`chassis-tokens diff` says when the repository has no git repository or no `main` branch, and names `--base`, in place of the error of git. `swift-package --check` says when `Package.swift` has not been written yet, and its messages name `chassis-tokens swift-package` rather than a script of the builder's workspace. The help of `lint-source` lists all of its rules, and the help of `archive` says that `--to` is relative to the repository. `init` lists `swift-package` among the next steps when an app has an iOS platform, aligns the tables of the README and `AGENTS.md` it writes for either package manager, writes the `release-notes`, `swift-package:check` and `archive` rows that those tables lacked, and no longer reports the token files it kept on an `--only` write of other files. Nothing in `dist/` changes.

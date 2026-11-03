---
'@chassis-ui/tokens': minor
---

**Breaking.** The code of the package moved from `build/` to `lib/`, and the export `./build/*` became `./lib/*`: `lib/cli.js` is the command, `lib/build/` the Style Dictionary build, `lib/commands/` one module per command on a repository, and `lib/root.js`, `lib/logger.js` and `lib/utils.js` the shared modules. What `init` writes moved from `build/init-templates/` to `templates/`. A project that imports a module of the package by its path changes `@chassis-ui/tokens/build/<module>` to `@chassis-ui/tokens/lib/<module>`, with `build/` or `commands/` added for a module of the build or a command. Nothing in `dist/` of a repository of tokens changes.

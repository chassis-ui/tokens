---
'@chassis-ui/tokens': minor
---

Add `chassis-tokens archive`, which writes one zip per platform, app and brand of the output, `<name>-<platform>-<app>-<brand>-<version>.zip`, with the content of `dist/<platform>/<app>/<brand>/` at its top level. `chassis-tokens init` writes a script `archive`, an `archives/` line in `.gitignore`, and a release workflow that attaches the zips and runs on a push to `main` whose version has no tag `v<version>`, in place of a tag pushed by hand: it creates the tag itself. An existing repository of tokens adds the same to take them. Nothing else changes.

---
'@chassis-ui/tokens': minor
---

**Breaking:** the package ships no `dist/` and no `Package.swift` from this version; it is the builder, the `chassis-tokens` command and the management of design tokens. The tokens of the Chassis sites and apps are [`@chassis-ui/website-tokens`](https://www.npmjs.com/package/@chassis-ui/website-tokens): replace `@chassis-ui/tokens/dist/...` with `@chassis-ui/website-tokens/dist/...`, the rest of the path stays the same. The Swift package is https://github.com/chassis-ui/website-tokens, and the Android libraries are on its releases. The tags of this repository are no longer a Swift package, and its releases attach no Android libraries. The `chassis-tokens` scripts of this repository run on `vendor/tokens`, a submodule of chassis-ui/website-tokens.

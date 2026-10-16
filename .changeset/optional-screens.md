---
'@chassis-ui/tokens': patch
---

Fix the build without screens. With `screens` empty or left out of `chassis.build`, the build failed with `No token sets for chassis_docs_light in source/$themes.json` unless the screen group was also removed from `source/$themes.json`. It now takes the token sets of the first screen in `source/$themes.json`, as the build did before 0.6.0, and writes one number file without a screen suffix: `number.scss`, `Number.swift` and `number.xml`. The committed configuration and its files do not change.

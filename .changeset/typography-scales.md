---
'@chassis-ui/tokens': patch
---

The token system that `init` writes has a size and line-height scale for the display family, `typography.fontSize.display` and `typography.lineHeight.display` from `6xlarge` to `2xsmall`, following the ui scale as prose does, and its composites `font.display.<size>.<weight>` with the letter spacing `typography.letterSpacing.display`. The ui, prose and display scales gain a `6xlarge` step (52 and 64), and the code scale `xlarge` (22 and 32) and `xsmall` (12 and 18), with their composites. A repository made before this release keeps its token sets.

---
'@chassis-ui/tokens': patch
---

A color that applies a Tokens Studio color modifier (lighten, darken, mix or alpha) to a primitive or context color prints its own color on the web. The Chassis CSS format printed the custom property of the color it references, and the SCSS presets with `outputReferences` its variable, so the modifier was lost. No token of the token system that `init` writes does this, so nothing in its output changes. A repository can now add a color group of its own, such as spot colors for particular elements, whose colors mix primitives in the theme sets.

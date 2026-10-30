---
'@chassis-ui/tokens': minor
---

Define the transparent primitive colors in the theme group, as Figma now keeps a reference inside a transparent color. `color.primitive.<palette>.transparent` and `t-*` hold `rgba()` of a color of their palette, and they follow a change of the brand in Figma. The base context and shadow colors that referenced them hold the same `rgba()` themselves. The resolved values of `color.primitive.*`, `color.context.*` and `color.shadow.*` stay the same in the built brands.

The `dim-*` context colors now reference `opacity.context.dim-*`, except `dim-slight` of `default` and `alternate`, which references `opacity.level.05`. `opacity.context.dim-slight` goes from `0.05` to `0.1`, the alpha of the other `dim-slight` colors; those colors keep their values.

**Breaking:** all 216 `color.base.primitive.<theme>.<palette>.transparent` and `t-*` colors are removed from the main files of every platform and from the Android `res/values/color_base.xml`, such as `$cx-color-base-primitive-light-primary-t-5005`. Use the color of the current theme, `color.primitive.<palette>.t-5005`, from the color files.

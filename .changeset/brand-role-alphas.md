---
'@chassis-ui/tokens': minor
---

A brand can set the alphas of its color roles, and the subtle text of the colored contexts has an alpha of its own.

- New token `opacity.context.fg-a11y` (`$cx-opacity-context-fg-a11y`, `OpacityContextFgA11y`, `opacity_context_fg_a11y`): the alpha of the `fg-subtle` colors of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts, which had the alpha of `opacity.context.fg-subtle`
- `opacity.context.*` references the new `opacity.base.context.*` in `source/base/brand-base.json`, which a brand overrides in its own token set. The build does not write `opacity.base.context.*`; the names and the format of the output stay as they are
- `opacity.context.fg-subtle` and `opacity.context.icon-subtle` are higher, and so is the alpha of every `fg-subtle` and `icon-subtle` color
- In the dark theme, `fg-main`, `fg-highlight`, `link-main`, `link-hover` and `link-active` of the same seven contexts are lighter shades of their palette, and so are the colors that reference them

No name is renamed or removed, so an app has nothing to change.

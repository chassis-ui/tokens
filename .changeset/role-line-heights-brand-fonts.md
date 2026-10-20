---
'@chassis-ui/tokens': patch
---

`font.context.jumbo` and `font.context.hero` take their line height from a token of their own, and the base role groups and the fonts of the `sinefil` brand change. No token is removed or renamed.

- Added `typography.lineHeight.context.jumbo` (`120`) and `typography.lineHeight.context.hero` (`80`) (`$cx-typography-line-height-context-jumbo`, `TypographyLineHeightContextJumbo`, `typography_line_height_context_jumbo`). `font.context.jumbo` and `font.context.hero` reference them instead of holding `125%`, so their line height stays the same at the default sizes but no longer follows a brand that changes `typography.fontSize.context.jumbo` or `typography.fontSize.context.hero`
- In `source/base/brand-base.json`, the role groups `jumbo`, `hero` and `heading` point at the display family with `typography.fontWeight.display.strong`, instead of the `ui` family with `typography.fontWeight.ui.mass`, and `title` points at the `prose` family with `typography.fontWeight.prose.strong`. `typography.fontWeight.context.blockquote` is `{typography.fontWeight.prose.elegant} Italic`. The base display family is Playfair Display instead of Merriweather, and the base code family is `'IBM Plex Mono', ui-monospace, monospace`. A brand that does not override these tokens changes with them
- `typography.letterSpacing.prose.*` hold `{size.unit.0}` instead of referencing `typography.letterSpacing.ui.*`, and `typography.paragraphSpacing.base.*` reference `size.unit.*`. Their values do not change
- The `chassis` brand: `font.context.blockquote` is Regular Italic (`400`) instead of Light Italic (`300`), the code family ends with `ui-monospace, monospace`, and the icon family is quoted on the web, `'Chassis-Icons'`
- The `sinefil` brand: the `ui` family is Geist, the `prose` family is Lora, the display family references `prose`, and the code family is Cousine. `jumbo`, `hero` and `heading` are set in Lora Medium (`500`), `title` in Lora Regular, `cite` in Geist SemiBold, and `blockquote` in Lora Regular Italic

In the `web` platform, `$cx-font-context-jumbo` and `$cx-font-context-hero` name `var(--line-height-jumbo)` and `var(--line-height-hero)` instead of printing `1.25em`. Chassis CSS must declare the two custom properties; with a version that does not, `.font-jumbo` and `.font-hero` get an invalid line height and inherit one.

In Figma, push the token sets from Tokens Studio to add the two line height variables and update the text styles.

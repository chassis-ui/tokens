---
'@chassis-ui/tokens': patch
---

Fix the web letter spacing, which tightened text several times more than iOS, Android and Figma. The web divided the pixels by 16 and printed ems, which CSS multiplies by the font size of the text: `font.website.hero-title` printed `-0.0625em`, 4 px at its 64 px font size, where its token says 1 px. The web now prints letter spacing in its size unit, as the other sizes, so it is the same number of pixels as on iOS, Android and in Figma. No name changes; these values do:

- The `letter-spacing` of every typography map is in the size unit: `-0.0625rem` for `font.website.hero-title` in `web` and `web-scss`, where it was `-0.0625em`, `-1px` in `web-px` and `-0.0625vw` in `web-vw`. A letter spacing of zero prints `0rem` (`0px`, `0vw`), where it printed `0em`
- The letter spacing tokens, `$cx-typography-letter-spacing-*`, are in the size unit too: `0rem` where they printed `0em`
- `typography.letterSpacing.context.jumbo` references `typography.letterSpacing.text.mass`, as `context.hero` does, instead of `size.unit.nd05`, so `font.context.jumbo` no longer tightens its letters on any platform
- A letter spacing in percent prints on every platform: in `em` on the web and Android, and in points of the font size on iOS. The source writes pixels, because Figma variables cannot hold a percentage, and `pnpm tokens:lint:source` fails on a letter spacing in percent or in `em`

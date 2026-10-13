---
'@chassis-ui/tokens': patch
---

The colors of the `chassis` brand, the link and highlight colors of the contexts, the hover color of a table row and the heading weight of the `sinefil` brand change in value. No name is added, removed or renamed, and an app has nothing to change.

- `chassis` brand: new base colors for `primary` (`#00A4CC` to `#0094B8`), `neutral` (`#6F8085` to `#7B878E`), `danger` (`#F52314` to `#D72A1D`), `success` (`#10C263` to `#1A9E4F`), `warning` (`#F5A300` to `#F0A205`) and `info` (`#1414F5` to `#3A72E4`). Every color made from them changes with them
- Light theme: `fg-highlight` of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts is one step darker (`70` instead of `60`), and the four link colors of the `alternate` context use the lighter steps `20` to `40`
- Dark theme: the four link colors of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts are one step stronger (`link-main` and `link-active` at `30`, `link-hover` at `20`, `link-visited` at `40`)
- `color.table.bg-hover` references `color.context.default.dim-slight`, a translucent layer over the row, instead of `color.context.default.bg-evident`
- `sinefil` brand: `typography.fontWeight.html.heading` is the `display.strong` weight, so `font.html.h1` to `font.html.h6` are Semi Bold (`600`) instead of Bold (`700`)

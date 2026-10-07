---
'@chassis-ui/tokens': minor
---

The grid tokens hold the page margin and the number of columns of each breakpoint, and the gutters have new values.

- New tokens `grid.margin.xsmall` to `grid.margin.2xlarge` (`$cx-grid-margin-xsmall`, `GridMarginXsmall`, `grid_margin_xsmall`): the margin of the page at each breakpoint, a size like `grid.gutter.*`
- New tokens `grid.columns.xsmall` to `grid.columns.2xlarge` (`$cx-grid-columns-xsmall`, `GridColumnsXsmall`, `grid_columns_xsmall`): the number of columns of the layout grid at each breakpoint, a number without a unit. On Android it is an `<integer>` resource, and an `Int` in Compose
- `grid.gutter.*` changed in value: `xsmall` is 16 design pixels where it was 8, and `large`, `xlarge` and `2xlarge` are 24, the value of `medium`, where they were 32, 40 and 48. `grid.margin.*` holds the same values as the gutters

No name is renamed or removed. An app that uses `grid.gutter.*` gets the new gutters and has nothing to change.

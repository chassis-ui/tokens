# Changelog

## 0.13.0

### Minor Changes

- e2cec06: **Breaking:** the package ships no `dist/` and no `Package.swift` from this version; it is the builder, the `chassis-tokens` command and the management of design tokens. The tokens of the Chassis sites and apps are [`@chassis-ui/website-tokens`](https://www.npmjs.com/package/@chassis-ui/website-tokens): replace `@chassis-ui/tokens/dist/...` with `@chassis-ui/website-tokens/dist/...`, the rest of the path stays the same. The Swift package is https://github.com/chassis-ui/website-tokens, and the Android libraries are on its releases. The tags of this repository are no longer a Swift package, and its releases attach no Android libraries. The `chassis-tokens` scripts of this repository run on `vendor/tokens`, a submodule of chassis-ui/website-tokens.

## 0.12.0

### Minor Changes

- 6ff1f8c: Add the `chassis-tokens` command, so that the package builds and checks a repository of tokens wherever it runs: `build`, `verify`, `diff`, `lint-source` and `swift-package` work on the repository that `--cwd <dir>` names, by default the nearest folder upward whose `package.json` has a `chassis` block. `source/`, `dist/` and `Package.swift` are at its root; `chassis.dist` moves the output folder. `chassis-tokens init [dir]` writes a new repository: a `package.json` with the `chassis.build` block, a README, a changelog, a CI workflow, a release workflow on the tag `v<version>` and a few Tokens Studio files, which it writes only into a `source/` that holds none, with or without `--force`. `--repository`, `--license` and `--author` fill in `package.json`, by default from git.

  The header of every file comes from the `package.json` of the repository it is built in: the title from `chassis.title` or `name`, the copyright from `chassis.copyright` or `author`, and the license line from `license` and `repository`. The headers of this package's files stay as they were.

  The package now holds `build/` and the Gradle project of the Android libraries, and its build dependencies are `dependencies`, so installing it also installs Style Dictionary, `@tokens-studio/sd-transforms`, `svg2vectordrawable` and `tinycolor2`. The output and the token names do not change. Only the comment at the top of `Package.swift` now names the command.

## 0.11.0

### Minor Changes

- 931bd80: Add motion tokens to every brand: durations under `motion.timing.*` and easings under `motion.easing.*`, each referencing `motion.base.*`, in the main and number files of every platform.

  Durations are `250ms` on the web, `TimeInterval(0.25)` in seconds on iOS and SwiftUI, and integers in milliseconds on Android and Compose. Easings are `cubic-bezier(0.42, 0, 1, 1)` on the web, a tuple of control points on iOS and SwiftUI, `CubicBezierEasing` on Compose and four float resources (`_x_1`, `_y_1`, `_x_2`, `_y_2`) on Android.

  The Compose files now import `androidx.compose.animation.core.CubicBezierEasing`. An app that uses Compose without `androidx.compose.animation:animation-core` on its classpath has to add it.

- bb936d3: Define the transparent primitive colors in the theme group, as Figma now keeps a reference inside a transparent color. `color.primitive.<palette>.transparent` and `t-*` hold `rgba()` of a color of their palette, and they follow a change of the brand in Figma. The base context and shadow colors that referenced them hold the same `rgba()` themselves. The resolved values of `color.primitive.*`, `color.context.*` and `color.shadow.*` stay the same in the built brands.

  The `dim-*` context colors now reference `opacity.context.dim-*`, except `dim-slight` of `default` and `alternate`, which references `opacity.level.05`. `opacity.context.dim-slight` goes from `0.05` to `0.1`, the alpha of the other `dim-slight` colors; those colors keep their values.

  **Breaking:** all 216 `color.base.primitive.<theme>.<palette>.transparent` and `t-*` colors are removed from the main files of every platform and from the Android `res/values/color_base.xml`, such as `$cx-color-base-primitive-light-primary-t-5005`. Use the color of the current theme, `color.primitive.<palette>.t-5005`, from the color files.

## 0.10.1

### Patch Changes

- 1168271: `font.context.jumbo` and `font.context.hero` take their line height from a token of their own, and the base role groups and the fonts of the `sinefil` brand change. No token is removed or renamed.

  - Added `typography.lineHeight.context.jumbo` (`120`) and `typography.lineHeight.context.hero` (`80`) (`$cx-typography-line-height-context-jumbo`, `TypographyLineHeightContextJumbo`, `typography_line_height_context_jumbo`). `font.context.jumbo` and `font.context.hero` reference them instead of holding `125%`, so their line height stays the same at the default sizes but no longer follows a brand that changes `typography.fontSize.context.jumbo` or `typography.fontSize.context.hero`
  - In `source/base/brand-base.json`, the role groups `jumbo`, `hero` and `heading` point at the display family with `typography.fontWeight.display.strong`, instead of the `ui` family with `typography.fontWeight.ui.mass`, and `title` points at the `prose` family with `typography.fontWeight.prose.strong`. `typography.fontWeight.context.blockquote` is `{typography.fontWeight.prose.elegant} Italic`. The base display family is Playfair Display instead of Merriweather, and the base code family is `'IBM Plex Mono', ui-monospace, monospace`. A brand that does not override these tokens changes with them
  - `typography.letterSpacing.prose.*` hold `{size.unit.0}` instead of referencing `typography.letterSpacing.ui.*`, and `typography.paragraphSpacing.base.*` reference `size.unit.*`. Their values do not change
  - The `chassis` brand: `font.context.blockquote` is Regular Italic (`400`) instead of Light Italic (`300`), the code family ends with `ui-monospace, monospace`, and the icon family is quoted on the web, `'Chassis-Icons'`
  - The `sinefil` brand: the `ui` family is Geist, the `prose` family is Lora, the display family references `prose`, and the code family is Cousine. `jumbo`, `hero` and `heading` are set in Lora Medium (`500`), `title` in Lora Regular, `cite` in Geist SemiBold, and `blockquote` in Lora Regular Italic

  In the `web` platform, `$cx-font-context-jumbo` and `$cx-font-context-hero` name `var(--line-height-jumbo)` and `var(--line-height-hero)` instead of printing `1.25em`. Chassis CSS must declare the two custom properties; with a version that does not, `.font-jumbo` and `.font-hero` get an invalid line height and inherit one.

  In Figma, push the token sets from Tokens Studio to add the two line height variables and update the text styles.

## 0.10.0

### Minor Changes

- 428bfc9: **Breaking:** the font families are named by their job, and every named text style is a role of `font.context.*`. The `text` family is renamed `ui`, a reading family `prose` is added, the size scale of `display` and the `html` group are removed, and the headings, the quotation and the citation become text roles. The component fonts keep their values in every brand and on every platform.

  - Renamed `typography.fontFamily.text`, `typography.fontWeight.text.*`, `typography.fontSize.text.*`, `typography.lineHeight.text.*` and `typography.letterSpacing.text.*` to `ui` (`$cx-typography-font-family-ui`, `TypographyFontFamilyUi`, `typography_font_family_ui`, `typographyFontFamilyUi`), and `font.text.<size>.<weight>` to `font.ui.<size>.<weight>` (`$cx-font-ui-medium-strong`, `FontUiMediumStrongFontSize`, `font_ui_medium_strong_font_size`, `fontUiMediumStrongFontSize`). Every component font references `font.ui.*`
  - Added the family `prose`, for reading content: `typography.fontFamily.prose`, `typography.fontWeight.prose.*`, `typography.fontSize.prose.*`, `typography.lineHeight.prose.*` and `typography.letterSpacing.prose.*`, and `font.prose.<size>.<weight>` (`$cx-font-prose-medium-normal`, `FontProseMediumNormalFontSize`). The family, the sizes, the line heights and the letter spacing reference the `ui` token of the same name. The weights hold the style names of the reading font, because a weight belongs to its typeface: a brand that sets `typography.fontFamily.prose` sets `typography.fontWeight.prose.*` with it. Each committed brand sets the prose weights of its reading font, and the `sinefil` brand sets its reading font to its display family
  - Removed `typography.fontSize.display.*`, `typography.lineHeight.display.*`, `typography.letterSpacing.display.*` and `font.display.<size>.<weight>` (`$cx-font-display-medium-normal`, `FontDisplayMediumNormalFontSize`). `typography.fontFamily.display` and `typography.fontWeight.display.*` stay: text reaches the display family through a role group that a brand points at it
  - Removed `font.html.*` and every `typography.*.html.*` token. Use the text roles instead: `font.context.h1` to `font.context.h6` for `font.html.h1` to `font.html.h6`, `font.context.blockquote` and `font.context.cite` for `font.html.blockquote` and `font.html.cite`, and `font.context.body.medium` for `font.html.body`, `font.html.paragraph` and `font.html.list`. `font.context.body.medium` has the medium paragraph spacing, which `font.html.body` and `font.html.list` did not have. `font.code.medium.normal` replaces `font.html.code`, and `typography.fontWeight.ui.mass` replaces `typography.fontWeight.html.bold`
  - Removed the roles `heading`, `highlight`, `link`, `expired` and `code` of `font.context.*`, with their typography tokens. `font.context.body.*` has the properties of `font.context.highlight.*`. The nearest role to `font.context.heading` is `font.context.h2`, with the weight and the paragraph spacing of the headings. Set a link or an expired text with a base or context font and a text decoration of the app, and code with `font.code.*`
  - Added `font.context.h1` to `font.context.h6`, `font.context.blockquote` and `font.context.cite`. Each text role holds its own `typography.fontSize.context.<role>`, `typography.lineHeight.context.<role>` and `typography.letterSpacing.context.<role>`, such as `typography.fontSize.context.h1` and `typography.letterSpacing.context.title-large`, as values instead of references to a step of the scale. `typography.letterSpacing.context.title`, `body` and `label` are replaced by one letter spacing per size, such as `typography.letterSpacing.context.title-medium`
  - `typography.fontFamily.context.*` and `typography.fontWeight.context.*` hold one family and one weight per role group: `jumbo`, `hero`, `heading`, `lead`, `blockquote`, `cite`, `body`, `title` and `label`. `heading` is the group of `h1` to `h6`. `lead`, `blockquote`, `cite` and `body` reference the `prose` family, the others `ui`. The `chassis` brand points `heading`, `jumbo`, `hero` and `title` at its display family, and the `sinefil` brand points `heading` at it. In the `chassis` brand, `font.context.title.*` is now set in its display family, with the display weight it already had. In the `sinefil` brand, `font.context.lead` and `font.context.body.*` are now set in its display family, through `prose`

  In the `web` platform, the maps name custom properties that Chassis CSS must declare. A component font names the properties of its family, `var(--font-size-ui-md)` and `var(--font-weight-ui-strong)` instead of `var(--font-size-md)` and `var(--font-weight-strong)`. A text role names its own size and line height, `var(--font-size-h1)` and `var(--line-height-title-lg)`. `$cx-typography-font-family-context-*` and the `weight` part of `$cx-typography-font-weight-context-*` print the custom property of the family token they reference, such as `var(--font-family-display)`, so Chassis CSS can declare one property per role group. Chassis CSS 0.9 does not compile with this version, because it reads `$cx-typography-font-family-text`: an app that uses Chassis CSS updates both together. The presets `web-scss`, `web-px` and `web-vw` print resolved values, and with `outputReferences` they name the new variables.

  `pnpm tokens:lint:source` fails on a token set that sets a font family without its weights, and on a font token or text role group whose weight belongs to another family than its family. The `demo-a` and `demo-b` brands now set the weights of the families they set, with the weights they used before.

  In Figma, push the token sets from Tokens Studio to replace the text styles and the Variables of the removed tokens with those of the new ones, and relink the text layers that used a removed style.

## 0.9.0

### Minor Changes

- a9afec2: Add the card fonts: `font.card.<size>-title`, `font.card.<size>-subtitle` and `font.card.<size>-body` for the `large`, `medium` and `small` card sizes. Each references a base token of the text family, so the title is one step larger than the body and the subtitle one step smaller, in the `strong` weight. Nothing is removed or renamed.

  - Web: the typography maps `$cx-font-card-medium-title` to `$cx-font-card-small-body` in `main.scss`
  - iOS: a constant per property, such as `FontCardMediumTitleFontFamily` and `FontCardMediumTitleFontSize`, in `ChassisTokens.swift`, `String.swift` and the number files
  - Android: a resource per property, such as `font_card_medium_title_font_family` and `font_card_medium_title_font_size`, in `main.xml`, `string.xml`, the number files and the `res/` tree

### Patch Changes

- e7e906d: Add the `--clean` option to the build. The build writes files but deletes none, so a file it no longer writes, such as the number file of a removed screen or the image set of a removed icon, stayed in `dist/`. `pnpm tokens --clean` deletes `dist/<platform>/<app>/<brand>/` of each selected brand, app and platform before building, and `--dry-run` lists those directories. It fails with `--theme` or `--screen`, which rebuild only some files of a directory. The files of the package do not change.
- 8fa1425: The fonts of the `chassis` brand change in value. No name is added, removed or renamed, and an app has nothing to change.

  - `typography.fontFamily.display` is Montserrat (`'Montserrat', system-ui, -apple-system, Helvetica, Arial, sans-serif`) instead of Archivo Narrow, so every `font.display.*` style changes with it
  - `font.html.h1` to `font.html.h6` and the `jumbo`, `hero` and `heading` contexts use the display family, Montserrat, instead of the text family, Inter
  - `font.context.lead` is Light (`300`) instead of Regular (`400`)
  - `font.context.jumbo` and `font.context.hero` tighten their letters by 2.5 and 1.5 pixels (`-0.15625rem` and `-0.09375rem` on the web), where they had no letter spacing
  - The web quotes the first family of `text` and `code` (`'Inter'` and `'Fira Code'`), as it does for the families with a space in their name. iOS and Android print the same names as before

- 2f73a83: Fix the build without screens. With `screens` empty or left out of `chassis.build`, the build failed with `No token sets for chassis_docs_light in source/$themes.json` unless the screen group was also removed from `source/$themes.json`. It now takes the token sets of the first screen in `source/$themes.json`, as the build did before 0.6.0, and writes one number file without a screen suffix: `number.scss`, `Number.swift` and `number.xml`. The committed configuration and its files do not change.
- 7ba2f86: Fix the web letter spacing, which tightened text several times more than iOS, Android and Figma. The web divided the pixels by 16 and printed ems, which CSS multiplies by the font size of the text: `font.website.hero-title` printed `-0.0625em`, 4 px at its 64 px font size, where its token says 1 px. The web now prints letter spacing in its size unit, as the other sizes, so it is the same number of pixels as on iOS, Android and in Figma. No name changes; these values do:

  - The `letter-spacing` of every typography map is in the size unit: `-0.0625rem` for `font.website.hero-title` in `web` and `web-scss`, where it was `-0.0625em`, `-1px` in `web-px` and `-0.0625vw` in `web-vw`. A letter spacing of zero prints `0rem` (`0px`, `0vw`), where it printed `0em`
  - The letter spacing tokens, `$cx-typography-letter-spacing-*`, are in the size unit too: `0rem` where they printed `0em`
  - `typography.letterSpacing.context.jumbo` references `typography.letterSpacing.text.mass`, as `context.hero` does, instead of `size.unit.nd05`, so `font.context.jumbo` no longer tightens its letters on any platform
  - A letter spacing in percent prints on every platform: in `em` on the web and Android, and in points of the font size on iOS. The source writes pixels, because Figma variables cannot hold a percentage, and `pnpm tokens:lint:source` fails on a letter spacing in percent or in `em`

## 0.8.0

### Minor Changes

- 2826c94: **Breaking:** `typography.fontFamily.html` is removed and replaced by one family per group of HTML elements, and the text case and text decoration tokens are removed. A brand can retune the context text styles, `font.context.*`, as it can the HTML elements, and set each group of HTML elements in its own family. Every font token keeps its value in every brand and on every platform, and no other name is removed.

  - Removed `typography.textCase.base.none`, `typography.textCase.base.lowercase`, `typography.textCase.base.uppercase` and `typography.textCase.base.capitalize` (`$cx-typography-text-case-base-none`, `TypographyTextCaseBaseNone`, `typography_text_case_base_none`, `typographyTextCaseBaseNone`, and so on for each keyword)
  - Removed `typography.textDecoration.base.none`, `typography.textDecoration.base.underline` and `typography.textDecoration.base.line-through` (`$cx-typography-text-decoration-base-none`, `TypographyTextDecorationBaseNone`, `typography_text_decoration_base_none`, `typographyTextDecorationBaseNone`, and so on for each keyword)
  - Removed `typography.fontFamily.html` (`$cx-typography-font-family-html`, `TypographyFontFamilyHtml`, `typography_font_family_html`, `typographyFontFamilyHtml`), and the custom property `--font-family-html` that the maps of `font.html.*` named in the `web` platform. Use the family of the element group instead: `typography.fontFamily.html.heading` for the headings, `typography.fontFamily.html.body` for the body, and so on
  - Added `typography.fontFamily.html.<element>` (`$cx-typography-font-family-html-heading`, `TypographyFontFamilyHtmlHeading`, `typography_font_family_html_heading`, `typographyFontFamilyHtmlHeading`) for `heading`, `body`, `paragraph`, `blockquote`, `list`, `cite` and `code`, the names of `typography.fontWeight.html.*`. Each references `typography.fontFamily.text`, and `code` references `typography.fontFamily.code`, as `font.html.code` did. The `sinefil` brand sets every group except `code` in its display family, as it set `typography.fontFamily.html` before
  - Added `typography.fontFamily.context.<role>` (`$cx-typography-font-family-context-title`, `TypographyFontFamilyContextTitle`, `typography_font_family_context_title`): one family per role, shared by its sizes, for `jumbo`, `hero`, `lead`, `heading`, `title`, `body`, `highlight`, `label`, `link`, `expired` and `code`. Each references `typography.fontFamily.text`, and `code` references `typography.fontFamily.code`
  - Added `typography.fontWeight.context.<role>` (`$cx-typography-font-weight-context-title-weight`, `TypographyFontWeightContextTitleWeight`, `typography_font_weight_context_title_weight`): one weight per role, shared by its sizes, for the same roles as the families. Each references the weight that every size of the role used before
  - Added `typography.fontSize.context.<role>` for every context token: `jumbo`, `hero`, `lead`, `heading`, and `title`, `body`, `highlight`, `label`, `link`, `expired` and `code` with their sizes, such as `title-medium`
  - Added `typography.lineHeight.context.<role>` for the same roles and sizes except `jumbo` and `hero`, whose line height stays a percentage of their font size
  - Added one letter spacing per weight of the `text` and `display` families, `typography.letterSpacing.text.<weight>` and `typography.letterSpacing.display.<weight>` (`$cx-typography-letter-spacing-text-strong`, `TypographyLetterSpacingTextStrong`, `typography_letter_spacing_text_strong`), for `normal`, `strong`, `mass` and `elegant`. `font.text.*`, `font.display.*` and `font.website.*` reference the letter spacing of their weight
  - Added `typography.letterSpacing.html.<element>`, for the element groups of the families, and `typography.letterSpacing.context.<role>`, one per role and shared by its sizes like the family and the weight. Each references the letter spacing of the weight of its group or role; `typography.letterSpacing.context.jumbo` keeps its negative size
  - Moved `typography.letterSpacing.base.zero` and `typography.paragraphSpacing.base.*` from `base/app-base` to `base/brand-base`, with the same names and values, so a brand can change them. `font.code.*` keeps `typography.letterSpacing.base.zero`

  An app that uses `typography.fontFamily.html` under one of its names must replace it with the family of an element group. An app that uses a text case or text decoration constant uses the keyword instead, which the constant held. A font token names its text case and text decoration as a keyword where it is not `none`, such as `"textDecoration": "underline"` in `font.context.link.*`, and every font token still has the text case and text decoration parts on every platform, with the same values: the build fills in `none`. A brand token set that overrides `typography.fontFamily.html` overrides the families of the groups instead. A brand that sets a group or a role in another family also points its weight and its letter spacing at those of that family, such as `{typography.fontFamily.display}` with `{typography.fontWeight.display.mass}` and `{typography.letterSpacing.display.mass}` for the `hero` role.

  The maps of `font.context.*` and `font.html.*` in the `web` platform name no new custom property: a part that references a role token names the token the role points to in the brand, so the context maps print what they printed before, and the HTML maps print `var(--font-family-text)` or `var(--font-family-display)` where they printed `var(--font-family-html)`. A role that holds a value of its own prints the value. Chassis CSS must stop reading `$cx-typography-font-family-html` before an app updates: Chassis CSS 0.7.2 does not compile with this version. The presets `web-scss`, `web-px` and `web-vw` print the same values as before, and with `outputReferences` they name the new variables.

- b91fa03: **Breaking:** the `brand` and `accent` palettes are removed, with the gradients and the elevation shadows that used them. No other token referenced them.

  - Removed `color.primitive.brand.*` and `color.primitive.accent.*` (`$cx-color-primitive-brand-50`, `ColorPrimitiveBrand50`, `color_primitive_brand_50`): the 25 colors of each palette, in the light and the dark theme
  - Removed `color.base.primitive.<theme>.brand.*` and `color.base.primitive.<theme>.accent.*` (`$cx-color-base-primitive-light-brand-50`, `ColorBasePrimitiveLightBrand50`, `color_base_primitive_light_brand_50`): the 25 base colors of each palette, for the `light` and the `dark` theme
  - Removed `gradient.primitive.brand.*` and `gradient.primitive.accent.*` (`$cx-gradient-primitive-brand-l-50-000`, `GradientPrimitiveBrandL50000Angle`, `gradient_primitive_brand_l_50_000_angle`): the 8 gradients of each palette
  - Removed `shadow.elevation.brand.*` and `shadow.elevation.accent.*` (`$cx-shadow-elevation-brand-10`, `ShadowElevationBrand101Blur`, `shadow_elevation_brand_10_1_blur`): the 11 levels of each context

  No other name or value changes. An app that uses one of these names must replace it. In the `default` and `chassis` brands, `brand` had the base color of `primary` and `accent` that of `secondary`, so those palettes give the same colors. An app that uses none of the names has nothing to change.

### Patch Changes

- 3cfdc6e: The build configuration, `chassis.build`, is in the `package.json` at the root of the repository instead of `packages/tokens/package.json`, next to the token files in `source/`. The published `package.json` no longer has the `chassis` key. No token name, value or file changes, and an app that installs the package has nothing to change.

  A repository that owns its tokens moves its `chassis` key to the root `package.json`. Until then the build stops with `Invalid package.json: missing required chassis.build configuration at the root of the repository`. `--config` still takes a path relative to `packages/tokens/`.

- 44066bb: The colors of the `chassis` brand, the link and highlight colors of the contexts, the hover color of a table row and the heading weight of the `sinefil` brand change in value. No name is added, removed or renamed, and an app has nothing to change.

  - `chassis` brand: new base colors for `primary` (`#00A4CC` to `#0094B8`), `neutral` (`#6F8085` to `#7B878E`), `danger` (`#F52314` to `#D72A1D`), `success` (`#10C263` to `#1A9E4F`), `warning` (`#F5A300` to `#F0A205`) and `info` (`#1414F5` to `#3A72E4`). Every color made from them changes with them
  - Light theme: `fg-highlight` of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts is one step darker (`70` instead of `60`), and the four link colors of the `alternate` context use the lighter steps `20` to `40`
  - Dark theme: the four link colors of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts are one step stronger (`link-main` and `link-active` at `30`, `link-hover` at `20`, `link-visited` at `40`)
  - `color.table.bg-hover` references `color.context.default.dim-slight`, a translucent layer over the row, instead of `color.context.default.bg-evident`
  - `sinefil` brand: `typography.fontWeight.html.heading` is the `display.strong` weight, so `font.html.h1` to `font.html.h6` are Semi Bold (`600`) instead of Bold (`700`)

## 0.7.0

### Minor Changes

- 40bbc73: A brand can set the alphas of its color roles, and the subtle text of the colored contexts has an alpha of its own.

  - New token `opacity.context.fg-a11y` (`$cx-opacity-context-fg-a11y`, `OpacityContextFgA11y`, `opacity_context_fg_a11y`): the alpha of the `fg-subtle` colors of the `primary`, `secondary`, `neutral`, `danger`, `success`, `warning` and `info` contexts, which had the alpha of `opacity.context.fg-subtle`
  - `opacity.context.*` references the new `opacity.base.context.*` in `source/base/brand-base.json`, which a brand overrides in its own token set. The build does not write `opacity.base.context.*`; the names and the format of the output stay as they are
  - `opacity.context.fg-subtle` and `opacity.context.icon-subtle` are higher, and so is the alpha of every `fg-subtle` and `icon-subtle` color
  - In the dark theme, `fg-main`, `fg-highlight`, `link-main`, `link-hover` and `link-active` of the same seven contexts are lighter shades of their palette, and so are the colors that reference them

  No name is renamed or removed, so an app has nothing to change.

- 3fb0d2c: The grid tokens hold the page margin and the number of columns of each breakpoint, and the gutters have new values.

  - New tokens `grid.margin.xsmall` to `grid.margin.2xlarge` (`$cx-grid-margin-xsmall`, `GridMarginXsmall`, `grid_margin_xsmall`): the margin of the page at each breakpoint, a size like `grid.gutter.*`
  - New tokens `grid.columns.xsmall` to `grid.columns.2xlarge` (`$cx-grid-columns-xsmall`, `GridColumnsXsmall`, `grid_columns_xsmall`): the number of columns of the layout grid at each breakpoint, a number without a unit. On Android it is an `<integer>` resource, and an `Int` in Compose
  - `grid.gutter.*` changed in value: `xsmall` is 16 design pixels where it was 8, and `large`, `xlarge` and `2xlarge` are 24, the value of `medium`, where they were 32, 40 and 48. `grid.margin.*` holds the same values as the gutters

  No name is renamed or removed. An app that uses `grid.gutter.*` gets the new gutters and has nothing to change.

## [0.6.0] - 2026-09-27

The token build was rewritten on Style Dictionary 5.5, and the iOS and Android output was fixed so that it compiles and holds values the platforms can use. The web SCSS output keeps its format; the tokens it renames, removes and corrects are listed below. The npm package now holds the iOS and Android files too.

### Breaking changes

All platforms:

- `size.nav-left.wdith-collapsed` is now `size.nav-left.width-collapsed`: `$cx-size-nav-left-width-collapsed`, `SizeNavLeftWidthCollapsed`, `size_nav_left_width_collapsed`. Rename it where you use it
- `borderWidth.context.none`, `thin` and `thick` are removed. They held the same widths as `zero`, `small` and `xlarge`; use those instead
- The build no longer writes the groups that exist for Figma only: `figma.*` (`$cx-figma-website-size-page-w` and the other `figma.website.*` tokens) and `bg-blur.*` (`$cx-bg-blur-default`, `BgBlurDefaultColor` and their other parts). Nothing replaces them in the output; they stay in the token source for Figma

Web:

- `$cx-space-website-content-headers-gap` in `number-small.scss` is now `$cx-space-website-content-header-gap`, the name the medium and large files use. Rename it where you use it
- `package.json` has an `exports` map, so Node and bundlers resolve only `@chassis-ui/tokens/dist/…` and `@chassis-ui/tokens/package.json`. Every `dist/` path works as before; import nothing else from the package

iOS:

- Each file declares its own type, and `Main.swift` is now `ChassisTokens.swift`. The types are `ChassisTokens` (main file), `ChassisTokensString`, `ChassisTokensColorLight`, `ChassisTokensColorDark`, `ChassisTokensNumber<Screen>` and the new `ChassisTokensColor`. They are caseless `enum`s without `@objc`, not classes. Replace `ChassisTokens.X` from a color, number or string file with that file's type, such as `ChassisTokensColorLight.ColorContextDefaultBgMain`, or use `ChassisTokensColor` for colors that follow dark mode
- Font weights are `UIFont.Weight` (`UIFont.Weight.regular`), not `String` (`"regular"`). Pass them to `UIFont.systemFont(ofSize:weight:)` directly and remove any name-to-weight mapping
- Line heights that are a percentage in the design are points (`CGFloat(120)` for a 96 pt font at 125%), not the percentage (`CGFloat(125)`). Use the value as the line height
- Gradient tokens are an `…Angle`, and a `…Stop<N>Color` and `…Stop<N>Position` per stop. The single gradient constant, which held the first stop color only, is gone

Android:

- Opacity and letter spacing tokens are `<item type="dimen" format="float">`, not `<integer>` (which did not compile). Read them with `ResourcesCompat.getFloat(resources, R.dimen.…)`, and reference them as `@dimen/…`
- Font weights are `<integer>` from 100 to 900 (`400`), not `<string>` (`regular`). Read them with `resources.getInteger(R.integer.…)`
- Letter spacing of typography tokens is in ems of the font size (`-0.0052`), not design pixels (`-0.5`). Pass it to `TextView.setLetterSpacing` or `android:letterSpacing` as it is. The standalone letter spacing scale stays in pixels
- Line heights that are a percentage in the design are `sp` (`120sp`), not the percentage (`125sp`)
- Gradient tokens are an `…_angle`, and a `…_stop_<n>_color` and `…_stop_<n>_position` per stop, instead of one color resource

Build:

- The build needs Node.js 22 or later, and `engines` says so. npm and pnpm warn when a project that installs the package runs an older Node.js; they refuse only with `engine-strict`

### Presets for other CSS frameworks

The presets for teams that do not use Chassis CSS are kept, in the new structure: `web-px`, `web-vw`, the `cx/scss-variables` format, and `outputReferences` for SCSS and Android. Their output is the same as before, with these fixes:

- `web-px` typography maps divide the letter spacing by the base font size, as `web-vw` does: `-0.5px` prints `-0.0313em`, not `-0.5em`
- Android references are printed only when they compile and keep the value. 30 lines now print their value: 16 letter spacing references to a `<dimen>` as `@integer/…`, 8 font sizes in `sp` that referenced a size in `dp`, and 6 `rgba()` colors that referenced another element or lost their alpha
- A SCSS variables reference to a variable that no file declares fails the build

`outputReferences` now also works on iOS (new): a Swift constant names another constant of the same class, such as `SizeUnit4 = DimensionBase4`, with the same rule as Android.

### Changed

- Upgraded to Style Dictionary 5.5 and `@tokens-studio/sd-transforms` 2.0; the build now needs Node.js 22 or later
- Moved platform value encoding (`UIColor(…)`, ARGB colors, `sp`/`dp`, quoting, `em` units, `var(--…)` references) out of the output templates into tested modules (`build/values/` and the web reference policies), which run on fully resolved tokens
- Build one Style Dictionary instance per token-set list instead of one run per file group: a full build runs 16 builds instead of 36 and takes about 6 s instead of 20 s
- Replaced the copy of the sd-transforms preprocessor with the official type alignment plus the Chassis steps (letter spacing as a number, splitting every font weight into weight and style)
- The file header reads the version from `package.json`
- `--dry-run` lists the builds and the files each would write
- The build fails on a broken token reference, and when `source/$themes.json` has no token sets for a configured brand, app, theme or screen
- Replaced the mock-based tests with tests on real tokens and `dist/`
- The npm package holds all of `dist/`: the iOS and Android files (Swift, XML, the icon asset catalog and drawables) as well as the web SCSS. It held the SCSS files and the asset catalog's `Contents.json` files only
- `package.json` has an `exports` map: `@chassis-ui/tokens/dist/*` and `@chassis-ui/tokens/package.json`. Every `dist/` path resolves as before; other paths in the package no longer resolve through Node
- `pnpm check` fails when one of its steps fails; it ran them in the background and always passed
- Updated the dev dependencies within their ranges, among them Astro 7.3, so `pnpm audit` reports no advisory (it reported 39, one critical). The token build packages (Style Dictionary, sd-transforms, svg2vectordrawable, tinycolor2) and the Chassis CSS and docs packages the site uses kept their versions
- The release workflow publishes only after the CI checks pass on the same commit, installs with `--frozen-lockfile`, and pins its actions to commit SHAs
- Releases use Changesets: a pull request that changes the package adds a changeset, and the release workflow turns them into a "Version Packages" pull request that bumps the version and writes this CHANGELOG. The package is published with npm trusted publishing (no npm token) and provenance, and the GitHub release holds the CHANGELOG entry
- The repository is a pnpm workspace: this package is built and published from `packages/tokens/`, with only the build's dependencies, and the documentation site is a separate private package in `packages/site/`. The token files are in `source/`, the build in `build/` and its tests in `test/` of the package. The npm page shows a README for the package instead of the repository's. The package contents did not change

### Added

- The web color files, `color-<theme>.scss`, hold every shadow token with the colors of their theme, so a dark theme has dark shadows: `$cx-shadow-glow-primary` is `#40bbd9` in `color-dark.scss`. `main.scss` keeps the shadows of the first theme. iOS and Android already had the color parts of the shadows in their color files
- `pnpm tokens:verify`: builds into `dist-next/` and compares every file with `dist/`; the release workflow runs it before publishing. It also fails on a reference that names nothing the output declares
- `--out <dir>` build option
- `web-scss` platform: SCSS variables with resolved values in rem units, for CSS frameworks other than Chassis CSS
- `chassis.build.options`: Style Dictionary options by platform, such as `outputReferences`
- `--config <file>` build option, to read the build configuration from a JSON file
- `pnpm tokens:verify:presets`: checks each preset against its baseline in `test/golden/`
- `ios-swiftui` and `android-compose` platforms: Swift files with SwiftUI values and Kotlin objects for Jetpack Compose, with the same tokens and values as `ios` and `android`, written to `dist/ios-swiftui/` and `dist/android-compose/`
- `outputReferences` for the iOS format: a constant names another constant of the same class when it has the same type and value; base colors and sizes computed with math print their values
- CI for pull requests (`.github/workflows/ci.yml`): token lint, tests and golden checks on Node.js 22 and 24, the site lint and build, and `pnpm audit`
- A Swift package: `Package.swift` at the root of the repository has one library for every app and brand with an iOS platform, `ChassisTokensDemoChassis` and `ChassisTokensDemoSinefil`, on the files of `dist/ios/` with the icon catalog as a resource. iOS apps install the tokens with Swift Package Manager from the repository's URL and the version's tag. `pnpm tokens:swift-package` writes the manifest from `chassis.build`
- An Android library: every GitHub release has the `res/` tree of each app and brand as `chassis-tokens-<app>-<brand>-<version>.aar`, with the resources in `chassis.tokens.R`. `pnpm tokens:aar` builds them
- Native compile checks, run in CI when the tokens, the build or the output change, and before every release: the Swift files against the iOS simulator SDK, the asset catalogs with `actool` and a sample that uses the Swift package (`pnpm tokens:native:ios`, needs Xcode), and the Android resources, the Compose objects and a sample app that uses the Android library against the Android SDK and Jetpack Compose (`pnpm tokens:native:android`, a Gradle project in `test/native/android/`)
- Type checking of the build code (`pnpm tokens:typecheck`, TypeScript `checkJs` on `build/`), run in CI
- A token source lint (`pnpm tokens:lint:source`, `build/lint-tokens.js`), run in CI: it names the token set and token when the themes or screens declare different names, a name is unusable on a platform or collides with another, a font weight is unknown, a token has no type, or one name has two types
- A token diff report (`pnpm tokens:diff`, `build/diff.js`): the names added, removed, renamed and changed in value in each `dist/` file against another branch or commit. CI writes it to the job summary of every pull request
- Dependabot for npm packages and GitHub Actions, weekly
- `pnpm lint:prettier`: Prettier on the whole repository

### Removed

- The unused `cx/typography/web` and `cx/test` transforms, the `cx/test` format and the `cx/colorTokens` filter
- The `site:lint:vnu` script and the `vnu-jar` dependency, which `html-validate` replaced, and the `tokens:zip` script
- The `check:lockfile` script and the `lockfile-lint` dependency: it read `package-lock.json`, which this pnpm repository does not have

### Fixed

- Level `05` of `shadow.elevation.<context>` in the ten contexts other than `default` has a spread of `{dimension.base.nd05}` in its second layer. The spread was `-0.5` without a unit, so the web printed an invalid `box-shadow` (`0.125rem -0.5 rgba(…)`); it is now `-0.03125rem`. iOS and Android keep `-0.5`
- `space.unit.136` is 136 (`8.5rem`), not 128: it referenced `dimension.base.128`
- `size.modal.window-small-h` is 360 (`22.5rem`), not 640, which was taller than the medium (480) and large (600) windows
- `space.website.section-padding-y` is 64 on the large screen and 48 on the medium screen; they were 48 and 64, so the medium screen had the largest padding
- `shadow.glow.*` follows the theme: each glow references `color.context.<context>.base-color`, or `fg-main` for `default` and `alternate`. It referenced the light palette, so the glows of the dark theme had the light colors
- The dark theme declares `color.context.primary.bg-solid`, `color.utility.container-prototype` and `color.utility.container-flow`, as the light theme does. `primary.bg-solid` referenced the light palette in the dark theme; the values of the current brands do not change
- `font.html.list` references the list tokens, `typography.fontWeight.html.list`, `typography.fontSize.html.list` and `typography.lineHeight.html.list`, not those of `body`. The values do not change; on the web the map names `var(--font-weight-html-list)`, `var(--font-size-html-list)` and `var(--line-height-html-list)`, which Chassis CSS declares
- The iOS and Android main files have the color of each layer of `shadow.context.*`, such as `ShadowContextSmall1Color` and `shadow_context_small_1_color`, next to its other parts. The filter of the main file left them out with the context colors
- Web sizes that reference another size are not rounded: `size.unit.05` is `0.03125rem`, as `dimension.base.05` is, not `0.0313rem`. The steps of half a pixel and the shadows and radii that use them change in the fourth and fifth decimal
- A filter value that the configuration does not have, such as `--brand chasis`, fails the build and names the configured values; so do filters that select no build together, and a filter without a value. The build ran nothing and succeeded
- Android opacity and letter spacing tokens are float resources (`<item type="dimen" format="float">`) instead of `<integer>`. Android rejects fractions such as `0.4` in integer resources, so `main.xml` and the number files did not compile. Read them with `ResourcesCompat.getFloat`; references to them are `@dimen/…`
- Renamed `space.website.content.headers-gap` to `space.website.content.header-gap` in the small screen token set, so every screen declares the same name. On Android, the small screen had no value for `header-gap` in the default folder
- iOS and Android line heights that are a percentage in the design (`125%`, `150%`) are sizes of the typography token's font size: `FontContextJumboLineHeight` is `CGFloat(120)` and `font_context_jumbo_line_height` is `120sp`, not `125`. 9 typography tokens per file of `Main` and the number files
- Android letter spacing of typography tokens is in ems of their font size, which `TextView.setLetterSpacing`, `android:letterSpacing` and Compose's `em` take: `font_context_jumbo_letter_spacing` is `-0.0052`, not `-0.5`. The standalone letter spacing scale stays in design pixels
- iOS and Android font weights are weights instead of names: `UIFont.Weight.semibold` on iOS and `<integer>600</integer>` on Android, not `"semi-bold"`. They use the web's name map, so `Semi Bold` and `SemiBold`, which the tokens keep as each font's style name in Figma, are both 600. An unknown weight name fails the build
- iOS and Android gradient tokens are split into an angle and the color and position of each stop (`GradientPrimitiveBlackL000Angle`, `…Stop1Color`, `…Stop1Position`; `gradient_primitive_black_l_000_angle` and so on). They held only the first color stop, which is transparent for most gradients. The single gradient constant and resource are gone. With `outputReferences`, the stop colors name the colors they reference. A gradient that is not a `linear-gradient` with degrees or a side keyword fails the build
- Each iOS file declares its own type, so all seven files can be in one target: `ChassisTokens` in `ChassisTokens.swift` (was `Main.swift`, which Swift Package Manager took for an executable's entry point), and `ChassisTokensString`, `ChassisTokensColorLight`, `ChassisTokensColorDark` and `ChassisTokensNumber<Screen>` in the other files. Every file declared `class ChassisTokens`, so two files in one module did not compile. The types are caseless enums without `@objc`, which had no effect: the class was not visible to Objective-C. Write `ChassisTokensColorLight.ColorContextDefaultBgMain` instead of `ChassisTokensLight.ChassisTokens.ColorContextDefaultBgMain`
- New iOS file `Color.swift` with the type `ChassisTokensColor`: every theme color once, and a color that differs between the light and dark theme follows `userInterfaceStyle`. Apps no longer combine `ChassisTokensColorLight` and `ChassisTokensColorDark` themselves; both files stay. The build writes it after the other builds when the themes include `light` and `dark`, and fails when the two themes declare different color constants
- The Android build also writes a resource tree under `res/`: `values` (strings, base colors in `color_base.xml`, light colors, small screen numbers), `values-night` (dark colors), `values-sw600dp` (medium) and `values-sw840dp` (large). Apps add it as a Gradle resource folder instead of copying files with a script. The screen folders are set with `chassis.build.options.android.screens`; the build fails when a screen has no folder or not exactly one screen is in the default folder. The flat files stay
- The icon tokens are also icon assets: `Icons.xcassets` for iOS, with one vector image set per icon rendered as a template, and one vector drawable per icon in `res/drawable/` for Android, converted with `svg2vectordrawable` (new dev dependency). The string tokens stay
- iOS box shadows have a `…Radius` constant after their blur, half the CSS blur, for `CALayer.shadowRadius` (`ShadowContextSmall1Radius = CGFloat(4)`). The shadow color already carries the opacity: use it with `shadowOpacity = 1`
- The `sinefil` blockquote font weight is `Light Italic` instead of `Light Oblique`, the style name Figma and Google Fonts use for Source Serif 4. Its font style prints `italic` instead of `oblique` on web, iOS and Android
- Android string resources are escaped. The SVG icon tokens held raw markup, which Android's resource compiler drops, so every icon compiled to an empty string; now each compiles to its SVG text
- Rewrote the web, iOS and Android guides of the documentation site; their examples used token names and file setups that do not exist or do not compile

## [0.5.3] - 2026-09-25

### Fixed

- Removed the `modify.space` preset token and hardcoded `srgb` directly in each color's lighten/darken modifier, since Figma doesn't resolve token references inside a modifier's `space` property. `modify.lighten.*`/`modify.darken.*` value references are unaffected.

## [0.5.2] - 2026-09-24

### Changed

- Dark mode context base colors mapped to scale 40

## [0.5.1] - 2026-09-25

### Added

- Dedicated `borderRadius.base.*` tokens for the alert, dropdown (main/item), modal, and notification components, replacing shared `borderRadius.context.*` references
- Shared `modify.space`/`modify.lighten.*`/`modify.darken.*` preset tokens for color lighten/darken modifiers

### Changed

- Renamed the `example` brand to `sinefil` (`base/brand-example` → `brand-sinefil/brand-base`)
- Renamed the `metric-px` token set to `metric-source`
- Reworked brand color lighten/darken modify tokens to reference the shared `modify.*` presets instead of duplicating raw values per color
- Changed the segment component's active foreground/background colors from white/default-cue to the primary context's contrast/base colors

## [0.5.0] - 2026-09-19

### Added

- `demo-a` and `demo-b` brands, each with their own base, app, and (for `demo-b`) mobile/web/metric token sets
- `segment` component tokens (color, size, spacing, border-radius, and box-shadow) for a new segmented-control component
- `page.bg-body`/`page.bg-section` color tokens for the demo app

### Changed

- Set the default brand's `text`/`display` font families to Open Sans and Merriweather, and its `strong` font weight from Bold to SemiBold
- Abbreviated long-form scale-step names (e.g. `medium` → `md`, `xlarge` → `xl`) in generated `var(--...)` references for shadow, border-radius, and border-width tokens, matching chassis-css's own custom property names
- Reworked `alert`/context box-shadow tokens to reference shared `shadow.elevation.default.*` presets instead of duplicating drop-shadow layer definitions
- Corrected the package repository URL format in package.json (`git+https://...`)
- Upgraded `@chassis-ui/css` and `@chassis-ui/docs` to `0.5.0-0`

## [0.4.0] - 2026-08-25

### Changed

- Renamed `date-picker` component tokens to `datepicker` across base, brand, and theme token files
- Reduced datepicker day cell size from `size.unit.40` to `size.unit.32` and bound its border-radius tokens to a dedicated `borderRadius.base.datepicker` group instead of generic context tokens
- Renamed datepicker `menu-width` size token to `preset-width`
- Doubled the active pagination dot width (`dot-active-w`) from `size.unit.8` to `size.unit.16`
- Moved Pagefind's search index under a `tokens/pagefind` subdirectory (`site:pagefind` output and dev-server copy path) to match the site's production path prefix
- Reworked the dev-only Vite config in `site/src/libs/astro.ts` to alias `@chassis-ui/css` to its built JS entry and exclude `@chassis-ui/docs` from dependency optimization, preventing duplicate module instances during `astro dev`
- Replaced inline `<svg><use></svg>` icon markup in the homepage hero with the `@chassis-ui/docs` `Icon` shortcode
- Restructured `site/config.yml` social/org fields (`github_org`, `x` → `x_username`, added `figma_handle`) and updated the corresponding config schema
- Upgraded `@chassis-ui/docs` and other dependencies; bumped `pnpm/action-setup` and `softprops/action-gh-release` versions in the publish-release workflow

### Fixed

- Hero section "Get Started" clone command referencing the wrong repository

## [0.3.0] - 2026-07-04

### Added

- HTML validation build script (build/html-validate.js) replacing the vnu-jar based site:lint:vnu step
- Pagefind site search integration (pagefind.yml, site:pagefind script)
- Additional design token documentation content (border-radius, border-width, font, opacity, shadow, size, space, and typography tokens)
- `fg-active`/`bg-active` color tokens for every context role (default, alternate, primary, secondary, neutral, danger, success, warning, info, black, white)
- `4xlarge` border-radius scale step
- Explicit primary/secondary brand base colors for the chassis and example brands
- Alert component box-shadow token

### Changed

- Renamed homepage section components folder from sections/ to homepage/
- Refactored SCSS chassis-css and scss-variables build templates
- Reworked site/src/libs/astro.ts, config.ts, data.ts, and shortcode.ts helpers
- Replaced Prism code highlighting with Shiki
- Updated Astro, PostCSS, and TypeScript configuration for the docs site
- Renamed `color.*.palette.*` token group to `color.*.primitive.*` across base, theme, and effect tokens
- Consolidated pixel-based border-radius presets (`round`, `round-8` … `round-96`) into a single `full` token
- Updated breakpoint and container sizing scale to standard values (breakpoints 992/1200/1400 → 1024/1280/1536; containers 1140/1320 → 1200/1440)
- Replaced elevation-based box-shadow references (`shadow.elevation.default.*`) with semantic `shadow.context.small/medium/large` tokens
- Redesigned chevron-down icon asset used by the accordion indicator, button caret, and select caret
- Reassigned progress, tab, and edit component color roles from primary/neutral contexts to default/warning contexts
- Split `large-gap`/`small-gap` spacing tokens into `-main` and `-body` variants; adjusted dropdown and modal padding/gap values
- Regenerated all distribution files and token theme definitions for Android, iOS, and web platforms
- Refreshed getting-started and use-in-project documentation (Figma Variables, Style Dictionary, Tokens Studio, Android/iOS/Web application guides)

### Removed

- Unused site shortcodes and libs: Code.astro, Example.astro, ResponsiveImage.astro, chassis.ts, placeholder.ts, prism.ts, algolia-plugin.js
- Unused static scripts: example-mode.js, validate-forms.js
- `preview` root script (superseded by `astro:preview`)
- `brand` and `accent` semantic color contexts (primitive-level brand/accent color scales remain available)
- Chassis brand-specific modal spacing overrides (now inherit from base tokens)

## [0.2.0] - 2026-05-11

### Added

- GitHub Actions publish-release workflow (.github/workflows/publish-release.yml)
- Token distribution zip build script (build/zip-tokens.js) and `tokens:zip` script

### Changed

- Upgraded Astro, ESLint, and related devDependencies
- Switched `@chassis-ui/css` and `@chassis-ui/docs` from git branch references to published npm versions
- Refactored website sections and homepage copy
- Updated package descriptions and site configuration

### Removed

- Legacy release workflow (.github/workflows/release.yml)
- Unused site assets: application.js, color-modes.js, search.js, sidebar.js, snippets partials, Blockquote.astro, window.d.ts, docs-versions.yml, versions.astro

## [0.1.4] - 2026-04-16

### Added

- IntroSection component for homepage
- Brand-specific token configuration (brand-chassis/brand-base.json)

### Changed

- Reorganized website components into dedicated sections/ folder
- Renamed section components for consistency (SectionHero, SectionFeatures, SectionHow, etc.)
- Updated brand tokens structure and values
- Regenerated all distribution files for Android, iOS, and web platforms
- Improved README documentation
- Refactored homepage layout and structure

### Removed

- HOMEPAGE_COPY_REVIEW.md documentation file
- CoreSection component (replaced by IntroSection)
- Deprecated index2.astro page

## [0.1.3] - 2026-04-12

### Added

- Comprehensive homepage copy review and recommendations (HOMEPAGE_COPY_REVIEW.md)
- FeatureCard component implementation across all homepage sections

### Changed

- Standardized all homepage sections to use FeatureCard component
- Unified icon naming convention to cx- prefix (cx-clock, cx-check-circle, cx-code, etc.)
- Updated SectionTeams, SectionFeatures, SectionRoles, SectionHow, SectionTech to use Fragment slots
- Improved homepage copy to be pre-launch appropriate (removed customer claims)
- Enhanced hero messaging to emphasize automation and consistency

### Fixed

- Icon references from old naming (-outline suffix) to standardized cx- prefix
- Slot implementation from div to Fragment for proper Astro component usage

## [0.1.2] - 2026-04-11

### Fixed

- Website screen tokens font size and spacing references
- Token naming consistency for content layout gaps

### Changed

- Regenerated distribution files for Android and iOS platforms
- Updated example brand distribution files

## [0.1.1] - 2026-04-08

### Added

- Astro-based documentation site with comprehensive guides
- Documentation for Tokens Studio, Style Dictionary, Figma Variables
- Quick start guide and color tokens documentation
- Border radius base tokens
- Screen-specific tokens (small, medium, large)

### Changed

- Upgraded to Style Dictionary v4 with complete build system refactor
- Improved build system with enhanced format templates
- Updated SCSS variable and CSS templates with prefix support
- Changed build output path to `platform/app/brand/`
- Enhanced sync-submodules.js script
- Improved change-version.js with better error handling and validation
- Moved font weights and line heights to brand group
- Updated package name to `@chassis-ui/tokens`

### Fixed

- SCSS variables template font token output
- Mode switches for default brand
- Button color tokens
- Badge padding and size issues
- Unknown flag detection in version script
- File count summary to include package.json

## [0.1.0] - 2025-02-15

### Initiated

- Initial setup of project structure.
- Added basic configuration files.
- Created initial set of tokens.
- Set up version control with Git.
- Project licensed under the MIT license.

# Chassis Tokens architecture

How the token build of `@chassis-ui/tokens` works, why it is built this way, and what it promises to write. It is for contributors who change the build in `packages/tokens/build/` or the output in `packages/tokens/dist/`. How to set up the repository, run the checks and open a pull request is in [CONTRIBUTING.md](../.github/CONTRIBUTING.md).

Paths below are relative to `packages/tokens/` unless they start with the repository root.

## The build in one picture

```
source/$themes.json ─┐
source/<set>.json ───┤
package.json ────────┘  chassis.build: brands, themes, screens, apps, options
        │
        ▼
build.js            permutateThemes → one token-set list per brand, app, theme and screen
                    planBuilds      → one Style Dictionary instance per token-set list,
                                      with one platform per target platform of the app
        │
        ▼ for each instance
preprocessor.js     align types, split font weights, number tokens in source order
transforms.js       names, math, color modifiers, web units and shadows (before resolution)
  (Style Dictionary resolves references)
filters.js          which tokens go into which file
formats.js          one line per resolved token, from values/ and the reference policies
icons.js            actions: the Xcode asset catalog and the Android vector drawables
        │
        ▼ after every instance
theme-colors.js     Color.swift, from the light and dark color files
```

`node build/build.js --dry-run` prints the plan: the instances, the files each writes, and the files written after the builds.

## Design decisions

### Platform values are encoded after resolution, in pure functions

Encoding a value means turning a resolved token into its final text: `UIColor(…)`, an ARGB hex color, `sp` and `dp`, `CGFloat(…)`, quotes, escapes, references.

This cannot be a Style Dictionary value transform. Style Dictionary transforms a referenced token before it resolves the tokens that reference it. Many color tokens are `rgba({color}, {opacity})` or apply a Tokens Studio lighten or darken modifier to another color; if that color were already `UIColor(…)`, they would receive `UIColor(…)` as their input. Registering the iOS color encoding as a transform fails the build with `Invalid color: rgba(UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 1), 0)`.

So:

- **Transforms do only what is safe before resolution**: names (`name/kebab`, `name/pascal`, `name/snake`, `name/camel`), `ts/resolveMath`, `ts/color/modifiers`, `ts/color/css/hexrgba`, and on the web `ts/typography/fontWeight`, `cx/shadow/web` and one of `cx/size/rem`, `cx/size/px` or `cx/size/vw`. Transforms are transitive, so `ts/resolveMath` also parses a size that references another, already in `rem`; the web platforms set its `mathFractionDigits` to 10, as sd-transforms would round that size to four decimals.
- **`values/` encodes**: `ios.js`, `swiftui.js`, `android.js`, `compose.js` and `web.js`, with the rules they share in `shared.js`. Each exports pure functions that take a resolved token and return a string. They do not import Style Dictionary, and the tests call them directly.
- **Templates only print**: a header, one line per token from the encoder or the reference policy, and a footer. `templates/constants.js` builds the constant list of the Swift, SwiftUI and Compose files once, for all three.

### One Style Dictionary instance per token-set list

Style Dictionary takes `source` only at the top level of its configuration, so every platform of one instance sees the same tokens. `planBuilds` groups the outputs of a brand and app by the token-set list they need: the base files (main and string) and the files of the first theme and first screen share one list, and every other theme and screen adds one. With two themes and three screens that is four instances per brand and app, 16 for the configuration, which build in about 6 seconds:

| Token-set list | Files                                     |
| -------------- | ----------------------------------------- |
| light + large  | main, string, light colors, large numbers |
| dark + large   | dark colors                               |
| light + medium | medium numbers                            |
| light + small  | small numbers                             |

Each instance lists its sets in the order `permutateThemes` returns them from `source/$themes.json`, so later sets override earlier ones as in Tokens Studio. Style Dictionary logs these overrides as token collisions in every build (20 to 34 for a light list, 714 to 728 for a dark one); they are expected.

### Tokens are printed in source order

Style Dictionary 5 keeps tokens in a map and appends the parts of an expanded typography or shadow token at the end. The preprocessor numbers every token in source order (`$extensions.chassis.sourceOrder`), and every format sorts by that number (`inSourceOrder` in `formats.js`), so a file lists its tokens in the order of the token sets and an expanded token's parts stand where the token was.

### Every font weight is split into weight and style

`alignTypes` from sd-transforms aligns the Tokens Studio types, turns `text` into `content` and shadow `x` and `y` into `offsetX` and `offsetY`. The preprocessor adds three things on top:

- Letter spacing tokens are typed `number`, not `dimension`, so size transforms leave them alone.
- Every `fontWeight` token becomes a group of two tokens, `<name>.weight` and `<name>.style` (`Light Italic` becomes `Light` and `italic`; a weight without a style gets `normal`). sd-transforms splits only the weights that name a style, so the output would otherwise depend on the spelling of each weight.
- A typography token that references its font weight stores the path of that weight as segments (`fontWeightPath`), not as a reference: after the split the weight is a group, and Style Dictionary 5 fails the build on a reference to a group.

### Presets are configuration, references are a policy

An adopter selects a preset by its platform name in `chassis.build.apps`, and sets options per platform in `chassis.build.options`, which the build merges into the Style Dictionary options of that platform:

```json
"apps": { "demo": ["ios", "android"] },
"options": { "ios": { "outputReferences": true } }
```

The presets reuse the platform configurations: `web-px`, `web-vw` and `web-scss` call `webConfig()` of `config/web.js` with another unit and format, and `ios-swiftui` calls `swiftConfig()` of `config/ios.js` with another format. No preset has a template of its own.

Which tokens print a reference instead of a value is decided by pure functions too: `reference-policy.js` holds the rules the two web formats share, `css-var-policy.js` and `scss-var-policy.js` the names each prints, and `reference(token, target)` in each mobile encoder the rule of its platform. The templates pass the token lookups in.

### A reference is printed only when it is safe

With `outputReferences`, a mobile token names the token it references only when the reference compiles and keeps the value: the target is in the same file, the token is not a base color and not a size computed with math, and the target encodes to the same text (on Android, also to the same resource kind). Otherwise it prints its value. Without this rule, references to colors drop the alpha of `rgba({color}, {opacity})` tokens, and font sizes in `sp` name sizes in `dp`.

### The colors that follow dark mode are written after the builds

The light and dark color files come from two instances, so no format sees both themes. The iOS format records the constants of each theme's color file in `theme-colors.js`, and `build.js` writes `Color.swift` after the last instance: a constant whose light and dark values differ becomes `UIColor { $0.userInterfaceStyle == .dark ? <dark> : <light> }`, and one whose values are equal keeps its value. The build fails when the two files declare different names, or when a constant that is not a color differs.

### The committed `dist/` is the reference

`dist/` is committed and published. `pnpm tokens:verify` builds into `dist-next/` and compares every file with `dist/`, ignoring only the header lines with the timestamp and the version, so any change to the build that changes the output fails until `dist/` is rebuilt and the change is reviewed. The presets write nothing into `dist/`, so their reference output is committed in `test/golden/<preset>/` and checked by `pnpm tokens:verify:presets`.

## Configuration

`chassis.build` in `package.json`:

| Key       | Current value                           | Meaning                                                                        |
| --------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| `brands`  | `chassis`, `sinefil`                    | Options of the `brand` group in `source/$themes.json` to build                 |
| `themes`  | `light`, `dark`                         | Options of the `theme` group; the first is the default                         |
| `screens` | `large`, `medium`, `small`              | Options of the `screen` group; the first is the default                        |
| `apps`    | `docs`: `web`; `demo`: `ios`, `android` | Options of the `app` group, each with its platforms                            |
| `options` | none                                    | Style Dictionary options by platform name, merged into that platform's options |

`source/$themes.json` has four groups: `brand` (`default`, `chassis`, `sinefil`, `demo-a`, `demo-b`), `app` (`docs`, `demo`), `theme` and `screen`. `permutateThemes` names each token-set list `<brand>_<app>_<theme>_<screen>`. The themes select 19 of the 27 token sets; the other 8 are never built, and the source lint does not read them.

The platforms are in `config/index.js`:

| Platform          | Output                                | Format                 | Notes                                                                 |
| ----------------- | ------------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `web`             | `dist/web/<app>/<brand>/`             | `cx/scss-chassis-css`  | rem; `var(--…)` references for Chassis CSS                            |
| `web-scss`        | `dist/web/<app>/<brand>/`             | `cx/scss-variables`    | rem; resolved values, `$…` with `outputReferences`                    |
| `web-px`          | `dist/web/<app>/<brand>/`             | `cx/scss-variables`    | px                                                                    |
| `web-vw`          | `dist/web/<app>/<brand>/`             | `cx/scss-variables`    | vw, 16 px to `1vw`                                                    |
| `ios`             | `dist/ios/<app>/<brand>/`             | `cx/ios-swift-class`   | UIKit; also `Color.swift` and `Icons.xcassets`                        |
| `ios-swiftui`     | `dist/ios-swiftui/<app>/<brand>/`     | `cx/swiftui`           | SwiftUI values                                                        |
| `android`         | `dist/android/<app>/<brand>/`         | `cx/android-resources` | flat files and the `res/` tree with its drawables                     |
| `android-compose` | `dist/android-compose/<app>/<brand>/` | `cx/compose-object`    | package `chassis.tokens`, or `options["android-compose"].packageName` |

Android options: `options.android.screens` maps each screen to a resource qualifier, `""` for the default `values` folder. Without it, `small` goes into `values`, `medium` into `values-sw600dp` and `large` into `values-sw840dp`. Every screen needs a folder and exactly one screen goes into the default folder; `loadConfig` fails otherwise.

## Output contract

This is what the build promises to write. Changing it changes what apps compile against, so it needs a changeset that says what breaks (see [Changesets](../.github/CONTRIBUTING.md#changesets)).

### Files

Every output folder is `dist/<platform>/<app>/<brand>/`. With the current configuration there are 114 files: per brand, 7 web files, 27 iOS files and 23 Android files.

| Platform | Files                                                                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| web      | `main.scss`, `string.scss`, `color-<theme>.scss`, `number-<screen>.scss` (`number.scss` without screens)                                                                                                                                                 |
| iOS      | `ChassisTokens.swift`, `String.swift`, `Color<Theme>.swift`, `Number<Screen>.swift`, `Color.swift` when the themes include `light` and `dark`, and `Icons.xcassets` with one image set per icon                                                          |
| Android  | `main.xml`, `string.xml`, `color_<theme>.xml`, `number_<screen>.xml`, and the tree `res/values/{string,color_base,color,number}.xml`, `res/values-night/color.xml` (the `dark` theme), `res/values-<qualifier>/number.xml` and `res/drawable/<icon>.xml` |

The iOS files declare `ChassisTokens` (in `ChassisTokens.swift`) and `ChassisTokens<File>` in the others (`ChassisTokensString`, `ChassisTokensColorLight`, `ChassisTokensNumberLarge`, `ChassisTokensColor`), each a caseless `public enum`, so all of them can be in one module. The SwiftUI and Compose files have the same names and types (`.kt` for Compose), without `Color.swift` and icons.

The repository root also has `Package.swift`, written by `build/swift-package.js` from `chassis.build`: one Swift library per brand of every app with an iOS platform, `ChassisTokens<App><Brand>` (and `…SwiftUI` for `ios-swiftui`), on the output folder, with the icon catalog as a resource. The release attaches an Android library per `res/` tree, `chassis-tokens-<app>-<brand>-<version>.aar`, built by the `library` module of `test/native/android/`.

### Filters

| Filter               | Files                               | Tokens                                                                                                                    |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `cx/allTokens`       | main                                | every emitted type, without the colors under `color.primitive`, `color.context`, `color.utility` and `gradient.primitive` |
| `cx/stringTokens`    | string                              | asset, content, fontFamily, fontStyle, fontWeight, string, text, textCase, textDecoration, type                           |
| `cx/themeTokens`     | color files                         | colors, without `path[1]` `base` or `utility`, and shadows                                                                |
| `cx/numberTokens`    | number files                        | duration, letterSpacing, number, opacity, and the size group: dimension, fontSize, lineHeight, paragraphSpacing           |
| `cx/baseColorTokens` | Android `res/values/color_base.xml` | colors whose `path[1]` is `base`                                                                                          |

The type groups are in `utils.js`. Tokens typed `boolean` or `other` are never emitted, and neither are the groups that exist for Figma only, `figma.*` (mode switches and the frame sizes of the Figma files) and `bg-blur.*` (background blur effects); every filter leaves them out (`figmaOnlyGroups` in `filters.js`). `dimension.base.*` is emitted in the main and number files on purpose: other sizes reference it, and with `outputReferences` they name it.

Only the web keeps a shadow token whole, so only the web color files hold shadows. The mobile platforms expand a shadow into its parts; the color part of each layer is a color, in the main file and the color files, and the other parts are sizes and strings.

So the main file holds every token except the theme colors, with the values of the first theme (its component colors) and the first screen. The string, color and number files share no names with each other, and together they hold everything in main except the base colors.

### Web

SCSS with the prefix `cx`: the header line `$prefix: cx- !default;`, then one `$cx-<name>: <value> !default;` per token between `// scss-docs-start design-tokens` and `// scss-docs-end design-tokens`.

- **Sizes**: pixels divided by 16 with `rem`, not rounded; zero is `0rem`. A size that references another prints the same value (`dimension.base.05` and `size.unit.05` are `0.03125rem`).
- **Colors**: `#ffffff`, or `rgba(22, 26, 27, 0.5)` with alpha.
- **Line height tokens**: divided by the font size token at the same step, `typography.fontSize.<path[2]>.<path[3]>`, three decimals with trailing zeros removed, `em` (`1.25em`).
- **Letter spacing** (tokens under `letterSpacing` and the `letter-spacing` of typography maps): pixels divided by 16, four decimals, `em` (`-0.5px` is `-0.0313em`).
- **Shadows**: `x y blur spread color`, with ` inset` for inner shadows, layers joined with `, `, sizes in rem. `main.scss` has the shadows with the colors of the first theme, and `color-<theme>.scss` every shadow with the colors of its theme.
- **Font weights**: numbers (`400`). Font families: the whole list, as written.
- **Assets**: in double quotes.
- **Typography**: a Sass map with the keys `font-family`, `font-weight`, `font-size`, `line-height`, `font-style`, `letter-spacing`, `margin-bottom`, `text-transform`, `text-decoration`, in this order.

#### `var(--…)` references of the Chassis CSS format

The `web` platform prints the custom properties that Chassis CSS generates, so its SCSS works only with Chassis CSS. A token prints `var(--name)` when its original value is a single reference and `path[0]` is `color`, `space`, `opacity`, `shadow`, `borderRadius` or `borderWidth`, except `borderRadius` and `borderWidth` tokens whose `path[1]` is `context` or `base`, and shadow tokens whose `path[2]` is `idle`, `hover`, `press`, `disabled`, `focus` or `highlight`, which print their value.

| Referenced path                                                     | Custom property                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `color.context.X.Y`, `color.primitive.X.Y`                          | `--X-Y`                                                                                                 |
| `space.context.X`                                                   | `--space-X`                                                                                             |
| `opacity.context.X`, `opacity.level.X`                              | `--opacity-X`                                                                                           |
| `shadow.context.X`                                                  | `--box-shadow-<short X>`                                                                                |
| `borderRadius.context.X`, `borderRadius.base.context.X`             | `--border-radius-<short X>`                                                                             |
| `borderWidth.context.X`, `borderWidth.base.context.X`               | `--border-width-<short X>`                                                                              |
| `borderRadius.base.<component>.X`, `borderWidth.base.<component>.X` | follows one more reference; if that is in the same group and under `context`, its last segment names it |
| anything else                                                       | the resolved value                                                                                      |

Typography maps name the font family, weight, size and line height: `var(--font-family-<family>)`, `var(--font-weight-<family>-<weight>)`, `var(--font-size-<group>-<short size>)` and `var(--line-height-<group>-<short size>)` for a typography value, and `var(--font-family-text)`, `var(--font-weight-strong)`, `var(--font-size-md)`, `var(--line-height-md)` for a reference to another typography token, from its path. A literal line height in percent prints in `em` (`125%` is `1.25em`).

The short scale names are `4xs`, `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl` and `2xl` to `6xl` for `4xsmall` to `6xlarge`; other names stay as they are.

#### SCSS variables of the presets

`web-scss`, `web-px` and `web-vw` print resolved values. Their typography maps quote the font family list as one string (`"font-family": "Inter, system-ui, …"`). With `outputReferences`, single references in the groups `color`, `space`, `opacity`, `borderRadius` and `borderWidth` print the variable of the token that the shared rules above name (`$cx-color-context-default-fg-main`), and typography maps hold variables. A variable may be declared by another file of the build, so an app loads a color file before `main.scss`, whose color tokens reference variables of `color-<theme>.scss`; the other files use only variables they declare themselves. The build fails when no file declares a variable.

### iOS

`import UIKit`, then one `public static let <PascalName> = <value>` per token. Typography and shadow tokens are expanded into one constant per property (`FontContextJumboFontSize`, `ShadowContextSmall1Blur`).

- **Colors**: `UIColor(red: 0.086, green: 0.102, blue: 0.106, alpha: 1)`, three decimals per channel, the alpha as it is. A value that is not a color prints as it is, with a warning.
- **Numbers and sizes**: `CGFloat(16)`, in points. A line height in percent is that percentage of the font size of the same typography token, three decimals (`125%` of `96` is `CGFloat(120)`). Letter spacing is in points (`CGFloat(-0.5)`).
- **Font families**: the first family of the list, without quotes, in double quotes (`"Inter"`).
- **Font weights**: `UIFont.Weight.<name>`, from the weight number of the web's map rounded to the nearest hundred from 100 to 900: `ultraLight`, `thin`, `light`, `regular`, `medium`, `semibold`, `bold`, `heavy`, `black`. An unknown weight fails the build.
- **Other strings**: in double quotes, including the SVG text of the icons.
- **Gradients**: a color token with a `linear-gradient(…)` value prints as parts: `<Name>Angle` in CSS degrees (0 points up, clockwise, from 0 to less than 360), and `<Name>Stop<N>Color` and `<Name>Stop<N>Position` (0 to 1) for each stop. The direction is `<number>deg`, `to top`, `to right`, `to bottom`, `to left`, or none (180); other directions and other gradient functions fail the build.
- **Shadows**: the CSS parts, and `<Name>Radius`, half the blur, for Core Animation's `shadowRadius`.

`Color.swift` declares `ChassisTokensColor`, as described in [the design decisions](#the-colors-that-follow-dark-mode-are-written-after-the-builds).

**SwiftUI** (`ios-swiftui`): the same constants, without the `…Radius` of the shadows, with `import SwiftUI`, colors as `Color(red: 1.000, green: 1.000, blue: 1.000, opacity: 1)` and weights as `Font.Weight.<name>`.

### Android

`<resources>` with one element per token, snake_case names, expanded as on iOS. The element comes from the type, in this order:

| Tokens                                                                                      | Element                              | Example                    |
| ------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------- |
| opacity, letter spacing (type, or `path[1]` `letterSpacing`), gradient angles and positions | `<item type="dimen" format="float">` | `0.4`                      |
| font weights                                                                                | `<integer>`, 100 to 900              | `400`                      |
| colors                                                                                      | `<color>`, ARGB hex                  | `#80161a1b`                |
| other numbers                                                                               | `<integer>`                          | none in the current tokens |
| sizes                                                                                       | `<dimen>`                            | `16dp`, `22sp`             |
| everything else                                                                             | `<string>`                           | `Inter`                    |

- **`sp`** when the last path segment is `fontSize`, `lineHeight` or `paragraphSpacing`, the type is `fontSize` or `lineHeight`, or `path[1]` is `paragraphSpacing`; **`dp`** for other sizes. A line height in percent is converted as on iOS (`120sp`).
- **Letter spacing** of a typography token is in ems of its font size, four decimals (`-0.0052`), which `android:letterSpacing` takes; the letter spacing scale (`typography.letterSpacing.*`) has no font size and keeps its pixel number.
- **Strings** are escaped: `&`, `<` and `>` become entities, `\`, `'` and `"` get a backslash, and so does a leading `@` or `?`.
- **Gradients**: as on iOS, `<name>_angle`, `<name>_stop_<n>_color` and `<name>_stop_<n>_position`.

The `res/` tree has the strings and the base colors in `values`, the colors of the first theme in `values` and of `dark` in `values-night`, and each screen's numbers in the folder of its qualifier. Other themes have only their flat file.

**Compose** (`android-compose`): one Kotlin `object` per file with a getter per token, camelCase names and the Android values: `Color(0xFFFFFFFF)`, `16.dp`, `22.sp`, `FontWeight(400)`, `0.4f` for float items, `(-0.0052).em` for the letter spacing of a typography token, and Kotlin string literals.

### References with `outputReferences`

| Platform             | Prints                      | Example                             |
| -------------------- | --------------------------- | ----------------------------------- |
| `web`                | always `var(--…)`, as above | `var(--default-fg-main)`            |
| SCSS presets         | `$<name>`                   | `$cx-color-context-default-fg-main` |
| `ios`, `ios-swiftui` | the bare constant name      | `SizeUnit4 = DimensionBase4`        |
| `android`            | `@<element type>/<name>`    | `@dimen/dimension_base_4`           |
| `android-compose`    | the property name           | `sizeUnit4 get() = dimensionBase4`  |

The mobile rule is the [safe reference rule](#a-reference-is-printed-only-when-it-is-safe); a float item is referenced as `@dimen/…`. The value of every constant and resource is the same with and without the option.

### Icons

An icon is an `asset` token whose value is an SVG document. It stays a string token on every platform, and the build of the main file also writes it as an asset:

- iOS: `Icons.xcassets/<Name>.imageset/` with the SVG and a `Contents.json` that keeps the vector and renders it as a template.
- Android: `res/drawable/<name>.xml`, a vector drawable made by `svg2vectordrawable` with black fills and three decimals, which a tint colors.

## Checks

| Command                      | Checks                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm tokens:lint:source`    | `source/`: equal names across themes and screens, usable names, known font weights, typed tokens, no name with two types (`build/lint-tokens.js`)                    |
| `pnpm tokens:lint`           | ESLint on `build/` and `test/`                                                                                                                                       |
| `pnpm tokens:typecheck`      | TypeScript `checkJs` on `build/`                                                                                                                                     |
| `pnpm tokens:test`           | Vitest, on real tokens and the committed `dist/`; includes the golden checks and that `Package.swift` matches `chassis.build`                                        |
| `pnpm tokens:verify`         | A fresh build equals `dist/`; no name twice in one file; every reference names something the output declares                                                         |
| `pnpm tokens:verify:presets` | Each preset equals its baseline in `test/golden/`                                                                                                                    |
| `pnpm tokens:diff`           | Not a check: the names added, removed, renamed and changed in each `dist/` file against another ref; CI writes it to the pull request's summary                      |
| `pnpm tokens:native:ios`     | The Swift files against the iOS simulator SDK, the asset catalogs with `actool`, and a sample that uses the Swift package (needs Xcode)                              |
| `pnpm tokens:native:android` | The Android resources against `android.jar`, the Compose objects against Compose, and a sample app that uses the Android libraries (needs a JDK and the Android SDK) |

[`test/README.md`](../packages/tokens/test/README.md) describes the tests, fixtures, baselines and native checks. CI runs all of these on pull requests; the native jobs only when the tokens, the build or the output change.

## Known oddities

They are part of the output contract and kept on purpose. Don't fix one without a changeset that says what breaks.

- **The main file repeats the other files.** `ChassisTokens.swift` and `main.xml` hold every token except the theme colors, with the component colors of the light theme and the numbers of the large screen. `main.xml` cannot share a resource folder with the flat string, color or number files: aapt2 fails with `has a conflicting value`.
- **The flat files stay for one release.** `ColorLight.swift` and `ColorDark.swift` next to `Color.swift`, and the flat Android files next to `res/`, are kept since 0.6.0 so that apps can move over.
- **Web letter spacing is in ems of 16 px.** The web divides pixels by 16, so `-0.5px` at a 96 px font size prints `-0.0313em`, where the em of that font size is `-0.0052`, which Android prints. Chassis CSS reads the web value, so it stays.
- **Letter spacing has different units per platform.** Web ems of 16 px, iOS points, Android and Compose ems of the font size; the letter spacing scale is in pixels on iOS and Android because it has no font size.
- **Icons are in the string files too.** The SVG text of each icon is a string constant or resource next to its asset; on Android it is escaped.
- **`dimension.base.*` is emitted** in the main and number files, though apps use the scales that reference it.
- **Two spellings of one weight.** The source spells semi bold `Semi Bold` for Inter and `SemiBold` for other fonts, the style name of each font in Figma. The build maps both to `600`; don't normalize the source, or the fonts break in Figma.
- **The web presets share the web folder.** `web`, `web-scss`, `web-px` and `web-vw` all write to `dist/web/<app>/<brand>/`, so an app selects one of them.
- **iOS shadows have a derived radius.** `…Radius` is half the CSS blur, close to Core Animation's `shadowRadius`; the spread has no Core Animation equivalent.
- **Unused token sets.** 8 token sets are selected by no theme and never built; `brand-demo-a/app-base` still uses the format before DTCG. The `brand` group also has options (`default`, `demo-a`, `demo-b`) that the configuration does not build.

## History

The build was rewritten in 2026 from Style Dictionary 4 templates that encoded values while printing, in phases committed as `rewrite(phase N): …` (`git log --grep 'rewrite(phase'`). The plan that guided it, with the measurements and the result of every phase, is in the history of `docs/rewrite-plan.md`, deleted after the last phase; the last version is at commit `b9cbab6`.

# @chassis-ui/tokens

Design tokens of the [Chassis Design System](https://chassis-ui.com), built from [Tokens Studio](https://tokens.studio) tokens with Style Dictionary into SCSS for the web, Swift for iOS and resources for Android.

```sh
npm install @chassis-ui/tokens
```

## What the package holds

Every file is in `dist/<platform>/<app>/<brand>/`. This release builds the `docs` app for the web and the `demo` app for iOS and Android, each for the brands `chassis` and `sinefil`.

| Platform | Folder                       | Files                                                                                                                                                                                                  |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web      | `dist/web/docs/<brand>/`     | `main.scss`, `color-light.scss`, `color-dark.scss`, `number-large.scss`, `number-medium.scss`, `number-small.scss`, `string.scss`: SCSS variables for [Chassis CSS](https://github.com/chassis-ui/css) |
| iOS      | `dist/ios/demo/<brand>/`     | `ChassisTokens.swift`, `Color.swift` (colours that follow dark mode), `ColorLight.swift`, `ColorDark.swift`, `Number<Screen>.swift`, `String.swift`, and the `Icons.xcassets` catalog                  |
| Android  | `dist/android/demo/<brand>/` | `res/` (`values`, `values-night`, `values-sw600dp`, `values-sw840dp`, `drawable`), and the same resources as flat files                                                                                |

## Use

Web, with Sass modules:

```scss
@use '@chassis-ui/tokens/dist/web/docs/chassis/main' as tokens;

.card {
  padding: tokens.$cx-space-context-medium;
}
```

iOS: add the Swift files and `Icons.xcassets` of one app and brand to your target, then read `ChassisTokens.SpaceContextMedium` or `ChassisTokensColor.ColorContextDefaultBgMain`.

Android: add `dist/android/<app>/<brand>/res` as a resource folder of your module, then read `R.dimen.space_context_medium` or `R.color.color_context_default_bg_main`.

The guides for [web](https://chassis-ui.com/tokens/docs/use-in-project/web-applications/), [iOS](https://chassis-ui.com/tokens/docs/use-in-project/ios-applications/) and [Android](https://chassis-ui.com/tokens/docs/use-in-project/android-applications/) cover themes, screen sizes and setup in detail.

## Your own tokens

Chassis Tokens is meant to be owned and customized: clone the [repository](https://github.com/chassis-ui/tokens), edit the tokens in Tokens Studio, and build your own brands, apps and platforms, including plain SCSS variables for other CSS frameworks, SwiftUI and Jetpack Compose. See the [documentation](https://chassis-ui.com/tokens/docs/getting-started/introduction/).

## Changes

[CHANGELOG.md](https://github.com/chassis-ui/tokens/blob/main/packages/tokens/CHANGELOG.md) lists every release and what each breaking change asks of an app.

## License

MIT

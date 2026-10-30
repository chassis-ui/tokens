---
'@chassis-ui/tokens': minor
---

Add motion tokens to every brand: durations under `motion.timing.*` and easings under `motion.easing.*`, each referencing `motion.base.*`, in the main and number files of every platform.

Durations are `250ms` on the web, `TimeInterval(0.25)` in seconds on iOS and SwiftUI, and integers in milliseconds on Android and Compose. Easings are `cubic-bezier(0.42, 0, 1, 1)` on the web, a tuple of control points on iOS and SwiftUI, `CubicBezierEasing` on Compose and four float resources (`_x_1`, `_y_1`, `_x_2`, `_y_2`) on Android.

The Compose files now import `androidx.compose.animation.core.CubicBezierEasing`. An app that uses Compose without `androidx.compose.animation:animation-core` on its classpath has to add it.

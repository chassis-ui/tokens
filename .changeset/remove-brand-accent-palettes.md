---
'@chassis-ui/tokens': minor
---

**Breaking:** the `brand` and `accent` palettes are removed, with the gradients and the elevation shadows that used them. No other token referenced them.

- Removed `color.primitive.brand.*` and `color.primitive.accent.*` (`$cx-color-primitive-brand-50`, `ColorPrimitiveBrand50`, `color_primitive_brand_50`): the 25 colors of each palette, in the light and the dark theme
- Removed `color.base.primitive.<theme>.brand.*` and `color.base.primitive.<theme>.accent.*` (`$cx-color-base-primitive-light-brand-50`, `ColorBasePrimitiveLightBrand50`, `color_base_primitive_light_brand_50`): the 25 base colors of each palette, for the `light` and the `dark` theme
- Removed `gradient.primitive.brand.*` and `gradient.primitive.accent.*` (`$cx-gradient-primitive-brand-l-50-000`, `GradientPrimitiveBrandL50000Angle`, `gradient_primitive_brand_l_50_000_angle`): the 8 gradients of each palette
- Removed `shadow.elevation.brand.*` and `shadow.elevation.accent.*` (`$cx-shadow-elevation-brand-10`, `ShadowElevationBrand101Blur`, `shadow_elevation_brand_10_1_blur`): the 11 levels of each context

No other name or value changes. An app that uses one of these names must replace it. In the `default` and `chassis` brands, `brand` had the base color of `primary` and `accent` that of `secondary`, so those palettes give the same colors. An app that uses none of the names has nothing to change.

---
'@chassis-ui/tokens': minor
---

Add the card fonts: `font.card.<size>-title`, `font.card.<size>-subtitle` and `font.card.<size>-body` for the `large`, `medium` and `small` card sizes. Each references a base token of the text family, so the title is one step larger than the body and the subtitle one step smaller, in the `strong` weight. Nothing is removed or renamed.

- Web: the typography maps `$cx-font-card-medium-title` to `$cx-font-card-small-body` in `main.scss`
- iOS: a constant per property, such as `FontCardMediumTitleFontFamily` and `FontCardMediumTitleFontSize`, in `ChassisTokens.swift`, `String.swift` and the number files
- Android: a resource per property, such as `font_card_medium_title_font_family` and `font_card_medium_title_font_size`, in `main.xml`, `string.xml`, the number files and the `res/` tree

---
'@chassis-ui/tokens': patch
---

The fonts of the `chassis` brand change in value. No name is added, removed or renamed, and an app has nothing to change.

- `typography.fontFamily.display` is Montserrat (`'Montserrat', system-ui, -apple-system, Helvetica, Arial, sans-serif`) instead of Archivo Narrow, so every `font.display.*` style changes with it
- `font.html.h1` to `font.html.h6` and the `jumbo`, `hero` and `heading` contexts use the display family, Montserrat, instead of the text family, Inter
- `font.context.lead` is Light (`300`) instead of Regular (`400`)
- `font.context.jumbo` and `font.context.hero` tighten their letters by 2.5 and 1.5 pixels (`-0.15625rem` and `-0.09375rem` on the web), where they had no letter spacing
- The web quotes the first family of `text` and `code` (`'Inter'` and `'Fira Code'`), as it does for the families with a space in their name. iOS and Android print the same names as before

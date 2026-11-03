---
'@chassis-ui/tokens': minor
---

`chassis-tokens init` writes the token sets of the Chassis token system in place of the seven starter sets: `source/base/` with the sets of every brand, app and theme, `source/brand-<brand>/brand-base.json` for each brand, and `$themes.json` with the groups `brand`, `app` and `theme` and a Figma mode per option. A new repository builds every name that Chassis CSS reads. It has no `screen` group and no `screens` in `chassis.build`, so the build writes one number file; a repository adds the group to have one per screen. `--app base:…` is refused, as `base/app-base.json` is a set of the system. No file of `dist/` is added, removed or renamed, and a repository made earlier changes nothing: `init` never writes over its token sets.

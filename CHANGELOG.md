# Changelog

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

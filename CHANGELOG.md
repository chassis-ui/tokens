# Changelog

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

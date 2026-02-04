# Chassis Design Tokens - Web

This directory contains compiled design tokens for web applications using the Chassis design system.

## Folder Structure

- **`mundi-default/`** - Default brand tokens
- **`mundi-mobile/`** - Mobile-optimized tokens
- **`mundi-web/`** - Web-optimized tokens

## Quick Start

Import the main token file for your brand:

```scss
// For web applications
@import "mundi-web/main.scss";

// For mobile applications
@import "mundi-mobile/main.scss";
```

## Color Tokens

You can load color tokens in two ways:

- **Per-theme files**: Import individual `color-*.scss` files for specific themes (e.g., `color-light.scss`, `color-dark.scss`) when you need theme-specific color variables.
- **Unified file**: Import `main.scss` for consistent variable names that reference theme-specific colors - you control the theme context separately.

### Example

```scss
// Theme-specific approach
@import "mundi-web/color-light.scss";
// Now you have: $cx-color-context-default-fg-main (with light theme value)

@import "mundi-web/color-dark.scss";
// Now you have: $cx-color-context-default-fg-main (with dark theme value)

// Unified approach
@import "mundi-web/main.scss";
// Now you have: $cx-color-base-context-light-default-fg-main
// and: $cx-color-base-context-dark-default-fg-main
// (requires manual theme mapping in your application for $cx-color-context-default-fg-main)
```

## Number Tokens

Number tokens provide responsive breakpoints and sizing values:

- **`number-small.scss`** - Small screen sizes
- **`number-medium.scss`** - Medium screen sizes
- **`number-large.scss`** - Large screen sizes

### Usage

```scss
@import "mundi-web/number-large.scss";
// Provides breakpoint and sizing variables for large screens
```

## Main File

The `main.scss` file contains all available tokens for comprehensive theming:

```scss
@import "mundi-web/main.scss";
// Includes colors, spacing, typography, and other design tokens
```

## Notes

- All token variables use the `$cx-` prefix
- Color tokens support light and dark themes
- Number tokens are primarily used for responsive design breakpoints

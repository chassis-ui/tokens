

# Chassis Design Tokens

Design tokens for the Chassis Design System, supporting multi-brand, multi-theme, multi-app, and multi-platform design systems.

**This repository contains:**
- Design tokens in [Tokens Studio](https://tokens.studio) format (`tokens/`)
- Style Dictionary transform scripts (`build/tokens/`)
- Documentation website (`site/`)

> [!NOTE]
> Asset distribution and icon font generation have moved to separate projects. This repository is focused on tokens and transformation scripts only.

> [!WARNING]
> This project uses `pnpm` for package management. Ensure you have `pnpm` installed globally before running the commands below.


## Install

Clone the repository and install dependencies:

```sh
git clone https://github.com/chassis-ui/tokens.git
pnpm install
```

---

## Transform Design Tokens

```shell
# Build all tokens (default)
pnpm tokens
```


Generates platform-specific token files in `dist/[platform]/[brand]-[app]` as specified in your configuration. Output formats and file structure are determined by Style Dictionary transforms and your settings.

### CLI Options

You can filter which tokens are built using CLI flags:

```shell
# Build tokens for a specific brand
pnpm tokens --brand=chassis

# Build tokens for a specific theme
pnpm tokens --theme=dark

# Build tokens for a specific app
pnpm tokens --app=docs

# Build tokens for a specific screen size
pnpm tokens --screen=large

# Combine multiple filters
pnpm tokens --brand=chassis --theme=light --app=docs --screen=large
```

**Available options:**
- `--brand`: Filter by brand (e.g., `chassis`, `test`)
- `--theme`: Filter by theme (e.g., `light`, `dark`)
- `--app`: Filter by app (e.g., `docs`, `test`)
- `--screen`: Filter by screen size (e.g., `small`, `large`)

When filters are applied, only token combinations matching all specified criteria will be generated. This is useful for faster builds during development or for generating specific token sets for deployment.

---

## Release Workflow

To update the version and publish new tokens:

```sh
# Update version in package.json
pnpm change-version <old_version> <new_version>

# Build tokens
pnpm tokens

# (Optional) Build documentation site
pnpm build:astro
```

See package scripts for more commands and options.



---

## Tokens Studio Format & Figma Variables

Tokens are stored in [Tokens Studio](https://tokens.studio) format, compatible with Figma variables. Example structure:

| Collection | Mode 1 | Mode 2 |
| --- | --- | --- |
| Brand | chassis | test |
| Theme | light | dark |
| App | docs | test |

See [Tokens Studio Documentation](https://docs.tokens.studio) and [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/) for more details.



---

## Configuration

The `chassis` key in your `package.json` defines which brands, themes, screens, and apps/platforms are available for transformation. Example:

```json
"chassis": {
  "defaults": {
    "theme": "light",
    "screen": "large"
  },
  "build": {
    "brands": ["chassis", "test"],
    "themes": ["light", "dark"],
    "screens": ["large", "medium", "small"],
    "apps": {
      "docs": ["web"],
      "test": ["ios", "android"]
    }
  }
}
```

### Key Details

- **`defaults`**: Default theme and screen for builds.
- **`build`**: Lists all brands, themes, screens, and apps/platforms to be processed.

Supported platforms:
- `web`: SCSS variables (rem, px, vw units)
- `ios`: Swift classes
- `android`: XML resources

Only the collections and sets defined under `build` are processed.




---

## Documentation Website

The documentation site (`site/`) provides guides, API documentation, and usage examples for working with tokens and transformation scripts. It is built with [Astro](https://astro.build/) and includes:

- How to extend or customize transforms
- How to structure tokens for brands/themes/apps/screens
- Advanced usage and troubleshooting
- Reference documentation for all build scripts
- Guides for integrating tokens into your design system

### Local Development

To run the documentation site locally:

```sh
pnpm dev
```

This will start Astro on [http://localhost:4323](http://localhost:4323) (default port). You can browse and edit documentation live.

### Building the Site

To build the static documentation site for deployment:

```sh
pnpm build:astro
```

The output will be generated in the `_site/` directory.

### Keeping Documentation Up to Date

To ensure documentation references the latest tokens, build tokens before building the site:

```sh
pnpm tokens
pnpm build:astro
```

### Editing Documentation

All documentation content is stored in `site/content/`. You can add or edit guides, API docs, and usage examples using Markdown or MDX files.

---


## Migrated Features

Asset distribution and icon font generation are now maintained in their own repositories. This project is focused on:
- Design tokens (Tokens Studio format)
- Style Dictionary transform scripts
- Documentation website

For asset and icon management, see the related projects in the Chassis ecosystem.


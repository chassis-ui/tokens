

# Chassis Tokens

Design tokens for the Chassis UI, supporting multi-brand, multi-theme, multi-app, and multi-platform design systems with comprehensive CLI tooling and build automation.

**This repository contains:**
- Design tokens in [Tokens Studio](https://tokens.studio) format (`tokens/`)
- Style Dictionary v4 transform scripts with custom extensions (`build/tokens/`)
- Platform-specific output for Web (SCSS), iOS (Swift), and Android (XML)
- Comprehensive test suite (97 tests) covering all build modules
- Documentation website (`site/`)

**Key features:**
- 🎨 Multi-brand, multi-theme support with Figma Variables integration
- 🚀 Fast selective builds with CLI filtering
- 📦 Self-contained platform configurations (no shared dependencies)
- 🧪 Comprehensive test coverage with Vitest
- 📊 Progress indicators and detailed build summaries
- 🔍 Dry-run mode for previewing tasks
- ⚡ Optional responsive screen layer
- 🛠️ Centralized logging with debug mode

> [!NOTE]
> This project is part of the Chassis UI ecosystem and handles design token generation and management. It provides tools to transform design tokens from Tokens Studio format into platform-specific output (Web SCSS, iOS Swift, Android XML) with multi-brand, multi-theme, and multi-app support.

> [!WARNING]
> This project uses `pnpm` for package management. Install it globally with `npm install -g pnpm` before running the commands below.


## 🚀 Quick Start

### Clone Repository

Clone the repository and install dependencies:

```sh
git clone https://github.com/chassis-ui/tokens.git chassis-tokens
cd chassis-tokens
pnpm install
```

### Generate Distribution

Transform all design tokens into platform-specific formats:

```shell
pnpm tokens
```

This generates token files for all brands, themes, apps, platforms, and screens defined in your configuration. Output is written to `dist/[platform]/[brand]-[app]/` with platform-specific formats (SCSS for web, Swift for iOS, XML for Android).

### Selective Builds

Build only specific tokens using CLI filters. When filters are applied, only matching combinations are generated:

```shell
# Filter by brand
pnpm tokens --brand chassis

# Filter by theme
pnpm tokens --theme light dark

# Filter by app
pnpm tokens --app docs

# Filter by platform
pnpm tokens --platform web ios

# Filter by screen size
pnpm tokens --screen large medium

# Combine multiple filters
pnpm tokens --brand chassis --platform web --screen large small

# Build specific brand/app for production
pnpm tokens --brand chassis --app docs --platform web
```

**Benefits:**
- Faster builds during development
- Reduced output size for targeted deployments
- Optimized CI/CD pipelines

## CLI Reference

### Available Options

All filter options accept space-separated values:

- `--brand <brands...>` — Filter by brand (e.g., `chassis test`)
- `--theme <themes...>` — Filter by theme (e.g., `light dark`)
- `--app <apps...>` — Filter by app (e.g., `docs test`)
- `--platform <platforms...>` — Filter by platform (e.g., `web ios android`)
- `--screen <screens...>` — Filter by screen size (e.g., `large medium small`)
- `--dry-run` — Preview tasks without executing builds
- `--help, -h` — Show help message
- `--version, -v` — Show version number

### Build Features

- **Progress indicators**: Shows build status (`[1/5]`, `[2/5]`, etc.)
- **Build summary**: Displays success/failure count and total duration
- **Error handling**: Detailed error messages with optional stack traces
- **Debug mode**: Set `DEBUG=1` for verbose output
- **Selective building**: Combine filters to build only what you need

### Additional Commands

```shell
# Run test suite
pnpm tokens:test
pnpm test:watch

# Update version
pnpm change-version <old_version> <new_version>
```

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


## Tokens Studio Format & Figma Variables

Tokens are stored in [Tokens Studio](https://tokens.studio) format, compatible with Figma variables. Example structure:

| Collection | Mode 1 | Mode 2 |
| --- | --- | --- |
| Brand | chassis | test |
| Theme | light | dark |
| App | docs | test |

See [Tokens Studio Documentation](https://docs.tokens.studio) and [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/) for more details.

## Configuration

The `chassis` key in your `package.json` defines which brands, themes, screens, and apps/platforms are available for transformation:

```json
"chassis": {
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

### Configuration Details

- **`brands`**: Array of brand identifiers
- **`themes`**: Array of theme variants (light, dark, etc.)
- **`screens`**: Array of screen sizes for responsive tokens. Set to `[]` or omit to generate single number files without screen suffixes
- **`apps`**: Object mapping app names to their target platforms

**Supported platforms:**
- `web`: SCSS variables (rem, px, vw units)
- `ios`: Swift classes (PascalCase naming)
- `android`: XML resources (snake_case naming)

**File naming conventions:**
- Web: `main.scss`, `color-light.scss`, `number-large.scss`
- iOS: `Main.swift`, `ColorLight.swift`, `NumberLarge.swift`
- Android: `main.xml`, `color_light.xml`, `number_large.xml`

Only the collections and sets defined under `build` are processed.

## Documentation Site

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

This will start Astro on [http://localhost:4322](http://localhost:4322) (default port). You can browse and edit documentation live.

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

## Development & Testing

### Running Tests

The build system includes comprehensive test coverage (97 tests) covering all modules:

```sh
# Run all tests
pnpm tokens:test

# Run tests in watch mode
pnpm test:watch
```

**Test coverage includes:**
- CLI argument parsing
- Token key lookup logic
- Task generation and filtering
- Platform-specific configurations
- Token transformations
- Filter functions
- Utility functions
- Logger output
- Preprocessor functionality

### Debugging

For verbose output with stack traces:

```sh
DEBUG=1 pnpm tokens --brand chassis
```

### Build Architecture

The build system uses:
- **Self-contained platform configs**: Each platform (web, iOS, Android) has its own independent configuration file
- **Style Dictionary v4.4.0**: Token transformation engine
- **Tokens Studio SD Transforms**: Figma Variables integration
- **Vitest**: Testing framework
- **Pure Node.js**: No external CLI parsing dependencies

**Key modules:**
- `build/tokens/build.js`: Main orchestration and task generation
- `build/tokens/config/`: Platform-specific configurations
- `build/tokens/filters.js`: Token filtering logic
- `build/tokens/transforms.js`: Custom value transformations
- `build/tokens/preprocessor.js`: Token preprocessing
- `build/tokens/logger.js`: Centralized logging utilities
- `build/tokens/utils.js`: Shared utilities and helpers

## Chassis UI Ecosystem

This project is part of the Chassis Design System's multi-repository architecture:

- **`chassis-tokens`**: Design token generation and management (this repository)
- **`chassis-assets`**: Asset management and distribution
- **`chassis-icons`**: Icon generation and sprite creation
- **`chassis-css`**: Production CSS framework
- **`chassis-figma`**: Figma library documentation and examples.

### Integration with Other Repositories

The token system works alongside other Chassis repositories:

1. **Design tokens** define colors, typography, spacing, and other design decisions
2. **Assets** provide fonts, images, and illustrations referenced by tokens
3. **Icons** are managed separately for scalability and performance
4. **CSS framework** consumes the generated token files to build production stylesheets
5. **Figma library** contains documentation and examples for Figma variables and components

## Contributing

This project follows the Chassis Design System contribution guidelines. For token-related contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/token-update`)
3. Add or update tokens in the `tokens/` directory
4. Test transformation with `pnpm tokens`
5. Run tests with `pnpm tokens:test`
6. Commit changes and create a pull request

---

## License

MIT License - see LICENSE file for details.


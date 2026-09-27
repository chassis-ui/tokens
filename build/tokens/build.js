/**
 * @file build.js
 * @description This file handles the build process for Style Dictionary: it registers
 *              the extensions, plans one Style Dictionary instance per token-set list and
 *              builds them.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { promises } from 'fs'
import StyleDictionary from 'style-dictionary'
import { permutateThemes, register as registerStudio } from '@tokens-studio/sd-transforms'
import config from './config/index.js'
import { screenQualifiers } from './config/android.js'
import registerFilters from './filters.js'
import registerTransforms from './transforms.js'
import registerFormats from './formats.js'
import cxPrep from './preprocessor.js'
import logger from './logger.js'
import { THEMES, THEME_COLORS_FILE, writeThemeColors } from './theme-colors.js'

const HELP = `
Chassis Tokens Build System

Usage: node build/tokens/build.js [options]

Options:
  --brand <brands...>       Filter by brand(s)
  --app <apps...>           Filter by app(s)
  --platform <platforms...> Filter by platform(s)
  --theme <themes...>       Filter by theme(s)
  --screen <screens...>     Filter by screen(s)
  --out <dir>               Output root directory (default: dist)
  --config <file>           JSON file to read the build configuration from, instead of
                            chassis.build in package.json
  --dry-run                 Show builds without executing
  --help, -h                Show this help
  --version, -v             Show version

Examples:
  node build/tokens/build.js --brand chassis --platform web
  node build/tokens/build.js --theme light dark --dry-run
`

/**
 * Loads the package version and the build configuration: `chassis.build` of
 * `package.json`, or the content of `configFile`.
 * The optional `options` of the configuration hold Style Dictionary options by platform
 * name, e.g. `{ "web-px": { "outputReferences": true } }`.
 * @param {string} [configFile] - A JSON file with `brands`, `themes`, `screens`, `apps`
 *   and optionally `options`.
 * @returns {Promise<Object>} The `version` and the `buildOptions`.
 * @throws {Error} When a setting is missing, or `options` names a platform no app uses.
 */
async function loadConfig(configFile) {
  const readJson = async (file) => JSON.parse(await promises.readFile(file, 'utf-8'))
  const packageJson = await readJson('package.json')
  const buildOptions = configFile ? await readJson(configFile) : packageJson.chassis?.build

  const source = configFile ?? 'package.json'
  if (!buildOptions?.brands || !buildOptions?.themes || !buildOptions?.apps) {
    throw new Error(
      configFile
        ? `Invalid ${configFile}: missing brands, themes or apps`
        : 'Invalid package.json: missing required chassis.build configuration'
    )
  }
  const platforms = Object.values(buildOptions.apps).flat()
  const unknown = Object.keys(buildOptions.options ?? {}).filter((key) => !platforms.includes(key))
  if (unknown.length > 0) {
    throw new Error(`Invalid ${source}: options for platforms no app uses: ${unknown.join(', ')}`)
  }
  if (platforms.includes('android')) {
    try {
      screenQualifiers(buildOptions.screens, buildOptions.options?.android?.screens)
    } catch (error) {
      throw new Error(`Invalid ${source}: ${error.message}`, { cause: error })
    }
  }
  return { version: packageJson.version, buildOptions }
}

/**
 * Registers all necessary extensions for Style Dictionary, including
 * preprocessors, filters, transforms, formats, and file headers.
 * @param {string} version - The package version, printed in every file header.
 */
function registerDictionary(version) {
  registerStudio(StyleDictionary, {
    'ts/color/modifiers': { format: 'hex' }
  })

  StyleDictionary.registerPreprocessor({
    name: 'cx/global',
    preprocessor: (dictionary) => cxPrep(dictionary)
  })

  registerFilters(StyleDictionary)
  registerTransforms(StyleDictionary)
  registerFormats(StyleDictionary)

  StyleDictionary.registerFileHeader({
    name: 'cxFileHeader',
    fileHeader: async (defaultMessages = []) => [
      ...defaultMessages,
      `Chassis - Tokens v${version}`,
      `Copyright 2026 Ozgur Gunes`,
      `Licensed under MIT (https://github.com/chassis-ui/tokens/blob/main/LICENSE)`
    ]
  })
}

/**
 * Parses command line arguments for selective builds. Unknown arguments are ignored.
 * @param {string[]} [args] - The arguments after the script name.
 * @returns {Object} Filters (`brands`, `apps`, `platforms`, `themes`, `screens`), the
 *   output directory (`out`), the configuration file (`config`, when given) and the
 *   flags `dryRun`, `help` and `version`.
 */
function parseArgs(args = process.argv.slice(2)) {
  const options = {
    brands: [],
    apps: [],
    platforms: [],
    themes: [],
    screens: [],
    out: 'dist',
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h'),
    version: args.includes('--version') || args.includes('-v')
  }

  const flags = ['--brand', '--app', '--platform', '--theme', '--screen']
  const keys = ['brands', 'apps', 'platforms', 'themes', 'screens']

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') {
      const dir = args[i + 1]
      if (!dir || dir.startsWith('--')) {
        throw new Error('--out requires a directory')
      }
      options.out = dir.replace(/[/\\]+$/, '')
      i++
      continue
    }
    if (args[i] === '--config') {
      const file = args[i + 1]
      if (!file || file.startsWith('--')) {
        throw new Error('--config requires a file')
      }
      options.config = file
      i++
      continue
    }
    const flagIndex = flags.indexOf(args[i])
    if (flagIndex !== -1) {
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        options[keys[flagIndex]].push(args[++i])
      }
    }
  }

  return options
}

/**
 * Plans the builds: one per brand, app and token-set list. Every theme adds a colour
 * output and every screen a number output. Outputs are built from the token sets of
 * their own theme or screen and the first configured theme or screen otherwise, so the
 * base output (main, string) shares its token sets with the first colour and the first
 * number output.
 *
 * @param {Object} sets - Token-set lists by `<brand>_<app>_<theme>[_<screen>]`, as
 *   `permutateThemes` returns them from `tokens/$themes.json`.
 * @param {Object} buildOptions - `chassis.build` from `package.json`.
 * @param {Object} [filters] - Filters from `parseArgs`; an empty filter selects all.
 * @returns {Object[]} Builds with `brand`, `app`, `key`, `platforms`, `outputs`, the
 *   configured `themes` and `screens`, and `source`, the token files in override order.
 * @throws {Error} When a token-set list is missing from `sets`.
 */
function planBuilds(sets, buildOptions, filters = {}) {
  const { brands, themes, screens = [], apps } = buildOptions
  const select = (all, selected) =>
    selected?.length > 0 ? all.filter((item) => selected.includes(item)) : all
  const [firstTheme] = themes
  const [firstScreen] = screens

  const outputs = [
    { kind: 'base' },
    ...select(themes, filters.themes).map((theme) => ({ kind: 'color', theme })),
    ...(screens.length > 0
      ? select(screens, filters.screens).map((screen) => ({ kind: 'number', screen }))
      : [{ kind: 'number' }])
  ]

  const builds = []
  for (const brand of select(brands, filters.brands)) {
    for (const [app, appPlatforms] of Object.entries(apps)) {
      const platforms = select(appPlatforms, filters.platforms)
      if (!select([app], filters.apps).length || platforms.length === 0) continue

      const byKey = new Map()
      for (const output of outputs) {
        const theme = output.theme ?? firstTheme
        const screen = output.screen ?? firstScreen
        const key = [brand, app, theme, screen].filter(Boolean).join('_')
        if (!byKey.has(key)) byKey.set(key, [])
        byKey.get(key).push(output)
      }

      for (const [key, keyOutputs] of byKey) {
        if (!sets[key]) {
          throw new Error(`No token sets for ${key} in tokens/$themes.json`)
        }
        builds.push({
          brand,
          app,
          key,
          platforms,
          outputs: keyOutputs,
          themes,
          screens,
          source: sets[key].map((tokenSet) => `tokens/${tokenSet}.json`)
        })
      }
    }
  }
  return builds
}

/**
 * Plans the iOS colour files that follow the appearance: one per output directory whose
 * builds write both a light and a dark colour file. `writeThemeColors` writes them after
 * all builds.
 *
 * @param {Object[]} builds - Builds from `planBuilds`.
 * @param {string} [outDir] - Output root directory.
 * @returns {string[]} The paths of the files, e.g. `dist/ios/demo/chassis/Color.swift`.
 */
function planThemeColors(builds, outDir) {
  const themesByPath = new Map()
  for (const build of builds) {
    if (!build.platforms.includes('ios')) continue
    const { buildPath } = config({ ...build, platforms: ['ios'], outDir }).platforms.ios
    if (!themesByPath.has(buildPath)) themesByPath.set(buildPath, new Set())
    for (const { kind, theme } of build.outputs) {
      if (kind === 'color') themesByPath.get(buildPath).add(theme)
    }
  }
  return [...themesByPath]
    .filter(([, themes]) => THEMES.every((theme) => themes.has(theme)))
    .map(([buildPath]) => `${buildPath}${THEME_COLORS_FILE}`)
}

/**
 * Builds all platforms of one planned build.
 * @param {Object} build - A build from `planBuilds`, with its Style Dictionary `cfg`.
 */
async function processBuild({ key, cfg }) {
  logger.info(`\n⚙️ Starting: ${key} (${Object.keys(cfg.platforms).join(', ')})`)
  logger.info('-'.repeat(40))
  const sd = new StyleDictionary(cfg)
  await sd.buildAllPlatforms()
  logger.info(`\n✅ Completed: ${key}\n`)
}

/**
 * Main execution function that registers extensions, parses CLI arguments for filtering,
 * plans the builds, and runs each one in turn.
 *
 * CLI usage:
 *   node build/tokens/build.js --brand chassis --theme light dark --app docs --platform web --screen large small
 *
 * All parameters are optional and accept multiple space-separated values.
 */
async function run() {
  try {
    const filters = parseArgs()
    if (filters.help) {
      logger.info(HELP)
      return
    }

    const { version, buildOptions } = await loadConfig(filters.config)
    if (filters.version) {
      logger.info(`v${version}`)
      return
    }

    const startTime = Date.now()
    let successCount = 0
    let errorCount = 0

    registerDictionary(version)

    const $themes = JSON.parse(await promises.readFile('tokens/$themes.json', 'utf-8'))
    const sets = permutateThemes($themes, { separator: '_' })
    const builds = planBuilds(sets, buildOptions, filters).map((build) => ({
      ...build,
      cfg: config({ ...build, outDir: filters.out, platformOptions: buildOptions.options })
    }))

    if (filters.dryRun) {
      logger.dryRun(builds, planThemeColors(builds, filters.out))
      return
    }

    logger.header(`📦 Processing ${builds.length} build(s)...`)

    for (let i = 0; i < builds.length; i++) {
      try {
        logger.progress(i + 1, builds.length)
        await processBuild(builds[i])
        successCount++
      } catch (error) {
        errorCount++
        logger.error(`Failed: ${builds[i].key}`, error)
      }
    }

    // Written after every build, because the light and dark colours come from two builds
    try {
      for (const path of await writeThemeColors()) logger.info(`✔︎ ${path}`)
    } catch (error) {
      errorCount++
      logger.error('Failed: iOS colours that follow the appearance', error)
    }

    logger.summary(successCount, errorCount, startTime)

    if (errorCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    logger.error('Build failed', error)
    process.exit(1)
  }
}

// Export for testing
export { loadConfig, planBuilds, planThemeColors, parseArgs }

// Only run if this is the main module (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  run()
}

/**
 * @file build.js
 * @description This file handles the build process for Style Dictionary, including
 *              registering extensions, generating tasks, and processing configurations.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { promises, readFileSync } from 'fs'
import { join } from 'path'
import StyleDictionary from 'style-dictionary'
import { permutateThemes, register as registerStudio } from '@tokens-studio/sd-transforms'
import config from './config/index.js'
import registerFilters from './filters.js'
import registerTransforms from './transforms.js'
import registerFormats from './formats.js'
import cxPrep from './preprocessor.js'
import logger from './logger.js'

let packageJson
let buildOptions

/**
 * Load configuration from package.json
 */
async function loadConfig() {
  if (!packageJson) {
    packageJson = JSON.parse(await promises.readFile('package.json', 'utf-8'))
    buildOptions = packageJson.chassis?.build

    if (!buildOptions?.brands || !buildOptions?.themes || !buildOptions?.apps) {
      throw new Error('Invalid package.json: missing required chassis.build configuration')
    }
  }
  return buildOptions
}

/**
 * Registers all necessary extensions for Style Dictionary, including
 * preprocessors, filters, transforms, formats, and file headers.
 */
function registerDictionary() {
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
      `Chassis - Tokens v0.2.0`,
      `Copyright 2026 Ozgur Gunes`,
      `Licensed under MIT (https://github.com/chassis-ui/tokens/blob/main/LICENSE)`
    ]
  })
}

/**
 * Find token key by brand, app, theme, and screen
 * @param {Object} tokens - The tokens object
 * @param {string} brand - Brand name
 * @param {string} app - App name
 * @param {string} [theme] - Theme name
 * @param {string} [screen] - Screen name
 * @returns {string|null} - The matching token key or null
 */
function findTokenKey(tokens, brand, app, theme, screen) {
  if (screen) {
    const key = `${brand}_${app}_${theme}_${screen}`
    return tokens[key] ? key : null
  }
  if (theme) {
    const exactKey = `${brand}_${app}_${theme}`
    return tokens[exactKey]
      ? exactKey
      : Object.keys(tokens).find((k) => k.startsWith(`${brand}_${app}_${theme}`))
  }
  return Object.keys(tokens).find((k) => k.startsWith(`${brand}_${app}`))
}

/**
 * Parse command line arguments for selective builds
 * @returns {Object} Parsed options with brands, apps, platforms, themes, screens arrays
 */
function parseArgs() {
  const args = process.argv.slice(2)

  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    logger.info(`
Chassie Tokens Build System

Usage: node build/tokens/build.js [options]

Options:
  --brand <brands...>       Filter by brand(s)
  --app <apps...>           Filter by app(s)
  --platform <platforms...> Filter by platform(s)
  --theme <themes...>       Filter by theme(s)
  --screen <screens...>     Filter by screen(s)
  --dry-run                 Show tasks without executing
  --help, -h                Show this help
  --version, -v             Show version

Examples:
  node build/tokens/build.js --brand chassis --platform web
  node build/tokens/build.js --theme light dark --dry-run
    `)
    process.exit(0)
  }

  // Handle version
  if (args.includes('--version') || args.includes('-v')) {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
    logger.info(`v${pkg.version}`)
    process.exit(0)
  }

  const options = {
    brands: [],
    apps: [],
    platforms: [],
    themes: [],
    screens: [],
    dryRun: args.includes('--dry-run')
  }

  const flags = ['--brand', '--app', '--platform', '--theme', '--screen']
  const keys = ['brands', 'apps', 'platforms', 'themes', 'screens']

  for (let i = 0; i < args.length; i++) {
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
 * Generates tasks for all brand, app, platform, theme, and screen combinations,
 * filtered by optional CLI parameters.
 *
 * @param {Object} tokens - The tokens object containing theme permutations.
 * @param {Object} filters - Filter object with optional arrays: brands, themes, apps, screens, platforms.
 * @param {Object} options - Build options from package.json (chassis.build)
 * @returns {Array<Object>} - An array of task configurations matching the filters.
 *
 * Example filter usage:
 *   { brands: ['chassis','test'], themes: ['light'], apps: ['docs'], screens: ['large','small'], platforms: ['web'] }
 */
function generateTasks(tokens, filters, options = buildOptions) {
  const { brands, themes, apps, screens } = options
  const filterList = (all, param) =>
    param && param.length > 0 ? all.filter((x) => param.includes(x)) : all

  const brandsFiltered = filterList(brands, filters.brands)
  const themesFiltered = filterList(themes, filters.themes)
  const screensFiltered = screens ? filterList(screens, filters.screens) : []
  const appsFiltered = Object.entries(apps).filter(
    ([app]) => !filters.apps || filters.apps.length === 0 || filters.apps.includes(app)
  )

  // Filter platforms if specified
  const platformsFiltered = (platforms) =>
    filters.platforms && filters.platforms.length > 0
      ? platforms.filter((p) => filters.platforms.includes(p))
      : platforms

  // Always generate a single base task (for main.scss and string.scss)
  const baseTasks = brandsFiltered.flatMap((brand) =>
    appsFiltered.flatMap(([app, platforms]) =>
      platformsFiltered(platforms).map((platform) => {
        const cfg = config({ brand, app, platform })
        const key = findTokenKey(tokens, brand, app)
        cfg.source = key ? tokens[key].map((tokenset) => `tokens/${tokenset}.json`) : []
        return {
          brand,
          app,
          platform,
          theme: undefined,
          screen: undefined,
          cfg
        }
      })
    )
  )

  // Generate color-<theme>.scss for all themes
  const colorTasks = brandsFiltered.flatMap((brand) =>
    appsFiltered.flatMap(([app, platforms]) =>
      platformsFiltered(platforms).flatMap((platform) =>
        themesFiltered.map((theme) => {
          const cfg = config({ brand, app, platform, theme })
          const key = findTokenKey(tokens, brand, app, theme)
          cfg.source = key ? tokens[key].map((tokenset) => `tokens/${tokenset}.json`) : []
          return { brand, app, platform, theme, screen: undefined, cfg }
        })
      )
    )
  )

  // Generate number files
  // If screens is not defined or empty, generate a single number file without screen suffix
  // Otherwise generate number-<screen>.scss for each screen
  const numberTasks = brandsFiltered.flatMap((brand) =>
    appsFiltered.flatMap(([app, platforms]) =>
      platformsFiltered(platforms).flatMap((platform) => {
        const theme = themesFiltered[0]

        // If no screens configured, generate single number file (pass null to indicate no screen suffix)
        if (!screens || screens.length === 0 || screensFiltered.length === 0) {
          const cfg = config({ brand, app, platform, screen: null })
          const key = findTokenKey(tokens, brand, app, theme)
          cfg.source = key ? tokens[key].map((tokenset) => `tokens/${tokenset}.json`) : []
          return [{ brand, app, platform, theme, screen: null, cfg }]
        }

        // Generate number file for each screen
        return screensFiltered.map((screen) => {
          const cfg = config({ brand, app, platform, screen })
          const key = findTokenKey(tokens, brand, app, theme, screen)
          cfg.source = key ? tokens[key].map((tokenset) => `tokens/${tokenset}.json`) : []
          return { brand, app, platform, theme, screen, cfg }
        })
      })
    )
  )

  return [...baseTasks, ...colorTasks, ...numberTasks]
}

/**
 * Processes a single task configuration by cleaning and building the platform.
 *
 * @param {Object} task - The task configuration object.
 * @param {string} task.brand - The brand name.
 * @param {string} task.app - The application name.
 * @param {string} task.platform - The target platform (e.g., 'web', 'ios', 'android').
 * @param {string} task.theme - The theme name.
 * @param {string} task.screen - The screen size.
 * @param {Object} task.cfg - The Style Dictionary configuration object.
 */
async function processTask({ brand, app, platform, theme, screen, cfg }) {
  // Build the identifier string
  let id = `${platform}/${brand}-${app}`
  if (theme) id += `-${theme}`
  if (screen) id += `-${screen}`
  logger.info(`\n⚙️ Starting: ${id}`)
  logger.info('-'.repeat(40))
  const sd = new StyleDictionary(cfg)
  await sd.cleanPlatform(platform)
  await sd.buildPlatform(platform)
  logger.info(`\n✅ Completed: ${id}\n`)
}

/**
 * Main execution function that registers extensions, parses CLI arguments for filtering,
 * generates tasks, and processes each task sequentially.
 *
 * CLI usage:
 *   node build/tokens/build.js --brand chassis test --theme light dark --app docs --platform web --screen large small
 *
 * All parameters are optional and accept multiple space-separated values.
 */
async function run() {
  try {
    const filters = parseArgs()
    const startTime = Date.now()
    let successCount = 0
    let errorCount = 0

    await loadConfig()
    registerDictionary()

    const $themes = JSON.parse(await promises.readFile('tokens/$themes.json', 'utf-8'))
    const tokens = permutateThemes($themes, { separator: '_' })
    const tasks = generateTasks(tokens, filters, buildOptions)

    // Dry run mode
    if (filters.dryRun) {
      logger.dryRun(tasks)
      return
    }

    logger.header(`📦 Processing ${tasks.length} task(s)...`)

    for (let i = 0; i < tasks.length; i++) {
      try {
        logger.progress(i + 1, tasks.length)
        await processTask(tasks[i])
        successCount++
      } catch (error) {
        errorCount++
        const task = tasks[i]
        logger.error(`Failed: ${task.platform}/${task.brand}-${task.app}`, error)
      }
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
export { generateTasks, processTask, parseArgs, findTokenKey }

// Only run if this is the main module (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  run()
}

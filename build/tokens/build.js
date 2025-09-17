/**
 * @file build.js
 * @description This file handles the build process for Style Dictionary, including
 *              registering extensions, generating tasks, and processing configurations.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { promises, readFileSync } from 'fs'
import { join } from 'path'
import minimist from 'minimist'
import StyleDictionary from 'style-dictionary'
import { permutateThemes, register as registerStudio } from '@tokens-studio/sd-transforms'
import config from './config.js'
import registerFilters from './filters.js'
import registerTransforms from './transforms.js'
import registerFormats from './formats.js'
import cxPrep from './preprocessor.js'

const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
const buildOptions = packageJson.chassis.build
const DEFAULT_THEME = packageJson.chassis.defaults.theme
const DEFAULT_SCREEN = packageJson.chassis.defaults.screen

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
      `Chassis - Tokens v0.1.0`,
      `Copyright 2025 Ozgur Gunes`,
      `Licensed under MIT (https://github.com/ozgurgunes/chassis-tokens/blob/main/LICENSE)`
    ]
  })
}

/**
 * Generates tasks for all brand, app, platform, theme, and screen combinations,
 * filtered by optional CLI parameters.
 *
 * @param {Object} tokens - The tokens object containing theme permutations.
 * @param {Object} filters - Filter object with optional arrays: brands, themes, apps, screens.
 * @returns {Array<Object>} - An array of task configurations matching the filters.
 *
 * Example filter usage:
 *   { brands: ['chassis','test'], themes: ['light'], apps: ['docs'], screens: ['large','small'] }
 */
function generateTasks(tokens, filters) {
  const { brands, themes, apps, screens } = buildOptions
  const filterList = (all, param) =>
    param && param.length > 0 ? all.filter((x) => param.includes(x)) : all

  const brandsFiltered = filterList(brands, filters.brands)
  const themesFiltered = filterList(themes, filters.themes)
  const screensFiltered = filterList(screens, filters.screens)
  const appsFiltered = Object.entries(apps).filter(
    ([app]) => !filters.apps || filters.apps.length === 0 || filters.apps.includes(app)
  )

  // Always generate a single base task (for base.scss and string.scss)
  const baseTasks = brandsFiltered.flatMap((brand) =>
    appsFiltered.flatMap(([app, platforms]) =>
      platforms.map((platform) => {
        const cfg = config({ brand, app, platform })
        // Use the first available tokens set for base
        const key = Object.keys(tokens).find((k) => k.startsWith(`${brand}_${app}`))
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
      platforms.flatMap((platform) =>
        themesFiltered.map((theme) => {
          const cfg = config({ brand, app, platform, theme })
          const key = tokens[`${brand}_${app}_${theme}`]
            ? `${brand}_${app}_${theme}`
            : `${brand}_${app}_${theme}_${DEFAULT_SCREEN}`
          cfg.source = tokens[key]?.map((tokenset) => `tokens/${tokenset}.json`) || []
          return { brand, app, platform, theme, screen: undefined, cfg }
        })
      )
    )
  )

  // Generate number-<screen>.scss for all screens
  const numberTasks = brandsFiltered.flatMap((brand) =>
    appsFiltered.flatMap(([app, platforms]) =>
      platforms.flatMap((platform) =>
        screensFiltered.map((screen) => {
          // Use the default theme for number files, or the first theme if not set
          const theme = themesFiltered[0] || DEFAULT_THEME
          const cfg = config({ brand, app, platform, screen })
          const key = tokens[`${brand}_${app}_${theme}_${screen}`]
            ? `${brand}_${app}_${theme}_${screen}`
            : null
          cfg.source = key ? tokens[key].map((tokenset) => `tokens/${tokenset}.json`) : []
          return { brand, app, platform, theme, screen, cfg }
        })
      )
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
  console.log(`\n⚙️ Starting: ${id}`)
  console.log('-'.repeat(40))
  const sd = new StyleDictionary(cfg)
  await sd.cleanPlatform(platform)
  await sd.buildPlatform(platform)
  console.log(`\n✅ Completed: ${id}\n`)
}

/**
 * Main execution function that registers extensions, parses CLI arguments for filtering,
 * generates tasks, and processes each task sequentially.
 *
 * CLI usage:
 *   node build/tokens/build.js --brand=chassis,test --theme=light,dark --app=docs --screen=large,small
 *
 * All parameters are optional and can be comma-separated for multiple values.
 */
async function run() {
  // Parse CLI args
  const argv = minimist(process.argv.slice(2))
  // Accept comma-separated values for each param
  const parseArg = (key) =>
    argv[key]
      ? String(argv[key])
          .split(',')
          .map((s) => s.trim())
      : undefined
  const filters = {
    brands: parseArg('brand'),
    themes: parseArg('theme'),
    apps: parseArg('app'),
    screens: parseArg('screen')
  }

  registerDictionary()

  const $themes = JSON.parse(await promises.readFile('tokens/$themes.json', 'utf-8'))
  const tokens = permutateThemes($themes, { separator: '_' })
  const tasks = generateTasks(tokens, filters)

  for (const task of tasks) {
    await processTask(task)
  }

  console.log('='.repeat(40))
  console.log('\nAll configurations processed successfully.\n')
}

// Export for testing
export { generateTasks, processTask }

// Only run if this is the main module (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  run()
}

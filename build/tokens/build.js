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
import StyleDictionary from 'style-dictionary'
import {
  permutateThemes,
  register as registerStudio
} from '@tokens-studio/sd-transforms'
import config from './config.js'
import registerFilters from './filters.js'
import registerTransforms from './transforms.js'
import registerFormats from './formats.js'
import cxPrep from './preprocessor.js'

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
)
const buildOptions = packageJson.chassis.build
const DEFAULT_TOKENS_THEME = packageJson.chassis.defaults.tokensTheme

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
    preprocessor: dictionary => cxPrep(dictionary)
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
 * Generates tasks for all brand, app, platform, theme, and template combinations.
 *
 * @param {Object} tokens - The tokens object containing theme permutations.
 * @returns {Array<Object>} - An array of task configurations.
 */
function generateTasks(tokens) {
  return buildOptions.brands.flatMap(brand =>
    Object.entries(buildOptions.apps).flatMap(([app, platforms]) =>
      platforms.flatMap(platform =>
        buildOptions.themes.flatMap(theme =>
          buildOptions.templates.map(template => {
            const cfg = config({
              brand,
              app,
              platform,
              theme,
              template,
              defaultTheme: theme === DEFAULT_TOKENS_THEME
            })
            cfg.source = tokens[`${brand}_${app}_${theme}_${template}`].map(
              tokenset => `tokens/${tokenset}.json`
            )
            return { brand, app, platform, theme, template, cfg }
          })
        )
      )
    )
  )
}

/**
 * Processes a single task configuration by cleaning and building the platform.
 *
 * @param {Object} task - The task configuration object.
 * @param {string} task.brand - The brand name.
 * @param {string} task.app - The application name.
 * @param {string} task.platform - The target platform (e.g., 'web', 'ios', 'android').
 * @param {string} task.theme - The theme name.
 * @param {string} task.template - The template/screen size.
 * @param {Object} task.cfg - The Style Dictionary configuration object.
 */
async function processTask({ brand, app, platform, theme, template, cfg }) {
  if (theme === DEFAULT_TOKENS_THEME) {
    console.log(`\nStarting: ${brand}/${app}-${platform}-${template}`)
    console.log('==============================================')
  }
  const sd = new StyleDictionary(cfg)
  await sd.cleanPlatform(platform)
  await sd.buildPlatform(platform)
  if (theme !== DEFAULT_TOKENS_THEME) {
    console.log(`\nCompleted: ${brand}/${app}-${platform}-${template}\n`)
  }
}

/**
 * Main execution function that registers extensions, generates tasks,
 * and processes each task sequentially.
 */
async function run() {
  registerDictionary()

  const $themes = JSON.parse(
    await promises.readFile('tokens/$themes.json', 'utf-8')
  )
  const tokens = permutateThemes($themes, { separator: '_' })
  const tasks = generateTasks(tokens)

  for (const task of tasks) {
    await processTask(task)
  }

  console.log('==============================================')
  console.log('\nAll configurations processed successfully.\n')
}

run()

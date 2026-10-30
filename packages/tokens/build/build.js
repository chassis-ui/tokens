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
import { relative, resolve } from 'path'
import StyleDictionary from 'style-dictionary'
import { permutateThemes, register as registerStudio } from '@tokens-studio/sd-transforms'
import config from './config/index.js'
import { screenQualifiers } from './config/android.js'
import registerFilters from './filters.js'
import registerTransforms from './transforms.js'
import registerFormats from './formats.js'
import registerIconActions from './icons.js'
import cxPrep from './preprocessor.js'
import logger from './logger.js'
import { THEMES, THEME_COLORS_FILE, writeThemeColors } from './theme-colors.js'
import { buildVersion, isEntry, readRepository, resolveRoot } from './root.js'

/** The token files, relative to the root of the repository, where the build runs. */
const SOURCE_DIR = 'source'

/** The `package.json` with `chassis.build`, at the root of the repository. */
const CONFIG_FILE = 'package.json'

const HELP = `
Chassis Tokens Build System

Usage: chassis-tokens build [options]

Options:
  --cwd <dir>               The repository of tokens (default: the nearest folder upward
                            whose package.json has a chassis block)
  --brand <brands...>       Filter by brand(s)
  --app <apps...>           Filter by app(s)
  --platform <platforms...> Filter by platform(s)
  --theme <themes...>       Filter by theme(s)
  --screen <screens...>     Filter by screen(s)
  --out <dir>               Output root directory (default: dist, or chassis.dist in the
                            package.json of the repository)
  --config <file>           JSON file to read the build configuration from, instead of
                            chassis.build in the package.json of the repository
  --clean                   Delete the output directory of each selected brand, app and
                            platform before building; not with --theme or --screen
  --dry-run                 Show builds without executing
  --help, -h                Show this help
  --version, -v             Show version

Examples:
  chassis-tokens build --brand chassis --platform web
  chassis-tokens build --theme light dark --dry-run
  chassis-tokens build --brand sinefil --clean
`

/**
 * Loads the version of the output and the build configuration: `chassis.build` of the
 * repository, or the content of `configFile`. The optional `options` of the configuration
 * hold Style Dictionary options by platform name, e.g.
 * `{ "web-px": { "outputReferences": true } }`.
 * @param {string} [configFile] - A JSON file with `brands`, `themes`, `screens`, `apps`
 *   and optionally `options`.
 * @param {string} [root] - The repository of tokens.
 * @returns {Promise<Object>} The `version` and the `buildOptions`.
 * @throws {Error} When a setting is missing, or `options` names a platform no app uses.
 */
async function loadConfig(configFile, root = resolveRoot()) {
  const { version, build } = readRepository(root)
  const buildOptions = configFile ? JSON.parse(await promises.readFile(configFile, 'utf-8')) : build

  const source = configFile ?? 'package.json'
  if (!buildOptions?.brands || !buildOptions?.themes || !buildOptions?.apps) {
    throw new Error(
      configFile
        ? `Invalid ${configFile}: missing brands, themes or apps`
        : `Invalid package.json in ${root}: missing required chassis.build configuration at the root of the repository`
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
  return { version, buildOptions }
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
  registerIconActions(StyleDictionary)

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
 * Parses command line arguments for selective builds. Unknown arguments are ignored;
 * `planBuilds` checks the filter values against the configuration.
 * @param {string[]} [args] - The arguments after the script name.
 * @returns {Object} Filters (`brands`, `apps`, `platforms`, `themes`, `screens`), the
 *   repository (`cwd`), the output directory (`out`) and the configuration file (`config`),
 *   when given, and the flags `clean`, `dryRun`, `help` and `version`.
 */
function parseArgs(args = process.argv.slice(2)) {
  const options = {
    brands: [],
    apps: [],
    platforms: [],
    themes: [],
    screens: [],
    clean: args.includes('--clean'),
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h'),
    version: args.includes('--version') || args.includes('-v')
  }

  const flags = ['--brand', '--app', '--platform', '--theme', '--screen']
  const keys = ['brands', 'apps', 'platforms', 'themes', 'screens']

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cwd') {
      const dir = args[i + 1]
      if (!dir || dir.startsWith('--')) {
        throw new Error('--cwd requires a directory')
      }
      options.cwd = dir
      i++
      continue
    }
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
      const values = options[keys[flagIndex]]
      const before = values.length
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        values.push(args[++i])
      }
      if (values.length === before) {
        throw new Error(`${flags[flagIndex]} requires a value`)
      }
    }
  }

  return options
}

/**
 * Checks the filter values against the configuration, so that a mistyped value fails
 * instead of building nothing.
 * @param {Object} buildOptions - `chassis.build` of the repository.
 * @param {Object} filters - Filters from `parseArgs`.
 * @throws {Error} When a filter names a brand, app, platform, theme or screen that the
 *   configuration does not have.
 */
function checkFilters(buildOptions, filters) {
  const { brands, themes, screens = [], apps } = buildOptions
  const known = {
    brand: [brands, filters.brands],
    app: [Object.keys(apps), filters.apps],
    platform: [[...new Set(Object.values(apps).flat())], filters.platforms],
    theme: [themes, filters.themes],
    screen: [screens, filters.screens]
  }
  const problems = Object.entries(known).flatMap(([flag, [values, selected = []]]) => {
    const unknown = selected.filter((value) => !values.includes(value))
    if (unknown.length === 0) return []
    const configured = values.length > 0 ? values.join(', ') : 'none'
    return [`--${flag} ${unknown.join(' ')} (configured: ${configured})`]
  })
  if (problems.length > 0) {
    throw new Error(`Unknown filter values: ${problems.join('; ')}`)
  }
}

/**
 * Plans the builds: one per brand, app and token-set list. Every theme adds a color
 * output and every screen a number output. Outputs are built from the token sets of
 * their own theme or screen and the first configured theme or screen otherwise, so the
 * base output (main, string) shares its token sets with the first color and the first
 * number output. Without configured screens there is one number output, built from the
 * token sets of the first screen in `source/$themes.json` when it has a screen group.
 *
 * @param {Object} sets - Token-set lists by `<brand>_<app>_<theme>[_<screen>]`, as
 *   `permutateThemes` returns them from `source/$themes.json`.
 * @param {Object} buildOptions - `chassis.build` of the repository.
 * @param {Object} [filters] - Filters from `parseArgs`; an empty filter selects all.
 * @returns {Object[]} Builds with `brand`, `app`, `key`, `platforms`, `outputs`, the
 *   configured `themes` and `screens`, and `source`, the token files in override order.
 * @throws {Error} When a filter names a value the configuration does not have, when the
 *   filters together select no build (such as an app without the selected platform), or
 *   when a token-set list is missing from `sets`.
 */
function planBuilds(sets, buildOptions, filters = {}) {
  checkFilters(buildOptions, filters)
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

      for (const [name, keyOutputs] of byKey) {
        // Without configured screens, the source may still have a screen group: its first
        // screen, the first that `permutateThemes` lists, gives the token sets
        const key =
          sets[name] || screens.length > 0
            ? name
            : (Object.keys(sets).find((setKey) => setKey.startsWith(`${name}_`)) ?? name)
        if (!sets[key]) {
          throw new Error(`No token sets for ${key} in source/$themes.json`)
        }
        builds.push({
          brand,
          app,
          key,
          platforms,
          outputs: keyOutputs,
          themes,
          screens,
          source: sets[key].map((tokenSet) => `${SOURCE_DIR}/${tokenSet}.json`)
        })
      }
    }
  }
  if (builds.length === 0) {
    throw new Error('The filters select no build: no selected app has a selected platform')
  }
  return builds
}

/**
 * Plans the iOS color files that follow the appearance: one per output directory whose
 * builds write both a light and a dark color file. `writeThemeColors` writes them after
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
 * Plans the directories that `--clean` deletes before the builds: the output directory of
 * every selected brand, app and platform, so that no file the build no longer writes,
 * such as the number file of a removed screen, stays behind.
 *
 * @param {Object[]} builds - Builds from `planBuilds`, with their Style Dictionary `cfg`.
 * @param {Object} [filters] - Filters from `parseArgs`.
 * @returns {string[]} The directories, e.g. `dist/web/docs/chassis/`.
 * @throws {Error} When a theme or screen filter is set: those builds write only some files
 *   of their directories, and the others would be deleted.
 */
function planClean(builds, filters = {}) {
  if (filters.themes?.length > 0 || filters.screens?.length > 0) {
    throw new Error(
      '--clean cannot be combined with --theme or --screen, which build only some files of a directory'
    )
  }
  const dirs = builds.flatMap(({ cfg }) =>
    Object.values(cfg.platforms).map(({ buildPath }) => buildPath)
  )
  return [...new Set(dirs)]
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
 * plans the builds, and runs each one in turn. It runs at the root of the repository, because
 * Style Dictionary reads a token file by a glob, and a path with a bracket in it is no glob of
 * that path; `--out` and `--config` are relative to the folder the command started in.
 *
 * CLI usage:
 *   chassis-tokens build --brand chassis --theme light dark --app docs --platform web --screen large small
 *
 * All parameters are optional and accept multiple space-separated values.
 *
 * @param {string[]} [args] - The arguments after the command.
 */
async function run(args) {
  try {
    const filters = parseArgs(args)
    if (filters.help) {
      logger.info(HELP)
      return
    }
    if (filters.version) {
      logger.info(`v${buildVersion()}`)
      return
    }

    const root = resolveRoot(filters.cwd)
    const out = filters.out && resolve(filters.out)
    const configFile = filters.config && resolve(filters.config)
    const { version, buildOptions } = await loadConfig(configFile, root)
    process.chdir(root)
    const outDir = out ?? relative(root, readRepository(root).dist)

    const startTime = Date.now()
    let successCount = 0
    let errorCount = 0

    registerDictionary(version)

    const $themes = JSON.parse(await promises.readFile(`${SOURCE_DIR}/$themes.json`, 'utf-8'))
    const sets = permutateThemes($themes, { separator: '_' })
    const builds = planBuilds(sets, buildOptions, filters).map((build) => ({
      ...build,
      cfg: config({ ...build, outDir, platformOptions: buildOptions.options })
    }))

    const cleanDirs = filters.clean ? planClean(builds, filters) : []

    if (filters.dryRun) {
      logger.dryRun(builds, planThemeColors(builds, outDir), cleanDirs)
      return
    }

    for (const dir of cleanDirs) {
      await promises.rm(dir, { recursive: true, force: true })
      logger.info(`🧹 Deleted ${dir}`)
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

    // Written after every build, because the light and dark colors come from two builds
    try {
      for (const path of await writeThemeColors()) logger.info(`✔︎ ${path}`)
    } catch (error) {
      errorCount++
      logger.error('Failed: iOS colors that follow the appearance', error)
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
export { loadConfig, planBuilds, planThemeColors, planClean, parseArgs, CONFIG_FILE, SOURCE_DIR }

/**
 * The command line of the build: `chassis-tokens build`.
 * @param {string[]} [argv] - The arguments. Default: `process.argv.slice(2)`.
 */
export function cli(argv) {
  return run(argv)
}

// Only run if this is the main module (not imported)
if (isEntry(import.meta.url)) {
  cli()
}

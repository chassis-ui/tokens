/**
 * @file init.js
 * @description Writes the baseline of a repository of tokens into a folder: a `package.json`
 *              with the `chassis.build` block, the scripts and a development dependency on
 *              this package, a README, a changelog, a CI workflow, a tag-driven release workflow
 *              and a few Tokens Studio files, so that the first build has tokens to build. The
 *              templates are in `init-templates/` beside this module, and the few values that
 *              differ by repository are filled in: the name, the package manager and its
 *              commands.
 *
 *              The command writes outside the output folder, the one that does, so it writes
 *              nothing when a file it would write exists, unless `--force` is given, and
 *              `--dry-run` only prints the files.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PLATFORM_NAMES } from './config/index.js'
import { buildVersion, isEntry, repositoryWebUrl } from './root.js'

/** The folder of the templates. */
const TEMPLATES = fileURLToPath(new URL('./init-templates/', import.meta.url))

/** The version of Node.js written to `.nvmrc`. Trusted publishing needs its npm 11. */
export const NODE_VERSION = '24'

/** The first version of a repository. */
export const FIRST_VERSION = '0.1.0'

/** The package managers of `--pm`, with the commands the templates name. */
export const PACKAGE_MANAGERS = {
  // The install of the workflows is frozen, so the first install has to commit its lockfile
  npm: {
    install: 'npm install',
    ci: 'npm ci',
    run: 'npm run',
    lockfile: 'package-lock.json',
    setup: ''
  },
  pnpm: {
    install: 'pnpm install',
    ci: 'pnpm install --frozen-lockfile',
    lockfile: 'pnpm-lock.yaml',
    run: 'pnpm',
    setup: [
      '      - name: Setup pnpm',
      '        uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0',
      '        with:',
      '          version: 10',
      '',
      ''
    ].join('\n')
  }
}

/** The brand and the app a repository starts with, when none is given. */
export const DEFAULTS = { brands: ['main'], apps: { site: ['web'] }, pm: 'npm', license: 'MIT' }

/** The folder of the token files, which init writes only when it holds none. */
const SOURCE_DIR = 'source'

/** The themes and the screens of a new repository. */
const THEMES = ['light', 'dark']
const SCREENS = ['large', 'medium', 'small']

/** A brand or app name: lowercase letters, digits and single hyphens, as the build wants. */
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * @typedef {object} InitOptions
 * @property {string} [dir] - The folder to write into. Default: the working directory.
 * @property {string} [name] - The name of the package. Default: the name of the folder.
 * @property {string[]} [brands] - The brands of `chassis.build`. Default `['main']`.
 * @property {Record<string, string[]>} [apps] - The apps of `chassis.build`, each with its
 *   platforms. Default `{ site: ['web'] }`.
 * @property {'npm' | 'pnpm'} [pm] - The package manager the README and the workflows name.
 *   Default `npm`.
 * @property {string} [repository] - The repository: `owner/name`, or an address. Default: the
 *   `origin` remote of the folder, when it is the root of a git repository.
 * @property {string} [license] - The license. Default `MIT`.
 * @property {string} [author] - The author. Default: `user.name` of the git configuration.
 * @property {boolean} [force] - Write over a file that exists, but never a token file.
 * @property {boolean} [dryRun] - Print the files, write nothing.
 */

/**
 * Reads what git knows of a folder: the author, by name only since a package publishes it, and
 * the `origin` remote, when the folder is the root of a repository and not a folder inside one.
 * @param {string} dir
 * @returns {{repository?: string, author?: string}} Without what git does not know.
 */
export function gitDefaults(dir) {
  const inDir = existsSync(dir)
  const git = (cwd, ...args) => {
    try {
      const output = execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      return output.toString().trim() || undefined
    } catch {
      return undefined
    }
  }
  const author = git(inDir ? dir : homedir(), 'config', 'user.name')
  const top = inDir ? git(dir, 'rev-parse', '--show-toplevel') : undefined
  const isRoot = top !== undefined && top === realpathSync(dir)
  const repository = isRoot ? git(dir, 'remote', 'get-url', 'origin') : undefined
  return {
    ...(author && { author }),
    ...(repositoryWebUrl(repository) && { repository })
  }
}

/**
 * Lists the files a folder of token files already holds, without dotfiles.
 * @param {string} dir - The folder of the repository.
 * @returns {string[]} Paths relative to `dir`.
 */
function existingSource(dir) {
  const source = join(dir, SOURCE_DIR)
  if (!existsSync(source)) return []
  return readdirSync(source, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => join(entry.parentPath, entry.name).slice(dir.length + 1))
    .sort()
}

/**
 * Checks a brand or app name.
 * @param {string} kind - `brand` or `app`, for the message.
 * @param {string} name
 * @returns {string} The name.
 * @throws {Error} When the name is not lowercase letters, digits and hyphens.
 */
export function checkName(kind, name) {
  if (!NAME_RE.test(name)) {
    throw new Error(
      `${kind === 'app' ? 'An' : 'A'} ${kind} name is lowercase letters, digits and hyphens: ${name}`
    )
  }
  return name
}

/**
 * Parses an app of `--app`: `<name>:<platform>[,<platform>…]`.
 * @param {string} spec
 * @returns {{ app: string, platforms: string[] }}
 * @throws {Error} When the form is wrong, or the build has no such platform.
 */
export function parseApp(spec) {
  const [app, list, ...more] = spec.split(':')
  if (!app || !list || more.length > 0) {
    throw new Error(
      `An app is <name>:<platform>[,<platform>…], such as docs:web or mobile:ios,android: ${spec}`
    )
  }
  checkName('app', app)
  const platforms = [...new Set(list.split(',').filter(Boolean))]
  for (const platform of platforms) {
    if (!PLATFORM_NAMES.includes(platform)) {
      throw new Error(
        `Unknown platform ${platform} of the app ${app}. Platforms: ${PLATFORM_NAMES.join(', ')}`
      )
    }
  }
  return { app, platforms }
}

/**
 * Fills a template: the placeholders, and the line of the pnpm setup step.
 * @param {string} text
 * @param {Record<string, string>} values - By placeholder, without the underscores.
 * @returns {string}
 */
function render(text, values) {
  return text
    .replace(/^[ \t]*# __PNPM_SETUP__\n/m, values.PNPM_SETUP)
    .replace(/__([A-Z_]+?)__/g, (match, key) => (key in values ? values[key] : match))
}

/**
 * The Tokens Studio files of a new repository, by path under `source/`: one option per brand,
 * app, theme and screen in `$themes.json`, each enabling one token set.
 * @param {string[]} brands
 * @param {string[]} apps
 * @returns {Record<string, Object>}
 */
function starterSource(brands, apps) {
  const color = (value) => ({ $type: 'color', $value: value })
  const size = (value) => ({ $type: 'dimension', $value: value })
  /** @type {Record<string, Object>} */
  const sets = {}
  for (const brand of brands)
    sets[`brand-${brand}`] = { color: { brand: { primary: color('#2563eb') } } }
  for (const app of apps) sets[`app-${app}`] = { size: { radius: { default: size('4') } } }
  sets['theme-light'] = { color: { surface: { default: color('#ffffff') } } }
  sets['theme-dark'] = { color: { surface: { default: color('#111111') } } }
  sets['screen-large'] = { size: { space: { default: size('24') } } }
  sets['screen-medium'] = { size: { space: { default: size('20') } } }
  sets['screen-small'] = { size: { space: { default: size('16') } } }

  const group = (name, options) =>
    options.map((option) => ({
      id: `${name}-${option}`,
      name: option,
      group: name,
      selectedTokenSets: { [`${name}-${option}`]: 'enabled' }
    }))
  const themes = [
    ...group('brand', brands),
    ...group('app', apps),
    ...group('theme', THEMES),
    ...group('screen', SCREENS)
  ]

  return {
    '$themes.json': themes,
    '$metadata.json': { tokenSetOrder: Object.keys(sets) },
    ...Object.fromEntries(Object.entries(sets).map(([set, tokens]) => [`${set}.json`, tokens]))
  }
}

/**
 * The files of a repository, by path relative to its root, with their content. Pure, apart
 * from reading the templates.
 * @param {InitOptions} [options]
 * @returns {Map<string, string>}
 * @throws {Error} On a name, an app or a package manager that is not accepted.
 */
export function planFiles(options = {}) {
  const dir = resolve(options.dir || '.')
  const name = options.name || basename(dir)
  const brands = (options.brands?.length ? options.brands : DEFAULTS.brands).map((brand) =>
    checkName('brand', brand)
  )
  const apps = options.apps && Object.keys(options.apps).length > 0 ? options.apps : DEFAULTS.apps
  for (const app of Object.keys(apps)) checkName('app', app)
  const pm = options.pm || DEFAULTS.pm
  if (!Object.hasOwn(PACKAGE_MANAGERS, pm)) {
    throw new Error(
      `Unknown package manager ${pm}. One of ${Object.keys(PACKAGE_MANAGERS).join(', ')}`
    )
  }
  const repository = options.repository && repositoryWebUrl(options.repository)
  if (options.repository && !repository) {
    throw new Error(`A repository is owner/name or an address: ${options.repository}`)
  }
  const commands = PACKAGE_MANAGERS[pm]
  const values = {
    NAME: name,
    VERSION: FIRST_VERSION,
    INSTALL: commands.install,
    INSTALL_CI: commands.ci,
    RUN: commands.run,
    PM: pm,
    PNPM_SETUP: commands.setup
  }
  const template = (file) => render(readFileSync(join(TEMPLATES, file), 'utf8'), values)
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`

  const packageJson = {
    name,
    version: FIRST_VERSION,
    description: `The design tokens of ${name}, built with @chassis-ui/tokens`,
    type: 'module',
    ...(repository && { repository: { type: 'git', url: `git+${repository}.git` } }),
    license: options.license || DEFAULTS.license,
    ...(options.author && { author: options.author }),
    files: ['dist', 'CHANGELOG.md'],
    exports: { './dist/*': './dist/*', './package.json': './package.json' },
    publishConfig: { access: 'public' },
    chassis: { build: { brands, themes: THEMES, screens: SCREENS, apps } },
    scripts: {
      build: 'chassis-tokens build',
      lint: 'chassis-tokens lint-source',
      verify: 'chassis-tokens verify',
      diff: 'chassis-tokens diff',
      'swift-package': 'chassis-tokens swift-package',
      'swift-package:check': 'chassis-tokens swift-package --check'
    },
    engines: { node: '>=22.12.0' },
    devDependencies: { '@chassis-ui/tokens': `^${buildVersion()}` }
  }

  return new Map([
    ['package.json', json(packageJson)],
    ['.gitignore', template('gitignore')],
    ['.nvmrc', `${NODE_VERSION}\n`],
    ['README.md', template('README.md')],
    ['CHANGELOG.md', template('CHANGELOG.md')],
    ['.github/workflows/ci.yml', template('workflows/ci.yml')],
    ['.github/workflows/release.yml', template('workflows/release.yml')],
    ...Object.entries(starterSource(brands, Object.keys(apps))).map(
      ([file, content]) =>
        /** @type {[string, string]} */ ([`${SOURCE_DIR}/${file}`, json(content)])
    )
  ])
}

/**
 * Writes the baseline of a repository of tokens. A folder that holds token files keeps them,
 * with or without `force`, and gets no starter tokens: a sync from Figma wrote them, and a
 * starter set among them would be built with them.
 * @param {InitOptions} [options]
 * @returns {{ dir: string, files: string[], existing: string[], kept: string[],
 *   packageJson: Object, written: boolean }} The folder, the files relative to it, the ones of
 *   them that existed before, the token files it left alone, the `package.json` it plans, and
 *   whether the files were written (not on a dry run).
 * @throws {Error} When a file exists and neither `force` nor `dryRun` is given, or on an
 *   option that is not accepted. Nothing is written then.
 */
export function init(options = {}) {
  const dir = resolve(options.dir || '.')
  const plan = planFiles({ ...gitDefaults(dir), ...options, dir })
  const kept = existingSource(dir)
  if (kept.length > 0) {
    for (const file of plan.keys()) {
      if (file.startsWith(`${SOURCE_DIR}/`)) plan.delete(file)
    }
  }
  const files = [...plan.keys()]
  const packageJson = JSON.parse(plan.get('package.json'))

  const existing = files.filter((file) => existsSync(join(dir, file)))
  if (options.dryRun) return { dir, files, existing, kept, packageJson, written: false }
  if (existing.length > 0 && !options.force) {
    throw new Error(
      `Files to write exist in ${dir}: ${existing.join(', ')}. --force writes over them`
    )
  }

  for (const [file, content] of plan) {
    const target = join(dir, file)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return { dir, files, existing, kept, packageJson, written: true }
}

const HELP = `Usage: chassis-tokens init [dir] [options]

Writes the baseline of a repository of tokens into dir, the working directory by default:
package.json with the chassis.build block and the scripts, .gitignore, .nvmrc, README.md,
CHANGELOG.md, a CI and a release workflow, and Tokens Studio files in source/ for the first
build. Writes nothing when a file exists. A source/ that holds files is never written to, with
or without --force: it is kept, and chassis.build has to follow its $themes.json.

Options:
  --name <name>          The package name, default the name of the folder
  --brand <name…>        The brands, default main
  --app <name:platforms> An app and its platforms, such as docs:web or mobile:ios,android,
                         one or more times; default site:web. Platforms: ${PLATFORM_NAMES.join(', ')}
  --pm <npm|pnpm>        The package manager the README and the workflows name, default npm
  --repository <repo>    The repository, owner/name or an address; default the origin remote
                         of the folder, or left out
  --license <license>    The license, default MIT
  --author <author>      The author; default user.name of git, or left out
  --force                Write over the files that exist, but never a token file
  --dry-run              Print the files, write nothing
  --help, -h             Print this help
`

/**
 * Parses the arguments of the command.
 * @param {string[]} argv
 * @returns {InitOptions & { help: boolean }}
 * @throws {Error} On an unknown option, or an option without its value.
 */
export function parseInitArgs(argv) {
  /** @type {InitOptions & { help: boolean }} */
  const options = { brands: [], apps: {}, help: false }
  const values = (i) => {
    const list = []
    while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) list.push(argv[++i])
    if (list.length === 0) throw new Error(`${argv[i]} needs a value`)
    return { list, i }
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (['--repository', '--license', '--author'].includes(arg)) {
      const { list, i: next } = values(i)
      options[arg.slice(2)] = list.join(' ')
      i = next
    } else if (arg === '--name' || arg === '--pm') {
      const { list, i: next } = values(i)
      if (list.length > 1) throw new Error(`${arg} takes one value`)
      if (arg === '--pm' && !Object.hasOwn(PACKAGE_MANAGERS, list[0])) {
        throw new Error(
          `Unknown package manager ${list[0]}. One of ${Object.keys(PACKAGE_MANAGERS).join(', ')}`
        )
      }
      options[arg === '--name' ? 'name' : 'pm'] = /** @type {any} */ (list[0])
      i = next
    } else if (arg === '--brand') {
      const { list, i: next } = values(i)
      options.brands.push(...list.map((brand) => checkName('brand', brand)))
      i = next
    } else if (arg === '--app') {
      const { list, i: next } = values(i)
      for (const spec of list) {
        const { app, platforms } = parseApp(spec)
        if (app in options.apps) throw new Error(`The app ${app} is given twice`)
        options.apps[app] = platforms
      }
      i = next
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option ${arg}. Run with --help for the options.`)
    } else if (options.dir === undefined) {
      options.dir = arg
    } else {
      throw new Error(`One folder at most: ${options.dir} and ${arg}`)
    }
  }
  return options
}

/**
 * The command line of init: `chassis-tokens init`. Exits the process on a mistake.
 * @param {string[]} [argv] - The arguments. Default: `process.argv.slice(2)`.
 */
export function cli(argv = process.argv.slice(2)) {
  let options
  try {
    options = parseInitArgs(argv)
  } catch (error) {
    console.error(`❌ ${error.message}`)
    process.exit(2)
  }
  if (options.help) {
    console.log(HELP)
    return
  }
  try {
    const { files, existing, kept, packageJson, written } = init(options)
    const shown = options.dir || '.'
    for (const file of files) {
      console.log(`📄 ${file}${!written && existing.includes(file) ? ' (exists)' : ''}`)
    }
    if (kept.length > 0) {
      console.log(
        `🔒 Kept ${SOURCE_DIR}/ with its ${kept.length} files, and wrote no starter tokens: keep chassis.build in step with its $themes.json`
      )
    }
    const { repository, license, author } = packageJson
    console.log(
      `🏷️  repository: ${repository?.url ?? 'none'}, license: ${license}, author: ${author ?? 'none'}`
    )
    if (!written) {
      console.log(
        `\n🔍 Dry run: ${files.length} files to write in ${shown}${existing.length > 0 ? `, ${existing.length} of them exist` : ''}`
      )
      return
    }
    const run = PACKAGE_MANAGERS[options.pm || DEFAULTS.pm]
    console.log(`\n✅ ${files.length} files in ${shown}\n\nNext:`)
    if (shown !== '.') console.log(`  cd ${shown}`)
    console.log(`  git init\n  ${run.install}\n  ${run.run} build`)
    console.log(`  git add . (with ${run.lockfile}, which the workflows install from)`)
  } catch (error) {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  }
}

// Only run if this file is executed directly (not imported)
if (isEntry(import.meta.url)) cli()

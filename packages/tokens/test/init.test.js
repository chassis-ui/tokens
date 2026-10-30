/**
 * @file init.test.js
 * @description `chassis-tokens init`: the baseline of a repository of tokens, written into a
 *              temporary folder and read back. `command.test.js` runs the commands on it.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { DEFAULTS, gitDefaults, init, parseApp, parseInitArgs, planFiles } from '../build/init.js'
import { lintTokens, loadSource } from '../build/lint-tokens.js'
import { buildVersion } from '../build/root.js'
import { CLI, PACKAGE_DIR } from './helpers.js'

const temporary = mkdtempSync(join(tmpdir(), 'chassis-tokens-init-'))
afterAll(() => rmSync(temporary, { recursive: true }))

const read = (dir, file) => readFileSync(join(dir, file), 'utf8')

// No test reads the git configuration of the machine it runs on
const noGlobalConfig = join(temporary, 'gitconfig')
beforeAll(() => {
  writeFileSync(noGlobalConfig, '')
  vi.stubEnv('GIT_CONFIG_GLOBAL', noGlobalConfig)
  vi.stubEnv('GIT_CONFIG_NOSYSTEM', '1')
})
afterAll(() => vi.unstubAllEnvs())

const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' })

/** The files init writes with the defaults, in order. */
const FILES = [
  'package.json',
  '.gitignore',
  '.nvmrc',
  'README.md',
  'CHANGELOG.md',
  '.github/workflows/ci.yml',
  '.github/workflows/release.yml',
  'source/$themes.json',
  'source/$metadata.json',
  'source/brand-main.json',
  'source/app-site.json',
  'source/theme-light.json',
  'source/theme-dark.json',
  'source/screen-large.json',
  'source/screen-medium.json',
  'source/screen-small.json'
]

describe('init', () => {
  test('writes the files of a repository with the defaults, named after the folder', () => {
    const dir = join(temporary, 'acme-tokens')
    expect(init({ dir })).toMatchObject({
      dir,
      files: FILES,
      existing: [],
      kept: [],
      written: true
    })
    for (const file of FILES) expect(existsSync(join(dir, file))).toBe(true)

    const pkg = JSON.parse(read(dir, 'package.json'))
    expect(pkg.name).toBe('acme-tokens')
    expect(pkg.version).toBe('0.1.0')
    expect(pkg).not.toHaveProperty('private')
    expect(pkg.license).toBe('MIT')
    expect(pkg).not.toHaveProperty('repository')
    expect(pkg).not.toHaveProperty('author')
    expect(pkg.files).toContain('dist')
    expect(pkg.chassis).toEqual({
      build: {
        brands: DEFAULTS.brands,
        themes: ['light', 'dark'],
        screens: ['large', 'medium', 'small'],
        apps: DEFAULTS.apps
      }
    })
    expect(pkg.scripts).toEqual({
      build: 'chassis-tokens build',
      lint: 'chassis-tokens lint-source',
      verify: 'chassis-tokens verify',
      diff: 'chassis-tokens diff',
      'swift-package': 'chassis-tokens swift-package',
      'swift-package:check': 'chassis-tokens swift-package --check'
    })
    expect(pkg.devDependencies).toEqual({ '@chassis-ui/tokens': `^${buildVersion()}` })
  })

  test('the tokens it writes pass the source lint', async () => {
    const dir = join(temporary, 'linted')
    init({ dir, brands: ['one', 'two'], apps: { docs: ['web'], demo: ['ios', 'android'] } })
    const source = await loadSource(join(dir, 'source'))
    expect(Object.keys(source.sets)).toHaveLength(9)
    expect(lintTokens(source)).toEqual([])
  })

  test('takes the name, the brands, the apps and the package manager', () => {
    const plan = planFiles({
      dir: 'x',
      name: '@acme/tokens',
      brands: ['one', 'two'],
      apps: { docs: ['web'], demo: ['ios', 'android'] },
      pm: 'pnpm'
    })
    const pkg = JSON.parse(plan.get('package.json'))
    expect(pkg.name).toBe('@acme/tokens')
    expect(pkg.chassis.build.brands).toEqual(['one', 'two'])
    expect(pkg.chassis.build.apps).toEqual({ docs: ['web'], demo: ['ios', 'android'] })
    expect(plan.has('source/brand-two.json')).toBe(true)
    expect(plan.has('source/app-demo.json')).toBe(true)
    expect(plan.get('README.md')).toContain('# @acme/tokens')
    expect(plan.get('README.md')).toContain('`pnpm verify`')
    expect(plan.get('.github/workflows/ci.yml')).toContain('pnpm/action-setup')
    expect(plan.get('.github/workflows/ci.yml')).toContain('run: pnpm verify')
  })

  test('leaves no placeholder in any file', () => {
    for (const pm of ['npm', 'pnpm']) {
      for (const [file, text] of planFiles({ dir: 'x', pm })) {
        expect(text, file).not.toMatch(/__[A-Z_]+__/)
      }
    }
  })

  test('the workflows run the scripts of the install, from its lockfile', () => {
    for (const [pm, run, install] of [
      ['pnpm', 'pnpm', 'pnpm install --frozen-lockfile'],
      ['npm', 'npm run', 'npm ci']
    ]) {
      const plan = planFiles({ dir: 'x', pm })
      for (const file of ['ci', 'release']) {
        const workflow = plan.get(`.github/workflows/${file}.yml`)
        expect(workflow).not.toContain('npx')
        expect(workflow).toContain(`run: ${install}\n`)
        expect(workflow).toContain(`run: ${run} swift-package:check\n`)
      }
      expect(plan.get('.github/workflows/ci.yml')).toContain(`cache: ${pm}\n`)
      const release = plan.get('.github/workflows/release.yml')
      expect(release).toContain('package-manager-cache: false')
      expect(release).not.toContain('cache: pnpm')
      expect(plan.get('README.md')).not.toContain('npx')
    }
  })

  test('the release steps of the README build, verify, commit and tag, in that order', () => {
    const readme = planFiles({ dir: 'x', pm: 'pnpm' }).get('README.md')
    const steps = ['2. `pnpm build`', '3. `pnpm verify`', '4. Commit', 'git tag v0.1.0']
    const order = steps.map((step) => readme.indexOf(step))
    expect(order[0]).toBeGreaterThan(-1)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  test('with npm, the workflows have no pnpm step', () => {
    const plan = planFiles({ dir: 'x' })
    expect(plan.get('.github/workflows/ci.yml')).not.toContain('pnpm')
    expect(plan.get('.github/workflows/release.yml')).not.toContain('pnpm')
    expect(plan.get('.github/workflows/ci.yml')).toContain('run: npm run verify')
  })

  test('the release runs on a tag, verifies dist/, publishes and attaches the libraries', () => {
    const release = planFiles({ dir: 'x' }).get('.github/workflows/release.yml')
    expect(release).toContain("tags: ['v*']")
    expect(release).toContain('The tag $GITHUB_REF_NAME is not the version')
    expect(release).toContain('id-token: write')
    expect(release).toContain('npm publish --provenance')
    expect(release).toContain('"$RUNNER_TEMP"/aars/*.aar')
    const steps = ['run: npm run verify', ':library:aars', 'npm publish', 'gh release create']
    const order = steps.map((step) => release.indexOf(step))
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(order[0]).toBeGreaterThan(-1)
  })

  test('the Gradle project the release runs is in the published package', () => {
    const { files } = JSON.parse(read(PACKAGE_DIR, 'package.json'))
    const android = 'test/native/android'
    for (const file of [
      'gradlew',
      'settings.gradle.kts',
      'build.gradle.kts',
      'gradle.properties',
      'gradle',
      'library/build.gradle.kts',
      'library/src'
    ]) {
      expect(files).toContain(`${android}/${file}`)
      expect(existsSync(join(PACKAGE_DIR, android, file))).toBe(true)
    }
    expect(planFiles({ dir: 'x' }).get('.github/workflows/release.yml')).toContain(
      `node_modules/@chassis-ui/tokens/${android}`
    )
  })

  test('writes nothing when a file exists, unless forced', () => {
    const dir = join(temporary, 'existing')
    mkdirSync(dir)
    writeFileSync(join(dir, 'README.md'), 'mine')
    expect(() => init({ dir })).toThrow('Files to write exist')
    expect(existsSync(join(dir, 'package.json'))).toBe(false)
    expect(read(dir, 'README.md')).toBe('mine')

    expect(init({ dir, force: true }).existing).toEqual(['README.md'])
    expect(read(dir, 'README.md')).not.toBe('mine')
  })

  describe('in a folder with token files', () => {
    const withSource = (name) => {
      const dir = join(temporary, name)
      mkdirSync(join(dir, 'source/base'), { recursive: true })
      writeFileSync(join(dir, 'source/$themes.json'), '[]')
      writeFileSync(join(dir, 'source/base/brand.json'), '{"mine":{}}')
      return dir
    }
    const KEPT = ['source/$themes.json', 'source/base/brand.json']

    test('keeps them, with no starter tokens and no need of --force', () => {
      const dir = withSource('source-kept')
      const result = init({ dir })
      expect(result.kept).toEqual(KEPT)
      expect(result.files.filter((file) => file.startsWith('source/'))).toEqual([])
      expect(read(dir, 'source/$themes.json')).toBe('[]')
      expect(existsSync(join(dir, 'source/brand-main.json'))).toBe(false)
      expect(existsSync(join(dir, 'package.json'))).toBe(true)
    })

    test('--force overwrites the other files, and still not one token file', () => {
      const dir = withSource('source-forced')
      writeFileSync(join(dir, 'README.md'), 'mine')
      const result = init({ dir, force: true })
      expect(result.kept).toEqual(KEPT)
      expect(read(dir, 'README.md')).not.toBe('mine')
      expect(read(dir, 'source/base/brand.json')).toBe('{"mine":{}}')
      expect(existsSync(join(dir, 'source/theme-light.json'))).toBe(false)
    })

    test('a folder with only a dotfile has no token files', () => {
      const dir = join(temporary, 'source-empty')
      mkdirSync(join(dir, 'source'), { recursive: true })
      writeFileSync(join(dir, 'source/.DS_Store'), '')
      expect(init({ dir }).kept).toEqual([])
      expect(existsSync(join(dir, 'source/$themes.json'))).toBe(true)
    })

    test('the command says what it kept', () => {
      const dir = withSource('source-said')
      const result = spawnSync(process.execPath, [CLI, 'init', dir, '--force'], {
        encoding: 'utf8'
      })
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('Kept source/ with its 2 files')
      expect(result.stdout).not.toContain('brand-main.json')
    })
  })

  describe('repository, license and author', () => {
    const pkg = (options) => JSON.parse(planFiles({ dir: 'x', ...options }).get('package.json'))

    test('takes them as options', () => {
      expect(pkg({ repository: 'acme/tokens', license: 'ISC', author: 'Acme' })).toMatchObject({
        repository: { type: 'git', url: 'git+https://github.com/acme/tokens.git' },
        license: 'ISC',
        author: 'Acme'
      })
    })

    test('refuses a repository it cannot read', () => {
      expect(() => pkg({ repository: 'not an address' })).toThrow('A repository is owner/name')
    })

    test('reads the author and the origin of a git repository', () => {
      const dir = join(temporary, 'with-git')
      mkdirSync(dir)
      git(dir, 'init')
      git(dir, 'config', 'user.name', 'Acme Person')
      git(dir, 'config', 'user.email', 'person@acme.test')
      git(dir, 'remote', 'add', 'origin', 'git@github.com:acme/tokens.git')
      expect(init({ dir }).packageJson).toMatchObject({
        repository: { url: 'git+https://github.com/acme/tokens.git' },
        author: 'Acme Person'
      })
      // The options come first, and the email is not published
      expect(JSON.parse(read(dir, 'package.json')).author).not.toContain('@')
      expect(init({ dir, force: true, author: 'Other' }).packageJson.author).toBe('Other')
    })

    test('leaves out the origin of a repository around the folder', () => {
      const parent = join(temporary, 'around')
      const dir = join(parent, 'inner')
      mkdirSync(dir, { recursive: true })
      git(parent, 'init')
      git(parent, 'remote', 'add', 'origin', 'git@github.com:acme/around.git')
      expect(gitDefaults(dir)).not.toHaveProperty('repository')
    })

    test('knows nothing without git settings', () => {
      expect(gitDefaults(join(temporary, 'nowhere'))).toEqual({})
    })
  })

  test('--dry-run prints the files and writes nothing', () => {
    const dir = join(temporary, 'dry')
    const result = spawnSync(process.execPath, [CLI, 'init', dir, '--dry-run'], {
      encoding: 'utf8'
    })
    expect(result.status).toBe(0)
    for (const file of FILES) expect(result.stdout).toContain(file)
    expect(result.stdout).toContain(`Dry run: ${FILES.length} files`)
    expect(existsSync(dir)).toBe(false)
  })

  test.each([
    [{ brands: ['Acme'] }, 'A brand name is lowercase'],
    [{ apps: { 'My App': ['web'] } }, 'An app name is lowercase'],
    [{ pm: 'yarn' }, 'Unknown package manager yarn']
  ])('refuses %o', (options, message) => {
    expect(() => planFiles({ dir: 'x', ...options })).toThrow(message)
  })
})

describe('parseApp', () => {
  test('reads an app and its platforms', () => {
    expect(parseApp('mobile:ios,android')).toEqual({ app: 'mobile', platforms: ['ios', 'android'] })
  })

  test.each([
    ['docs', 'An app is <name>:<platform>'],
    ['a:b:c', 'An app is <name>:<platform>'],
    ['docs:windows', 'Unknown platform windows of the app docs']
  ])('refuses %s', (spec, message) => {
    expect(() => parseApp(spec)).toThrow(message)
  })
})

describe('parseInitArgs', () => {
  test('reads the folder and the options', () => {
    const args =
      'dir --name n --brand a b --app x:web y:ios --pm pnpm --repository o/n --license ISC --author A B --force --dry-run'
    expect(parseInitArgs(args.split(' '))).toEqual({
      repository: 'o/n',
      license: 'ISC',
      author: 'A B',
      dir: 'dir',
      name: 'n',
      brands: ['a', 'b'],
      apps: { x: ['web'], y: ['ios'] },
      pm: 'pnpm',
      force: true,
      dryRun: true,
      help: false
    })
  })

  test.each([
    [['--name'], '--name needs a value'],
    [['--name', 'a', 'b'], '--name takes one value'],
    [['--pm', 'yarn'], 'Unknown package manager yarn'],
    [['--nope'], 'Unknown option --nope'],
    [['a', 'b'], 'One folder at most'],
    [['--app', 'x:web', 'x:ios'], 'The app x is given twice']
  ])('refuses %j', (args, message) => {
    expect(() => parseInitArgs(args)).toThrow(message)
  })
})

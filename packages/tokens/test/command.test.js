/**
 * @file command.test.js
 * @description The `chassis-tokens` command: the commands table, the help of each command, and
 *              each command run on a repository of tokens by `--cwd` and from a folder inside
 *              it. The repository is written by `init`, so it holds nothing of this package.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { init } from '../build/init.js'
import { buildVersion } from '../build/root.js'
import { CLI, FIXTURE_DIR, PACKAGE_DIR } from './helpers.js'

const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'chassis-tokens-command-')))
afterAll(() => rmSync(temporary, { recursive: true }))

/** Runs the command in a folder. */
function run(cwd, ...args) {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' })
  return { code: result.status, stdout: result.stdout, stderr: result.stderr }
}

const COMMANDS = ['build', 'verify', 'diff', 'lint-source', 'swift-package', 'init']

describe('chassis-tokens', () => {
  test('names every command in its help', () => {
    const { code, stdout } = run(temporary, '--help')
    expect(code).toBe(0)
    for (const command of COMMANDS) expect(stdout).toContain(`  ${command} `)
  })

  test('without a command, prints the help and fails', () => {
    const { code, stdout } = run(temporary)
    expect(code).toBe(2)
    expect(stdout).toContain('Usage: chassis-tokens <command>')
  })

  test('--version prints the version of the package', () => {
    expect(run(temporary, '--version').stdout.trim()).toBe(buildVersion())
  })

  test('fails on an unknown command', () => {
    const { code, stderr } = run(temporary, 'publish')
    expect(code).toBe(2)
    expect(stderr).toContain('Unknown command publish')
  })

  test.each(COMMANDS)('%s --help needs no repository', (command) => {
    const { code, stdout } = run(temporary, command, '--help')
    expect(code).toBe(0)
    expect(stdout).toContain(`chassis-tokens ${command}`)
  })

  test('the bin of the package is this file', () => {
    const { bin } = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'))
    expect(join(PACKAGE_DIR, bin['chassis-tokens'])).toBe(CLI)
  })
})

// A path with a bracket and a space is no glob of itself, and Style Dictionary reads by a glob
describe('on a repository of tokens', () => {
  const repository = join(temporary, 'acme [tokens] (1)')

  beforeAll(() => {
    init({
      dir: repository,
      name: 'acme-tokens',
      brands: ['acme'],
      apps: { shop: ['web', 'ios', 'android'] }
    })
  }, 30_000)

  test('lint-source checks its source/', () => {
    const { code, stdout } = run(temporary, 'lint-source', '--cwd', repository)
    expect(stdout).toContain('7 token sets')
    expect(code).toBe(0)
  })

  test('build writes dist/ at its root, with its version, from a folder inside it', () => {
    const { code, stdout } = run(join(repository, 'source'), 'build')
    expect(code, stdout).toBe(0)
    const text = readFileSync(join(repository, 'dist/web/shop/acme/main.scss'), 'utf8')
    expect(text).toContain('// Chassis - Tokens v0.1.0')
    expect(text).toContain('$cx-color-brand-primary: #2563eb !default;')
    expect(existsSync(join(repository, 'dist/ios/shop/acme/Color.swift'))).toBe(true)
    expect(existsSync(join(repository, 'dist/android/shop/acme/res/values/color.xml'))).toBe(true)
  }, 30_000)

  test('verify compares a fresh build with dist/', () => {
    const passed = run(temporary, 'verify', '--cwd', repository)
    expect(passed.code, passed.stdout + passed.stderr).toBe(0)
    expect(passed.stdout).toMatch(/\d+ files match/)
    expect(existsSync(join(repository, 'dist-next'))).toBe(true)

    const main = join(repository, 'dist/web/shop/acme/main.scss')
    const text = readFileSync(main, 'utf8')
    writeFileSync(main, text.replace('#2563eb', '#000000'))
    const failed = run(temporary, 'verify', '--cwd', repository)
    writeFileSync(main, text)
    expect(failed.code).toBe(1)
    expect(failed.stdout).toContain('differs    web/shop/acme/main.scss')
  }, 60_000)

  test('--out and --config are relative to the folder the command started in', () => {
    const start = join(temporary, 'start')
    mkdirSync(start)
    const config = { brands: ['acme'], themes: ['light'], apps: { shop: ['web-px'] } }
    writeFileSync(join(start, 'build.json'), JSON.stringify(config))
    const args = ['--cwd', repository, '--out', 'out', '--config', 'build.json', '--theme', 'light']
    const { code, stdout } = run(start, 'build', ...args)
    expect(code, stdout).toBe(0)
    expect(existsSync(join(start, 'out/web/shop/acme/main.scss'))).toBe(true)
  }, 30_000)

  test('swift-package writes Package.swift at its root, on dist/', () => {
    const { code, stdout } = run(temporary, 'swift-package', '--cwd', repository)
    expect(code, stdout).toBe(0)
    const manifest = readFileSync(join(repository, 'Package.swift'), 'utf8')
    expect(manifest).toContain('path: "dist/ios/shop/acme"')
    expect(run(repository, 'swift-package', '--check').code).toBe(0)
  })

  test('diff reports on dist/ against another folder', () => {
    const base = join(temporary, 'base')
    mkdirSync(join(base, 'web/shop/acme'), { recursive: true })
    writeFileSync(join(base, 'web/shop/acme/main.scss'), '$cx-gone: 1rem !default;\n')
    const { code, stdout } = run(temporary, 'diff', '--cwd', repository, '--base', base)
    expect(code).toBe(0)
    expect(stdout).toContain('cx-gone')
  })

  test('diff reads the output of a git ref', () => {
    const git = (...args) =>
      spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repository })
    git('init', '-b', 'main')
    git('add', '.')
    git('commit', '-m', 'first')
    const { code, stdout, stderr } = run(repository, 'diff')
    expect(code, stderr).toBe(0)
    expect(stdout).not.toContain('cx-')
  })
})

describe('on a repository without what it needs', () => {
  test('build names the folder without a chassis.build', () => {
    const empty = join(temporary, 'empty')
    mkdirSync(empty)
    const { code, stderr } = run(empty, 'build')
    expect(code).toBe(1)
    expect(stderr).toContain(`Invalid package.json in ${empty}`)
  })

  test('verify --preset takes no --cwd: the fixture is the repository of the presets', () => {
    const { code, stderr } = run(temporary, 'verify', '--preset', 'web-px', '--cwd', FIXTURE_DIR)
    expect(code).toBe(1)
    expect(stderr).toContain('--preset takes no --cwd')
  })
})

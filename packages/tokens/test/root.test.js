/**
 * @file root.test.js
 * @description `build/root.js`: the repository of tokens, found from a folder upward or given,
 *              its folders and the version of its output.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { buildVersion, findRoot, isEntry, readRepository, resolveRoot } from '../build/root.js'
import { CLI, FIXTURE_DIR, PACKAGE_DIR, WORKSPACE_DIR } from './helpers.js'

const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'chassis-tokens-root-')))
afterAll(() => rmSync(temporary, { recursive: true }))

let count = 0
/** Makes a new folder with the package.json files of `packages`, by path below it. */
function folder(packages) {
  const dir = join(temporary, String(++count))
  for (const [path, content] of Object.entries(packages)) {
    mkdirSync(join(dir, path), { recursive: true })
    const text = typeof content === 'string' ? content : JSON.stringify(content)
    writeFileSync(join(dir, path, 'package.json'), text)
  }
  return dir
}

describe('findRoot', () => {
  test('a folder whose package.json has a chassis block is the root', () => {
    expect(findRoot(FIXTURE_DIR)).toBe(FIXTURE_DIR)
  })

  test('the root is found from a folder below it', () => {
    expect(findRoot(join(FIXTURE_DIR, 'source', 'base'))).toBe(FIXTURE_DIR)
  })

  test('a package.json without a chassis block, or that is not JSON, is passed over', () => {
    const dir = folder({
      '.': { chassis: {} },
      'packages/tokens': { name: 'x' },
      'packages/tokens/below': '{'
    })
    expect(findRoot(join(dir, 'packages/tokens/below'))).toBe(dir)
  })

  test('the start folder is returned when no folder above it has a chassis block', () => {
    const dir = folder({ '.': { name: 'x' } })
    expect(findRoot(dir)).toBe(dir)
  })
})

describe('resolveRoot', () => {
  test('a given cwd is taken as it is, without looking upward', () => {
    const below = join(FIXTURE_DIR, 'source')
    expect(resolveRoot(below)).toBe(below)
  })

  test('a relative cwd resolves from the working directory', () => {
    expect(resolveRoot('some/folder')).toBe(resolve('some/folder'))
  })

  test('without a cwd, the root is found from the working directory', () => {
    expect(resolveRoot()).toBe(findRoot(process.cwd()))
  })
})

describe('readRepository', () => {
  test('source/ and dist/ are at the root of a repository of tokens', () => {
    const dir = folder({ '.': { version: '1.2.3', chassis: { build: { brands: ['a'] } } } })
    expect(readRepository(dir)).toEqual({
      root: dir,
      source: join(dir, 'source'),
      dist: join(dir, 'dist'),
      version: '1.2.3',
      build: { brands: ['a'] }
    })
  })

  test('chassis.dist moves the output, and the version is of the package that holds it', () => {
    const dir = folder({
      '.': { chassis: { dist: 'packages/tokens/dist', build: {} } },
      'packages/tokens': { version: '3.2.1' }
    })
    expect(readRepository(dir)).toMatchObject({
      dist: join(dir, 'packages/tokens/dist'),
      version: '3.2.1'
    })
  })

  test('without a version anywhere up to the root, the version is of the build', () => {
    const parent = folder({ '.': { version: '9.9.9' }, repo: { chassis: {} } })
    expect(readRepository(join(parent, 'repo')).version).toBe(buildVersion())
  })

  test.runIf(WORKSPACE_DIR)('in this workspace, the output stays in this package', () => {
    expect(readRepository(WORKSPACE_DIR)).toMatchObject({
      source: join(WORKSPACE_DIR, 'source'),
      dist: join(PACKAGE_DIR, 'dist'),
      version: buildVersion()
    })
  })
})

describe('isEntry', () => {
  test('a module that is imported is not the entry', () => {
    expect(isEntry(new URL('../build/root.js', import.meta.url).href)).toBe(false)
  })

  test('a command started through a link to its folder runs', () => {
    const link = join(temporary, 'link')
    symlinkSync(join(PACKAGE_DIR, 'build'), link)
    const result = spawnSync(process.execPath, [join(link, 'swift-package.js'), '--help'], {
      encoding: 'utf8'
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Usage: chassis-tokens swift-package')
  })

  test('the command itself is an entry through a link, as in node_modules/.bin', () => {
    const bin = join(temporary, 'chassis-tokens')
    symlinkSync(CLI, bin)
    const result = spawnSync(process.execPath, [bin, '--version'], { encoding: 'utf8' })
    expect(result.stdout.trim()).toBe(buildVersion())
  })
})

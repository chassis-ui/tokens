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
import {
  buildVersion,
  findRoot,
  headerLines,
  isEntry,
  readRepository,
  repositoryWebUrl,
  resolveRoot
} from '../build/root.js'
import { CLI, FIXTURE_DIR, PACKAGE_DIR, TOKENS_DIR } from './helpers.js'

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
      build: { brands: ['a'] },
      header: ['Tokens v1.2.3']
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

  test.runIf(TOKENS_DIR)('in the vendored repository, the output is at its root', () => {
    expect(readRepository(TOKENS_DIR)).toMatchObject({
      source: join(TOKENS_DIR, 'source'),
      dist: join(TOKENS_DIR, 'dist')
    })
  })
})

describe('repositoryWebUrl', () => {
  test.each([
    ['owner/name', 'https://github.com/owner/name'],
    ['github:owner/name', 'https://github.com/owner/name'],
    ['git+https://github.com/owner/name.git', 'https://github.com/owner/name'],
    ['https://gitlab.test/group/sub/name.git', 'https://gitlab.test/group/sub/name'],
    ['https://user:secret@github.com/owner/name.git', 'https://github.com/owner/name'],
    ['git@github.com:owner/name.git', 'https://github.com/owner/name'],
    ['ssh://git@host.test:22/owner/name.git', 'https://host.test/owner/name'],
    [{ url: 'git+https://github.com/owner/name.git' }, 'https://github.com/owner/name']
  ])('reads %j', (value, url) => {
    expect(repositoryWebUrl(value)).toBe(url)
  })

  test.each([[undefined], [''], ['not an address'], ['/a/local/path']])('not %j', (value) => {
    expect(repositoryWebUrl(value)).toBeUndefined()
  })
})

describe('headerLines', () => {
  test('takes the title, the author, the license and its link from package.json', () => {
    const pkg = {
      name: '@acme/tokens',
      author: 'Acme Inc <a@acme.test> (https://acme.test)',
      license: 'Apache-2.0',
      repository: { type: 'git', url: 'git+https://github.com/acme/tokens.git' }
    }
    expect(headerLines(pkg, '1.0.0')).toEqual([
      '@acme/tokens v1.0.0',
      'Copyright Acme Inc',
      'Licensed under Apache-2.0 (https://github.com/acme/tokens/blob/main/LICENSE)'
    ])
  })

  test('chassis.title and chassis.copyright come first', () => {
    const chassis = { title: 'Acme - Tokens', copyright: 'Copyright 2020 Acme' }
    expect(headerLines({ name: 'x', author: 'y', chassis }, '1.0.0')).toEqual([
      'Acme - Tokens v1.0.0',
      'Copyright 2020 Acme'
    ])
  })

  test('leaves out what is not known, and links only a repository of another host', () => {
    expect(headerLines({ license: 'MIT' }, '1.0.0')).toEqual([
      'Tokens v1.0.0',
      'Licensed under MIT'
    ])
    expect(headerLines({ license: 'MIT', repository: 'https://host.test/a/b' }, '1.0.0')).toContain(
      'Licensed under MIT (https://host.test/a/b)'
    )
  })

  test.runIf(TOKENS_DIR)('in the vendored repository, the text of its committed dist/', () => {
    const { header, version } = readRepository(TOKENS_DIR)
    expect(header).toEqual([
      `Chassis - Tokens v${version}`,
      'Copyright 2026 Ozgur Gunes',
      'Licensed under MIT (https://github.com/chassis-ui/website-tokens/blob/main/LICENSE)'
    ])
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

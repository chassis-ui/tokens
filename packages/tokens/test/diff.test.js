/**
 * @file diff.test.js
 * @description Tests for the token diff report, on files of the committed `dist/`. The
 *              changes are those of real commits: the `headers-gap` rename (16a5317), the
 *              font weights of Phase 14, the shadow radius of Phase 22 and the icon assets
 *              of Phase 21, applied to copies of the current files.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, test } from 'vitest'
import {
  compareDist,
  diffDeclarations,
  formatReport,
  isDeclarationFile,
  parseDeclarations
} from '../build/diff.js'

const DIST_DIR = fileURLToPath(new URL('../dist', import.meta.url))

const SCSS_SMALL = 'web/docs/chassis/number-small.scss'
const SWIFT_SMALL = 'ios/demo/chassis/NumberSmall.swift'
const XML_MAIN = 'android/demo/chassis/main.xml'
const DRAWABLE = 'android/demo/chassis/res/drawable/icon_button_caret.xml'

/** Token name declarations per format, as `verify.js` counts them for its duplicate check. */
const NAME_PATTERNS = {
  '.scss': /^\$[\w-]+:/gm,
  '.swift': /static let \w+/g,
  '.xml': /^\s*<\w+ name="[^"]+"/gm
}

async function listDist() {
  const entries = await readdir(DIST_DIR, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => relative(DIST_DIR, join(entry.parentPath, entry.name)).split(sep).join('/'))
}

const readDist = (file) => readFile(join(DIST_DIR, file), 'utf8')

describe('parseDeclarations', () => {
  test('reads every declaration of every dist/ file', async () => {
    const files = (await listDist()).filter(isDeclarationFile)
    expect(files.length).toBeGreaterThan(50)
    for (const file of files) {
      const text = await readDist(file)
      const expected = text.match(NAME_PATTERNS[file.slice(file.lastIndexOf('.'))])?.length ?? 0
      expect(parseDeclarations(file, text).size, file).toBe(expected)
    }
  })

  test('reads names and printed values of each platform', async () => {
    expect(
      parseDeclarations(SCSS_SMALL, await readDist(SCSS_SMALL)).get(
        '$cx-space-website-content-header-gap'
      )
    ).toBe('0.5rem')
    expect(
      parseDeclarations(SWIFT_SMALL, await readDist(SWIFT_SMALL)).get(
        'SpaceWebsiteContentHeaderGap'
      )
    ).toBe('CGFloat(8)')
    expect(
      parseDeclarations(XML_MAIN, await readDist(XML_MAIN)).get(
        'typography_font_weight_text_normal_weight'
      )
    ).toBe('<integer>400')
  })

  test('reads the Swift class declarations of the output before Phase 17', () => {
    const line = '    @objc public static let DimensionBase4 = CGFloat(4)'
    expect(parseDeclarations('ios/demo/chassis/Main.swift', line)).toEqual(
      new Map([['DimensionBase4', 'CGFloat(4)']])
    )
  })

  test('skips header and comment lines', async () => {
    const text = await readDist(XML_MAIN)
    const header = text.slice(0, text.indexOf('<resources>'))
    expect(parseDeclarations(XML_MAIN, header).size).toBe(0)
  })
})

describe('isDeclarationFile', () => {
  test('SCSS, Swift and Android values files hold declarations; icon assets do not', async () => {
    const files = await listDist()
    const assets = files.filter((file) => !isDeclarationFile(file))
    expect(assets.length).toBe(56)
    expect(assets.every((file) => /\/(res\/drawable|Icons\.xcassets)\//.test(file))).toBe(true)
    expect(isDeclarationFile('android/demo/chassis/res/values-night/color.xml')).toBe(true)
    expect(isDeclarationFile(DRAWABLE)).toBe(false)
  })
})

describe('diffDeclarations', () => {
  const map = (entries) => new Map(entries)

  test('pairs a removed and an added name with the same value as a possible rename', () => {
    const base = map([
      ['$cx-space-website-content-headers-gap', '0.5rem'],
      ['$cx-space-website-content-subsection-gap', '1.5rem']
    ])
    const head = map([
      ['$cx-space-website-content-header-gap', '0.5rem'],
      ['$cx-space-website-content-subsection-gap', '1.5rem']
    ])
    expect(diffDeclarations(base, head)).toEqual({
      added: [],
      removed: [],
      changed: [],
      renamed: [
        {
          from: '$cx-space-website-content-headers-gap',
          to: '$cx-space-website-content-header-gap',
          value: '0.5rem'
        }
      ]
    })
  })

  test('pairs names that share a value in file order, and keeps the rest', () => {
    const base = map([
      ['A', 'CGFloat(0)'],
      ['B', 'CGFloat(0)'],
      ['C', 'CGFloat(1)']
    ])
    const head = map([
      ['X', 'CGFloat(0)'],
      ['Y', 'CGFloat(0)'],
      ['Z', 'CGFloat(0)']
    ])
    const result = diffDeclarations(base, head)
    expect(result.renamed.map(({ from, to }) => `${from}>${to}`)).toEqual(['A>X', 'B>Y'])
    expect(result.removed).toEqual([{ name: 'C', value: 'CGFloat(1)' }])
    expect(result.added).toEqual([{ name: 'Z', value: 'CGFloat(0)' }])
  })

  test('reports a changed Android resource type as a changed value', () => {
    const result = diffDeclarations(
      map([['typography_font_weight_text_normal_weight', '<string>regular']]),
      map([['typography_font_weight_text_normal_weight', '<integer>400']])
    )
    expect(result.changed).toEqual([
      {
        name: 'typography_font_weight_text_normal_weight',
        from: '<string>regular',
        to: '<integer>400'
      }
    ])
  })
})

describe('compareDist', () => {
  const dirs = []

  /**
   * Copies dist/ twice and applies an edit to the base copy (to recreate the state before a
   * commit) and to the head copy.
   */
  async function trees({ base = {}, head = {} } = {}) {
    const root = await mkdtemp(join(tmpdir(), 'chassis-tokens-diff-'))
    dirs.push(root)
    const result = {}
    for (const [side, edits] of Object.entries({ base, head })) {
      const dir = join(root, side)
      await cp(DIST_DIR, dir, { recursive: true })
      for (const [file, edit] of Object.entries(edits)) {
        const path = join(dir, file)
        if (edit === null) {
          await rm(path)
        } else {
          await mkdir(dirname(path), { recursive: true })
          const text = await readFile(path, 'utf8').catch(() => '')
          await writeFile(path, edit(text))
        }
      }
      result[side] = dir
    }
    return compareDist(result.base, result.head)
  }

  afterAll(async () => {
    await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  test('reports nothing for the same dist/', async () => {
    const result = await compareDist(DIST_DIR, DIST_DIR)
    expect(result.files).toEqual([])
    expect(formatReport(result)).toBe('## Token changes\n\nNo token changes in `dist/`.\n')
  })

  test('ignores a rebuild that changes only the header lines', async () => {
    const result = await trees({
      head: Object.fromEntries(
        [SCSS_SMALL, SWIFT_SMALL, XML_MAIN].map((file) => [
          file,
          (text) =>
            text
              .replace(/Generated on .*/, 'Generated on Mon, 28 Sep 2026 09:00:00 GMT')
              .replace(/Chassis - Tokens v\S+/, 'Chassis - Tokens v0.7.0')
        ])
      )
    })
    expect(result.files).toEqual([])
  })

  test('reports the headers-gap rename (16a5317) as one possible rename per file', async () => {
    const result = await trees({
      base: {
        [SCSS_SMALL]: (text) =>
          text.replace(
            '$cx-space-website-content-header-gap:',
            '$cx-space-website-content-headers-gap:'
          ),
        [SWIFT_SMALL]: (text) =>
          text.replace('let SpaceWebsiteContentHeaderGap ', 'let SpaceWebsiteContentHeadersGap ')
      }
    })
    expect(result.files.map((entry) => [entry.file, entry.renamed.length])).toEqual([
      [SWIFT_SMALL, 1],
      [SCSS_SMALL, 1]
    ])
    const report = formatReport(result)
    expect(report).toContain('**Breaking:** 0 removed and 2 renamed names')
    expect(report).toContain(
      '- `SpaceWebsiteContentHeadersGap` → `SpaceWebsiteContentHeaderGap`: `CGFloat(8)`'
    )
  })

  test('reports the Phase 14 weights as value changes only', async () => {
    const weights = { 400: 'regular', 600: 'semi-bold', 700: 'bold', 300: 'light' }
    const result = await trees({
      base: {
        [XML_MAIN]: (text) =>
          text.replace(
            /<integer name="([^"]*weight[^"]*)">(\d+)<\/integer>/g,
            (line, name, value) => `<string name="${name}">${weights[value] ?? value}</string>`
          )
      }
    })
    expect(result.files).toHaveLength(1)
    const [entry] = result.files
    expect(entry.added.length + entry.removed.length + entry.renamed.length).toBe(0)
    expect(entry.changed.length).toBeGreaterThan(100)
    expect(entry.changed.every(({ name }) => name.includes('weight'))).toBe(true)
    expect(formatReport(result)).not.toContain('Breaking')
  })

  test('reports the Phase 22 radius lines as additions and lists 25 of them', async () => {
    const result = await trees({
      base: {
        [SWIFT_SMALL]: (text) => text.replace(/^.*static let Shadow\w*Radius = .*\n/gm, '')
      }
    })
    expect(result.files).toHaveLength(1)
    const [entry] = result.files
    expect(entry.added.length).toBe(394)
    expect(entry.removed.length + entry.changed.length + entry.renamed.length).toBe(0)
    const report = formatReport(result)
    expect(report).toContain('- …and 369 more')
    expect(report).not.toContain('Breaking')
  })

  test('reports removed names as breaking', async () => {
    const result = await trees({
      head: {
        [SCSS_SMALL]: (text) => text.replace(/^\$cx-space-website-content-header-gap:.*\n/m, '')
      }
    })
    expect(result.files[0].removed).toEqual([
      { name: '$cx-space-website-content-header-gap', value: '0.5rem' }
    ])
    expect(formatReport(result)).toContain('**Breaking:** 1 removed and 0 renamed names')
  })

  test('compares icon assets as whole files, and a removed file as breaking', async () => {
    const result = await trees({
      base: {
        [DRAWABLE]: null,
        'android/demo/chassis/res/drawable/icon_old.xml': () => '<vector/>'
      },
      head: { 'android/demo/chassis/res/drawable/icon_chip_remove.xml': (text) => `${text}\n` }
    })
    expect(
      result.files.map(({ file, status, declarations }) => [file, status, declarations])
    ).toEqual([
      [DRAWABLE, 'added', false],
      ['android/demo/chassis/res/drawable/icon_chip_remove.xml', 'changed', false],
      ['android/demo/chassis/res/drawable/icon_old.xml', 'removed', false]
    ])
    const report = formatReport(result)
    expect(report).toContain('1 removed files')
    expect(report).toContain(
      '| android | `demo/chassis/res/drawable/icon_old.xml` | removed (breaking) |'
    )
  })

  test('reports every name of a removed declaration file as removed', async () => {
    const result = await trees({ head: { [SWIFT_SMALL]: null } })
    const [entry] = result.files
    expect(entry.status).toBe('removed')
    expect(entry.removed.length).toBe(
      parseDeclarations(SWIFT_SMALL, await readDist(SWIFT_SMALL)).size
    )
    expect(formatReport(result)).toContain('`demo/chassis/NumberSmall.swift` (removed file)')
  })
})

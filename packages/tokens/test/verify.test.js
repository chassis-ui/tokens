/**
 * @file verify.test.js
 * @description Tests for the undeclared-reference check of the golden comparison and
 *              for the update of a reference, on lines copied from `dist/` and the
 *              preset baselines.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { compareOutput, formatReport, updateReference } from '../build/verify.js'

describe('undeclared references', () => {
  const dirs = []

  /**
   * Writes the files into a new directory and compares it with itself.
   */
  async function check(files) {
    const dir = await mkdtemp(join(tmpdir(), 'chassis-tokens-verify-'))
    dirs.push(dir)
    for (const [file, text] of Object.entries(files)) {
      await mkdir(dirname(join(dir, file)), { recursive: true })
      await writeFile(join(dir, file), text)
    }
    return compareOutput(dir, dir)
  }

  afterAll(async () => {
    await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  const xml = (...lines) => `<resources>\n  ${lines.join('\n  ')}\n</resources>\n`
  const dimen = '<dimen name="size_unit_0">0dp</dimen>'

  test('accepts an Android reference to an element of the same type in the file', async () => {
    const result = await check({
      'android/main.xml': xml(dimen, '<dimen name="space_unit_0">@dimen/size_unit_0</dimen>')
    })
    expect(result.ok, formatReport(result)).toBe(true)
  })

  test('reads the type of a float item', async () => {
    const result = await check({
      'android/main.xml': xml(
        '<item name="opacity_level_10" type="dimen" format="float">0.1</item>',
        '<item name="opacity_context_dim_slight" type="dimen" format="float">@dimen/opacity_level_10</item>'
      )
    })
    expect(result.ok, formatReport(result)).toBe(true)
  })

  test('reports an Android reference to another type', async () => {
    const result = await check({
      'android/main.xml': xml(
        dimen,
        '<integer name="typography_letter_spacing_base_zero">@integer/size_unit_0</integer>'
      )
    })
    expect(result.ok).toBe(false)
    expect(result.undeclared).toEqual([
      { file: 'android/main.xml', references: ['@integer/size_unit_0'] }
    ])
    expect(formatReport(result)).toContain('undeclared android/main.xml: @integer/size_unit_0')
  })

  test('reports an Android reference to another file', async () => {
    const result = await check({
      'android/main.xml': xml('<dimen name="space_unit_0">@dimen/size_unit_0</dimen>'),
      'android/number.xml': xml(dimen)
    })
    expect(result.undeclared).toEqual([
      { file: 'android/main.xml', references: ['@dimen/size_unit_0'] }
    ])
  })

  const swift = (...lines) =>
    `import UIKit\n\npublic enum ChassisTokens {\n    ${lines.join('\n    ')}\n}\n`
  const dimensionBase4 = 'public static let DimensionBase4 = CGFloat(4)'

  test('accepts a Swift constant named in the same file', async () => {
    const result = await check({
      'ios/NumberLarge.swift': swift(
        dimensionBase4,
        'public static let SizeUnit4 = DimensionBase4',
        'public static let ColorBgMain = UIColor(red: 1.000, green: 1.000, blue: 1.000, alpha: 1)'
      )
    })
    expect(result.ok, formatReport(result)).toBe(true)
  })

  test('reports a Swift constant that the file does not declare', async () => {
    const result = await check({
      'ios/ChassisTokens.swift': swift('public static let SizeUnit4 = DimensionBase4'),
      'ios/NumberLarge.swift': swift(dimensionBase4)
    })
    expect(result.undeclared).toEqual([
      { file: 'ios/ChassisTokens.swift', references: ['DimensionBase4'] }
    ])
    expect(formatReport(result)).toContain('undeclared ios/ChassisTokens.swift: DimensionBase4')
  })

  test('accepts a SCSS variable of another file in the same directory', async () => {
    const result = await check({
      'web/main.scss':
        '$prefix: cx- !default;\n$cx-color-accordion-item-fg-color: $cx-color-context-default-fg-main !default;\n',
      'web/color-light.scss': '$cx-color-context-default-fg-main: #161a1b !default;\n'
    })
    expect(result.ok, formatReport(result)).toBe(true)
  })

  test('reports a SCSS variable that no file of the directory declares', async () => {
    const result = await check({
      'web/main.scss':
        '$cx-font-context-jumbo: ("font-family": $cx-typography-font-family-text, "font-weight": 700) !default;\n',
      'other/string.scss': '$cx-typography-font-family-text: "Inter" !default;\n'
    })
    expect(result.undeclared).toEqual([
      { file: 'web/main.scss', references: ['$cx-typography-font-family-text'] }
    ])
  })
})

describe('update of a reference', () => {
  const dirs = []

  /**
   * Writes the files into a new directory.
   */
  async function write(files) {
    const dir = await mkdtemp(join(tmpdir(), 'chassis-tokens-update-'))
    dirs.push(dir)
    for (const [file, text] of Object.entries(files)) {
      await mkdir(dirname(join(dir, file)), { recursive: true })
      await writeFile(join(dir, file), text)
    }
    return dir
  }

  const read = (dir, file) => readFile(join(dir, file), 'utf8')

  afterAll(async () => {
    await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  const scss = (date, ...lines) =>
    `// Generated on ${date}\n// Chassis - Tokens v0.6.0\n\n${lines.join('\n')}\n`
  const before = 'Fri, 02 Oct 2026 15:29:27 GMT'
  const after = 'Sun, 04 Oct 2026 10:00:00 GMT'
  const fgSlight = '$cx-opacity-context-fg-slight: 0.25 !default;'

  test('writes the files that differ and the new ones, and deletes the others', async () => {
    const expected = await write({
      'web/main.scss': scss(before, '$cx-opacity-context-fg-subtle: 0.5 !default;'),
      'web/number-large.scss': scss(before, fgSlight),
      'web/number-small.scss': scss(before, fgSlight)
    })
    const actual = await write({
      'web/main.scss': scss(after, '$cx-opacity-context-fg-subtle: 0.6 !default;'),
      'web/number-large.scss': scss(after, fgSlight),
      'web/sub/string.scss': scss(after, '$cx-typography-font-family-text: "Inter" !default;')
    })

    const update = await updateReference(expected, actual)
    expect(update).toMatchObject({
      ok: true,
      written: ['web/main.scss', 'web/sub/string.scss'],
      deleted: ['web/number-small.scss']
    })
    expect(await read(expected, 'web/main.scss')).toBe(await read(actual, 'web/main.scss'))
    expect((await readdir(join(expected, 'web'))).sort()).toEqual([
      'main.scss',
      'number-large.scss',
      'sub'
    ])
    const result = await compareOutput(expected, actual)
    expect(result.ok, formatReport(result)).toBe(true)
  })

  test('leaves a file that differs in its header lines only', async () => {
    const expected = await write({ 'web/main.scss': scss(before, fgSlight) })
    const actual = await write({ 'web/main.scss': scss(after, fgSlight) })

    expect(await updateReference(expected, actual)).toMatchObject({
      ok: true,
      written: [],
      deleted: []
    })
    expect(await read(expected, 'web/main.scss')).toContain(before)
  })

  test('creates a reference that has no files yet', async () => {
    const actual = await write({ 'web/main.scss': scss(after, fgSlight) })
    const expected = join(await write({}), 'web-px')

    expect(await updateReference(expected, actual)).toMatchObject({
      ok: true,
      written: ['web/main.scss'],
      deleted: []
    })
    expect(await read(expected, 'web/main.scss')).toBe(await read(actual, 'web/main.scss'))
  })

  test('writes nothing when a reference names nothing the output declares', async () => {
    const expected = await write({ 'web/main.scss': scss(before, fgSlight) })
    const actual = await write({
      'web/main.scss': scss(
        after,
        '$cx-color-accordion-item-fg-color: $cx-color-context-default-fg-main !default;'
      )
    })

    const update = await updateReference(expected, actual)
    expect(update).toMatchObject({ ok: false, written: [], deleted: [] })
    expect(update.result.undeclared).toEqual([
      { file: 'web/main.scss', references: ['$cx-color-context-default-fg-main'] }
    ])
    expect(await read(expected, 'web/main.scss')).toBe(scss(before, fgSlight))
  })

  test('writes nothing when a token name appears twice in one file', async () => {
    const expected = await write({ 'web/main.scss': scss(before, fgSlight) })
    const actual = await write({ 'web/main.scss': scss(after, fgSlight, fgSlight) })

    expect(await updateReference(expected, actual)).toMatchObject({ ok: false, written: [] })
    expect(await read(expected, 'web/main.scss')).toBe(scss(before, fgSlight))
  })
})

/**
 * @file verify.test.js
 * @description Tests for the undeclared-reference check of the golden comparison, on
 *              lines copied from the preset baselines.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { compareOutput, formatReport } from '../verify.js'

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
    `import UIKit\n\npublic class ChassisTokens {\n    ${lines.join('\n    ')}\n}\n`
  const dimensionBase4 = '@objc public static let DimensionBase4 = CGFloat(4)'

  test('accepts a Swift constant named in the same file', async () => {
    const result = await check({
      'ios/NumberLarge.swift': swift(
        dimensionBase4,
        '@objc public static let SizeUnit4 = DimensionBase4',
        '@objc public static let ColorBgMain = UIColor(red: 1.000, green: 1.000, blue: 1.000, alpha: 1)'
      )
    })
    expect(result.ok, formatReport(result)).toBe(true)
  })

  test('reports a Swift constant that the file does not declare', async () => {
    const result = await check({
      'ios/Main.swift': swift('@objc public static let SizeUnit4 = DimensionBase4'),
      'ios/NumberLarge.swift': swift(dimensionBase4)
    })
    expect(result.undeclared).toEqual([{ file: 'ios/Main.swift', references: ['DimensionBase4'] }])
    expect(formatReport(result)).toContain('undeclared ios/Main.swift: DimensionBase4')
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

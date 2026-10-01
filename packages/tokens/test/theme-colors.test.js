/**
 * @file theme-colors.test.js
 * @description Tests for the iOS color file that follows the appearance: how the light and
 *              dark constants combine, using constants of the real color files, and which
 *              output directories get the file.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import {
  THEME_COLORS_FILE,
  collectThemeColors,
  combineThemeColors,
  writeThemeColors
} from '../build/theme-colors.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)
const caseNamed = (label) => structuredClone(fixture.themeColors.find((c) => c.case === label))
const constant = ({ name, type }, theme) => ({ name, type, ...theme })
const themesOf = (pair) => [[constant(pair, pair.light)], [constant(pair, pair.dark)]]

describe('combineThemeColors', () => {
  test('a color that differs picks the dark or the light value by userInterfaceStyle', () => {
    const pair = caseNamed('a color that differs by theme')
    expect(combineThemeColors(...themesOf(pair))).toEqual([
      {
        name: pair.name,
        printed: `UIColor { $0.userInterfaceStyle == .dark ? ${pair.dark.value} : ${pair.light.value} }`
      }
    ])
  })

  test.each([
    'a color that is the same in both themes',
    'a number part that is the same in both themes',
    'both themes name the same constant'
  ])('%s prints as it is', (label) => {
    const pair = caseNamed(label)
    expect(pair.light.printed).toBe(pair.dark.printed)
    expect(combineThemeColors(...themesOf(pair))).toEqual([
      { name: pair.name, printed: pair.light.printed }
    ])
  })

  test('uses the values when one theme names a constant and the other does not', () => {
    const pair = caseNamed('both themes name the same constant')
    pair.dark.printed = pair.dark.value
    const [combined] = combineThemeColors(...themesOf(pair))
    expect(combined.printed).toBe(
      `UIColor { $0.userInterfaceStyle == .dark ? ${pair.dark.value} : ${pair.light.value} }`
    )
  })

  test('keeps the order of the light file', () => {
    const [differs, same] = [
      caseNamed('a color that differs by theme'),
      caseNamed('a color that is the same in both themes')
    ]
    const light = [constant(same, same.light), constant(differs, differs.light)]
    const dark = [constant(differs, differs.dark), constant(same, same.dark)]
    expect(combineThemeColors(light, dark).map((c) => c.name)).toEqual([same.name, differs.name])
  })

  test('fails when the themes declare other constants', () => {
    const [light, dark] = themesOf(caseNamed('a color that differs by theme'))
    dark[0] = { ...dark[0], name: 'ColorContextDefaultBgOther' }
    expect(() => combineThemeColors(light, dark)).toThrow(
      'The light and dark color files declare different constants: ColorContextDefaultBgMain, ColorContextDefaultBgOther'
    )
  })

  test('fails when a constant that is not a color differs', () => {
    const pair = caseNamed('a number part that is the same in both themes')
    pair.dark.value = pair.dark.printed = 'CGFloat(90)'
    expect(() => combineThemeColors(...themesOf(pair))).toThrow(
      'GradientPrimitiveBlackL000Angle differs between light and dark, but only colors follow the appearance'
    )
  })
})

describe('writeThemeColors', () => {
  const dirs = []
  afterAll(() => Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true }))))

  const options = { import: ['UIKit'], accessControl: 'public', objectType: 'enum' }
  const collect = (buildPath, theme, pair) =>
    collectThemeColors({
      buildPath,
      theme,
      header: '// header',
      options: { ...options, className: 'ChassisTokensColorLight' },
      constants: [constant(pair, pair[theme] ?? pair.light)]
    })

  test('writes one file per directory that received a light and a dark file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'chassis-tokens-theme-colors-'))
    dirs.push(dir)
    const both = join(dir, 'both/')
    const lightOnly = join(dir, 'light-only/')
    const pair = caseNamed('a color that differs by theme')
    collect(both, 'light', pair)
    collect(both, 'dark', pair)
    collect(lightOnly, 'light', pair)
    collect(lightOnly, 'contrast', pair)

    expect(await writeThemeColors()).toEqual([`${both}${THEME_COLORS_FILE}`])
    expect(existsSync(`${lightOnly}${THEME_COLORS_FILE}`)).toBe(false)
    const swift = await readFile(`${both}${THEME_COLORS_FILE}`, 'utf8')
    expect(swift).toContain('// Color.swift\n')
    expect(swift).toContain('public enum ChassisTokensColor {\n')
    expect(swift).toContain(`public static let ${pair.name} = UIColor { $0.userInterfaceStyle`)
  })

  test('forgets what it wrote', async () => {
    expect(await writeThemeColors()).toEqual([])
  })
})

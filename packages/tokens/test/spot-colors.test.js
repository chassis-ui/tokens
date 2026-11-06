/**
 * @file spot-colors.test.js
 * @description Tests for spot colors, a group that a repository of tokens adds next to the
 *              primitive and context colors: single colors for particular elements, with a
 *              value for each theme. The chain is that of the primitive colors: a brand sets
 *              `color.base.spot.<theme>.*`, the theme sets select them as `color.spot.*`, and
 *              component colors of an app reference those. The test adds such a chain to the
 *              token system that `init` writes, builds it for every default platform and
 *              reads the output.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { init } from '../lib/commands/init.js'
import { lintTokens, loadSource } from '../lib/commands/lint-tokens.js'
import { CLI } from './helpers.js'

const temporary = mkdtempSync(join(tmpdir(), 'chassis-tokens-spot-'))
afterAll(() => rmSync(temporary, { recursive: true }))

const dir = join(temporary, 'spot')
const read = (file) => readFileSync(join(dir, file), 'utf8')

/**
 * Changes a token set of `source/base/`.
 */
function edit(file, change) {
  const path = join(dir, 'source/base', file)
  const json = JSON.parse(readFileSync(path, 'utf8'))
  change(json)
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`)
}

const color = ($value, modify) => ({
  $type: 'color',
  $value,
  ...(modify && { $extensions: { 'studio.tokens': { modify: { space: 'srgb', ...modify } } } })
})

const PAGE = { light: '#f4f1ea', dark: '#1c1b19' }

/**
 * The spot colors of one theme: one that selects a brand color as it is, one that selects
 * a brand color mixed from a primitive, and one that mixes a primitive in the theme set.
 */
const themeSpots = (theme) => ({
  page: { bg: color(`{color.base.spot.${theme}.page.bg}`) },
  promo: {
    bg: color(`{color.base.spot.${theme}.promo.bg}`),
    border: color('{color.primitive.primary.50}', { type: 'mix', value: '0.5', color: '#ffffff' })
  }
})

const brandSpots = (theme, mixColor) => ({
  page: { bg: color(PAGE[theme]) },
  promo: {
    bg: color(`{color.base.primitive.${theme}.primary.base}`, {
      type: 'mix',
      value: '0.8',
      color: mixColor
    })
  }
})

beforeAll(() => {
  init({
    dir,
    brands: ['one'],
    apps: { site: ['web'], docs: ['web-scss'], mobile: ['ios', 'android'] }
  })
  edit('brand-base.json', (json) => {
    json.color.base.spot = {
      light: brandSpots('light', '#ffffff'),
      dark: brandSpots('dark', '#000000')
    }
  })
  edit('theme-base.json', (json) => {
    json.color.spot = themeSpots('light')
  })
  edit('theme-dark.json', (json) => {
    json.color.spot = themeSpots('dark')
  })
  edit('app-base.json', (json) => {
    json.color.page['bg-body'] = color('{color.spot.page.bg}')
  })
  const pkg = JSON.parse(read('package.json'))
  pkg.chassis.build.options = {
    'web-scss': { outputReferences: true },
    android: { outputReferences: true }
  }
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)

  const result = spawnSync(process.execPath, [CLI, 'build', '--cwd', dir], { encoding: 'utf8' })
  expect(result.status, result.stderr).toBe(0)
}, 60_000)

/**
 * The value of a SCSS variable in a file of the output.
 */
function scss(file, name) {
  const match = read(file).match(new RegExp(`^\\$cx-${name}: (.+) !default;$`, 'm'))
  expect(match, `${name} in ${file}`).not.toBeNull()
  return match[1]
}

describe('spot colors', () => {
  test('pass the source lint', async () => {
    expect(lintTokens(await loadSource(join(dir, 'source')))).toEqual([])
  })

  describe.each(['site', 'docs'])('web (%s)', (app) => {
    const file = (name) => `dist/web/${app}/one/${name}`

    test('each theme file holds the spot colors and the component colors of its theme', () => {
      for (const theme of ['light', 'dark']) {
        expect(scss(file(`color-${theme}.scss`), 'color-spot-page-bg')).toBe(PAGE[theme])
        expect(scss(file(`color-${theme}.scss`), 'color-page-bg-body')).toBe(PAGE[theme])
      }
    })

    test('the main file holds the brand colors of every theme', () => {
      expect(scss(file('main.scss'), 'color-base-spot-light-page-bg')).toBe(PAGE.light)
      expect(scss(file('main.scss'), 'color-base-spot-dark-page-bg')).toBe(PAGE.dark)
    })

    test('a mix prints its own color, not the color it references', () => {
      const light = file('color-light.scss')
      for (const name of ['color-spot-promo-bg', 'color-spot-promo-border']) {
        expect(scss(light, name)).toMatch(/^#[0-9a-f]{6}$/)
      }
      expect(scss(light, 'color-spot-promo-border')).not.toBe(
        scss(light, 'color-primitive-primary-50')
      )
    })
  })

  test('iOS follows the appearance', () => {
    const swift = read('dist/ios/mobile/one/Color.swift')
    expect(swift).toMatch(
      /static let ColorSpotPageBg = UIColor \{ \$0\.userInterfaceStyle == \.dark \? UIColor\(red: 0\.110, green: 0\.106, blue: 0\.098, alpha: 1\) : UIColor\(red: 0\.957, green: 0\.945, blue: 0\.918, alpha: 1\) \}/
    )
    expect(swift).toMatch(/static let ColorPageBgBody = UIColor \{ \$0\.userInterfaceStyle/)
  })

  test('Android names the spot color of each night mode', () => {
    for (const [folder, theme] of [
      ['values', 'light'],
      ['values-night', 'dark']
    ]) {
      const xml = read(`dist/android/mobile/one/res/${folder}/color.xml`)
      expect(xml).toContain(`<color name="color_spot_page_bg">#ff${PAGE[theme].slice(1)}</color>`)
      expect(xml).toContain('<color name="color_page_bg_body">@color/color_spot_page_bg</color>')
    }
  })
})

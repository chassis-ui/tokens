/**
 * @file filters.test.js
 * @description Tests for the file filters, using resolved tokens from the real build and
 *              which files of the committed dist/ declare them.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import registerFilters, { figmaOnlyGroups, filters } from '../build/filters.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/filter-tokens.json', import.meta.url), 'utf8')
)
const dist = (file) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8')
const matchingFilters = (token) => Object.keys(filters).filter((name) => filters[name](token))

describe('filters', () => {
  test.each(fixture.cases)('$token.name ($token.$type)', ({ token, files }) => {
    const matching = Object.keys(filters).filter((name) => filters[name](token))
    expect(matching).toEqual(files)
  })

  test('emit every size in the main and number files, whatever its path', () => {
    const { token } = fixture.cases.find((c) => c.token.path.join('.') === 'dimension.base.0')
    for (const path of [token.path, ['size', 'dimension', 'large']]) {
      expect(filters['cx/allTokens']({ ...token, path })).toBe(true)
      expect(filters['cx/numberTokens']({ ...token, path })).toBe(true)
    }
  })

  test('emit the color parts of every shadow in the main and color files', () => {
    // The mobile platforms expand shadows; each layer's color is a color token
    for (const group of ['context', 'elevation', 'button']) {
      const token = { path: ['shadow', group, 'small', '1', 'color'], $type: 'color' }
      expect(matchingFilters(token)).toEqual(['cx/allTokens', 'cx/themeTokens'])
    }
  })

  test('leave the theme palettes out of the main file, gradients included', () => {
    for (const path of [
      ['color', 'context', 'default', 'fg-main'],
      ['color', 'primitive', 'primary', '10'],
      ['gradient', 'primitive', 'black', 'l-000']
    ]) {
      expect(matchingFilters({ path, $type: 'color' })).toEqual(['cx/themeTokens'])
    }
  })

  test('leave out the groups that exist for Figma only', () => {
    expect(figmaOnlyGroups).toEqual(['figma', 'bg-blur'])
    for (const [path, $type] of [
      [['figma', 'website', 'size', 'page-w'], 'dimension'],
      [['figma', 'website', 'variant', 'nav'], 'content'],
      [['bg-blur', 'default'], 'shadow'],
      [['bg-blur', 'default', 'color'], 'color'],
      [['bg-blur', 'default', 'blur'], 'dimension']
    ]) {
      expect(matchingFilters({ path, $type })).toEqual([])
    }
  })

  test('put the shadow color parts of the committed main files next to their other parts', () => {
    const swift = dist('ios/demo/chassis/ChassisTokens.swift')
    const xml = dist('android/demo/chassis/main.xml')
    expect(swift).toMatch(/static let ShadowContextSmall1Blur = /)
    expect(swift).toMatch(/static let ShadowContextSmall1Color = UIColor\(/)
    expect(xml).toMatch(/<color name="shadow_context_small_1_color">/)
    expect(swift).not.toMatch(/Figma|BgBlur/)
  })

  test('put every web shadow into the color file of each theme', () => {
    const shadows = (file) => dist(file).match(/^\$cx-shadow-[\w-]+(?=:)/gm)
    const main = shadows('web/docs/chassis/main.scss')
    expect(main.length).toBeGreaterThan(100)
    expect(shadows('web/docs/chassis/color-light.scss')).toEqual(main)
    expect(shadows('web/docs/chassis/color-dark.scss')).toEqual(main)

    const glow = (file) => dist(file).match(/^\$cx-shadow-glow-primary: (.+) !default;$/m)[1]
    expect(glow('web/docs/chassis/color-light.scss')).toBe(glow('web/docs/chassis/main.scss'))
    expect(glow('web/docs/chassis/color-dark.scss')).not.toBe(glow('web/docs/chassis/main.scss'))
  })

  test('are the four filters the configs use', () => {
    const configs = ['web', 'ios', 'android'].map((platform) =>
      readFileSync(new URL(`../build/config/${platform}.js`, import.meta.url), 'utf8')
    )
    const used = new Set(configs.flatMap((text) => text.match(/cx\/\w+Tokens/g)))
    expect(Object.keys(filters).sort()).toEqual([...used].sort())
  })

  test('are registered by name', () => {
    const registered = []
    registerFilters({ registerFilter: (filter) => registered.push(filter) })
    expect(registered).toEqual(Object.entries(filters).map(([name, filter]) => ({ name, filter })))
  })
})

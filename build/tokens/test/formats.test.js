/**
 * @file formats.test.js
 * @description Tests for the token order of the formats and the lookups of the SCSS,
 *              Android and iOS templates, using real tokens.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { inSourceOrder } from '../formats.js'
import { scssValue } from '../scss-var-policy.js'
import scssTemplate from '../templates/scss.template.js'
import androidTemplate from '../templates/android-resources.template.js'
import iosTemplate from '../templates/ios-swift-class.template.js'

/**
 * A token as the formats see it, reduced to what the order needs.
 */
const token = (name, sourceOrder) => ({ name, $extensions: { chassis: { sourceOrder } } })

describe('inSourceOrder', () => {
  // Style Dictionary 5 puts expanded tokens after all others. These are tokens of
  // ios/demo/chassis/Main.swift with their numbers, in the order Style Dictionary 5.5
  // passes them to the format.
  const tokens = [
    token('BorderRadiusTooltipMain', 3061),
    token('BorderWidthContextNone', 3342),
    token('IconAccordionIndicator', 3371),
    token('FontContextJumboFontFamily', 3150),
    token('FontContextJumboFontWeight', 3150),
    token('FontContextJumboLineHeight', 3150),
    token('FontContextHeroFontFamily', 3151),
    token('ShadowContextSmall1Type', 3399)
  ]

  test('puts expanded tokens where their source token is', () => {
    expect(inSourceOrder(tokens).map((item) => item.name)).toEqual([
      'BorderRadiusTooltipMain',
      'FontContextJumboFontFamily',
      'FontContextJumboFontWeight',
      'FontContextJumboLineHeight',
      'FontContextHeroFontFamily',
      'BorderWidthContextNone',
      'IconAccordionIndicator',
      'ShadowContextSmall1Type'
    ])
  })

  test('returns a copy', () => {
    const before = [...tokens]
    expect(inSourceOrder(tokens)).not.toBe(tokens)
    expect(tokens).toEqual(before)
  })
})

describe('SCSS template', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/scss-var-tokens.json', import.meta.url), 'utf8')
  )
  const tokens = fixture.tokens['web-px-references']

  /**
   * Nests tokens keyed by path, as Style Dictionary passes them to a format.
   */
  function nest(list) {
    const tree = {}
    for (const token of list) {
      const parent = token.path.slice(0, -1).reduce((group, key) => (group[key] ??= {}), tree)
      parent[token.path.at(-1)] = token
    }
    return tree
  }

  /**
   * Prints one token of main.scss with references; `unfiltered` holds every token of the
   * build.
   */
  function print(token, unfiltered) {
    const file = [token, ...Object.values(tokens).filter((item) => item !== token)]
    return scssTemplate({
      dictionary: { tokens: nest(file), allTokens: [token], unfilteredTokens: nest(unfiltered) },
      file: { destination: 'main.scss' },
      header: '',
      platform: { prefix: 'cx' },
      value: scssValue,
      settings: { basePxFontSize: 16, outputReferences: true }
    })
  }

  const colour = tokens['color.accordion.item-fg-color']
  const target = tokens['color.context.default.base-color']

  test('names a variable of another file', () => {
    const token = { ...colour, original: { $value: '{color.context.default.base-color}' } }
    expect(print(token, [token, target])).toContain(
      '$cx-color-accordion-item-fg-color: $cx-color-context-default-base-color !default;'
    )
  })

  test('throws when the referenced token does not exist', () => {
    const token = { ...colour, original: { $value: '{color.context.default.missing}' } }
    expect(() => print(token, [token, target])).toThrow(
      'No file declares a variable for color.context.default.missing'
    )
  })

  test('throws when every file filters the referenced token out', () => {
    // Tokens typed boolean are in no file
    const flag = { ...target, $type: 'boolean', path: ['color', 'context', 'default', 'flag'] }
    const token = { ...colour, original: { $value: '{color.context.default.flag}' } }
    expect(() => print(token, [token, flag])).toThrow(
      'No file declares a variable for color.context.default.flag'
    )
  })
})

describe('Android template', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
  )
  const { token, target } = fixture.androidReferences.find((c) => c.case === 'dimen reference')
  const tree = { [target.path[0]]: { base: { [target.path[2]]: target } } }
  const print = (outputReferences) =>
    androidTemplate({
      dictionary: { tokens: tree, allTokens: [token] },
      header: '',
      settings: { outputReferences }
    })

  test('prints the reference with outputReferences', () => {
    expect(print(true)).toContain(`<dimen name="size_unit_16">@dimen/dimension_base_16</dimen>`)
  })

  test('prints the value without it', () => {
    expect(print(false)).toContain(`<dimen name="size_unit_16">16dp</dimen>`)
  })
})

describe('iOS template', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
  )
  const { token, target } = fixture.iosReferences.find((c) => c.case === 'number reference')
  const tree = { [target.path[0]]: { base: { [target.path[2]]: target } } }
  const print = (settings) =>
    iosTemplate({
      dictionary: { tokens: tree, allTokens: [token] },
      file: { destination: 'NumberLarge.swift' },
      header: '',
      options: { import: ['UIKit'], accessControl: 'public', objectType: 'class' },
      settings
    })

  test('names the constant with outputReferences', () => {
    expect(print({ outputReferences: true })).toContain(
      '@objc public static let SizeUnit4 = DimensionBase4'
    )
  })

  test('prints the value without it', () => {
    expect(print({ outputReferences: false })).toContain(
      '@objc public static let SizeUnit4 = CGFloat(4)'
    )
    expect(print(undefined)).toContain('@objc public static let SizeUnit4 = CGFloat(4)')
  })
})

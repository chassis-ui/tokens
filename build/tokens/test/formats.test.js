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
import iosTemplate, { swiftConstants } from '../templates/ios-swift-class.template.js'
import composeTemplate from '../templates/compose-object.template.js'
import { tokenConstants } from '../templates/constants.js'
import * as swiftuiValues from '../values/swiftui.js'
import * as composeValues from '../values/compose.js'

/**
 * A token as the formats see it, reduced to what the order needs.
 */
const token = (name, sourceOrder) => ({ name, $extensions: { chassis: { sourceOrder } } })

describe('inSourceOrder', () => {
  // Style Dictionary 5 puts expanded tokens after all others. These are tokens of
  // ios/demo/chassis/ChassisTokens.swift with their numbers, in the order Style Dictionary 5.5
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
      options: {
        import: ['UIKit'],
        accessControl: 'public',
        objectType: 'enum',
        className: 'ChassisTokens'
      },
      settings
    })

  test('names the constant with outputReferences', () => {
    expect(print({ outputReferences: true })).toContain(
      'public static let SizeUnit4 = DimensionBase4'
    )
  })

  test('declares the type of the file, an enum without @objc by default', () => {
    const swift = iosTemplate({
      dictionary: { tokens: tree, allTokens: [token] },
      file: { destination: 'NumberLarge.swift' },
      header: '',
      options: {
        import: ['UIKit'],
        accessControl: 'public',
        objectType: 'enum',
        className: 'ChassisTokensNumberLarge'
      }
    })
    expect(swift).toContain('public enum ChassisTokensNumberLarge {\n')
    expect(swift).not.toContain('@objc')
  })

  test('marks the constants of a class @objc', () => {
    const swift = iosTemplate({
      dictionary: { tokens: tree, allTokens: [token] },
      file: { destination: 'NumberLarge.swift' },
      header: '',
      options: {
        import: ['UIKit'],
        accessControl: 'public',
        objectType: 'class',
        className: 'Tokens'
      }
    })
    expect(swift).toContain('public class Tokens {\n')
    expect(swift).toContain('@objc public static let SizeUnit4 = CGFloat(4)')
  })

  test('prints the value without it', () => {
    expect(print({ outputReferences: false })).toContain('public static let SizeUnit4 = CGFloat(4)')
    expect(print(undefined)).toContain('public static let SizeUnit4 = CGFloat(4)')
  })
})

describe('Typography parts in the mobile templates', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
  )
  // A typography token expanded into a font size part and a line height part
  const partsOf = (platform) => {
    const { token, context } = fixture.typographyParts.find(
      (c) => c.platform === platform && c.token.path.join('.') === 'font.context.jumbo.lineHeight'
    )
    const fontSize = {
      ...token,
      path: [...token.path.slice(0, -1), 'fontSize'],
      $value: context.fontSize
    }
    const tree = { font: { context: { jumbo: { fontSize, lineHeight: token } } } }
    return { tree, token }
  }

  test('the iOS template encodes a percentage line height with its font size', () => {
    const { tree, token } = partsOf('ios')
    const swift = iosTemplate({
      dictionary: { tokens: tree, allTokens: [token] },
      file: { destination: 'ChassisTokens.swift' },
      header: '',
      options: {
        import: ['UIKit'],
        accessControl: 'public',
        objectType: 'enum',
        className: 'ChassisTokens'
      }
    })
    expect(swift).toContain('public static let FontContextJumboLineHeight = CGFloat(120)')
  })

  test('the Android template encodes a percentage line height with its font size', () => {
    const android = fixture.android.find((c) => c.token.name === 'font_context_jumbo_line_height')
    const { token, context } = android
    const fontSize = {
      ...token,
      path: [...token.path.slice(0, -1), 'fontSize'],
      $value: context.fontSize
    }
    const tree = { font: { context: { jumbo: { fontSize, lineHeight: token } } } }
    const xml = androidTemplate({
      dictionary: { tokens: tree, allTokens: [token] },
      header: '',
      settings: {}
    })
    expect(xml).toContain('<dimen name="font_context_jumbo_line_height">120sp</dimen>')
  })
})

describe('Gradients in the mobile templates', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
  )
  const { cases, stopColors } = fixture.gradients

  // The file's tokens as a tree, with each token named for the platform
  const dictionaryFor = (platform, gradient) => {
    const tokens = [gradient, ...stopColors].map(({ token, names }) => ({
      ...token,
      name: names[platform]
    }))
    const tree = {}
    for (const token of tokens) {
      const parent = token.path.slice(0, -1).reduce((node, key) => (node[key] ??= {}), tree)
      parent[token.path[token.path.length - 1]] = token
    }
    return { tokens: tree, allTokens: [tokens[0]] }
  }

  const printIos = (gradient, outputReferences) =>
    iosTemplate({
      dictionary: dictionaryFor('ios', gradient),
      file: { destination: 'ColorLight.swift' },
      header: '',
      options: {
        import: ['UIKit'],
        accessControl: 'public',
        objectType: 'enum',
        className: 'ChassisTokens'
      },
      settings: { outputReferences }
    })
  const printAndroid = (gradient, outputReferences) =>
    androidTemplate({
      dictionary: dictionaryFor('android', gradient),
      header: '',
      settings: { outputReferences }
    })

  const iosLines = (lines) => lines.map(([name, value]) => `static let ${name} = ${value}`)
  // An Android element with this name and this text, whatever its tag and attributes
  const androidLine = ([name, value]) =>
    new RegExp(`name="${name}"[^>]*>${value.replace(/[.#()]/g, '\\$&')}<`)

  test.each(cases)('iOS prints the parts of $case', (gradient) => {
    const swift = printIos(gradient, false)
    for (const line of iosLines(gradient.expected.ios)) expect(swift).toContain(line)
    expect(swift).not.toContain(`static let ${gradient.names.ios} =`)
  })

  test.each(cases)('iOS names the stop colours with outputReferences, $case', (gradient) => {
    const swift = printIos(gradient, true)
    for (const line of iosLines(gradient.expectedWithReferences.ios)) expect(swift).toContain(line)
  })

  test.each(cases)('Android prints the parts of $case', (gradient) => {
    const xml = printAndroid(gradient, false)
    for (const line of gradient.expected.android) expect(xml).toMatch(androidLine(line))
    expect(xml).toContain(
      `<item name="${gradient.names.android}_angle" type="dimen" format="float">`
    )
    expect(xml).not.toContain(`name="${gradient.names.android}">`)
  })

  test.each(cases)('Android names the stop colours with outputReferences, $case', (gradient) => {
    const xml = printAndroid(gradient, true)
    for (const line of gradient.expectedWithReferences.android) {
      expect(xml).toMatch(androidLine(line))
    }
  })
})

describe('SwiftUI and Compose templates', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
  )
  const { token, target } = fixture.iosReferences.find((c) => c.case === 'number reference')
  const tree = { [target.path[0]]: { base: { [target.path[2]]: target } } }

  test('SwiftUI constants use the SwiftUI values', () => {
    const colour = fixture.ios.find((c) => c.token.$type === 'color').token
    const [constant] = swiftConstants({ tokens: {}, allTokens: [colour] }, {}, swiftuiValues)
    expect(constant.printed).toMatch(/^Color\(red: /)
  })

  test('SwiftUI constants name others with outputReferences', () => {
    const [constant] = swiftConstants(
      { tokens: tree, allTokens: [token] },
      { outputReferences: true },
      swiftuiValues
    )
    expect(constant.printed).toBe('DimensionBase4')
  })

  test('Compose prints one object of getters in the package', () => {
    const android = fixture.androidReferences.find((c) => c.case === 'dimen reference')
    const named = (t, name) => ({ ...t, name })
    const size = named(android.token, 'sizeUnit16')
    const base = named(android.target, 'dimensionBase16')
    const dictionary = {
      tokens: { dimension: { base: { 16: base } } },
      allTokens: [size, base]
    }
    const print = (outputReferences) =>
      composeTemplate({
        file: { destination: 'NumberLarge.kt' },
        header: '// header',
        options: { packageName: 'com.example.tokens', className: 'ChassisTokensNumberLarge' },
        constants: tokenConstants(dictionary, { outputReferences }, composeValues)
      })
    const kotlin = print(false)
    expect(kotlin).toContain('package com.example.tokens\n')
    expect(kotlin).toContain('import androidx.compose.ui.unit.dp\n')
    expect(kotlin).toContain('object ChassisTokensNumberLarge {\n')
    expect(kotlin).toContain('val sizeUnit16 get() = 16.dp\n')
    // A getter may name a property declared after it
    expect(print(true)).toContain('val sizeUnit16 get() = dimensionBase16\n')
  })
})

describe('Derived constants in the mobile templates', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
  )
  const blur = fixture.shadowParts.find((c) => c.case === 'shadow blur').token
  const dictionary = { tokens: {}, allTokens: [blur] }

  test('UIKit prints the radius right after the blur', () => {
    expect(swiftConstants(dictionary).map((c) => [c.name, c.printed])).toEqual([
      ['ShadowContextSmall1Blur', 'CGFloat(8)'],
      ['ShadowContextSmall1Radius', 'CGFloat(4)']
    ])
  })

  test('SwiftUI and Compose print no derived constants', () => {
    expect(swiftConstants(dictionary, {}, swiftuiValues)).toHaveLength(1)
    const compose = { ...blur, name: 'shadowContextSmall1Blur' }
    expect(tokenConstants({ tokens: {}, allTokens: [compose] }, {}, composeValues)).toHaveLength(1)
  })
})

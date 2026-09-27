/**
 * @file values-swiftui.test.js
 * @description Tests for the SwiftUI value encoder, using the resolved tokens of the iOS
 *              fixture: each value is the UIKit value of dist/ in SwiftUI form.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { encode, partName, reference } from '../build/values/swiftui.js'
import * as ios from '../build/values/ios.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)

// The UIKit value of dist/ in SwiftUI form
const swiftui = (uikit) =>
  uikit
    .replace(
      /^UIColor\(red: (.*), green: (.*), blue: (.*), alpha: (.*)\)$/,
      'Color(red: $1, green: $2, blue: $3, opacity: $4)'
    )
    .replace(/^UIFont\.Weight\./, 'Font.Weight.')

describe('SwiftUI encode', () => {
  test.each(fixture.ios)('$case ($token.name)', ({ token, context, expected }) => {
    expect(encode(token, context)).toBe(swiftui(expected))
  })

  test('prints colours as Color with opacity and weights as Font.Weight', () => {
    const colour = fixture.ios.find((c) => c.token.$type === 'color').token
    expect(encode(colour)).toMatch(
      /^Color\(red: [\d.]+, green: [\d.]+, blue: [\d.]+, opacity: [\d.]+\)$/
    )
    const weight = fixture.ios.find((c) => c.token.$type === 'fontWeight').token
    expect(encode(weight)).toMatch(/^Font\.Weight\.\w+$/)
  })

  test('names constants and parts as the iOS encoder does', () => {
    const { token, target } = fixture.iosReferences.find((c) => c.case === 'number reference')
    expect(reference(token, target)).toBe(ios.reference(token, target))
    expect(partName({ name: 'GradientPrimitiveBlackL000' }, ['stop1', 'color'])).toBe(
      'GradientPrimitiveBlackL000Stop1Color'
    )
  })

  test('refuses a reference whose value would change, as on iOS', () => {
    const { token, target } = fixture.iosReferences.find((c) =>
      c.case.startsWith('rgba() colour whose first reference is a colour')
    )
    expect(encode(token)).not.toBe(encode(target))
    expect(reference(token, target)).toBeUndefined()
  })
})

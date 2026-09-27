/**
 * @file formats.test.js
 * @description Tests for the token order of the formats.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, expect, test } from 'vitest'
import { inSourceOrder } from '../formats.js'

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

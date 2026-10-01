/**
 * @file values-shared.test.js
 * @description Tests for the gradient helpers the iOS and Android encoders share, using
 *              gradient tokens from the real build and CSS gradient forms the tokens may
 *              use.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  gradientParts,
  isGradient,
  parseColor,
  parseLinearGradient
} from '../build/values/shared.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)
const gradientCase = (label) =>
  structuredClone(fixture.gradients.cases.find((c) => c.case === label).token)

describe('isGradient', () => {
  test('is true for a color token holding a gradient', () => {
    expect(isGradient(gradientCase('0deg, two stops'))).toBe(true)
  })

  test('is false for a plain color and for another type', () => {
    const [{ token }] = fixture.gradients.stopColors
    expect(isGradient(token)).toBe(false)
    expect(isGradient({ $type: 'string', $value: 'linear-gradient(red, blue)' })).toBe(false)
  })
})

describe('parseLinearGradient', () => {
  test('reads the angle and the stops of a token', () => {
    expect(parseLinearGradient(gradientCase('0deg, two stops').$value)).toEqual({
      angle: 0,
      stops: [
        { color: 'rgba(0, 0, 0, 0)', position: 0 },
        { color: '#000000', position: 1 }
      ]
    })
  })

  test('turns a negative angle into one from 0 to 360', () => {
    expect(parseLinearGradient(gradientCase('negative angle').$value).angle).toBe(315)
    expect(parseLinearGradient('linear-gradient(-90deg, red, blue)').angle).toBe(270)
    expect(parseLinearGradient('linear-gradient(450deg, red, blue)').angle).toBe(90)
  })

  test('reads the side keywords and defaults to top to bottom', () => {
    expect(parseLinearGradient('linear-gradient(to right, red, blue)').angle).toBe(90)
    expect(parseLinearGradient('linear-gradient(red, blue)').angle).toBe(180)
  })

  test('gives stops without a position the positions CSS gives them', () => {
    const { stops } = parseLinearGradient('linear-gradient(90deg, red, green, yellow 90%, blue)')
    expect(stops.map((stop) => stop.position)).toEqual([0, 0.45, 0.9, 1])
  })

  test('keeps references and commas inside a stop color', () => {
    const { stops } = parseLinearGradient(gradientCase('0deg, two stops').original.$value)
    expect(stops.map((stop) => stop.color)).toEqual([
      '{color.primitive.black.transparent}',
      '{color.primitive.black.base}'
    ])
  })

  test.each([
    'radial-gradient(red, blue)',
    'linear-gradient(to top right, red, blue)',
    'linear-gradient(0.25turn, red, blue)',
    'linear-gradient(0deg, red)'
  ])('fails on %s', (value) => {
    expect(() => parseLinearGradient(value)).toThrow()
  })
})

describe('gradientParts', () => {
  test('expands a gradient into its angle and the color and position of each stop', () => {
    const token = gradientCase('0deg, two stops')
    const parts = gradientParts(token)
    expect(parts.map((part) => [part.segments.join('.'), part.$type, part.$value])).toEqual([
      ['angle', 'number', 0],
      ['stop1.color', 'color', 'rgba(0, 0, 0, 0)'],
      ['stop1.position', 'number', 0],
      ['stop2.color', 'color', '#000000'],
      ['stop2.position', 'number', 1]
    ])
    expect(parts[1].path).toEqual([...token.path, 'stop1', 'color'])
  })

  test('keeps the referenced color of each stop as its original value', () => {
    const parts = gradientParts(gradientCase('0deg, two stops'))
    expect(parts[1].original.$value).toBe('{color.primitive.black.transparent}')
    expect(parts[0].original.$value).toBe(0)
  })

  test('uses the resolved stops when the original is not a gradient', () => {
    const token = { ...gradientCase('0deg, two stops'), original: { $value: '{gradient.other}' } }
    expect(gradientParts(token)[1].original.$value).toBe('rgba(0, 0, 0, 0)')
  })

  test('fails with the token path on a gradient it does not read', () => {
    const token = { ...gradientCase('0deg, two stops'), $value: 'radial-gradient(red, blue)' }
    expect(() => gradientParts(token)).toThrow(
      'gradient.primitive.black.l-000: Not a linear gradient'
    )
  })
})

describe('parseColor', () => {
  test('fails on a gradient instead of reading its first stop', () => {
    expect(() => parseColor(gradientCase('0deg, two stops'))).toThrow(
      'Gradient gradient.primitive.black.l-000 is printed as parts, not as a color'
    )
  })
})

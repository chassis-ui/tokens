/**
 * @file values-shared.test.js
 * @description Tests for the helpers the encoders share, using gradient and easing tokens
 *              from the real build, CSS gradient forms the tokens may use, and duration
 *              and easing forms.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  cubicBezierParts,
  cubicBezierPoints,
  durationMilliseconds,
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

describe('durationMilliseconds', () => {
  const duration = ($value) => ({ path: ['motion', 'timing'], $value })

  test.each([
    ['250', 250],
    [250, 250],
    ['250ms', 250],
    ['0.25s', 250]
  ])('reads %s', (value, expected) => {
    expect(durationMilliseconds(duration(value))).toBe(expected)
  })

  test.each(['', 'fast', '-100', '100px'])('fails on "%s"', (value) => {
    expect(() => durationMilliseconds(duration(value))).toThrow(
      `motion.timing: "${value}" is not a duration`
    )
  })
})

describe('cubicBezierPoints', () => {
  const easing = ($value) => ({ path: ['motion', 'easing'], $value })

  test('reads the source form', () => {
    expect(cubicBezierPoints(fixture.easing.token)).toEqual([0.42, 0, 1, 1])
  })

  test('reads an array and a y outside 0 to 1, which overshoots', () => {
    expect(cubicBezierPoints(easing([0.3, 1.5, 0.6, -0.5]))).toEqual([0.3, 1.5, 0.6, -0.5])
  })

  test.each(['', '0, 1, 0', '0, 1, 0, 1, 1', '0, , 0, 1', 'ease', '-0.1, 0, 1, 1', '0, 0, 1.1, 1'])(
    'fails on "%s"',
    (value) => {
      expect(() => cubicBezierPoints(easing(value))).toThrow('is not a cubic Bézier curve')
    }
  )
})

describe('cubicBezierParts', () => {
  test('returns a number per control point, without references', () => {
    const parts = cubicBezierParts(fixture.easing.token)

    expect(parts.map((part) => part.segments[0])).toEqual(['x1', 'y1', 'x2', 'y2'])
    expect(parts.map((part) => part.$value)).toEqual([0.42, 0, 1, 1])
    expect(parts[0].path).toEqual(['motion', 'easing', 'context', 'ease-in', 'x1'])
    expect(parts[0].$type).toBe('number')
    expect(parts[0].original.$value).toBe(0.42)
  })
})

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

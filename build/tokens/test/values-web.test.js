/**
 * @file values-web.test.js
 * @description Tests for the web (SCSS) value rules, using resolved tokens from the real
 *              build and the matching values from the committed dist/.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  cssShadow,
  encode,
  letterSpacingEm,
  lineHeightEm,
  percentToEm,
  remSize,
  typographyMap
} from '../values/web.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/web-tokens.json', import.meta.url), 'utf8')
)

describe('web encode', () => {
  test.each(fixture.encode)('$case ($token.name)', ({ token, fontSize, expected }) => {
    const references = []
    const resolveReference = (reference) => {
      references.push(reference)
      return fontSize
    }

    expect(encode(token, { resolveReference })).toBe(expected)
    if (token.$type === 'lineHeight') {
      expect(references).toEqual([`{typography.fontSize.${token.path[2]}.${token.path[3]}}`])
    } else {
      expect(references).toEqual([])
    }
  })
})

describe('remSize', () => {
  test.each(fixture.remSize)('$case ($token.name)', ({ token, expected }) => {
    expect(remSize(token, 16)).toBe(expected)
  })

  test('keeps rem values and converts each space-separated value', () => {
    expect(remSize({ name: 'x', $value: '0.5rem 8px' }, 16)).toBe('0.5rem 0.5rem')
  })

  test('throws on a value that is not a number', () => {
    expect(() => remSize({ name: 'cx-size-bad', $value: 'auto' }, 16)).toThrow(
      "Invalid Number: 'cx-size-bad: auto' is not a valid number, cannot transform to 'rem'."
    )
  })
})

describe('cssShadow', () => {
  test.each(fixture.cssShadow)('$case', ({ value, expected }) => {
    expect(cssShadow(value)).toBe(expected)
  })

  test('accepts a single layer object', () => {
    const [layer] = fixture.cssShadow[0].value
    expect(cssShadow(layer)).toBe(fixture.cssShadow[0].expected)
  })

  test('passes a string through', () => {
    expect(cssShadow('none')).toBe('none')
  })
})

describe('typographyMap', () => {
  test.each(fixture.typographyMap)('$case ($name)', ({ parts, expected }) => {
    expect(typographyMap(parts)).toBe(expected)
  })
})

describe('unit helpers', () => {
  test('letterSpacingEm keeps the math-rounded number', () => {
    expect(letterSpacingEm('-0.0313rem')).toBe('-0.0313em')
  })

  test('letterSpacingEm prints zero as 0em', () => {
    expect(letterSpacingEm('0rem')).toBe('0em')
  })

  test('lineHeightEm trims trailing zeros', () => {
    expect(lineHeightEm('3rem', '2rem')).toBe('1.5em')
    expect(lineHeightEm('2rem', '2rem')).toBe('1em')
  })

  test.each(fixture.percentToEm)('percentToEm: $case', ({ value, expected }) => {
    expect(percentToEm(value)).toBe(expected)
  })
})

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
  pxSize,
  remSize,
  resolvedTypographyMap,
  typographyMap,
  vwSize
} from '../build/values/web.js'

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

describe('pxSize', () => {
  test.each(fixture.remSize)('$case ($token.name)', ({ token }) => {
    expect(pxSize(token)).toBe(`${parseFloat(token.$value)}px`)
  })

  test('keeps px values and converts each space-separated value', () => {
    expect(pxSize({ name: 'x', $value: '8px 4 -0.5' })).toBe('8px 4px -0.5px')
  })

  test('throws on a value that is not a number', () => {
    expect(() => pxSize({ name: 'cx-size-bad', $value: 'auto' })).toThrow(
      "Invalid Number: 'cx-size-bad: auto' is not a valid number, cannot transform to 'px'."
    )
  })
})

describe('vwSize', () => {
  // The base font size in pixels is 1vw, so the numbers are those of rem
  test.each(fixture.remSize)('$case ($token.name)', ({ token, expected }) => {
    expect(vwSize(token, 16)).toBe(expected.replaceAll('rem', 'vw'))
  })

  test('keeps vw values and converts each space-separated value', () => {
    expect(vwSize({ name: 'x', $value: '0.5vw 8px' }, 16)).toBe('0.5vw 0.5vw')
  })

  test('throws on a value that is not a number', () => {
    expect(() => vwSize({ name: 'cx-size-bad', $value: 'auto' }, 16)).toThrow(
      "Invalid Number: 'cx-size-bad: auto' is not a valid number, cannot transform to 'vw'."
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

describe('resolvedTypographyMap', () => {
  const value = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 700,
    lineHeight: '125%',
    fontSize: '96px',
    letterSpacing: '-0.5px',
    paragraphSpacing: '0px',
    textCase: 'none',
    textDecoration: 'none',
    fontStyle: 'normal'
  }

  test('quotes the family list and converts a percent line height', () => {
    expect(resolvedTypographyMap(value, 16)).toBe(
      '("font-family": "Inter, system-ui, sans-serif", "font-weight": 700, "font-size": 96px, ' +
        '"line-height": 1.25em, "font-style": normal, "letter-spacing": -0.0313em, ' +
        '"margin-bottom": 0px, "text-transform": none, "text-decoration": none)'
    )
  })

  test('prints a line height relative to the font size', () => {
    const map = resolvedTypographyMap({ ...value, fontSize: '22px', lineHeight: '32px' }, 16)
    expect(map).toContain('"line-height": 1.455em')
  })
})

describe('unit helpers', () => {
  test('letterSpacingEm keeps the math-rounded number', () => {
    expect(letterSpacingEm('-0.0313rem')).toBe('-0.0313em')
  })

  test('letterSpacingEm prints zero as 0em', () => {
    expect(letterSpacingEm('0rem')).toBe('0em')
    expect(letterSpacingEm('0px')).toBe('0em')
  })

  test('letterSpacingEm divides a px value by the base font size, to four decimals', () => {
    expect(letterSpacingEm('-0.5px', 16)).toBe('-0.0313em')
    expect(letterSpacingEm('-1px', 16)).toBe('-0.0625em')
    expect(letterSpacingEm('2px')).toBe('0.125em')
  })

  test('letterSpacingEm does not divide rem and vw values', () => {
    expect(letterSpacingEm('-0.0313vw', 16)).toBe('-0.0313em')
  })

  test('lineHeightEm trims trailing zeros', () => {
    expect(lineHeightEm('3rem', '2rem')).toBe('1.5em')
    expect(lineHeightEm('2rem', '2rem')).toBe('1em')
  })

  test.each(fixture.percentToEm)('percentToEm: $case', ({ value, expected }) => {
    expect(percentToEm(value)).toBe(expected)
  })
})

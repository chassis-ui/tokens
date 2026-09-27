/**
 * @file values-ios.test.js
 * @description Tests for the iOS value encoder and its references, using resolved tokens
 *              from the real build and the matching values from the committed dist/ and
 *              the ios-references baseline.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { derivedConstants, encode, partName, reference } from '../build/values/ios.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)
const tokenNamed = (name) => structuredClone(fixture.ios.find((c) => c.token.name === name).token)

describe('iOS encode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each(fixture.ios)('$case ($token.name)', ({ token, context, expected }) => {
    expect(encode(token, context)).toBe(expected)
  })

  test('does not modify the token', () => {
    for (const { token, context } of fixture.ios) {
      const frozen = Object.freeze({ ...token, path: Object.freeze([...token.path]) })
      expect(() => encode(frozen, context)).not.toThrow()
    }
  })

  test('prints an unparseable colour as is and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const token = { ...tokenNamed('ColorBasePrimitiveLightBlackBase'), $value: 'not-a-color' }

    expect(encode(token)).toBe('not-a-color')
    expect(warn).toHaveBeenCalledOnce()
  })

  test('prints a type outside every group as is', () => {
    const token = { ...tokenNamed('ShadowContextNoneType'), $type: 'other' }

    expect(encode(token)).toBe('dropShadow')
  })
})

describe('iOS reference', () => {
  const caseNamed = (label) => structuredClone(fixture.iosReferences.find((c) => c.case === label))

  test.each(fixture.iosReferences)(
    '$case ($token.name in $file)',
    ({ token, target, expected }) => {
      expect(reference(token, target) ?? encode(token)).toBe(expected.value)
    }
  )

  test('names the constant of the target, without the class', () => {
    const { token, target } = caseNamed('number reference')
    expect(reference(token, target)).toBe('DimensionBase4')
  })

  test('none without a target in the same file', () => {
    const { token, target } = caseNamed('reference to a token of another file')
    expect(target).toBeUndefined()
    expect(reference(token, undefined)).toBeUndefined()
  })

  test('none for a base colour, even when the reference would be safe', () => {
    const { token, target } = caseNamed('base colour with a reference')
    expect(encode(target)).toBe(encode(token))
    expect(reference(token, target)).toBeUndefined()
    expect(
      reference({ ...token, path: ['color', 'context', ...token.path.slice(2)] }, target)
    ).toBe(target.name)
  })

  test('none for a colour with a modifier, whose value differs from its target', () => {
    const { token, target } = caseNamed('base colour with a modifier')
    const context = { ...token, path: ['color', 'context', ...token.path.slice(2)] }
    expect(encode(context)).not.toBe(encode(target))
    expect(reference(context, target)).toBeUndefined()
  })

  test('none for a size computed with math, even when the value is the same', () => {
    const { token, target } = caseNamed('size computed with math')
    const same = {
      ...token,
      $value: target.$value,
      original: { $value: `{${target.path.join('.')}}*1` }
    }
    expect(encode(same)).toBe(encode(target))
    expect(reference(same, target)).toBeUndefined()
    expect(reference({ ...same, original: { $value: `{${target.path.join('.')}}` } }, target)).toBe(
      target.name
    )
  })

  test('none for an rgba() colour whose alpha the target lacks', () => {
    const { token, target } = caseNamed(
      'rgba() colour whose first reference is a colour: alpha lost'
    )
    expect(encode(token)).toContain('alpha: 0.5)')
    expect(encode(target)).toContain('alpha: 1)')
    expect(reference(token, target)).toBeUndefined()
  })

  test('none when the target is another Swift type', () => {
    const { token, target } = caseNamed(
      'rgba() colour whose first reference is an opacity: another Swift type'
    )
    expect(encode(target)).toBe('CGFloat(0.5)')
    expect(reference(token, target)).toBeUndefined()
  })

  test('none when the target is another Swift type with the same text inside', () => {
    const { token, target } = caseNamed('number reference')
    const string = { ...target, $type: 'string', $value: 'CGFloat(4)' }
    expect(encode(string)).toBe('"CGFloat(4)"')
    expect(reference(token, string)).toBeUndefined()
  })
})

describe('iOS typography parts', () => {
  const parts = fixture.typographyParts.filter((c) => c.platform === 'ios')

  test.each(parts)('$case ($token.name in $file)', ({ token, context, expected }) => {
    expect(encode(token, context)).toBe(expected)
  })

  test('a percentage line height needs the font size', () => {
    const { token } = parts.find((c) => c.token.name === 'FontContextJumboLineHeight')
    expect(() => encode(token)).toThrow(
      'No font size for the percentage line height of font.context.jumbo.lineHeight'
    )
  })

  test('letter spacing does not use the font size', () => {
    const { token, context } = parts.find((c) => c.token.name === 'FontContextJumboLetterSpacing')
    expect(encode(token)).toBe(encode(token, context))
  })

  test('the reference check compares encoded values with their font sizes', () => {
    const { token, context } = parts.find((c) => c.token.name === 'FontContextJumboLineHeight')
    const target = { ...token, name: 'Other', path: ['font', 'context', 'other', 'lineHeight'] }
    expect(reference(token, target, context, context)).toBe('Other')
    expect(reference(token, target, context, { fontSize: '64px' })).toBeUndefined()
  })
})

describe('iOS font weights', () => {
  const weight = (value) => ({
    ...tokenNamed('TypographyFontWeightTextStrongWeight'),
    $value: value
  })

  test.each([
    ['Semi Bold', 'semibold'],
    ['SemiBold', 'semibold'],
    ['semi-bold', 'semibold'],
    ['Thin', 'ultraLight'],
    ['Extra Light', 'thin'],
    ['Extra Bold', 'heavy'],
    ['Black', 'black'],
    ['600', 'semibold']
  ])('%s is UIFont.Weight.%s', (value, name) => {
    expect(encode(weight(value))).toBe(`UIFont.Weight.${name}`)
  })

  test('rounds to the nearest hundred from 100 to 900', () => {
    expect(encode(weight('Ultra Black'))).toBe('UIFont.Weight.black')
    expect(encode(weight('350'))).toBe('UIFont.Weight.regular')
    expect(encode(weight('340'))).toBe('UIFont.Weight.light')
  })

  test('an unknown name fails with the token path', () => {
    expect(() => encode(weight('Chunky'))).toThrow(
      'Unknown font weight "Chunky" in typography.fontWeight.text.strong.weight'
    )
  })
})

describe('iOS part names', () => {
  test('add the segments of the part to the token name', () => {
    expect(partName({ name: 'GradientPrimitiveBlackL000' }, ['stop1', 'color'])).toBe(
      'GradientPrimitiveBlackL000Stop1Color'
    )
  })
})

describe('iOS derived constants', () => {
  const shadow = (label) => structuredClone(fixture.shadowParts.find((c) => c.case === label).token)

  test('a shadow blur is followed by its Core Animation radius, half the blur', () => {
    expect(derivedConstants(shadow('shadow blur'))).toEqual([
      { name: 'ShadowContextSmall1Radius', type: 'dimension', value: 'CGFloat(4)' }
    ])
  })

  test('every box shadow blur has one, including bg-blur', () => {
    expect(derivedConstants(shadow('blur of the bg-blur box shadow'))).toEqual([
      { name: 'BgBlurDefaultRadius', type: 'dimension', value: 'CGFloat(24)' }
    ])
  })

  test('other shadow parts and blurs outside a shadow have none', () => {
    expect(derivedConstants(shadow('shadow spread'))).toEqual([])
    const plain = { ...shadow('shadow blur'), $extensions: {} }
    expect(derivedConstants(plain)).toEqual([])
  })

  test('the radius keeps three decimals', () => {
    const odd = { ...shadow('shadow blur'), $value: '7px' }
    expect(derivedConstants(odd)[0].value).toBe('CGFloat(3.5)')
  })
})

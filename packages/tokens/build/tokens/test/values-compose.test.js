/**
 * @file values-compose.test.js
 * @description Tests for the Jetpack Compose value encoder, using the resolved tokens of
 *              the Android fixture: each value is the Android resource value of dist/ in
 *              Kotlin.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { encode, kotlinString, partName, reference } from '../values/compose.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)
const caseNamed = (label) => structuredClone(fixture.android.find((c) => c.case === label))

// The Android resource value of dist/ in Kotlin
const kotlin = ({ element, value }, token, context) => {
  if (element === 'color') return `Color(0x${value.slice(1).toUpperCase()})`
  if (element === 'dimen') {
    const [, number, unit] = value.match(/^(-?[\d.]+)(dp|sp)$/)
    return `${number.startsWith('-') ? `(${number})` : number}.${unit}`
  }
  if (element === 'item') {
    const em = token.path[token.path.length - 1] === 'letterSpacing' && context?.fontSize
    return em ? `${value.startsWith('-') ? `(${value})` : value}.em` : `${value}f`
  }
  if (element === 'integer') return token.$type === 'fontWeight' ? `FontWeight(${value})` : value
  return null
}

describe('Compose encode', () => {
  const cases = fixture.android.filter(({ expected }) => expected.element !== 'string')

  test.each(cases)('$case ($token.name)', ({ token, context, expected }) => {
    expect(encode(token, context)).toBe(kotlin(expected, token, context))
  })

  // The text of an escaped Android string resource
  const unescape = (value) =>
    value.replace(/\\(.)/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

  test.each(fixture.android.filter(({ expected }) => expected.element === 'string'))(
    '$case ($token.name) prints the text of the Android string as a Kotlin literal',
    ({ token, context, expected }) => {
      expect(encode(token, context)).toBe(kotlinString(unescape(expected.value)))
    }
  )

  test('escapes backslashes, quotes and string templates', () => {
    expect(kotlinString(`a "b" \\ $c\nd`)).toBe('"a \\"b\\" \\\\ \\$c\\nd"')
  })

  test('puts a negative number in parentheses before a unit', () => {
    const { token } = caseNamed('dimen: sp for a fontSize sub-token')
    expect(encode({ ...token, path: ['size', 'unit', 'n1'], $value: '-1px' })).toBe('(-1).dp')
    const { token: spacing, context } = caseNamed(
      'float: a letterSpacing sub-token is in em of the font size'
    )
    expect(encode(spacing, context)).toBe('(-0.0052).em')
  })

  test('prints a float without a font size as a Float', () => {
    const { token } = caseNamed('float: opacity as is')
    expect(encode(token)).toMatch(/^[\d.]+f$/)
  })

  test('names the property of the target, by the Android rule', () => {
    const { token, target } = fixture.androidReferences.find((c) => c.case === 'dimen reference')
    expect(reference(token, { ...target, name: 'dimensionBase16' })).toBe('dimensionBase16')
    const refused = fixture.androidReferences.find((c) =>
      c.case.startsWith('font size referencing a size')
    )
    expect(reference(refused.token, refused.target)).toBeUndefined()
  })

  test('names parts in camelCase', () => {
    expect(partName({ name: 'gradientPrimitiveBlackL000' }, ['stop1', 'color'])).toBe(
      'gradientPrimitiveBlackL000Stop1Color'
    )
  })
})

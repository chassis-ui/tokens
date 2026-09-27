/**
 * @file values-android.test.js
 * @description Tests for the Android value encoder, resource element choice and
 *              references, using resolved tokens from the real build and the matching
 *              lines from the committed dist/ and the android-references baseline.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { encode, reference, resourceKind, resourceTag, resourceType } from '../values/android.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)
const tokenNamed = (name) =>
  structuredClone(fixture.android.find((c) => c.token.name === name).token)

describe('Android encode and resourceType', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each(fixture.android)('$case ($token.name)', ({ token, expected }) => {
    expect(resourceTag(token).tag).toBe(expected.element)
    expect(encode(token)).toBe(expected.value)
  })

  // Android integer resources reject fractions such as 0.4 (aapt2: invalid integer)
  test.each(['float: opacity as is', 'float: letterSpacing type is a bare number'])(
    '%s prints a float dimen item',
    (label) => {
      const { token } = fixture.android.find((c) => c.case === label)
      expect(resourceKind(token)).toBe('float')
      expect(resourceType(token)).toBe('dimen')
      expect(resourceTag(token)).toEqual({
        tag: 'item',
        attributes: ' type="dimen" format="float"'
      })
    }
  )

  test('prints every opacity and letter spacing as a float, whole or not', () => {
    const opacity = fixture.android.find((c) => c.case === 'float: opacity as is').token
    expect(resourceKind({ ...opacity, $value: '1' })).toBe('float')
    const spacing = tokenNamed('typography_letter_spacing_base_zero')
    expect(spacing.$type).toBe('number')
    expect(resourceKind(spacing)).toBe('float')
  })

  test('keeps other number types as integers', () => {
    const opacity = fixture.android.find((c) => c.case === 'float: opacity as is').token
    const zIndex = { ...opacity, $type: 'number', path: ['z', 'index', 'top'] }
    expect(resourceTag(zIndex)).toEqual({ tag: 'integer', attributes: '' })
  })

  test('does not modify the token', () => {
    for (const { token } of fixture.android) {
      const frozen = Object.freeze({ ...token, path: Object.freeze([...token.path]) })
      expect(() => encode(frozen)).not.toThrow()
    }
  })

  test('prints an unparseable colour as is and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const token = { ...tokenNamed('color_base_primitive_light_black_base'), $value: 'not-a-color' }

    expect(encode(token)).toBe('not-a-color')
    expect(warn).toHaveBeenCalledOnce()
  })

  test('uses a string element for a type outside every mapped group', () => {
    const token = { ...tokenNamed('shadow_context_none_type'), $type: 'typography' }

    expect(resourceType(token)).toBe('string')
    expect(encode(token)).toBe('dropShadow')
  })
})

describe('Android reference', () => {
  const caseNamed = (label) =>
    structuredClone(fixture.androidReferences.find((c) => c.case === label))

  test.each(fixture.androidReferences)(
    '$case ($token.name in $file)',
    ({ token, target, expected }) => {
      expect(resourceTag(token).tag).toBe(expected.element)
      expect(reference(token, target) ?? encode(token)).toBe(expected.value)
    }
  )

  test('names the resource of the target with the element of both', () => {
    const { token, target } = caseNamed('dimen reference')
    expect(reference(token, target)).toBe(`@dimen/${target.name}`)
  })

  test('none without a target in the same file', () => {
    const { token, target } = caseNamed('reference to a token of another file')
    expect(target).toBeUndefined()
    expect(reference(token, undefined)).toBeUndefined()
  })

  test('none for a base colour, even when the reference would be safe', () => {
    const { token, target } = caseNamed('base colour with a reference')
    expect([resourceKind(target), encode(target)]).toEqual([resourceKind(token), encode(token)])
    expect(reference(token, target)).toBeUndefined()
    expect(
      reference({ ...token, path: ['color', 'context', ...token.path.slice(2)] }, target)
    ).toBe(`@color/${target.name}`)
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
      `@dimen/${target.name}`
    )
  })

  test('names a float resource as a dimen', () => {
    const { token, target } = caseNamed('float reference')
    expect(reference(token, target)).toBe(`@dimen/${target.name}`)
  })

  test('none when the target is another kind with the same number', () => {
    const { token, target } = caseNamed('float reference')
    const dimen = {
      ...target,
      name: 'size_unit_0',
      path: ['size', 'unit', '0'],
      $type: 'dimension',
      $value: '0'
    }
    expect(encode(token)).toBe('0')
    expect(reference(token, dimen)).toBeUndefined()
  })

  test('none when the target encodes to another value', () => {
    const { token, target } = caseNamed('font size referencing a size: sp, not dp')
    expect([encode(token), encode(target)]).toEqual(['96sp', '96dp'])
    expect(reference(token, target)).toBeUndefined()
  })

  test('none for an rgba() colour whose alpha the target lacks', () => {
    const { token, target } = caseNamed(
      'rgba() colour whose first reference is a colour: alpha lost'
    )
    expect([encode(token), encode(target)]).toEqual(['#80b7c0c2', '#ffb7c0c2'])
    expect(reference(token, target)).toBeUndefined()
  })
})

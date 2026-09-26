/**
 * @file values-android.test.js
 * @description Tests for the Android value encoder and resource element choice, using
 *              resolved tokens from the real build and the matching lines from the
 *              committed dist/.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { encode, resourceType } from '../values/android.js'

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
    expect(resourceType(token)).toBe(expected.element)
    expect(encode(token)).toBe(expected.value)
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

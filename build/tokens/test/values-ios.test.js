/**
 * @file values-ios.test.js
 * @description Tests for the iOS value encoder, using resolved tokens from the real build
 *              and the matching values from the committed dist/.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { encode } from '../values/ios.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)
const tokenNamed = (name) => structuredClone(fixture.ios.find((c) => c.token.name === name).token)

describe('iOS encode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test.each(fixture.ios)('$case ($token.name)', ({ token, expected }) => {
    expect(encode(token)).toBe(expected)
  })

  test('does not modify the token', () => {
    for (const { token } of fixture.ios) {
      const frozen = Object.freeze({ ...token, path: Object.freeze([...token.path]) })
      expect(() => encode(frozen)).not.toThrow()
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

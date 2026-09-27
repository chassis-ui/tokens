/**
 * @file scss-var-policy.test.js
 * @description Tests for the values of the SCSS variables format, using resolved tokens
 *              of the web-px, web-vw and web-scss presets from the real build and the
 *              matching values from their baselines in golden/.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { scssValue } from '../scss-var-policy.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/scss-var-tokens.json', import.meta.url), 'utf8')
)

const REFERENCE = /\{([^{}]+)\}/g
const platform = { basePxFontSize: 16 }

/**
 * Token lookups over a set of tokens keyed by path.
 */
function lookupsIn(tokens) {
  const find = (path) => {
    if (!tokens[path]) throw new Error(`Tries to reference ${path}, which is not defined.`)
    return tokens[path]
  }
  return {
    token: (value) => {
      const [match] = typeof value === 'string' ? value.matchAll(REFERENCE) : []
      return match && find(match[1])
    },
    value: (value) => String(value).replace(REFERENCE, (_, path) => find(path).$value)
  }
}

const valueOf = (preset, path, tokens = fixture.tokens[preset]) =>
  scssValue(tokens[path], lookupsIn(tokens), platform)

describe('scssValue on emitted tokens', () => {
  test.each(fixture.cases)('$preset, $group: $case ($token)', ({ preset, token, expected }) => {
    expect(valueOf(preset, token)).toBe(expected)
  })

  test('prints no reference', () => {
    for (const { preset, token } of fixture.cases) {
      expect(valueOf(preset, token)).not.toMatch(/var\(--|\$cx-/)
    }
  })

  test('does not change the token', () => {
    for (const { preset, token } of fixture.cases) {
      const before = structuredClone(fixture.tokens[preset][token])
      valueOf(preset, token)
      expect(fixture.tokens[preset][token]).toEqual(before)
    }
  })
})

describe('letter spacing', () => {
  const spacing = (preset, path) => valueOf(preset, path).match(/"letter-spacing": ([^,]+)/)[1]

  // web-px holds the pixel value; it prints what the rem and vw presets print
  test.each([
    ['font.context.jumbo', '-0.5px', '-0.0313em'],
    ['font.website.hero-title', '-1px', '-0.0625em'],
    ['font.context.lead', '0px', '0em']
  ])('%s: %s in web-px prints %s, as in web-scss and web-vw', (path, px, expected) => {
    expect(fixture.tokens['web-px'][path].$value.letterSpacing).toBe(px)
    expect(spacing('web-px', path)).toBe(expected)
    expect(spacing('web-scss', path)).toBe(expected)
    expect(spacing('web-vw', path)).toBe(expected)
  })

  test('uses the base font size of the platform', () => {
    const tokens = fixture.tokens['web-px']
    const value = scssValue(tokens['font.context.jumbo'], lookupsIn(tokens), { basePxFontSize: 10 })
    expect(value).toContain('"letter-spacing": -0.05em')
  })
})

describe('errors', () => {
  test('name the token', () => {
    const tokens = structuredClone(fixture.tokens['web-px'])
    delete tokens['typography.fontSize.text.medium']
    expect(() => valueOf('web-px', 'typography.lineHeight.text.medium', tokens)).toThrow(
      'typography.lineHeight.text.medium: Tries to reference typography.fontSize.text.medium'
    )
  })
})

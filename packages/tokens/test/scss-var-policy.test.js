/**
 * @file scss-var-policy.test.js
 * @description Tests for the values of the SCSS variables format, using resolved tokens
 *              of the web-px, web-vw and web-scss presets and of web-px with
 *              outputReferences from the real build, and the matching values from their
 *              baselines in golden/.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { webValue } from '../build/css-var-policy.js'
import { scssValue } from '../build/scss-var-policy.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/scss-var-tokens.json', import.meta.url), 'utf8')
)

const REFERENCE = /\{([^{}]+)\}/g
const REFERENCES = 'web-px-references'
const settingsOf = (preset) => ({ basePxFontSize: 16, outputReferences: preset === REFERENCES })

/**
 * Token lookups over a set of tokens keyed by path, and variables by path.
 */
function lookupsIn(tokens, variables = {}) {
  const find = (path) => {
    if (!tokens[path]) throw new Error(`Tries to reference ${path}, which is not defined.`)
    return tokens[path]
  }
  return {
    token: (value) => {
      const [match] = typeof value === 'string' ? value.matchAll(REFERENCE) : []
      return match && find(match[1])
    },
    value: (value) => String(value).replace(REFERENCE, (_, path) => find(path).$value),
    variable: (path) => {
      const name = variables[path.join('.')]
      if (!name) throw new Error(`No file declares a variable for ${path.join('.')}`)
      return `$${name}`
    }
  }
}

const valueOf = (preset, path, tokens = fixture.tokens[preset]) =>
  scssValue(tokens[path], lookupsIn(tokens, fixture.variables[preset]), settingsOf(preset))

const resolvedCases = fixture.cases.filter(({ preset }) => preset !== REFERENCES)
const referenceCases = fixture.cases.filter(({ preset }) => preset === REFERENCES)

describe('scssValue on emitted tokens', () => {
  test.each(resolvedCases)('$preset, $group: $case ($token)', ({ preset, token, expected }) => {
    expect(valueOf(preset, token)).toBe(expected)
  })

  test('prints no reference', () => {
    for (const { preset, token } of resolvedCases) {
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

describe('scssValue with outputReferences', () => {
  const tokens = fixture.tokens[REFERENCES]
  const references = lookupsIn(tokens, fixture.variables[REFERENCES])
  const variant = (path, changes) => ({
    ...structuredClone(tokens[path]),
    ...changes,
    original: { ...tokens[path].original, ...changes.original }
  })
  const withReference = (reference) =>
    variant('space.accordion.medium-title-padding-y', { original: { $value: reference } })

  test.each(referenceCases)('$group: $case ($token)', ({ token, expected }) => {
    expect(valueOf(REFERENCES, token)).toBe(expected)
  })

  test('prints the variable where the Chassis CSS format prints a custom property', () => {
    for (const { group, token } of referenceCases.filter(({ group }) => group !== 'typography')) {
      const cssVar = webValue(tokens[token], references)
      const variable = valueOf(REFERENCES, token).startsWith('$')
      // Shadows print their value in the SCSS variables format
      const expected = cssVar.startsWith('var(--') && tokens[token].path[0] !== 'shadow'
      expect(variable, `${group}: ${token}`).toBe(expected)
    }
  })

  test('prints the value of a shadow that references a context shadow', () => {
    expect(webValue(tokens['shadow.alert.main'], references)).toBe('var(--box-shadow-lg)')
    expect(valueOf(REFERENCES, 'shadow.alert.main')).toBe(tokens['shadow.alert.main'].$value)
  })

  // No emitted token reaches these references today. The referenced tokens are real.
  test.each([
    ['{color.primitive.primary.10}', '$cx-color-primitive-primary-10'],
    ['{space.context.small}', '$cx-space-context-small'],
    ['{opacity.context.fg-subtle}', '$cx-opacity-context-fg-subtle'],
    ['{opacity.level.40}', '$cx-opacity-level-40'],
    ['{borderRadius.base.context.large}', '$cx-border-radius-context-large']
  ])('%s prints %s', (reference, expected) => {
    expect(tokens[reference.slice(1, -1)]).toBeDefined()
    expect(scssValue(withReference(reference), references, settingsOf(REFERENCES))).toBe(expected)
  })

  test('throws when no file declares the variable', () => {
    const token = variant('color.accordion.item-fg-color', {
      original: { $value: '{color.context.default.fg-missing}' }
    })
    expect(() => scssValue(token, references, settingsOf(REFERENCES))).toThrow(
      'color.accordion.item-fg-color: No file declares a variable for color.context.default.fg-missing'
    )
  })

  test('throws when no file declares a typography variable', () => {
    const variables = { ...fixture.variables[REFERENCES] }
    delete variables['typography.fontWeight.text.mass.style']
    expect(() =>
      scssValue(tokens['font.context.jumbo'], lookupsIn(tokens, variables), settingsOf(REFERENCES))
    ).toThrow(
      'font.context.jumbo: No file declares a variable for typography.fontWeight.text.mass.style'
    )
  })

  test('names every typography part after a token', () => {
    const map = valueOf(REFERENCES, 'font.button.medium')
    for (const part of ['font-family', 'font-weight', 'font-size', 'line-height', 'font-style']) {
      expect(map).toMatch(new RegExp(`"${part}": \\$cx-typography-`))
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

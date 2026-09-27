/**
 * @file css-var-policy.test.js
 * @description Tests for the web reference policy, using resolved tokens from the real
 *              build and the matching values from the committed dist/.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  MAX_HOPS,
  abbreviateScale,
  customProperties,
  customProperty,
  isReference,
  printsReference,
  referencePath,
  webValue
} from '../css-var-policy.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/css-var-tokens.json', import.meta.url), 'utf8')
)

const REFERENCE = /\{([^{}]+)\}/g

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

const references = lookupsIn(fixture.tokens)
const casesIn = (group) => fixture.cases.filter((item) => item.group === group)

/**
 * A token that is not in the current token sets, built from a real one.
 */
function variant(path, changes) {
  const token = structuredClone(fixture.tokens[path])
  return { ...token, ...changes, original: { ...token.original, ...changes.original } }
}

describe('webValue on emitted tokens', () => {
  test.each(fixture.cases)('$group: $case ($token)', ({ token, expected }) => {
    expect(webValue(fixture.tokens[token], references)).toBe(expected)
  })

  test('does not change the token', () => {
    for (const { token } of fixture.cases) {
      const before = structuredClone(fixture.tokens[token])
      webValue(fixture.tokens[token], references)
      expect(fixture.tokens[token]).toEqual(before)
    }
  })
})

describe('printsReference', () => {
  test.each([...casesIn('table'), ...casesIn('follow'), ...casesIn('literal')])(
    'true for $token',
    ({ token }) => {
      expect(printsReference(fixture.tokens[token])).toBe(true)
    }
  )

  test.each([...casesIn('exception'), ...casesIn('typography'), ...casesIn('encode')])(
    'false for $token',
    ({ token }) => {
      expect(printsReference(fixture.tokens[token])).toBe(false)
    }
  )

  test.each(['idle', 'hover', 'press', 'disabled', 'focus', 'highlight'])(
    'false for the shadow state %s',
    (state) => {
      const token = variant('shadow.alert.main', { path: ['shadow', 'button', state] })
      expect(printsReference(token)).toBe(false)
    }
  )

  test('true for a shadow state name outside path[2]', () => {
    const token = variant('shadow.alert.main', { path: ['shadow', 'hover', 'main'] })
    expect(printsReference(token)).toBe(true)
  })

  test('false outside the referencing groups', () => {
    const token = variant('space.context.zero', { path: ['size', 'context', 'zero'] })
    expect(printsReference(token)).toBe(false)
  })
})

describe('customProperty', () => {
  test.each(casesIn('literal'))('none for $case ($token)', ({ token }) => {
    expect(customProperty(fixture.tokens[token], references)).toBeUndefined()
  })

  // No emitted token reaches these rows today. The referenced tokens are real.
  test.each([
    ['color.primitive', '{color.primitive.primary.10}', 'var(--primary-10)'],
    ['space.context', '{space.context.small}', 'var(--space-small)'],
    ['opacity.context', '{opacity.context.fg-subtle}', 'var(--opacity-fg-subtle)'],
    ['opacity.level', '{opacity.level.40}', 'var(--opacity-40)'],
    ['borderRadius.base.context', '{borderRadius.base.context.large}', 'var(--border-radius-lg)'],
    ['borderRadius.base.context', '{borderRadius.base.context.full}', 'var(--border-radius-full)']
  ])('%s: %s', (row, reference, expected) => {
    expect(fixture.tokens[reference.slice(1, -1)]).toBeDefined()
    expect(customProperties.map((item) => item.reference)).toContain(row)

    const token = variant('space.accordion.medium-title-padding-y', {
      original: { $value: reference }
    })
    expect(customProperty(token, references)).toBe(expected)
  })

  test('has the rows of the output contract', () => {
    expect(customProperties.map((item) => item.reference)).toEqual([
      'color.context',
      'color.primitive',
      'space.context',
      'opacity.context',
      'opacity.level',
      'shadow.context',
      'borderRadius.context',
      'borderRadius.base.context',
      'borderWidth.context',
      'borderWidth.base.context'
    ])
  })

  // The current token sets have no borderWidth.base tokens.
  describe('borderWidth.base', () => {
    const tokens = {
      'borderWidth.base.context.medium': variant('borderRadius.base.context.medium', {
        path: ['borderWidth', 'base', 'context', 'medium']
      }),
      'borderWidth.base.button.main': variant('borderRadius.base.alert.main', {
        path: ['borderWidth', 'base', 'button', 'main'],
        original: { $value: '{borderWidth.base.context.medium}' }
      })
    }

    test('names a direct base.context reference', () => {
      const token = variant('borderWidth.accordion.main', {
        original: { $value: '{borderWidth.base.context.medium}' }
      })
      expect(customProperty(token, lookupsIn(tokens))).toBe('var(--border-width-md)')
    })

    test('follows a base component to its context token', () => {
      const token = variant('borderWidth.accordion.main', {
        original: { $value: '{borderWidth.base.button.main}' }
      })
      expect(customProperty(token, lookupsIn(tokens))).toBe('var(--border-width-md)')
    })
  })

  describe('follow', () => {
    const follower = (tokens) =>
      customProperty(fixture.tokens['borderRadius.alert.main'], lookupsIn(tokens))
    const base = fixture.tokens['borderRadius.base.alert.main']

    test('reads one reference past its own', () => {
      expect(MAX_HOPS).toBe(1)
    })

    test('accepts a context token outside base', () => {
      const target = variant(base.path.join('.'), {
        original: { $value: '{borderRadius.context.large}' }
      })
      expect(follower({ 'borderRadius.base.alert.main': target })).toBe('var(--border-radius-lg)')
    })

    test('stops after one hop', () => {
      const tokens = {
        'borderRadius.base.alert.main': variant(base.path.join('.'), {
          original: { $value: '{borderRadius.base.card.main}' }
        }),
        'borderRadius.base.card.main': variant(base.path.join('.'), {
          path: ['borderRadius', 'base', 'card', 'main']
        })
      }
      expect(follower(tokens)).toBeUndefined()
    })

    test('ignores a context token of another group', () => {
      const target = variant(base.path.join('.'), {
        original: { $value: '{borderWidth.context.medium}' }
      })
      expect(follower({ 'borderRadius.base.alert.main': target })).toBeUndefined()
    })

    test('ignores a base token with a literal value', () => {
      const target = variant(base.path.join('.'), { original: { $value: '8' } })
      expect(follower({ 'borderRadius.base.alert.main': target })).toBeUndefined()
    })

    test('ignores a base token that is not in the token set', () => {
      expect(follower({})).toBeUndefined()
    })

    test('throws when the token references itself', () => {
      const token = variant('borderRadius.alert.main', {
        path: ['borderRadius', 'base', 'alert', 'main'],
        original: { $value: '{borderRadius.base.alert.main}' }
      })
      expect(() => customProperty(token, references)).toThrow(
        'Circular reference: borderRadius.base.alert.main → borderRadius.base.alert.main'
      )
    })

    test('throws when the referenced token points back', () => {
      const target = variant(base.path.join('.'), {
        original: { $value: '{borderRadius.alert.main}' }
      })
      expect(() => follower({ 'borderRadius.base.alert.main': target })).toThrow(
        'Circular reference: borderRadius.alert.main → borderRadius.base.alert.main → borderRadius.alert.main'
      )
    })
  })
})

describe('typography', () => {
  const jumbo = fixture.tokens['font.context.jumbo']
  const withOriginal = (part, value) =>
    variant('font.context.jumbo', {
      original: { $value: { ...jumbo.original.$value, [part]: value } }
    })

  test('prints a literal line height that is not a percentage as it is', () => {
    expect(webValue(withOriginal('lineHeight', '1.5'), references)).toContain(
      '"line-height": 1.5, '
    )
  })

  test('prints the value of a line height reference to another type', () => {
    expect(webValue(withOriginal('lineHeight', '{size.unit.96}'), references)).toContain(
      '"line-height": 6rem, '
    )
  })

  test('throws on a literal font size', () => {
    expect(() => webValue(withOriginal('fontSize', '96'), references)).toThrow(
      'font.context.jumbo: fontSize does not reference a token: "96"'
    )
  })

  test('throws on a literal font family', () => {
    expect(() => webValue(withOriginal('fontFamily', 'Inter'), references)).toThrow(
      'font.context.jumbo: Not a single reference: "Inter"'
    )
  })

  test('throws on a literal font weight', () => {
    const token = variant('font.context.jumbo', { original: { $extensions: {} } })
    expect(() => webValue(token, references)).toThrow(
      'font.context.jumbo: fontWeight does not reference a token: "Bold"'
    )
  })

  test('throws on a reference that is not font.<family>.<size>.<weight>', () => {
    const token = variant('font.button.medium', { original: { $value: '{font.context.lead}' } })
    expect(() => webValue(token, references)).toThrow(
      'font.button.medium: Not a font.<family>.<size>.<weight> reference: {font.context.lead}'
    )
  })
})

describe('references', () => {
  test('isReference accepts a single reference only', () => {
    expect(isReference('{space.context.small}')).toBe(true)
    expect(isReference('rgba({color.base.black}, {opacity.level.10})')).toBe(false)
    expect(isReference('{size.unit.4} * 2')).toBe(false)
    expect(isReference('16')).toBe(false)
    expect(isReference({ fontSize: '{size.unit.96}' })).toBe(false)
    expect(isReference(undefined)).toBe(false)
  })

  test('referencePath splits a reference', () => {
    expect(referencePath('{font.text.medium.strong}')).toEqual(['font', 'text', 'medium', 'strong'])
  })

  test('referencePath throws on anything else', () => {
    expect(() => referencePath('{size.unit.4} * 2')).toThrow(
      'Not a single reference: "{size.unit.4} * 2"'
    )
  })
})

describe('abbreviateScale', () => {
  test.each([
    ['4xsmall', '4xs'],
    ['3xsmall', '3xs'],
    ['2xsmall', '2xs'],
    ['xsmall', 'xs'],
    ['small', 'sm'],
    ['medium', 'md'],
    ['large', 'lg'],
    ['xlarge', 'xl'],
    ['2xlarge', '2xl'],
    ['3xlarge', '3xl'],
    ['4xlarge', '4xl'],
    ['5xlarge', '5xl'],
    ['6xlarge', '6xl']
  ])('%s becomes %s', (name, expected) => {
    expect(abbreviateScale(name)).toBe(expected)
  })

  test.each(['zero', 'full', 'h1', 'body', 'hero-title', 'context'])(
    '%s passes through',
    (name) => {
      expect(abbreviateScale(name)).toBe(name)
    }
  )
})

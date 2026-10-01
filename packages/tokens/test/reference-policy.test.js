/**
 * @file reference-policy.test.js
 * @description Tests for the rules shared by the web reference policies, using resolved
 *              tokens from the real build. The policies' own tests cover the names they
 *              print and the follow in detail.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { referencingGroups as cssVarGroups } from '../build/css-var-policy.js'
import {
  followedGroups,
  isReference,
  printsReference,
  referencePath,
  referenceTarget,
  referenceTargets,
  startsWith
} from '../build/reference-policy.js'
import { referencingGroups as scssVarGroups } from '../build/scss-var-policy.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/css-var-tokens.json', import.meta.url), 'utf8')
)

const REFERENCE = /\{([^{}]+)\}/g
const references = {
  token: (value) => {
    const [match] = typeof value === 'string' ? value.matchAll(REFERENCE) : []
    if (match && !fixture.tokens[match[1]]) {
      throw new Error(`Tries to reference ${match[1]}, which is not defined.`)
    }
    return match && fixture.tokens[match[1]]
  },
  value: (value) => value
}

/**
 * A token of the accordion that references `reference`.
 */
const referencing = (reference, path = ['space', 'accordion', 'medium-title-padding-y']) => ({
  ...fixture.tokens['space.accordion.medium-title-padding-y'],
  path,
  original: { $value: reference }
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

  test('startsWith compares whole segments', () => {
    expect(startsWith(['color', 'context', 'default'], 'color.context')).toBe(true)
    expect(startsWith(['color', 'contexts', 'default'], 'color.context')).toBe(false)
    expect(startsWith(['color'], 'color.context')).toBe(false)
  })
})

describe('printsReference', () => {
  const shadow = fixture.tokens['shadow.alert.main']
  const color = fixture.tokens['color.accordion.item-fg-color']

  test('the SCSS variables format leaves shadows out, as before the rewrite', () => {
    expect(cssVarGroups.filter((group) => !scssVarGroups.includes(group))).toEqual(['shadow'])
    expect(printsReference(shadow, cssVarGroups)).toBe(true)
    expect(printsReference(shadow, scssVarGroups)).toBe(false)
  })

  test('uses the groups it is given', () => {
    expect(printsReference(color, cssVarGroups)).toBe(true)
    expect(printsReference(color, ['space'])).toBe(false)
  })
})

describe('referenceTarget', () => {
  test.each([
    ['color.accordion.item-fg-color', ['color', 'context', 'default', 'fg-main']],
    ['borderRadius.accordion.main', ['borderRadius', 'context', 'medium']],
    ['borderWidth.accordion.main', ['borderWidth', 'context', 'medium']],
    ['shadow.alert.main', ['shadow', 'context', 'large']]
  ])('%s names the token it references', (path, expected) => {
    expect(referenceTarget(fixture.tokens[path], references)).toEqual(expected)
  })

  test.each([
    ['borderRadius.alert.main', ['borderRadius', 'context', 'large']],
    ['borderRadius.badge.medium', ['borderRadius', 'context', 'full']]
  ])('%s follows its base component token to a context step', (path, expected) => {
    expect(fixture.tokens[path].original.$value).toMatch(/^\{borderRadius\.base\./)
    expect(referenceTarget(fixture.tokens[path], references)).toEqual(expected)
  })

  test.each(followedGroups.map((group) => [group, group]))(
    '%s.base.context.<step> names %s.context.<step>',
    (group) => {
      const token = referencing(`{${group}.base.context.large}`)
      expect(referenceTarget(token, references)).toEqual([group, 'context', 'large'])
    }
  )

  test.each(casesOf('literal'))('none for $case ($token)', ({ token }) => {
    expect(referenceTarget(fixture.tokens[token], references)).toBeUndefined()
  })

  test('the targets are context and primitive groups', () => {
    expect(referenceTargets).toEqual([
      'color.context',
      'color.primitive',
      'space.context',
      'opacity.context',
      'opacity.level',
      'shadow.context',
      'borderRadius.context',
      'borderWidth.context'
    ])
  })
})

function casesOf(group) {
  return fixture.cases.filter((item) => item.group === group)
}

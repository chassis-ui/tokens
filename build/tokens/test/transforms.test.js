/**
 * @file transforms.test.js
 * @description Tests for the custom value transforms, using resolved tokens and values
 *              from the real build.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import web from '../config/web.js'
import registerTransforms, { transforms } from '../transforms.js'

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))
const webTokens = read('./fixtures/web-tokens.json')
const filterTokens = read('./fixtures/filter-tokens.json')

const transform = (name) => transforms.find((item) => item.name === name)
const platform = web('chassis', 'docs')
const typesMatching = (name) =>
  [...new Set(filterTokens.cases.map(({ token }) => token.$type))]
    .filter((type) => transform(name).filter({ $type: type }))
    .sort()

describe('cx/size/rem', () => {
  test('applies to the size types', () => {
    expect(typesMatching('cx/size/rem')).toEqual(['dimension', 'fontSize', 'lineHeight'])
  })

  test.each(webTokens.remSize)('$case ($token.name)', ({ token, expected }) => {
    expect(transform('cx/size/rem').transform(token, platform)).toBe(expected)
  })
})

describe('cx/shadow/web', () => {
  test('applies to shadow tokens', () => {
    expect(typesMatching('cx/shadow/web')).toEqual(['shadow'])
  })

  test.each(webTokens.cssShadow)('$case', ({ value, expected }) => {
    expect(transform('cx/shadow/web').transform({ $value: value }, platform)).toBe(expected)
  })
})

describe('transforms', () => {
  test('are the custom transforms the web config uses', () => {
    const custom = platform.transforms.filter((name) => name.startsWith('cx/'))
    expect(transforms.map((item) => item.name).sort()).toEqual(custom.sort())
  })

  test('also apply to tokens whose value is a reference', () => {
    for (const item of transforms) {
      expect(item).toMatchObject({ type: 'value', transitive: true })
    }
  })

  test('are registered as defined', () => {
    const registered = []
    registerTransforms({ registerTransform: (item) => registered.push(item) })
    expect(registered).toEqual(transforms)
  })
})

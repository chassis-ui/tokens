/**
 * @file transforms.test.js
 * @description Tests for the custom value transforms, using resolved tokens and values
 *              from the real build.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { checkAndEvaluateMath } from '@tokens-studio/sd-transforms'
import { describe, expect, test } from 'vitest'
import web, { MATH_FRACTION_DIGITS } from '../build/config/web.js'
import webPx from '../build/config/web-px.js'
import webVw from '../build/config/web-vw.js'
import registerTransforms, { transforms } from '../build/transforms.js'

const read = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'))
const webTokens = read('./fixtures/web-tokens.json')
const filterTokens = read('./fixtures/filter-tokens.json')

const transform = (name) => transforms.find((item) => item.name === name)
const platform = web('chassis', 'docs', [])
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

describe.each(['cx/size/px', 'cx/size/vw'])('%s', (name) => {
  test('applies to the size types', () => {
    expect(typesMatching(name)).toEqual(['dimension', 'fontSize', 'lineHeight'])
  })
})

describe('cx/size/px', () => {
  test.each(webTokens.remSize)('$case ($token.name)', ({ token }) => {
    const px = transform('cx/size/px').transform(token, webPx('chassis', 'docs', []))
    expect(px).toBe(`${parseFloat(token.$value)}px`)
  })
})

describe('cx/size/vw', () => {
  test.each(webTokens.remSize)('$case ($token.name)', ({ token, expected }) => {
    const vw = transform('cx/size/vw').transform(token, webVw('chassis', 'docs', []))
    expect(vw).toBe(expected.replaceAll('rem', 'vw'))
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

describe('ts/resolveMath on the web', () => {
  const resolveMath = (config, $value) =>
    checkAndEvaluateMath({ $value, $type: 'dimension' }, config.mathFractionDigits)

  test('keeps a size that references another size exact', () => {
    // Without the option, sd-transforms rounds to four decimals
    expect(resolveMath({}, '0.03125rem')).toBe('0.0313rem')
    for (const config of [web, webPx, webVw]) {
      const platform = config('chassis', 'docs', [])
      expect(platform.mathFractionDigits).toBe(MATH_FRACTION_DIGITS)
      expect(resolveMath(platform, '0.03125rem')).toBe('0.03125rem')
      expect(resolveMath(platform, '-0.15625rem')).toBe('-0.15625rem')
    }
  })

  test('drops the floating-point noise of the math', () => {
    expect(resolveMath(platform, '0.1rem*3')).toBe('0.3rem')
  })

  test('prints a size and a size that references it alike in the committed main.scss', () => {
    const main = readFileSync(
      new URL('../dist/web/docs/chassis/main.scss', import.meta.url),
      'utf8'
    )
    const value = (name) => main.match(new RegExp(`^\\$cx-${name}: (.+) !default;$`, 'm'))[1]
    expect(value('dimension-base-05')).toBe('0.03125rem')
    expect(value('size-unit-05')).toBe('0.03125rem')
    expect(value('size-unit-nd25')).toBe(value('dimension-base-nd25'))
  })
})

describe('transforms', () => {
  test('are the custom transforms the web configs use', () => {
    const custom = [web, webPx, webVw]
      .flatMap((config) => config('chassis', 'docs', []).transforms)
      .filter((name) => name.startsWith('cx/'))
    expect(transforms.map((item) => item.name).sort()).toEqual([...new Set(custom)].sort())
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

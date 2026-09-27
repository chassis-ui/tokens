/**
 * @file filters.test.js
 * @description Tests for the file filters, using resolved tokens from the real build and
 *              which files of the committed dist/ declare them.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import registerFilters, { filters } from '../build/filters.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/filter-tokens.json', import.meta.url), 'utf8')
)

describe('filters', () => {
  test.each(fixture.cases)('$token.name ($token.$type)', ({ token, files }) => {
    const matching = Object.keys(filters).filter((name) => filters[name](token))
    expect(matching).toEqual(files)
  })

  test('emit every size in the main and number files, whatever its path', () => {
    const { token } = fixture.cases.find((c) => c.token.path.join('.') === 'dimension.base.0')
    for (const path of [token.path, ['size', 'dimension', 'large']]) {
      expect(filters['cx/allTokens']({ ...token, path })).toBe(true)
      expect(filters['cx/numberTokens']({ ...token, path })).toBe(true)
    }
  })

  test('are the four filters the configs use', () => {
    const configs = ['web', 'ios', 'android'].map((platform) =>
      readFileSync(new URL(`../build/config/${platform}.js`, import.meta.url), 'utf8')
    )
    const used = new Set(configs.flatMap((text) => text.match(/cx\/\w+Tokens/g)))
    expect(Object.keys(filters).sort()).toEqual([...used].sort())
  })

  test('are registered by name', () => {
    const registered = []
    registerFilters({ registerFilter: (filter) => registered.push(filter) })
    expect(registered).toEqual(Object.entries(filters).map(([name, filter]) => ({ name, filter })))
  })
})

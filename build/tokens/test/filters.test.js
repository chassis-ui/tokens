/**
 * @file filters.test.js
 * @description Test suite for token filter functions
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

describe('Token Filters', () => {
  let filtersModule
  let mockStyleDictionary

  beforeEach(async () => {
    mockStyleDictionary = {
      registerFilter: vi.fn()
    }
    filtersModule = await import('../filters.js')
  })

  describe('Filter Registration', () => {
    test('should register all filters with StyleDictionary', () => {
      filtersModule.default(mockStyleDictionary)

      expect(mockStyleDictionary.registerFilter).toHaveBeenCalledTimes(5)

      const registeredFilters = mockStyleDictionary.registerFilter.mock.calls.map(
        (call) => call[0].name
      )

      expect(registeredFilters).toContain('cx/allTokens')
      expect(registeredFilters).toContain('cx/colorTokens')
      expect(registeredFilters).toContain('cx/themeTokens')
      expect(registeredFilters).toContain('cx/numberTokens')
      expect(registeredFilters).toContain('cx/stringTokens')
    })
  })

  describe('Color Filter', () => {
    test('should filter color tokens', () => {
      filtersModule.default(mockStyleDictionary)

      const colorFilterCall = mockStyleDictionary.registerFilter.mock.calls.find(
        (call) => call[0].name === 'cx/colorTokens'
      )
      const filterFn = colorFilterCall[0].filter

      expect(filterFn({ $type: 'color', path: ['theme', 'primary'] })).toBe(true)
      expect(filterFn({ $type: 'color', path: ['theme', 'palette'] })).toBe(false)
      expect(filterFn({ $type: 'number', path: ['spacing', 'small'] })).toBe(false)
    })
  })

  describe('Theme Filter', () => {
    test('should filter theme tokens', () => {
      filtersModule.default(mockStyleDictionary)

      const themeFilterCall = mockStyleDictionary.registerFilter.mock.calls.find(
        (call) => call[0].name === 'cx/themeTokens'
      )
      const filterFn = themeFilterCall[0].filter

      expect(filterFn({ $type: 'color', path: ['theme', 'primary'] })).toBe(true)
      expect(filterFn({ $type: 'color', path: ['theme', 'base'] })).toBe(false)
      expect(filterFn({ $type: 'number', path: ['spacing', 'small'] })).toBe(false)
    })
  })

  describe('Number Filter', () => {
    test('should filter number tokens', () => {
      filtersModule.default(mockStyleDictionary)

      const numberFilterCall = mockStyleDictionary.registerFilter.mock.calls.find(
        (call) => call[0].name === 'cx/numberTokens'
      )
      const filterFn = numberFilterCall[0].filter

      expect(filterFn({ $type: 'number', path: ['spacing'] })).toBe(true)
      expect(filterFn({ $type: 'dimension', path: ['theme', 'size'] })).toBe(true)
      expect(filterFn({ $type: 'dimension', path: ['theme', 'dimension'] })).toBe(false)
      expect(filterFn({ $type: 'color', path: ['theme', 'primary'] })).toBe(false)
    })
  })

  describe('String Filter', () => {
    test('should filter string tokens', () => {
      filtersModule.default(mockStyleDictionary)

      const stringFilterCall = mockStyleDictionary.registerFilter.mock.calls.find(
        (call) => call[0].name === 'cx/stringTokens'
      )
      const filterFn = stringFilterCall[0].filter

      expect(filterFn({ $type: 'string', path: ['content'] })).toBe(true)
      expect(filterFn({ $type: 'fontFamily', path: ['typography'] })).toBe(true)
      expect(filterFn({ $type: 'color', path: ['theme'] })).toBe(false)
    })
  })

  describe('All Tokens Filter', () => {
    test('should pass most token types', () => {
      filtersModule.default(mockStyleDictionary)

      const allFilterCall = mockStyleDictionary.registerFilter.mock.calls.find(
        (call) => call[0].name === 'cx/allTokens'
      )
      const filterFn = allFilterCall[0].filter

      expect(filterFn({ $type: 'color', path: ['theme', 'primary'] })).toBe(true)
      expect(filterFn({ $type: 'number', path: ['spacing'] })).toBe(true)
      expect(filterFn({ $type: 'string', path: ['content'] })).toBe(true)
      expect(filterFn({ $type: 'fontFamily', path: ['typography'] })).toBe(true)
    })
  })
})

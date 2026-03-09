/**
 * @file transforms.test.js
 * @description Test suite for custom token transformations
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

describe('Token Transforms', () => {
  let transformsModule
  let mockStyleDictionary

  beforeEach(async () => {
    mockStyleDictionary = {
      registerTransform: vi.fn()
    }
    transformsModule = await import('../transforms.js')
  })

  describe('Transform Registration', () => {
    test('should register all custom transforms', () => {
      transformsModule.default(mockStyleDictionary)

      const registeredTransforms = mockStyleDictionary.registerTransform.mock.calls.map(
        (call) => call[0].name
      )

      expect(registeredTransforms.length).toBeGreaterThan(0)
      expect(registeredTransforms).toBeTruthy()
    })

    test('should register transforms with required properties', () => {
      transformsModule.default(mockStyleDictionary)

      mockStyleDictionary.registerTransform.mock.calls.forEach((call) => {
        const transform = call[0]
        expect(transform).toHaveProperty('name')
        expect(transform).toHaveProperty('type')
        expect(transform).toHaveProperty('transform')
      })
    })
  })

  describe('Transform Function Signatures', () => {
    test('all transforms should have transform function', () => {
      transformsModule.default(mockStyleDictionary)

      mockStyleDictionary.registerTransform.mock.calls.forEach((call) => {
        const transform = call[0]
        expect(typeof transform.transform).toBe('function')
      })
    })
  })
})

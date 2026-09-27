/**
 * @file utils.test.js
 * @description Test suite for utility functions and constants
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach } from 'vitest'

describe('Utils Module', () => {
  let utilsModule

  beforeEach(async () => {
    utilsModule = await import('../utils.js')
  })

  describe('tokenTypes', () => {
    test('should define color token types', () => {
      expect(utilsModule.tokenTypes.color).toEqual(['color'])
    })

    test('should define font token types', () => {
      expect(utilsModule.tokenTypes.font).toContain('fontFamily')
      expect(utilsModule.tokenTypes.font).toContain('fontWeight')
      expect(utilsModule.tokenTypes.font).toContain('fontSize')
    })

    test('should define number token types', () => {
      expect(utilsModule.tokenTypes.number).toContain('number')
      expect(utilsModule.tokenTypes.number).toContain('opacity')
    })

    test('should define shadow token types', () => {
      expect(utilsModule.tokenTypes.shadow).toEqual(['shadow'])
    })

    test('should define string token types', () => {
      expect(utilsModule.tokenTypes.string).toContain('string')
      expect(utilsModule.tokenTypes.string).toContain('fontFamily')
    })

    test('should define gradient token types', () => {
      expect(utilsModule.tokenTypes.gradient).toEqual(['gradient'])
    })
  })
})

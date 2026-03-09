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

  describe('fontWeightMap', () => {
    test('should map font weight names to numeric values', () => {
      expect(utilsModule.fontWeightMap.thin).toBe(100)
      expect(utilsModule.fontWeightMap.extralight).toBe(200)
      expect(utilsModule.fontWeightMap.light).toBe(300)
      expect(utilsModule.fontWeightMap.regular).toBe(400)
      expect(utilsModule.fontWeightMap.medium).toBe(500)
      expect(utilsModule.fontWeightMap.semibold).toBe(600)
      expect(utilsModule.fontWeightMap.bold).toBe(700)
      expect(utilsModule.fontWeightMap.extrabold).toBe(800)
      expect(utilsModule.fontWeightMap.black).toBe(900)
    })

    test('should include alternative font weight names', () => {
      expect(utilsModule.fontWeightMap.normal).toBe(400)
      expect(utilsModule.fontWeightMap.demibold).toBe(600)
      expect(utilsModule.fontWeightMap.ultrabold).toBe(800)
    })
  })

  describe('getFontWeight', () => {
    test('should return numeric value for named font weights', () => {
      expect(utilsModule.getFontWeight('regular')).toBe(400)
      expect(utilsModule.getFontWeight('bold')).toBe(700)
      expect(utilsModule.getFontWeight('light')).toBe(300)
    })

    test('should return numeric value as-is', () => {
      expect(utilsModule.getFontWeight(500)).toBe(500)
      expect(utilsModule.getFontWeight(700)).toBe(700)
    })

    test('should handle case-insensitive font weight names', () => {
      expect(utilsModule.getFontWeight('Bold')).toBe(700)
      expect(utilsModule.getFontWeight('REGULAR')).toBe(400)
    })

    test('should return 400 for unknown font weight names', () => {
      expect(utilsModule.getFontWeight('unknown')).toBe(400)
    })

    test('should strip italic/oblique from font weight strings', () => {
      expect(utilsModule.getFontWeight('bold italic')).toBe(700)
      expect(utilsModule.getFontWeight('regular oblique')).toBe(400)
    })
  })

  describe('getFontStyle', () => {
    test('should return italicfor italic font style', () => {
      expect(utilsModule.getFontStyle('italic')).toBe('italic')
      expect(utilsModule.getFontStyle('Italic')).toBe('italic')
      expect(utilsModule.getFontStyle('Bold Italic')).toBe('italic')
    })

    test('should return oblique for oblique font style', () => {
      expect(utilsModule.getFontStyle('oblique')).toBe('oblique')
      expect(utilsModule.getFontStyle('Bold Oblique')).toBe('oblique')
    })

    test('should return normal for regular font style', () => {
      expect(utilsModule.getFontStyle('regular')).toBe('normal')
      expect(utilsModule.getFontStyle('Regular')).toBe('normal')
      expect(utilsModule.getFontStyle('bold')).toBe('normal')
    })

    test('should handle empty or undefined values', () => {
      expect(utilsModule.getFontStyle('')).toBe('normal')
      expect(utilsModule.getFontStyle(undefined)).toBe('normal')
      expect(utilsModule.getFontStyle(null)).toBe('normal')
    })
  })
})

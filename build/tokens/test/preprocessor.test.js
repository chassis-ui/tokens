/**
 * @file preprocessor.test.js
 * @description Test suite for token preprocessing functions
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach } from 'vitest'

describe('Token Preprocessor', () => {
  let preprocessorModule

  beforeEach(async () => {
    preprocessorModule = await import('../preprocessor.js')
  })

  describe('Module Structure', () => {
    test('should export a default function', () => {
      expect(typeof preprocessorModule.default).toBe('function')
    })

    test('should process dictionary without errors', () => {
      const dictionary = {
        tokens: {
          color: {
            primary: {
              $type: 'color',
              $value: '#FF0000'
            }
          }
        }
      }

      expect(() => preprocessorModule.default(dictionary)).not.toThrow()
    })

    test('should return a dictionary object', () => {
      const dictionary = {
        tokens: {
          spacing: {
            small: {
              $type: 'dimension',
              $value: '8px'
            }
          }
        }
      }

      const result = preprocessorModule.default(dictionary)
      expect(result).toHaveProperty('tokens')
    })
  })

  describe('Token Processing', () => {
    test('should handle nested token structures', () => {
      const dictionary = {
        tokens: {
          colors: {
            brand: {
              primary: {
                $type: 'color',
                $value: '#FF0000'
              }
            }
          }
        }
      }

      const result = preprocessorModule.default(dictionary)
      expect(result.tokens.colors.brand.primary).toBeDefined()
    })

    test('should preserve token types', () => {
      const dictionary = {
        tokens: {
          color: {
            primary: {
              $type: 'color',
              $value: '#FF0000'
            }
          },
          spacing: {
            small: {
              $type: 'dimension',
              $value: '8px'
            }
          }
        }
      }

      const result = preprocessorModule.default(dictionary)
      expect(result.tokens.color.primary.$type).toBe('color')
      expect(result.tokens.spacing.small.$type).toBe('dimension')
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty dictionary', () => {
      const dictionary = { tokens: {} }
      const result = preprocessorModule.default(dictionary)
      expect(result.tokens).toEqual({})
    })

    test('should handle dictionary with missing tokens', () => {
      const dictionary = {}
      expect(() => preprocessorModule.default(dictionary)).not.toThrow()
    })

    test('should preserve token references', () => {
      const dictionary = {
        tokens: {
          primary: {
            $type: 'color',
            $value: '#FF0000'
          },
          accent: {
            $type: 'color',
            $value: '{primary}'
          }
        }
      }

      const result = preprocessorModule.default(dictionary)
      expect(result.tokens.accent.$value).toBe('{primary}')
    })
  })
})

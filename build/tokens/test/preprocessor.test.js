/**
 * @file preprocessor.test.js
 * @description Test suite for token preprocessing functions
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, test, expect, beforeEach } from 'vitest'
import preprocess from '../preprocessor.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/preprocessor-tokens.json', import.meta.url), 'utf8')
)

/**
 * Lists the tokens of a dictionary in key order.
 */
function flatten(slice, path = []) {
  if (Object.hasOwn(slice, '$value')) return [{ ...slice, path }]
  return Object.entries(slice).flatMap(([key, value]) => flatten(value, [...path, key]))
}

describe('Chassis extensions on real tokens', () => {
  const tokens = flatten(preprocess(fixture.tokens))
  const find = (path) => tokens.find((token) => token.path.join('.') === path)

  test('stores the font weight path of a typography token as segments', () => {
    expect(find('font.context.jumbo').$extensions.chassis.fontWeightPath).toEqual([
      'typography',
      'fontWeight',
      'text',
      'mass'
    ])
    expect(find('font.context.lead').$extensions.chassis.fontWeightPath).toEqual([
      'typography',
      'fontWeight',
      'text',
      'normal'
    ])
  })

  test('leaves no reference in the extensions', () => {
    // Style Dictionary 5 resolves references in $extensions and rejects references to
    // groups, which the font weight paths are after the weight and style split.
    for (const token of tokens) {
      expect(JSON.stringify(token.$extensions ?? {})).not.toContain('{typography.')
    }
  })

  test('numbers the tokens in source order, after the weight and style split', () => {
    expect(
      tokens.map((token) => [token.path.join('.'), token.$extensions.chassis.sourceOrder])
    ).toEqual([
      ['typography.fontWeight.text.normal.weight', 0],
      ['typography.fontWeight.text.normal.style', 1],
      ['typography.fontWeight.text.strong.weight', 2],
      ['typography.fontWeight.text.strong.style', 3],
      ['typography.fontWeight.text.mass.weight', 4],
      ['typography.fontWeight.text.mass.style', 5],
      ['typography.fontWeight.text.elegant.weight', 6],
      ['typography.fontWeight.text.elegant.style', 7],
      ['typography.fontWeight.html.body.weight', 8],
      ['typography.fontWeight.html.body.style', 9],
      ['typography.fontWeight.html.blockquote.weight', 10],
      ['typography.fontWeight.html.blockquote.style', 11],
      ['font.context.jumbo', 12],
      ['font.context.lead', 13],
      ['shadow.context.small', 14]
    ])
  })

  test('keeps the other chassis extensions', () => {
    expect(find('shadow.context.small').$extensions.chassis).toEqual({
      originalType: 'boxShadow',
      sourceOrder: 14
    })
  })

  test('does not change its input', () => {
    const before = structuredClone(fixture.tokens)
    preprocess(fixture.tokens)
    expect(fixture.tokens).toEqual(before)
  })
})

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

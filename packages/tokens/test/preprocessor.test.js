/**
 * @file preprocessor.test.js
 * @description Test suite for token preprocessing functions
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, test, expect, beforeEach } from 'vitest'
import preprocess from '../build/preprocessor.js'

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
      ['typography.letterSpacing.base.zero', 12],
      ['font.context.jumbo', 13],
      ['font.context.lead', 14],
      ['shadow.context.small', 15],
      ['shadow.context.focus', 16],
      ['figma.website.variant.nav', 17]
    ])
  })

  test('keeps the original type that the type alignment stores', () => {
    expect(find('shadow.context.small').$extensions).toEqual({
      'studio.tokens': { originalType: 'boxShadow' },
      chassis: { sourceOrder: 15 }
    })
  })

  test('does not change its input', () => {
    const before = structuredClone(fixture.tokens)
    preprocess(fixture.tokens)
    expect(fixture.tokens).toEqual(before)
  })
})

describe('Types on real tokens', () => {
  const tokens = flatten(preprocess(fixture.tokens))
  const find = (path) => tokens.find((token) => token.path.join('.') === path)

  test.each([
    ['typography.letterSpacing.base.zero', 'number'],
    ['figma.website.variant.nav', 'content'],
    ['shadow.context.small', 'shadow'],
    ['font.context.jumbo', 'typography'],
    ['typography.fontWeight.text.mass.weight', 'fontWeight'],
    ['typography.fontWeight.text.mass.style', 'fontStyle']
  ])('%s is typed %s', (path, type) => {
    expect(find(path).$type).toBe(type)
  })

  test('renames the shadow offsets', () => {
    expect(Object.keys(find('shadow.context.focus').$value).sort()).toEqual([
      'blur',
      'color',
      'offsetX',
      'offsetY',
      'spread',
      'type'
    ])
  })
})

describe('Font styles on real tokens', () => {
  const tokens = flatten(preprocess(fixture.tokens))
  const value = (path) => tokens.find((token) => token.path.join('.') === path).$value

  test('splits a font weight that names no style', () => {
    expect(value('typography.fontWeight.text.strong.weight')).toBe('SemiBold')
    expect(value('typography.fontWeight.text.strong.style')).toBe('normal')
  })

  test('splits a font weight that names a style', () => {
    expect(value('typography.fontWeight.html.blockquote.weight')).toBe('Light')
    expect(value('typography.fontWeight.html.blockquote.style')).toBe('italic')
  })

  test('resolves a font weight that references another', () => {
    expect(value('typography.fontWeight.html.body.weight')).toBe('Regular')
    expect(value('typography.fontWeight.html.body.style')).toBe('normal')
  })

  test('adds the resolved weight and the style to typography tokens', () => {
    expect(value('font.context.jumbo')).toMatchObject({ fontWeight: 'Bold', fontStyle: 'normal' })
    expect(value('font.context.lead')).toMatchObject({ fontWeight: 'Regular', fontStyle: 'normal' })
  })

  test.each([
    ['Italic', 'Regular', 'italic'],
    ['Bold Oblique', 'Bold', 'oblique'],
    ['Semi Bold', 'Semi Bold', 'normal'],
    ['Normal', 'Regular', 'normal']
  ])('splits %s into %s and %s', (fontWeight, weight, style) => {
    const result = preprocess({
      typography: { fontWeight: { text: { mass: { $type: 'fontWeights', $value: fontWeight } } } }
    })
    expect(result.typography.fontWeight.text.mass.weight.$value).toBe(weight)
    expect(result.typography.fontWeight.text.mass.style.$value).toBe(style)
  })
})

describe('Token Preprocessor', () => {
  let preprocessorModule

  beforeEach(async () => {
    preprocessorModule = await import('../build/preprocessor.js')
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

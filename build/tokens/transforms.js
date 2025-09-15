/**
 * @file transforms.js
 * @description This file registers custom transforms for Style Dictionary. It includes
 *              transformations for size, shadow, typography, and other token types.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { tokenTypes } from './utils.js'

/**
 * Registers custom transforms for Style Dictionary.
 *
 * @param {Object} StyleDictionary - The Style Dictionary instance.
 */
export default function (StyleDictionary) {
  /**
   * Test transform to log font-related tokens.
   */
  StyleDictionary.registerTransform({
    name: 'cx/test',
    type: 'value',
    transitive: true,
    transform: token => {
      if (token.path[0] === 'font' && token.original.$extensions) {
        console.log(
          `${token.name 
          }: ${ 
            token.original.$extensions['chassis'].originalFontWeight}`
        )
      }
      return token.$value
    }
  })

  /**
   * Transform size tokens to px units.
   */
  StyleDictionary.registerTransform({
    name: 'cx/size/px',
    type: 'value',
    transitive: true,
    filter: token => tokenTypes.size.includes(token.$type),
    transform: function (token) {
      const values = String(token.$value).split(' ')
      return values
        .map(value => {
          if (value.endsWith('px')) return value
          let parsed = parseFloat(value)
          if (isNaN(parsed)) {
            throw new Error(
              `Invalid Number: '${token.name}: ${token.$value}' is not a valid number, cannot transform to 'px'.`
            )
          }
          return `${parsed  }px`
        })
        .join(' ')
    }
  })

  /**
   * Transform size tokens to rem units.
   */
  StyleDictionary.registerTransform({
    name: 'cx/size/rem',
    type: 'value',
    transitive: true,
    filter: token => tokenTypes.size.includes(token.$type),
    transform: function (token, config) {
      const values = String(token.$value).split(' ')
      return values
        .map(value => {
          if (value.endsWith('rem')) return value
          let parsed = parseFloat(value)
          if (isNaN(parsed)) {
            throw new Error(
              `Invalid Number: '${token.name}: ${token.$value}' is not a valid number, cannot transform to 'rem'.`
            )
          }
          return `${parsed / config.basePxFontSize  }rem`
        })
        .join(' ')
    }
  })

  /**
   * Transform size tokens to vw units.
   */
  StyleDictionary.registerTransform({
    name: 'cx/size/vw',
    type: 'value',
    transitive: true,
    filter: token => tokenTypes.size.includes(token.$type),
    transform: function (token, config) {
      const values = String(token.$value).split(' ')
      return values
        .map(value => {
          if (value.endsWith('vw')) return value
          let parsed = parseFloat(value)
          if (isNaN(parsed)) {
            throw new Error(
              `Invalid Number: '${token.name}: ${token.$value}' is not a valid number, cannot transform to 'vw'.`
            )
          }
          return `${parsed / config.basePxFontSize  }vw`
        })
        .join(' ')
    }
  })

  /**
   * Transform shadow tokens to CSS-compatible shadow values.
   */
  StyleDictionary.registerTransform({
    name: 'cx/shadow/web',
    type: 'value',
    transitive: true,
    filter: token => tokenTypes.shadow.includes(token.$type),
    transform: function (token) {
      if (typeof token.$value !== 'object') {
        return token.$value
      }
      const shadow = Array.isArray(token.$value) ? token.$value : [token.$value]
      const value = shadow.map(s => {
        const { offsetX, offsetY, blur, color, spread, type } = s
        return `${offsetX} ${offsetY} ${blur} ${spread} ${color}${
          type === 'innerShadow' ? ' inset' : ''
        }`
      })
      return `${value.join(', ')}`
    }
  })

  /**
   * Transform typography tokens to CSS-compatible typography values.
   */
  StyleDictionary.registerTransform({
    name: 'cx/typography/web',
    type: 'value',
    transitive: true,
    filter: token => tokenTypes.font.includes(token.$type),
    transform: function (token) {
      if (token.$type === 'typography' && typeof token.$value === 'object') {
        return (
          `(${ 
            [
              `"font-family": ${token.$value.fontFamily}`,
              `"font-weight": ${token.$value.fontWeight}`,
              `"font-size": ${token.$value.fontSize}`,
              `"font-style": ${token.$value.fontWeight}`,
              `"letter-spacing": ${token.$value.letterSpacing}`,
              `"line-height": ${token.$value.lineHeight}`,
              `"paragraph-spacing": ${token.$value.paragraphSpacing}`,
              `"text-transform": ${token.$value.textCase}`,
              `"text-decoration": ${token.$value.textDecoration}`
            ].join(', ') 
          })`
        )
      }
      return token.$value
    }
  })
}

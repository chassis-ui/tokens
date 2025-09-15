/**
 * @file filters.js
 * @description This file defines custom filters for Style Dictionary. These filters
 *              are used to include or exclude specific tokens based on their type
 *              or other properties during the build process.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { tokenTypes } from './utils.js'

/**
 * Registers custom filters with Style Dictionary.
 * @param {Object} StyleDictionary - The Style Dictionary instance.
 */
export default function (StyleDictionary) {
  /**
   * A filter to include all tokens except certain excluded types.
   */
  StyleDictionary.registerFilter({
    name: 'cx/allTokens',
    filter: token => {
      return (
        (tokenTypes.color.includes(token.$type) &&
          !['palette', 'context', 'utility'].includes(token.path[1])) ||
        tokenTypes.font.includes(token.$type) ||
        tokenTypes.gradient.includes(token.$type) ||
        tokenTypes.number.includes(token.$type) ||
        tokenTypes.shadow.includes(token.$type) ||
        (tokenTypes.size.includes(token.$type) &&
          token.path[1] !== 'dimension') ||
        tokenTypes.string.includes(token.$type)
      )
    }
  })

  /**
   * A filter to include only color tokens, excluding specific categories.
   */
  StyleDictionary.registerFilter({
    name: 'cx/colorTokens',
    filter: token => {
      return (
        tokenTypes.color.includes(token.$type) &&
        !['palette', 'context', 'utility'].includes(token.path[1])
      )
    }
  })

  /**
   * A filter to include only color tokens, excluding specific categories.
   */
  StyleDictionary.registerFilter({
    name: 'cx/themeTokens',
    filter: token => {
      return (
        tokenTypes.color.includes(token.$type) &&
        !['base', 'utility'].includes(token.path[1])
      )
    }
  })

  /**
   * A filter to include only number tokens and certain size tokens.
   */
  StyleDictionary.registerFilter({
    name: 'cx/numberTokens',
    filter: token => {
      return (
        tokenTypes.number.includes(token.$type) ||
        (tokenTypes.size.includes(token.$type) && token.path[1] !== 'dimension')
      )
    }
  })

  /**
   * A filter to include only string tokens.
   */
  StyleDictionary.registerFilter({
    name: 'cx/stringTokens',
    filter: token => {
      return tokenTypes.string.includes(token.$type)
    }
  })
}

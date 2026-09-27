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
 * The custom filters by name. The `path[1] !== 'dimension'` exclusion matches no current
 * token; it is kept because the output contract includes it.
 */
export const filters = {
  // Everything that goes into main: all emitted types, without base and theme colours.
  'cx/allTokens': (token) =>
    (tokenTypes.color.includes(token.$type) &&
      !['primitive', 'context', 'utility'].includes(token.path[1])) ||
    tokenTypes.font.includes(token.$type) ||
    tokenTypes.gradient.includes(token.$type) ||
    tokenTypes.number.includes(token.$type) ||
    tokenTypes.shadow.includes(token.$type) ||
    (tokenTypes.size.includes(token.$type) && token.path[1] !== 'dimension') ||
    tokenTypes.string.includes(token.$type),

  // Theme colours, without base and utility colours.
  'cx/themeTokens': (token) =>
    tokenTypes.color.includes(token.$type) && !['base', 'utility'].includes(token.path[1]),

  // Numbers and sizes, which change with the screen.
  'cx/numberTokens': (token) =>
    tokenTypes.number.includes(token.$type) ||
    (tokenTypes.size.includes(token.$type) && token.path[1] !== 'dimension'),

  // Strings, font names and assets.
  'cx/stringTokens': (token) => tokenTypes.string.includes(token.$type)
}

/**
 * Registers custom filters with Style Dictionary.
 * @param {Object} StyleDictionary - The Style Dictionary instance.
 */
export default function (StyleDictionary) {
  Object.entries(filters).forEach(([name, filter]) =>
    StyleDictionary.registerFilter({ name, filter })
  )
}

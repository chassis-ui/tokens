/**
 * @file android-resources.template.js
 * @description Template for generating Android resources XML files from design tokens.
 *              Maps tokens to Android resource types (e.g., dimen, color, string) and formats
 *              them into a valid XML structure.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { usesReferences, getReferences } from 'style-dictionary/utils'
import Color from 'tinycolor2'
import { tokenTypes } from '../utils.js'

/**
 * Generates an Android resources XML file from the provided tokens.
 *
 * @param {Object} opts - The options object containing the following properties:
 *   @param {Object} opts.file - The file object containing resourceType, resourceMap, and options.
 *   @param {string} opts.header - The header string to include at the top of the XML file.
 *   @param {Object} opts.dictionary - The dictionary object containing all tokens and helper methods.
 *   @param {Object} opts.options - Additional options for processing tokens.
 * @returns {string} - A string representing the Android resources XML file.
 */
export default (opts) => {
  const { dictionary, file, header, options } = opts

  const resourceType = file.resourceType || null

  const resourceMap = file.resourceMap || {
    size: 'dimen',
    color: 'color',
    string: 'string',
    content: 'string',
    time: 'integer',
    number: 'integer'
  }

  /**
   * Determines the Android resource type for a given token.
   *
   * @param {Object} token - The token object to determine the resource type for.
   * @returns {string} - The resource type (e.g., 'dimen', 'color', 'string', etc.).
   *                     Defaults to 'string' if no matching type is found.
   */
  function tokenToType(token) {
    if (resourceType) {
      return resourceType
    }
    if (token.$type === 'letterSpacing' || token.path[1] === 'letterSpacing') {
      return 'integer'
    }
    for (const tokenType of Object.keys(tokenTypes)) {
      if (tokenTypes[tokenType].includes(token.$type)) {
        if (resourceMap[tokenType]) {
          return resourceMap[tokenType]
        }
      }
    }
    return 'string'
  }

  /**
   * Converts a token to its corresponding value for Android resources.
   *
   * @param {Object} token - The token object to convert.
   * @param {Object} dictionary - The dictionary object containing all tokens and helper methods.
   * @param {Object} options - Additional options for processing tokens.
   * @returns {string} - The token value formatted for Android resources.
   *                     - For color tokens, returns a valid ARGB hex color string.
   *                     - For fontFamily tokens, returns the first font family without quotes.
   *                     - For fontWeight tokens, returns the weight in lowercase with spaces replaced by hyphens.
   *                     - For fontSize tokens, returns the size in 'sp' units.
   *                     - For size tokens, returns the size in 'dp' units.
   *                     - For unsupported or invalid tokens, returns the raw token value.
   *                     If the token references another token, it returns the reference in the format `@resourceType/resourceName`.
   */
  function tokenToValue(token, dictionary, options) {
    // Base colors should not be referenced
    const color_condition = !(token.$type === 'color' && token.path[1] === 'base')
    // Math operations should not be referenced
    const math_condition = !(
      tokenTypes.size.includes(token.$type) && !/^[+\-*/]?[^+*/]*$/.test(token.original.$value)
    )
    if (options.outputReferences && color_condition && math_condition) {
      const originalValue = token.original.$value
      if (usesReferences(originalValue)) {
        const ref = getReferences(originalValue, dictionary.tokens, {
          usesDtcg: true,
          warnImmediately: false
        })[0]
        if (ref) return `@${tokenToType(token, options)}/${ref.name}`
      }
    }
    if (token.path[0] === 'gradient') {
      // TODO: Implement gradient support
      // console.warn(
      //   `Gradient token not supported: ${token.path.join('.')} (${token.$value})`,
      // )
    }
    if (token.$type === 'color') {
      const color = Color(token.$value)
      if (color.isValid()) {
        const str = color.toHex8()
        return `#${str.slice(6)}${str.slice(0, 6)}`
      } else {
        console.warn(`Invalid color token: ${token.path.join('.')} (${token.$value})`)
        return token.$value
      }
    } else if (token.$type === 'fontFamily') {
      return `${token.$value.split(',')[0].trim().replace(/['"]/g, '')}` // Only take the first font family
    } else if (token.$type === 'fontWeight') {
      return `${token.$value.replace(' ', '-').toLowerCase()}` // Only take the first font family
    } else if (
      ['fontSize', 'lineHeight', 'paragraphSpacing'].includes(token.path[token.path.length - 1]) ||
      ['fontSize', 'lineHeight'].includes(token.$type) ||
      token.path[1] === 'paragraphSpacing'
    ) {
      return `${parseFloat(token.$value)}sp` // Only take the first font family
    } else if (
      tokenTypes.size.includes(token.$type) &&
      token.$type !== 'letterSpacing' &&
      token.path[1] !== 'letterSpacing'
    ) {
      return `${parseFloat(token.$value)}dp`
    }

    return token.$value
  }

  /**
   * Converts a token to a single line of XML for Android resources.
   *
   * @param {Object} token - The token object to convert.
   * @returns {string} - A string representing the token as an XML line.
   *                     Includes the resource type, name, value, and optional comment.
   */
  function tokenToLine(token) {
    return `<${tokenToType(token, options)} name="${token.name}">${tokenToValue(
      token,
      dictionary,
      options
    )}</${tokenToType(token, options)}>${token.comment ? ` <!-- ${token.comment} -->` : ''}`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>

${header}

<resources>
  ${dictionary.allTokens.map((token) => tokenToLine(token)).join(`\n  `)}
</resources>
`
}

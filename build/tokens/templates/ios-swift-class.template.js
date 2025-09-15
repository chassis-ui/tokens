/**
 * @file ios-swift-class.template.js
 * @description Template for generating Swift classes from design tokens.
 *              It processes tokens such as colors, font sizes, and other design properties
 *              and converts them into Swift code that can be used in iOS applications.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import Color from 'tinycolor2'
import { tokenTypes } from '../utils.js'

/**
 * Main export function to generate Swift class from design tokens.
 * @param {Object} opts - Options for generating the Swift class.
 * @param {Object} opts.dictionary - Token dictionary containing all tokens.
 * @param {Object} opts.file - File metadata including destination and class name.
 * @param {string} opts.header - Header comment for the generated file.
 * @param {Object} opts.options - Additional options for customization.
 * @returns {string} - Generated Swift class as a string.
 */
export default opts => {
  const { dictionary, file, header, options } = opts

  /**
   * Converts a token to its corresponding Swift value.
   * @param {Object} token - The token to convert.
   * @param {Object} dictionary - Token dictionary for reference.
   * @returns {string} - Swift representation of the token value.
   */
  function tokenToValue(token, dictionary) {
    if (token.path[0] === 'gradient') {
      // TODO: Implement gradient support
      // console.warn(
      //   `Gradient token not supported: ${token.path.join('.')} (${token.$value})`,
      // )
    }
    if (token.$type === 'color') {
      const color = Color(token.$value)
      if (color.isValid()) {
        token.$value = color.toHexString()
        const { r, g, b, a } = color.toRgb()
        const rFixed = (r / 255.0).toFixed(3)
        const gFixed = (g / 255.0).toFixed(3)
        const bFixed = (b / 255.0).toFixed(3)
        return `UIColor(red: ${rFixed}, green: ${gFixed}, blue: ${bFixed}, alpha: ${a})`
      } else {
        console.warn(
          `Invalid color token: ${token.path.join('.')} (${token.$value})`
        )
        return token.$value
      }
    } else if (tokenTypes.number.includes(token.$type) || tokenTypes.size.includes(token.$type)) {
      return `CGFloat(${parseFloat(token.$value)})`
    } else if (token.$type === 'fontFamily') {
      return `"${token.$value.split(',')[0].trim().replace(/['"]/g, '')}"` // Only take the first font family
    } else if (token.$type === 'fontWeight') {
      return `"${token.$value.replace(' ', '-').toLowerCase()}"` // Convert font weight to lowercase with hyphens
    } else if (tokenTypes.string.includes(token.$type)) {
      return `"${token.$value}"`
    }
    return token.$value
  }

  /**
   * Converts a token to a line of Swift code.
   * @param {Object} token - The token to convert.
   * @returns {string} - Swift code line for the token.
   */
  function tokenToLine(token) {
    return `@objc ${options.accessControl ? `${options.accessControl} ` : ''}static let ${token.name} = ${tokenToValue(token, dictionary)}`
  }

  /**
   * Generates the Swift class as a string.
   * @returns {string} - The complete Swift class.
   */
  return `
//
// ${file.destination}
//
${header}
${options.import.map(item => `import ${item}`).join('\n')}

${options.accessControl ? `${options.accessControl} ` : ''}${
  options.objectType ? `${options.objectType} ` : ''
}${file.className ? `${file.className} ` : ''}{
    ${dictionary.allTokens.map(token => tokenToLine(token)).join('\n    ')}
}
`
}

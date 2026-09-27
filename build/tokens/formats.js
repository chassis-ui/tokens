/**
 * @file formats.js
 * @description This file defines custom formats for Style Dictionary. These formats
 *              are used to generate platform-specific token files such as SCSS variables,
 *              Swift classes, and Android resource files.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { fileHeader, setSwiftFileProperties } from 'style-dictionary/utils'
import androidResourcesTemplate from './templates/android-resources.template.js'
import iosSwiftClassTemplate from './templates/ios-swift-class.template.js'
import scssTemplate from './templates/scss.template.js'
import { webValue } from './css-var-policy.js'
import { scssValue } from './scss-var-policy.js'

/**
 * Returns the tokens in source order, by the number the preprocessor gave them. Expanded
 * tokens share the number of their source token and keep their order.
 * @param {Object[]} tokens - The tokens of a file.
 * @returns {Object[]} - A sorted copy.
 */
export function inSourceOrder(tokens) {
  const order = (token) => token.$extensions['chassis'].sourceOrder
  return [...tokens].sort((a, b) => order(a) - order(b))
}

/**
 * Returns a format that generates SCSS variables.
 * @param {Function} value - Returns the SCSS value of a token.
 * @returns {Function} - The format function.
 */
function scssFormat(value) {
  return async function ({ dictionary, options, file, platform }) {
    const { formatting, commentStyle } = options
    const header = await fileHeader({ file, formatting, commentStyle })
    dictionary.allTokens = inSourceOrder(dictionary.allTokens)
    const settings = {
      basePxFontSize: platform.basePxFontSize,
      outputReferences: options.outputReferences === true
    }
    return scssTemplate({ dictionary, options, file, header, platform, value, settings })
  }
}

/**
 * Registers custom formats with Style Dictionary.
 * @param {Object} StyleDictionary - The Style Dictionary instance.
 */
export default function (StyleDictionary) {
  /**
   * A format to generate SCSS variables for Chassis CSS.
   */
  StyleDictionary.registerFormat({
    name: 'cx/scss-chassis-css',
    format: scssFormat(webValue)
  })

  /**
   * A format to generate SCSS variables for other CSS frameworks.
   */
  StyleDictionary.registerFormat({
    name: 'cx/scss-variables',
    format: scssFormat(scssValue)
  })

  /**
   * A format to generate an iOS Swift class.
   */
  StyleDictionary.registerFormat({
    name: 'cx/ios-swift-class',
    format: async function ({ dictionary, options, file, platform }) {
      const { formatting, commentStyle } = options
      const header = await fileHeader({ file, formatting, commentStyle })
      options = setSwiftFileProperties(options, 'class', platform.transformGroup)
      dictionary.allTokens = inSourceOrder(dictionary.allTokens)
      return iosSwiftClassTemplate({ dictionary, options, file, header, platform })
    }
  })

  /**
   * A format to generate Android resource files.
   */
  StyleDictionary.registerFormat({
    name: 'cx/android-resources',
    format: async function ({ dictionary, options, file, platform }) {
      const { formatting, commentStyle } = options
      const header = await fileHeader({ file, formatting, commentStyle })
      dictionary.allTokens = inSourceOrder(dictionary.allTokens)
      return androidResourcesTemplate({ dictionary, options, file, header, platform })
    }
  })
}

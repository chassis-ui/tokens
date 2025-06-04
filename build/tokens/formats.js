/**
 * @file formats.js
 * @description This file defines custom formats for Style Dictionary. These formats
 *              are used to generate platform-specific token files such as SCSS variables,
 *              Swift classes, and Android resource files.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import {
  fileHeader,
  sortByName,
  setSwiftFileProperties,
} from 'style-dictionary/utils'
import androidResourcesTemplate from './templates/android-resources.template.js'
import iosSwiftClassTemplate from './templates/ios-swift-class.template.js'
import scssVariablesTemplate from './templates/scss-variables.template.js'

/**
 * Registers custom formats with Style Dictionary.
 * @param {Object} StyleDictionary - The Style Dictionary instance.
 */
export default function (StyleDictionary) {
  /**
   * A test format for debugging purposes.
   */
  StyleDictionary.registerFormat({
    name: 'cx/test',
    format: ({ dictionary, file, options, platform }) => {
      let type = ''
      const allTokens = dictionary.allTokens
        .sort(sortByName)
        .map(function (token) {
          // console.log(token)
          // if (token.$type !== type) {
          //   console.log(token.name + ": " + token.$type)
          //   type = token.$type
          // }
          return token
        })
      return (
        allTokens
          // .map(token => `${JSON.stringify(token, null, 2)}`)
          .map(token => `  ${token.name}: ${token.$type}`)
          // .map(token => `  ${token.name}: ${token.$value}`)
          .join('\n')
      )
    },
  })

  /**
   * A format to generate SCSS variables.
   */
  StyleDictionary.registerFormat({
    name: 'cx/scss-variables',
    format: async function ({ dictionary, options, file }) {
      const { formatting, commentStyle } = options
      const header = await fileHeader({ file, formatting, commentStyle })
      dictionary.allTokens = [...dictionary.allTokens]
        // .sort(sortByName)
      return scssVariablesTemplate({ dictionary, options, file, header })
    },
  })

  /**
   * A format to generate an iOS Swift class.
   */
  StyleDictionary.registerFormat({
    name: 'cx/ios-swift-class',
    format: async function ({ dictionary, options, file, platform }) {
      const { formatting, commentStyle } = options
      const header = await fileHeader({ file, formatting, commentStyle })
      options = setSwiftFileProperties(
        options,
        'class',
        platform.transformGroup,
      )
      dictionary.allTokens = [...dictionary.allTokens]
        // .sort(sortByName)
      return iosSwiftClassTemplate({ dictionary, options, file, header })
    },
  })

  /**
   * A format to generate Android resource files.
   */
  StyleDictionary.registerFormat({
    name: 'cx/android-resources',
    format: async function ({ dictionary, options, file }) {
      const { formatting, commentStyle } = options
      const header = await fileHeader({ file, formatting, commentStyle })
      dictionary.allTokens = [...dictionary.allTokens]
        // .sort(sortByName)
      return androidResourcesTemplate({ dictionary, options, file, header })
    },
  })
}

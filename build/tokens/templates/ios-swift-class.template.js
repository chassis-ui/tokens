/**
 * @file ios-swift-class.template.js
 * @description Template for generating Swift classes from design tokens. Prints one
 *              `static let` per token; the value and the constant it names come from
 *              `values/ios.js`.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { encode, reference } from '../values/ios.js'
import { firstReferencedToken } from './references.js'

/**
 * Main export function to generate Swift class from design tokens.
 * @param {Object} opts - Options for generating the Swift class.
 * @param {Object} opts.dictionary - Token dictionary containing all tokens.
 * @param {Object} opts.file - File metadata including destination.
 * @param {string} opts.header - Header comment for the generated file.
 * @param {Object} opts.options - Swift file properties (import, accessControl, objectType, className).
 * @param {Object} [opts.settings] - `outputReferences`: name other constants of the
 *   class where `reference` allows it.
 * @returns {string} - Generated Swift class as a string.
 */
export default (opts) => {
  const { dictionary, file, header, options, settings = {} } = opts
  const accessControl = options.accessControl ? `${options.accessControl} ` : ''
  const objectType = options.objectType ? `${options.objectType} ` : ''
  const className = options.className ? `${options.className} ` : 'ChassisTokens'

  const tokenToLine = (token) => {
    const value =
      (settings.outputReferences &&
        reference(token, firstReferencedToken(token, dictionary.tokens))) ||
      encode(token)
    return `@objc ${accessControl}static let ${token.name} = ${value}`
  }

  return `
//
// ${file.destination}
//
${header}
${options.import.map((item) => `import ${item}`).join('\n')}

${accessControl}${objectType}${className} {
    ${dictionary.allTokens.map(tokenToLine).join('\n    ')}
}
`
}

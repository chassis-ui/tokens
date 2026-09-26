/**
 * @file ios-swift-class.template.js
 * @description Template for generating Swift classes from design tokens. Prints one
 *              `static let` per token; values come from `values/ios.js`.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { encode } from '../values/ios.js'

/**
 * Main export function to generate Swift class from design tokens.
 * @param {Object} opts - Options for generating the Swift class.
 * @param {Object} opts.dictionary - Token dictionary containing all tokens.
 * @param {Object} opts.file - File metadata including destination.
 * @param {string} opts.header - Header comment for the generated file.
 * @param {Object} opts.options - Swift file properties (import, accessControl, objectType, className).
 * @returns {string} - Generated Swift class as a string.
 */
export default (opts) => {
  const { dictionary, file, header, options } = opts
  const accessControl = options.accessControl ? `${options.accessControl} ` : ''
  const objectType = options.objectType ? `${options.objectType} ` : ''
  const className = options.className ? `${options.className} ` : 'ChassisTokens'

  const tokenToLine = (token) => `@objc ${accessControl}static let ${token.name} = ${encode(token)}`

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

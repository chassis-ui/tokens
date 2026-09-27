/**
 * @file ios-swift-class.template.js
 * @description Template for generating Swift classes from design tokens. Prints one
 *              `static let` per token; the value and the constant it names come from
 *              `values/ios.js`.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { encode, partName, reference } from '../values/ios.js'
import { gradientParts, isGradient } from '../values/shared.js'
import { encodingContext, firstReferencedToken } from './references.js'

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

  // The reference a token prints with `outputReferences`, if any
  const referenceOf = (token, context) => {
    const target = firstReferencedToken(token, dictionary.tokens)
    return reference(token, target, context, target && encodingContext(target, dictionary.tokens))
  }

  // A gradient prints as its parts; other tokens print as they are
  const printedTokens = (token) =>
    isGradient(token)
      ? gradientParts(token).map((part) => ({ ...part, name: partName(token, part.segments) }))
      : [token]

  const tokenToLine = (token) => {
    const context = encodingContext(token, dictionary.tokens)
    const value =
      (settings.outputReferences && referenceOf(token, context)) || encode(token, context)
    return `@objc ${accessControl}static let ${token.name} = ${value}`
  }

  return `
//
// ${file.destination}
//
${header}
${options.import.map((item) => `import ${item}`).join('\n')}

${accessControl}${objectType}${className} {
    ${dictionary.allTokens.flatMap(printedTokens).map(tokenToLine).join('\n    ')}
}
`
}

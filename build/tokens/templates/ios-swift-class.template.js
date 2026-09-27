/**
 * @file ios-swift-class.template.js
 * @description Template for generating Swift types from design tokens. Prints one
 *              `static let` per token; the value and the constant it names come from
 *              `values/ios.js`. The constants and the file are separate steps, so the
 *              dynamic colour file (`theme-colors.js`) prints through the same code.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { encode, partName, reference } from '../values/ios.js'
import { gradientParts, isGradient } from '../values/shared.js'
import { encodingContext, firstReferencedToken } from './references.js'

/**
 * Returns the constants a dictionary prints, in order: gradients as their parts, other
 * tokens as they are.
 *
 * @param {Object} dictionary - Token dictionary with `tokens` and `allTokens`.
 * @param {Object} [settings] - `outputReferences`: name other constants of the type
 *   where `reference` allows it.
 * @returns {Object[]} `{ name, type, value, printed }`: the Swift value, and what the
 *   constant prints, which is the value or the name of another constant.
 */
export function swiftConstants(dictionary, settings = {}) {
  // The reference a token prints with `outputReferences`, if any
  const referenceOf = (token, context) => {
    const target = firstReferencedToken(token, dictionary.tokens)
    return reference(token, target, context, target && encodingContext(target, dictionary.tokens))
  }

  const printedTokens = (token) =>
    isGradient(token)
      ? gradientParts(token).map((part) => ({ ...part, name: partName(token, part.segments) }))
      : [token]

  return dictionary.allTokens.flatMap(printedTokens).map((token) => {
    const context = encodingContext(token, dictionary.tokens)
    const value = encode(token, context)
    const printed = (settings.outputReferences && referenceOf(token, context)) || value
    return { name: token.name, type: token.$type, value, printed }
  })
}

/**
 * Prints a Swift file that declares one type with the given constants.
 *
 * @param {Object} opts
 * @param {Object} opts.file - File metadata including destination.
 * @param {string} opts.header - Header comment for the generated file.
 * @param {Object} opts.options - Swift file properties (import, accessControl, objectType,
 *   className). A `class` marks its constants `@objc`; an `enum` cannot.
 * @param {Object[]} opts.constants - `{ name, printed }` per constant.
 * @returns {string} - The Swift file.
 */
export function swiftFile({ file, header, options, constants }) {
  const accessControl = options.accessControl ? `${options.accessControl} ` : ''
  const objectType = options.objectType ? `${options.objectType} ` : ''
  const className = options.className || 'ChassisTokens'
  const objc = options.objectType === 'class' ? '@objc ' : ''
  const lines = constants.map(
    ({ name, printed }) => `${objc}${accessControl}static let ${name} = ${printed}`
  )

  return `
//
// ${file.destination}
//
${header}
${options.import.map((item) => `import ${item}`).join('\n')}

${accessControl}${objectType}${className} {
    ${lines.join('\n    ')}
}
`
}

/**
 * Generates a Swift type from design tokens.
 * @param {Object} opts - Options for generating the Swift type.
 * @param {Object} opts.dictionary - Token dictionary containing all tokens.
 * @param {Object} opts.file - File metadata including destination.
 * @param {string} opts.header - Header comment for the generated file.
 * @param {Object} opts.options - Swift file properties, as for `swiftFile`.
 * @param {Object} [opts.settings] - As for `swiftConstants`.
 * @returns {string} - Generated Swift type as a string.
 */
export default ({ dictionary, file, header, options, settings }) =>
  swiftFile({ file, header, options, constants: swiftConstants(dictionary, settings) })

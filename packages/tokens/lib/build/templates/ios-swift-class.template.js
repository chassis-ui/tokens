/**
 * @file ios-swift-class.template.js
 * @description Template for generating Swift types from design tokens. Prints one
 *              `static let` per token; the value and the constant it names come from
 *              `values/ios.js`. The constants and the file are separate steps, so the
 *              dynamic color file (`theme-colors.js`) prints through the same code.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import * as iosValues from '../values/ios.js'
import { tokenConstants } from './constants.js'

/**
 * Returns the constants a dictionary prints as Swift, with `values/ios.js` unless another
 * value module is given.
 *
 * @param {Object} dictionary - Token dictionary with `tokens` and `allTokens`.
 * @param {Object} [settings] - `outputReferences`.
 * @param {Object} [values] - A value module, e.g. `values/swiftui.js`.
 * @returns {Object[]} As `tokenConstants` returns them.
 */
export function swiftConstants(dictionary, settings, values = iosValues) {
  return tokenConstants(dictionary, settings, values)
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

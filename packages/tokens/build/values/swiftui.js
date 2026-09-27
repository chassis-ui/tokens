/**
 * @file swiftui.js
 * @description Encodes resolved tokens as SwiftUI values. Colours are `Color` and font
 *              weights `Font.Weight`; every other value is the one of `values/ios.js`.
 *              Two tokens encode to the same SwiftUI text exactly when they encode to the
 *              same UIKit text, so references follow the iOS rule.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import {
  colorChannels,
  encode as encodeIos,
  fontWeightConstant,
  partName,
  reference as referenceIos
} from './ios.js'

export { partName }

/**
 * Encodes a resolved token as the right-hand side of a Swift `static let` for SwiftUI.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {Object} [context] - As for `encode` of `values/ios.js`.
 * @returns {string} e.g. `Color(red: 0.086, green: 0.102, blue: 0.106, opacity: 1)`
 */
export function encode(token, context = {}) {
  if (token.$type === 'color') {
    const channels = colorChannels(token)
    if (!channels) return String(token.$value)
    const { red, green, blue, alpha } = channels
    return `Color(red: ${red}, green: ${green}, blue: ${blue}, opacity: ${alpha})`
  }
  if (token.$type === 'fontWeight') {
    return `Font.Weight.${fontWeightConstant(token)}`
  }
  return encodeIos(token, context)
}

/**
 * Returns the constant a token names with `outputReferences`, by the rule of
 * `values/ios.js`.
 *
 * @param {Object} token - The token.
 * @param {Object} [target] - The first token that the original value references.
 * @param {Object} [context] - The encoding context of the token.
 * @param {Object} [targetContext] - The encoding context of the target.
 * @returns {string|undefined} e.g. `DimensionBase16`
 */
export function reference(token, target, context, targetContext) {
  return referenceIos(token, target, context, targetContext)
}

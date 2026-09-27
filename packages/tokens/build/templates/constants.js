/**
 * @file constants.js
 * @description The constants a code template prints for a file: gradients as their parts,
 *              other tokens as they are, each with its value and what it prints. The
 *              platform's value module decides the values, references and part names.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { gradientParts, isGradient } from '../values/shared.js'
import { encodingContext, firstReferencedToken } from './references.js'

/**
 * Returns the constants a dictionary prints, in order.
 *
 * @param {Object} dictionary - Token dictionary with `tokens` and `allTokens`.
 * @param {Object} [settings] - `outputReferences`: name other constants where the
 *   platform's `reference` allows it.
 * @param {Object} values - The platform's value module: `encode`, `reference`,
 *   `partName`, and optionally `derivedConstants`, which returns constants printed after
 *   a token, e.g. `values/ios.js`.
 * @returns {Object[]} `{ name, type, value, printed }`: the value, and what the constant
 *   prints, which is the value or the name of another constant.
 */
export function tokenConstants(
  dictionary,
  settings = {},
  { encode, reference, partName, derivedConstants = () => [] }
) {
  // The reference a token prints with `outputReferences`, if any
  const referenceOf = (token, context) => {
    const target = firstReferencedToken(token, dictionary.tokens)
    return reference(token, target, context, target && encodingContext(target, dictionary.tokens))
  }

  const printedTokens = (token) =>
    isGradient(token)
      ? gradientParts(token).map((part) => ({ ...part, name: partName(token, part.segments) }))
      : [token]

  return dictionary.allTokens.flatMap(printedTokens).flatMap((token) => {
    const context = encodingContext(token, dictionary.tokens)
    const value = encode(token, context)
    const printed = (settings.outputReferences && referenceOf(token, context)) || value
    const derived = derivedConstants(token).map((constant) => ({
      ...constant,
      printed: constant.value
    }))
    return [{ name: token.name, type: token.$type, value, printed }, ...derived]
  })
}

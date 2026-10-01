/**
 * @file compose.js
 * @description Encodes resolved tokens as Kotlin values for Jetpack Compose: `Color`,
 *              `.dp`, `.sp`, `.em`, `Float`, `FontWeight` and string literals. The values
 *              are the ones of `values/android.js`, in Kotlin; references follow the
 *              Android rule.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { encodeValue, reference as referenceAndroid, resourceKind } from './android.js'
import { fontWeightNumber } from './shared.js'

/**
 * A Kotlin number, in parentheses when it is negative, so a unit extension such as `.dp`
 * applies to the whole number.
 *
 * @param {string} number - e.g. `-0.5`
 * @returns {string} e.g. `(-0.5)`
 */
function operand(number) {
  return number.startsWith('-') ? `(${number})` : number
}

/**
 * A Kotlin string literal. Backslashes, quotes and `$` are escaped, the last so that
 * Kotlin does not read a string template.
 *
 * @param {string} text
 * @returns {string} e.g. `"Inter"`
 */
export function kotlinString(text) {
  const escaped = String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n')
  return `"${escaped}"`
}

/**
 * Encodes a resolved token as the value of a Kotlin property for Compose.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {Object} [context] - As for `encode` of `values/android.js`; with a font size,
 *   the letter spacing of a typography token is in `em`.
 * @returns {string} e.g. `Color(0xFF161A1B)`, `16.dp`, `22.sp`, `(-0.0052).em`, `0.4f`
 */
export function encode(token, context = {}) {
  const kind = resourceKind(token)
  if (token.$type === 'fontWeight') {
    return `FontWeight(${fontWeightNumber(token)})`
  }
  const value = encodeValue(token, context)
  if (kind === 'color') {
    return `Color(0x${value.slice(1).toUpperCase()})`
  }
  if (kind === 'dimen') {
    const [, number, unit] = value.match(/^(-?[\d.]+)(dp|sp)$/)
    return `${operand(number)}.${unit}`
  }
  if (kind === 'float') {
    const letterSpacingPart =
      token.path[token.path.length - 1] === 'letterSpacing' && context.fontSize !== undefined
    return letterSpacingPart ? `${operand(value)}.em` : `${value}f`
  }
  if (kind === 'integer') return value
  return kotlinString(value)
}

/**
 * Returns the property a token names with `outputReferences`, by the rule of
 * `values/android.js`: the target must be of the same kind and have the same value.
 *
 * @param {Object} token - The token.
 * @param {Object} [target] - The first token that the original value references.
 * @param {Object} [context] - The encoding context of the token.
 * @param {Object} [targetContext] - The encoding context of the target.
 * @returns {string|undefined} e.g. `dimensionBase16`
 */
export function reference(token, target, context, targetContext) {
  return referenceAndroid(token, target, context, targetContext) ? target.name : undefined
}

/**
 * Returns the property name of a part of a token, such as a gradient stop: the token's
 * camelCase name with the part's segments capitalised.
 *
 * @param {Object} token - The token the part belongs to, with `name`.
 * @param {string[]} segments - e.g. `['stop1', 'color']`
 * @returns {string} e.g. `gradientPrimitiveBlackL000Stop1Color`
 */
export function partName(token, segments) {
  return (
    token.name + segments.map((segment) => segment[0].toUpperCase() + segment.slice(1)).join('')
  )
}

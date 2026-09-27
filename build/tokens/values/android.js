/**
 * @file android.js
 * @description Encodes resolved tokens as Android resource values, picks the resource
 *              element for each token, and decides when a token prints a reference to
 *              another resource. Runs at print time, after Style Dictionary has resolved
 *              every reference.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { tokenTypes } from '../utils.js'
import { firstFontFamily, fontWeightName, parseColor } from './shared.js'

/**
 * Resource element per token type group. Groups are checked in `tokenTypes` order and
 * the first group with an element wins, so `letterSpacing` (font and number groups)
 * becomes `integer` and `fontFamily` (font and string groups) becomes `string`.
 */
const RESOURCE_ELEMENTS = {
  color: 'color',
  number: 'integer',
  size: 'dimen',
  string: 'string'
}

/**
 * Size keys and types that use scale-independent pixels.
 */
const SP_KEYS = ['fontSize', 'lineHeight', 'paragraphSpacing']
const SP_TYPES = ['fontSize', 'lineHeight']

/**
 * Returns the Android resource element for a token.
 *
 * @param {Object} token - A resolved token with `$type`.
 * @returns {string} `color`, `integer`, `dimen` or `string`.
 */
export function resourceType(token) {
  for (const [group, types] of Object.entries(tokenTypes)) {
    if (RESOURCE_ELEMENTS[group] && types.includes(token.$type)) {
      return RESOURCE_ELEMENTS[group]
    }
  }
  return 'string'
}

/**
 * Formats a colour as ARGB hex.
 *
 * @param {Object} token - A resolved token of type `color`.
 * @returns {string} e.g. `#80b7c0c2`
 */
function encodeColor(token) {
  const color = parseColor(token)
  if (!color) return String(token.$value)
  const rgba = color.toHex8()
  return `#${rgba.slice(6)}${rgba.slice(0, 6)}`
}

/**
 * Encodes a resolved token as the text content of its resource element.
 * The order of the checks matters and matches the frozen output contract.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @returns {string} The resource value.
 */
export function encode(token) {
  const { $type: type, $value: value, path } = token

  if (type === 'color') {
    return encodeColor(token)
  }
  if (type === 'fontFamily') {
    return firstFontFamily(value)
  }
  if (type === 'fontWeight') {
    return fontWeightName(value)
  }
  if (
    SP_KEYS.includes(path[path.length - 1]) ||
    SP_TYPES.includes(type) ||
    path[1] === 'paragraphSpacing'
  ) {
    return `${parseFloat(value)}sp`
  }
  if (path[1] === 'letterSpacing' || type === 'letterSpacing') {
    return `${parseFloat(value)}`
  }
  if (tokenTypes.size.includes(type)) {
    return `${parseFloat(value)}dp`
  }
  return String(value)
}

/**
 * A size value without math: at most a leading sign or operator, then no operator.
 */
const WITHOUT_MATH = /^[+\-*/]?[^+*/]*$/

/**
 * Returns the reference a token prints with `outputReferences`: the resource of the
 * first token its original value references. There is none for base colours, for sizes
 * computed with math, and when the reference would not compile or would change the
 * value: the referenced resource must be of the same element and encode to the same
 * value.
 *
 * @param {Object} token - A resolved token with `$type`, `$value`, `path` and `original`.
 * @param {Object} [target] - The first token that the original value references, from
 *   the same file.
 * @returns {string|undefined} e.g. `@dimen/size_unit_16`
 */
export function reference(token, target) {
  if (!target) return undefined
  if (token.$type === 'color' && token.path[1] === 'base') return undefined
  if (tokenTypes.size.includes(token.$type) && !WITHOUT_MATH.test(token.original.$value)) {
    return undefined
  }

  const element = resourceType(token)
  if (resourceType(target) !== element || encode(target) !== encode(token)) return undefined
  return `@${element}/${target.name}`
}

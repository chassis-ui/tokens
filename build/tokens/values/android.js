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
 * Resource kind per token type group. Groups are checked in `tokenTypes` order and the
 * first group with a kind wins, so `fontFamily` (font and string groups) becomes
 * `string`.
 */
const RESOURCE_KINDS = {
  color: 'color',
  number: 'integer',
  size: 'dimen',
  string: 'string'
}

/**
 * Types whose values are fractions, such as `0.4` or `-0.5`. Android integer resources
 * reject them, so they are float resources: `<item type="dimen" format="float">`.
 */
const FLOAT_TYPES = ['opacity', 'letterSpacing']

/**
 * Size keys and types that use scale-independent pixels.
 */
const SP_KEYS = ['fontSize', 'lineHeight', 'paragraphSpacing']
const SP_TYPES = ['fontSize', 'lineHeight']

/**
 * Returns the kind of Android resource a token becomes.
 *
 * @param {Object} token - A resolved token with `$type` and `path`.
 * @returns {string} `color`, `float`, `integer`, `dimen` or `string`.
 */
export function resourceKind(token) {
  if (FLOAT_TYPES.includes(token.$type) || token.path[1] === 'letterSpacing') {
    return 'float'
  }
  for (const [group, types] of Object.entries(tokenTypes)) {
    if (RESOURCE_KINDS[group] && types.includes(token.$type)) {
      return RESOURCE_KINDS[group]
    }
  }
  return 'string'
}

/**
 * Returns the Android resource type of a token, as references and the `R` class name
 * it: a float resource is a `dimen`.
 *
 * @param {Object} token - A resolved token with `$type` and `path`.
 * @returns {string} `color`, `integer`, `dimen` or `string`.
 */
export function resourceType(token) {
  const kind = resourceKind(token)
  return kind === 'float' ? 'dimen' : kind
}

/**
 * Returns the XML element that declares a token and the attributes after its name.
 *
 * @param {Object} token - A resolved token with `$type` and `path`.
 * @returns {Object} e.g. `{ tag: 'dimen', attributes: '' }` or
 *   `{ tag: 'item', attributes: ' type="dimen" format="float"' }`
 */
export function resourceTag(token) {
  const kind = resourceKind(token)
  return kind === 'float'
    ? { tag: 'item', attributes: ' type="dimen" format="float"' }
    : { tag: kind, attributes: '' }
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
 * Escapes text for an Android string resource. XML special characters become entities,
 * so markup such as an SVG icon stays text; aapt2 would otherwise read it as styling
 * tags and drop it. Backslashes, quotes and apostrophes get a backslash, and a leading
 * `@` or `?` too, so aapt2 does not read the text as a reference.
 *
 * @param {string} text - e.g. `<svg xmlns='http://www.w3.org/2000/svg'>…</svg>`
 * @returns {string} e.g. `&lt;svg xmlns=\'http://www.w3.org/2000/svg\'&gt;…&lt;/svg&gt;`
 */
export function escapeString(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '\\\\')
    .replace(/(['"])/g, '\\$1')
    .replace(/^([@?])/, '\\$1')
}

/**
 * Encodes a resolved token as the text content of its resource element. String
 * resources are escaped.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @returns {string} The resource value.
 */
export function encode(token) {
  const value = encodeValue(token)
  return resourceKind(token) === 'string' ? escapeString(value) : value
}

/**
 * Encodes a resolved token's value before string escaping. The order of the checks
 * matters and matches the frozen output contract.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @returns {string} The value.
 */
function encodeValue(token) {
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
 * value: the referenced resource must be of the same kind and encode to the same
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

  if (resourceKind(target) !== resourceKind(token) || encode(target) !== encode(token)) {
    return undefined
  }
  return `@${resourceType(token)}/${target.name}`
}

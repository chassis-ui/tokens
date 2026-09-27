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
import {
  firstFontFamily,
  fontWeightNumber,
  isBaseColor,
  isSizeWithMath,
  letterSpacingEm,
  parseColor,
  percentLineHeight
} from './shared.js'

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
 * Number parts of a gradient (`gradientParts`), which are floats: an angle in degrees and
 * stop positions from 0 to 1.
 */
const FLOAT_PARTS = ['angle', 'position']

/**
 * Size keys and types that use scale-independent pixels.
 */
const SP_KEYS = ['fontSize', 'lineHeight', 'paragraphSpacing']
const SP_TYPES = ['fontSize', 'lineHeight']

/**
 * Returns the kind of Android resource a token becomes. Font weights are integers
 * (`600`), which Compose's `FontWeight` and `Typeface.create` take, although their type
 * is in the string group.
 *
 * @param {Object} token - A resolved token with `$type` and `path`.
 * @returns {string} `color`, `float`, `integer`, `dimen` or `string`.
 */
export function resourceKind(token) {
  if (
    FLOAT_TYPES.includes(token.$type) ||
    token.path[1] === 'letterSpacing' ||
    (token.$type === 'number' && FLOAT_PARTS.includes(token.path[token.path.length - 1]))
  ) {
    return 'float'
  }
  if (token.$type === 'fontWeight') return 'integer'
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
 * Formats a color as ARGB hex.
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
 * @param {Object} [context] - `fontSize`: the font size part of the typography token
 *   that the token is a part of, for a percentage line height and a letter spacing.
 * @returns {string} The resource value.
 */
export function encode(token, context = {}) {
  const value = encodeValue(token, context)
  return resourceKind(token) === 'string' ? escapeString(value) : value
}

/**
 * Encodes a resolved token's value before string escaping. The order of the checks
 * matters and matches the frozen output contract. Compose prints the same values in
 * Kotlin (`values/compose.js`).
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {Object} context - As for `encode`.
 * @returns {string} The value.
 */
export function encodeValue(token, context = {}) {
  const { $type: type, $value: value, path } = token

  if (type === 'color') {
    return encodeColor(token)
  }
  if (type === 'fontFamily') {
    return firstFontFamily(value)
  }
  if (type === 'fontWeight') {
    return `${fontWeightNumber(token)}`
  }
  if (
    SP_KEYS.includes(path[path.length - 1]) ||
    SP_TYPES.includes(type) ||
    path[1] === 'paragraphSpacing'
  ) {
    return `${percentLineHeight(token, context.fontSize) ?? parseFloat(value)}sp`
  }
  if (path[1] === 'letterSpacing' || type === 'letterSpacing') {
    return `${letterSpacingEm(token, context.fontSize) ?? parseFloat(value)}`
  }
  if (tokenTypes.size.includes(type)) {
    return `${parseFloat(value)}dp`
  }
  return String(value)
}

/**
 * Returns the reference a token prints with `outputReferences`: the resource of the
 * first token its original value references. There is none for base colors, for sizes
 * computed with math, and when the reference would not compile or would change the
 * value: the referenced resource must be of the same kind and encode to the same
 * value.
 *
 * @param {Object} token - A resolved token with `$type`, `$value`, `path` and `original`.
 * @param {Object} [target] - The first token that the original value references, from
 *   the same file.
 * @param {Object} [context] - The encoding context of the token, as for `encode`.
 * @param {Object} [targetContext] - The encoding context of the target.
 * @returns {string|undefined} e.g. `@dimen/size_unit_16`
 */
export function reference(token, target, context = {}, targetContext = {}) {
  if (!target || isBaseColor(token) || isSizeWithMath(token)) return undefined

  if (
    resourceKind(target) !== resourceKind(token) ||
    encode(target, targetContext) !== encode(token, context)
  ) {
    return undefined
  }
  return `@${resourceType(token)}/${target.name}`
}

/**
 * Returns the resource name of a part of a token, such as a gradient stop: the token's
 * name with the part's segments in snake_case, digits split off as in the other names.
 *
 * @param {Object} token - The token the part belongs to, with `name`.
 * @param {string[]} segments - e.g. `['stop1', 'color']`
 * @returns {string} e.g. `gradient_primitive_black_l_000_stop_1_color`
 */
export function partName(token, segments) {
  return [token.name, ...segments.map((segment) => segment.replace(/(\D)(\d)/g, '$1_$2'))].join('_')
}

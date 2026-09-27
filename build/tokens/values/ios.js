/**
 * @file ios.js
 * @description Encodes resolved tokens as Swift values, and decides when a token names
 *              another constant instead. Runs at print time, after Style Dictionary has
 *              resolved every reference, because converting a colour to `UIColor(…)` any
 *              earlier would break the tokens that reference it.
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
  parseColor,
  percentLineHeight
} from './shared.js'

/**
 * Formats a colour as a `UIColor` with three-decimal channels.
 *
 * @param {Object} token - A resolved token of type `color`.
 * @returns {string} e.g. `UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 0.1)`
 */
function encodeColor(token) {
  const color = parseColor(token)
  if (!color) return String(token.$value)
  const { r, g, b, a } = color.toRgb()
  const channel = (value) => (value / 255).toFixed(3)
  return `UIColor(red: ${channel(r)}, green: ${channel(g)}, blue: ${channel(b)}, alpha: ${a})`
}

/**
 * `UIFont.Weight` constants by weight number, as SwiftUI's `Font.Weight` orders them.
 */
const FONT_WEIGHTS = {
  100: 'ultraLight',
  200: 'thin',
  300: 'light',
  400: 'regular',
  500: 'medium',
  600: 'semibold',
  700: 'bold',
  800: 'heavy',
  900: 'black'
}

/**
 * Formats a font weight as a `UIFont.Weight` constant: the weight number rounded to the
 * nearest hundred, from 100 to 900.
 *
 * @param {Object} token - A resolved token of type `fontWeight`.
 * @returns {string} e.g. `UIFont.Weight.semibold`
 */
function encodeFontWeight(token) {
  const hundred = Math.min(900, Math.max(100, Math.round(fontWeightNumber(token) / 100) * 100))
  return `UIFont.Weight.${FONT_WEIGHTS[hundred]}`
}

/**
 * Encodes a resolved token as the right-hand side of a Swift `static let`.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {Object} [context] - `fontSize`: the font size part of the typography token
 *   that the token is a part of, for a percentage line height.
 * @returns {string} The Swift value.
 */
export function encode(token, context = {}) {
  const { $type: type, $value: value } = token

  if (type === 'color') {
    return encodeColor(token)
  }
  if (tokenTypes.number.includes(type) || tokenTypes.size.includes(type)) {
    return `CGFloat(${percentLineHeight(token, context.fontSize) ?? parseFloat(value)})`
  }
  if (type === 'fontFamily') {
    return `"${firstFontFamily(value)}"`
  }
  if (type === 'fontWeight') {
    return encodeFontWeight(token)
  }
  if (tokenTypes.string.includes(type)) {
    return `"${value}"`
  }
  return String(value)
}

/**
 * Returns the constant a token names with `outputReferences`: the constant of the first
 * token its original value references. There is none for base colours and for sizes
 * computed with math, as on Android, and none when the target encodes to other Swift
 * text. The text holds the Swift type (`UIColor(…)`, `CGFloat(…)`, a string literal),
 * so equal text means the same type and value.
 *
 * The name is not qualified with the class, because Swift finds a static member of the
 * same type from a static property initializer, whatever `className` is.
 *
 * @param {Object} token - A resolved token with `$type`, `$value`, `path` and `original`.
 * @param {Object} [target] - The first token that the original value references, from
 *   the same file.
 * @param {Object} [context] - The encoding context of the token, as for `encode`.
 * @param {Object} [targetContext] - The encoding context of the target.
 * @returns {string|undefined} e.g. `DimensionBase16`
 */
export function reference(token, target, context = {}, targetContext = {}) {
  if (!target || isBaseColor(token) || isSizeWithMath(token)) return undefined
  return encode(target, targetContext) === encode(token, context) ? target.name : undefined
}

/**
 * Returns the constant name of a part of a token, such as a gradient stop: the token's
 * name with the part's segments in PascalCase.
 *
 * @param {Object} token - The token the part belongs to, with `name`.
 * @param {string[]} segments - e.g. `['stop1', 'color']`
 * @returns {string} e.g. `GradientPrimitiveBlackL000Stop1Color`
 */
export function partName(token, segments) {
  return (
    token.name + segments.map((segment) => segment[0].toUpperCase() + segment.slice(1)).join('')
  )
}

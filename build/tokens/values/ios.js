/**
 * @file ios.js
 * @description Encodes resolved tokens as Swift values. Runs at print time, after Style
 *              Dictionary has resolved every reference, because converting a colour to
 *              `UIColor(…)` any earlier would break the tokens that reference it.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { tokenTypes } from '../utils.js'
import { firstFontFamily, fontWeightName, parseColor } from './shared.js'

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
 * Encodes a resolved token as the right-hand side of a Swift `static let`.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @returns {string} The Swift value.
 */
export function encode(token) {
  const { $type: type, $value: value } = token

  if (type === 'color') {
    return encodeColor(token)
  }
  if (tokenTypes.number.includes(type) || tokenTypes.size.includes(type)) {
    return `CGFloat(${parseFloat(value)})`
  }
  if (type === 'fontFamily') {
    return `"${firstFontFamily(value)}"`
  }
  if (type === 'fontWeight') {
    return `"${fontWeightName(value)}"`
  }
  if (tokenTypes.string.includes(type)) {
    return `"${value}"`
  }
  return String(value)
}

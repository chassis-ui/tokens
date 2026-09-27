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
 * Returns the channels of a colour as Swift numbers: red, green and blue from 0 to 1 with
 * three decimals, and the alpha as parsed. UIKit and SwiftUI print the same channels.
 *
 * @param {Object} token - A resolved token of type `color`.
 * @returns {Object|null} e.g. `{ red: '0.000', green: '0.643', blue: '0.800', alpha: 1 }`,
 *   or null when the colour does not parse.
 */
export function colorChannels(token) {
  const color = parseColor(token)
  if (!color) return null
  const { r, g, b, a } = color.toRgb()
  const channel = (value) => (value / 255).toFixed(3)
  return { red: channel(r), green: channel(g), blue: channel(b), alpha: a }
}

/**
 * Formats a colour as a `UIColor` with three-decimal channels.
 *
 * @param {Object} token - A resolved token of type `color`.
 * @returns {string} e.g. `UIColor(red: 0.000, green: 0.000, blue: 0.000, alpha: 0.1)`
 */
function encodeColor(token) {
  const channels = colorChannels(token)
  if (!channels) return String(token.$value)
  const { red, green, blue, alpha } = channels
  return `UIColor(red: ${red}, green: ${green}, blue: ${blue}, alpha: ${alpha})`
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
  return `UIFont.Weight.${fontWeightConstant(token)}`
}

/**
 * Returns the Apple name of a font weight, which `UIFont.Weight` and SwiftUI's
 * `Font.Weight` share: the weight number rounded to the nearest hundred, from 100 to 900.
 *
 * @param {Object} token - A resolved token of type `fontWeight`.
 * @returns {string} e.g. `semibold`
 */
export function fontWeightConstant(token) {
  const hundred = Math.min(900, Math.max(100, Math.round(fontWeightNumber(token) / 100) * 100))
  return FONT_WEIGHTS[hundred]
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

/**
 * Returns the constants iOS prints after a token, derived from it: for the blur of a
 * shadow, the `CALayer.shadowRadius` that draws about the same shadow, half the CSS blur.
 * The shadow colour needs no derived constant: Core Animation multiplies its alpha by
 * `shadowOpacity`, so the colour with `shadowOpacity = 1` gives the CSS shadow.
 *
 * @param {Object} token - A resolved token with `name`, `path`, `$value` and `$extensions`.
 * @returns {Object[]} `{ name, type, value }` per derived constant, e.g.
 *   `{ name: 'ShadowContextSmall1Radius', type: 'dimension', value: 'CGFloat(4)' }`
 */
export function derivedConstants(token) {
  const shadowPart = token.$extensions?.['studio.tokens']?.originalType === 'boxShadow'
  if (!shadowPart || token.path[token.path.length - 1] !== 'blur' || !token.name.endsWith('Blur')) {
    return []
  }
  const radius = Number((parseFloat(token.$value) / 2).toFixed(3))
  return [
    {
      name: `${token.name.slice(0, -'Blur'.length)}Radius`,
      type: token.$type,
      value: `CGFloat(${radius})`
    }
  ]
}

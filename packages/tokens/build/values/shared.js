/**
 * @file shared.js
 * @description Value helpers shared by the iOS and Android encoders. Every function takes
 *              a fully resolved token (or value) and never modifies it.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { transformFontWeight } from '@tokens-studio/sd-transforms'
import Color from 'tinycolor2'
import { tokenTypes } from '../utils.js'

/**
 * A size value without math: at most a leading sign or operator, then no operator.
 */
const WITHOUT_MATH = /^[+\-*/]?[^+*/]*$/

/**
 * Parses a resolved color value.
 *
 * tinycolor parses leniently: a `linear-gradient(…)` value would yield its first color
 * stop. Gradient tokens are printed as parts (`gradientParts`), so a gradient here is an
 * error.
 *
 * @param {Object} token - A resolved token of type `color`.
 * @returns {Object|null} A tinycolor instance, or null (with a warning) if unparseable.
 * @throws {Error} When the value is a gradient.
 */
export function parseColor(token) {
  if (isGradient(token)) {
    throw new Error(`Gradient ${token.path.join('.')} is printed as parts, not as a color`)
  }
  const color = Color(token.$value)
  if (color.isValid()) return color
  console.warn(`Invalid color token: ${token.path.join('.')} (${token.$value})`)
  return null
}

/**
 * Returns the first family of a font stack, without quotes.
 *
 * @param {string} value - e.g. `'Archivo Narrow', Georgia, serif`
 * @returns {string} e.g. `Archivo Narrow`
 */
export function firstFontFamily(value) {
  return value.split(',')[0].trim().replace(/['"]/g, '')
}

/**
 * Returns the number of a font weight, with the map the web output uses
 * (`ts/typography/fontWeight` of sd-transforms). Case, spaces and hyphens do not
 * matter, so `Semi Bold`, `SemiBold` and `semi-bold` are all `600`: the token source
 * keeps the style name each font has in Figma. A number passes as it is.
 *
 * @param {Object} token - A resolved `fontWeight` token with `$value` and `path`.
 * @returns {number} e.g. `600`
 * @throws {Error} When the name is not a known weight, with the token path.
 */
export function fontWeightNumber(token) {
  const name = String(token.$value).replace(/-/g, ' ')
  const weight = Number(transformFontWeight({ $type: 'fontWeight', $value: name }))
  if (!Number.isInteger(weight) || weight < 1 || weight > 1000) {
    throw new Error(`Unknown font weight "${token.$value}" in ${token.path.join('.')}`)
  }
  return weight
}

/**
 * Checks whether a token is a size whose original value is computed with math, such as
 * `{size.datepicker.day-width}*7`. A reference to the first token it names would drop
 * the math.
 *
 * @param {Object} token - A resolved token with `$type` and `original`.
 * @returns {boolean}
 */
export function isSizeWithMath(token) {
  return tokenTypes.size.includes(token.$type) && !WITHOUT_MATH.test(token.original.$value)
}

/**
 * Checks whether a token is a base color, the raw palette behind the context colors.
 * Base colors print their value on iOS and Android, also with `outputReferences`.
 *
 * @param {Object} token - A resolved token with `$type` and `path`.
 * @returns {boolean}
 */
export function isBaseColor(token) {
  return token.$type === 'color' && token.path[1] === 'base'
}

/**
 * Checks whether a token is a line height: a `lineHeight` token, or the line height part
 * of a typography token.
 *
 * @param {Object} token - A resolved token with `$type` and `path`.
 * @returns {boolean}
 */
function isLineHeight(token) {
  return token.$type === 'lineHeight' || token.path[token.path.length - 1] === 'lineHeight'
}

/**
 * Returns the size a percentage line height stands for: the percentage of the font size
 * of the same typography token, in the unit of the font size, to three decimals. iOS and
 * Android take line heights as sizes, not percentages.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {string|number} [fontSize] - The font size part of the same typography token.
 * @returns {number|undefined} e.g. `120` for `125%` of `96px`; `undefined` when the
 *   token is not a percentage line height.
 * @throws {Error} When the token is a percentage line height without a font size.
 */
export function percentLineHeight(token, fontSize) {
  if (!isLineHeight(token) || !String(token.$value).endsWith('%')) return undefined
  if (fontSize === undefined) {
    throw new Error(`No font size for the percentage line height of ${token.path.join('.')}`)
  }
  return Number(((parseFloat(token.$value) / 100) * parseFloat(String(fontSize))).toFixed(3))
}

/**
 * Rounds a number to a number of decimals, without a negative zero.
 *
 * @param {number} value
 * @param {number} digits
 * @returns {number}
 */
function round(value, digits) {
  return Number(value.toFixed(digits)) || 0
}

/**
 * Returns a letter spacing that is relative to the font size, as a fraction of the font
 * size: a percentage divided by 100, or a number of ems. A value in px, rem or vw, or
 * without a unit, is absolute and returns `undefined`; the source writes pixels, which
 * Figma variables hold.
 *
 * @param {string|number} value - e.g. `-2%`, `-0.02em`, `-0.5px`
 * @returns {number|undefined} e.g. `-0.02`
 */
export function letterSpacingFraction(value) {
  const text = String(value).trim()
  if (text.endsWith('%')) return parseFloat(text) / 100
  if (/\dem$/.test(text)) return parseFloat(text)
  return undefined
}

/**
 * Checks whether a token is the letter spacing part of a typography token.
 *
 * @param {Object} token - A resolved token with `path`.
 * @returns {boolean}
 */
function isLetterSpacingPart(token) {
  return token.path[token.path.length - 1] === 'letterSpacing'
}

/**
 * Throws when a letter spacing part has no font size to be encoded with.
 *
 * @param {Object} token - A resolved token with `path`.
 * @param {string|number} [fontSize]
 * @throws {Error}
 */
function requireFontSize(token, fontSize) {
  if (fontSize === undefined) {
    throw new Error(`No font size for the letter spacing of ${token.path.join('.')}`)
  }
}

/**
 * Returns the letter spacing part of a typography token in ems of its font size, to
 * four decimals, as the web rounds letter spacing. A percentage is divided by 100; an
 * absolute value is divided by the font size. Android's `letterSpacing` takes ems.
 * Letter spacing tokens outside a typography token return `undefined`.
 *
 * @param {Object} token - A resolved token with `$value` and `path`.
 * @param {string|number} [fontSize] - The font size part of the same typography token.
 * @returns {number|undefined} e.g. `-0.02` for `-2%`, `-0.0052` for `-0.5px` at `96px`
 * @throws {Error} When the token is a letter spacing part without a font size.
 */
export function letterSpacingEm(token, fontSize) {
  if (!isLetterSpacingPart(token)) return undefined
  requireFontSize(token, fontSize)
  const em =
    letterSpacingFraction(token.$value) ??
    parseFloat(String(token.$value)) / parseFloat(String(fontSize))
  return round(em, 4)
}

/**
 * Returns the letter spacing part of a typography token in points, which UIKit's `kern`
 * and SwiftUI's `tracking` take: a percentage of the font size of the same token, to
 * three decimals, as a percentage line height. An absolute value is already in points.
 * Letter spacing tokens outside a typography token return `undefined`.
 *
 * @param {Object} token - A resolved token with `$value` and `path`.
 * @param {string|number} [fontSize] - The font size part of the same typography token.
 * @returns {number|undefined} e.g. `-2.88` for `-3%` at `96px`
 * @throws {Error} When the token is a letter spacing part without a font size.
 */
export function letterSpacingPoints(token, fontSize) {
  if (!isLetterSpacingPart(token)) return undefined
  requireFontSize(token, fontSize)
  const fraction = letterSpacingFraction(token.$value)
  if (fraction === undefined) return parseFloat(String(token.$value))
  return round(fraction * parseFloat(String(fontSize)), 3)
}

/**
 * Returns the number that a letter spacing token outside a typography token prints on
 * iOS and Android, where it has no font size: a fraction of the font size for a
 * percentage, to four decimals, and the number of an absolute value.
 *
 * @param {Object} token - A resolved token with `$value`.
 * @returns {number} e.g. `-0.03` for `-3%`, `-0.5` for `-0.5px`
 */
export function letterSpacingNumber(token) {
  const fraction = letterSpacingFraction(token.$value)
  return fraction === undefined ? parseFloat(String(token.$value)) : round(fraction, 4)
}

/**
 * Checks whether a token holds a CSS gradient. Gradient tokens are typed `color`.
 *
 * @param {Object} token - A resolved token with `$type` and `$value`.
 * @returns {boolean}
 */
export function isGradient(token) {
  return token.$type === 'color' && /^[a-z-]*gradient\(/.test(String(token.$value).trim())
}

/**
 * Splits a list at the commas that are not inside parentheses or braces.
 *
 * @param {string} text - e.g. `0deg, rgba(0, 0, 0, 0) 0%, #000000 100%`
 * @returns {string[]} e.g. `['0deg', 'rgba(0, 0, 0, 0) 0%', '#000000 100%']`
 */
function splitList(text) {
  const items = ['']
  let depth = 0
  for (const char of text) {
    if ('({'.includes(char)) depth++
    if (')}'.includes(char)) depth--
    if (char === ',' && depth === 0) items.push('')
    else items[items.length - 1] += char
  }
  return items.map((item) => item.trim())
}

/**
 * Directions that a `to <side>` keyword stands for, as angles.
 */
const SIDE_ANGLES = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }

/**
 * Parses a CSS `linear-gradient(…)` value into its angle and color stops. The angle is
 * in degrees clockwise from the top, as in CSS, from 0 to less than 360; without one it
 * is 180 (top to bottom). A stop position is a fraction from 0 to 1. A stop without a
 * position gets one as CSS gives it: the first 0, the last 1, and the others spread
 * evenly between their neighbours.
 *
 * @param {string} value - e.g. `linear-gradient(-45deg, rgba(0, 0, 0, 0) 0%, #000000 100%)`
 * @returns {Object} e.g. `{ angle: 315, stops: [{ color: 'rgba(0, 0, 0, 0)', position: 0 }, …] }`
 * @throws {Error} When the value is another gradient or a form this function does not read.
 */
export function parseLinearGradient(value) {
  const match = String(value)
    .trim()
    .match(/^linear-gradient\((.*)\)$/s)
  if (!match) throw new Error(`Not a linear gradient: ${value}`)

  const items = splitList(match[1])
  let angle = 180
  const direction = items[0].toLowerCase()
  const degrees = direction.match(/^(-?\d+(?:\.\d+)?)deg$/)
  if (degrees) {
    angle = parseFloat(degrees[1])
    items.shift()
  } else if (direction in SIDE_ANGLES) {
    angle = SIDE_ANGLES[direction]
    items.shift()
  } else if (/^to /.test(direction) || /^-?[\d.]+(turn|rad|grad)$/.test(direction)) {
    throw new Error(`Unsupported gradient direction "${items[0]}": ${value}`)
  }
  if (items.length < 2) throw new Error(`A gradient needs two color stops: ${value}`)

  const stops = items.map((item) => {
    const parts = item.match(/^(.*?)(?:\s+(-?\d+(?:\.\d+)?)%)?$/s)
    return {
      color: parts[1].trim(),
      position: parts[2] === undefined ? undefined : parseFloat(parts[2]) / 100
    }
  })
  stops[0].position ??= 0
  stops[stops.length - 1].position ??= 1
  for (let i = 1; i < stops.length - 1; i++) {
    if (stops[i].position !== undefined) continue
    let next = i + 1
    while (stops[next].position === undefined) next++
    const step = (stops[next].position - stops[i - 1].position) / (next - i + 1)
    stops[i].position = stops[i - 1].position + step
  }

  return {
    angle: ((angle % 360) + 360) % 360,
    stops: stops.map(({ color, position }) => ({ color, position: Number(position.toFixed(4)) }))
  }
}

/**
 * Expands a gradient token into the tokens iOS and Android print for it: the angle, and
 * the color and position of each stop. Each part has `segments` for its name
 * (`['stop1', 'color']`) and a path below the token's. The color of a stop keeps the
 * stop of the original value as its `original`, so with `outputReferences` it can name
 * the color it references.
 *
 * @param {Object} token - A resolved gradient token.
 * @returns {Object[]} Part tokens with `segments`, `path`, `$type`, `$value` and `original`.
 * @throws {Error} When the value is not a linear gradient this build reads, with the path.
 */
export function gradientParts(token) {
  let gradient
  try {
    gradient = parseLinearGradient(token.$value)
  } catch (error) {
    throw new Error(`${token.path.join('.')}: ${error.message}`, { cause: error })
  }
  let originalStops
  try {
    originalStops = parseLinearGradient(token.original?.$value).stops
  } catch {
    // The original is a reference to another gradient, or another form
  }
  if (originalStops?.length !== gradient.stops.length) originalStops = gradient.stops

  const part = (segments, $type, $value, original = $value) => ({
    segments,
    path: [...token.path, ...segments],
    $type,
    $value,
    original: { $value: original }
  })
  return [
    part(['angle'], 'number', gradient.angle),
    ...gradient.stops.flatMap(({ color, position }, index) => [
      part([`stop${index + 1}`, 'color'], 'color', color, originalStops[index].color),
      part([`stop${index + 1}`, 'position'], 'number', position)
    ])
  ]
}

/**
 * Returns a duration in milliseconds. The source writes durations without a unit, which
 * means milliseconds.
 *
 * @param {Object} token - A resolved token of type `duration`.
 * @returns {number} e.g. `250`
 * @throws {Error} When the value is not a duration.
 */
export function durationMilliseconds(token) {
  const match = String(token.$value)
    .trim()
    .match(/^(\d*\.?\d+)(ms|s)?$/)
  if (!match) throw new Error(`${token.path.join('.')}: "${token.$value}" is not a duration`)
  const [, number, unit] = match
  return unit === 's' ? Number((Number(number) * 1000).toFixed(3)) : Number(number)
}

/**
 * Returns the control points of a cubic Bézier easing.
 *
 * @param {Object} token - A resolved token of type `cubicBezier`, whose value is a
 *   comma-separated string or an array.
 * @returns {number[]} `x1`, `y1`, `x2` and `y2`, e.g. `[0.42, 0, 0.58, 1]`
 * @throws {Error} When the value is not four numbers, or `x1` or `x2` is outside 0 to 1.
 */
export function cubicBezierPoints(token) {
  const points = String(token.$value)
    .split(',')
    .map((point) => (point.trim() === '' ? NaN : Number(point)))
  const [x1, , x2] = points
  if (points.length !== 4 || points.some(isNaN) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new Error(`${token.path.join('.')}: "${token.$value}" is not a cubic Bézier curve`)
  }
  return points
}

/**
 * Returns a cubic Bézier easing as the parts of a platform without a value for one: a
 * number per control point. The parts have no references, as they have no tokens to name.
 *
 * @param {Object} token - A resolved token of type `cubicBezier`.
 * @returns {Object[]} `{ segments, path, $type, $value, original }` per part, in the order
 *   `x1`, `y1`, `x2`, `y2`.
 */
export function cubicBezierParts(token) {
  return cubicBezierPoints(token).map(($value, index) => {
    const segments = [['x1', 'y1', 'x2', 'y2'][index]]
    return {
      segments,
      path: [...token.path, ...segments],
      $type: 'number',
      $value,
      original: { $value }
    }
  })
}

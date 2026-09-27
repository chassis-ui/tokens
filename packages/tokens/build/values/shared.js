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
 * Parses a resolved colour value.
 *
 * tinycolor parses leniently: a `linear-gradient(…)` value would yield its first colour
 * stop. Gradient tokens are printed as parts (`gradientParts`), so a gradient here is an
 * error.
 *
 * @param {Object} token - A resolved token of type `color`.
 * @returns {Object|null} A tinycolor instance, or null (with a warning) if unparseable.
 * @throws {Error} When the value is a gradient.
 */
export function parseColor(token) {
  if (isGradient(token)) {
    throw new Error(`Gradient ${token.path.join('.')} is printed as parts, not as a colour`)
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
 * Checks whether a token is a base colour, the raw palette behind the context colours.
 * Base colours print their value on iOS and Android, also with `outputReferences`.
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
 * Returns the letter spacing part of a typography token in ems of its font size, to
 * four decimals, as the web rounds letter spacing. A value in px or without a unit is
 * divided by the font size; a percentage is divided by 100. Android's `letterSpacing`
 * takes ems. Letter spacing tokens outside a typography token have no font size and
 * return `undefined`.
 *
 * @param {Object} token - A resolved token with `$value` and `path`.
 * @param {string|number} [fontSize] - The font size part of the same typography token.
 * @returns {number|undefined} e.g. `-0.0052` for `-0.5px` at `96px`
 * @throws {Error} When the token is a letter spacing part without a font size.
 */
export function letterSpacingEm(token, fontSize) {
  if (token.path[token.path.length - 1] !== 'letterSpacing') return undefined
  if (fontSize === undefined) {
    throw new Error(`No font size for the letter spacing of ${token.path.join('.')}`)
  }
  const value = String(token.$value)
  const em = value.endsWith('%')
    ? parseFloat(value) / 100
    : value.endsWith('em')
      ? parseFloat(value)
      : parseFloat(value) / parseFloat(String(fontSize))
  return Number(em.toFixed(4)) || 0
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
 * Parses a CSS `linear-gradient(…)` value into its angle and colour stops. The angle is
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
  if (items.length < 2) throw new Error(`A gradient needs two colour stops: ${value}`)

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
 * the colour and position of each stop. Each part has `segments` for its name
 * (`['stop1', 'color']`) and a path below the token's. The colour of a stop keeps the
 * stop of the original value as its `original`, so with `outputReferences` it can name
 * the colour it references.
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

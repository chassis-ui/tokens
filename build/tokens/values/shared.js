/**
 * @file shared.js
 * @description Value helpers shared by the iOS and Android encoders. Every function takes
 *              a fully resolved token (or value) and never modifies it.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import Color from 'tinycolor2'
import { tokenTypes } from '../utils.js'

/**
 * A size value without math: at most a leading sign or operator, then no operator.
 */
const WITHOUT_MATH = /^[+\-*/]?[^+*/]*$/

/**
 * Parses a resolved colour value.
 *
 * tinycolor parses leniently: a `linear-gradient(…)` value yields its first colour stop,
 * which is what the mobile outputs contain for gradient tokens.
 *
 * @param {Object} token - A resolved token of type `color`.
 * @returns {Object|null} A tinycolor instance, or null (with a warning) if unparseable.
 */
export function parseColor(token) {
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
 * Returns a font weight name in lowercase, with its first space replaced by a hyphen.
 *
 * @param {string} value - e.g. `Semi Bold`
 * @returns {string} e.g. `semi-bold`
 */
export function fontWeightName(value) {
  return value.replace(' ', '-').toLowerCase()
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
  return Number(((parseFloat(token.$value) / 100) * parseFloat(fontSize)).toFixed(3))
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
      : parseFloat(value) / parseFloat(fontSize)
  return Number(em.toFixed(4)) || 0
}

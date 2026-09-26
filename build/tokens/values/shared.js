/**
 * @file shared.js
 * @description Value helpers shared by the iOS and Android encoders. Every function takes
 *              a fully resolved token (or value) and never modifies it.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import Color from 'tinycolor2'

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

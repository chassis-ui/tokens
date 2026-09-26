/**
 * @file web.js
 * @description Web (SCSS) value rules. `remSize` and `cssShadow` back the `cx/size/rem`
 *              and `cx/shadow/web` transforms; `encode` and `typographyMap` run at print
 *              time on resolved tokens. The `var(--…)` reference policy is not here.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { removeTrailingZeros } from '../utils.js'

/**
 * Converts each space-separated px value to rem, without rounding. Values already in
 * rem pass through.
 *
 * @param {Object} token - A token whose `$value` holds one or more sizes.
 * @param {number} basePxFontSize - Pixels per rem.
 * @returns {string} e.g. `0.0625rem`, `0rem`
 */
export function remSize(token, basePxFontSize) {
  return String(token.$value)
    .split(' ')
    .map((value) => {
      if (value.endsWith('rem')) return value
      const parsed = parseFloat(value)
      if (isNaN(parsed)) {
        throw new Error(
          `Invalid Number: '${token.name}: ${token.$value}' is not a valid number, cannot transform to 'rem'.`
        )
      }
      return `${parsed / basePxFontSize}rem`
    })
    .join(' ')
}

/**
 * Formats a shadow object or array as a CSS `box-shadow` value. Non-object values pass
 * through.
 *
 * @param {Object|Object[]|string} value - Shadow layer(s) with offsetX, offsetY, blur,
 *   spread, color and type.
 * @returns {string} e.g. `0rem 0.125rem 0.25rem 0rem rgba(0, 0, 0, 0.1) inset`
 */
export function cssShadow(value) {
  if (typeof value !== 'object') return value
  const layers = Array.isArray(value) ? value : [value]
  return layers
    .map(({ offsetX, offsetY, blur, spread, color, type }) => {
      return `${offsetX} ${offsetY} ${blur} ${spread} ${color}${type === 'innerShadow' ? ' inset' : ''}`
    })
    .join(', ')
}

/**
 * Converts a letter spacing to em by keeping its number and dropping its unit.
 *
 * @param {string|number} value - e.g. `-0.0313rem`
 * @returns {string} e.g. `-0.0313em`
 */
export function letterSpacingEm(value) {
  return `${parseFloat(value)}em`
}

/**
 * Expresses a line height relative to its font size, to three decimals without trailing
 * zeros.
 *
 * @param {string|number} lineHeight - e.g. `3.5rem`
 * @param {string|number} fontSize - e.g. `2.75rem`
 * @returns {string} e.g. `1.273em`
 */
export function lineHeightEm(lineHeight, fontSize) {
  return `${removeTrailingZeros((parseFloat(lineHeight) / parseFloat(fontSize)).toFixed(3))}em`
}

/**
 * Converts a literal percent line height to em; other values pass through.
 *
 * @param {string} value - e.g. `125%`
 * @returns {string} e.g. `1.25em`
 */
export function percentToEm(value) {
  return value.endsWith('%') ? `${parseFloat(value) / 100}em` : value
}

/**
 * Builds the Sass map for a typography token. Keys and their order are part of the
 * output contract.
 *
 * @param {Object} parts - Values already in their final form, except `letterSpacing`,
 *   which is converted to em here.
 * @returns {string} e.g. `("font-family": var(--font-family-text), …)`
 */
export function typographyMap({
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  fontStyle,
  letterSpacing,
  paragraphSpacing,
  textCase,
  textDecoration
}) {
  return `(${[
    `"font-family": ${fontFamily}`,
    `"font-weight": ${fontWeight}`,
    `"font-size": ${fontSize}`,
    `"line-height": ${lineHeight}`,
    `"font-style": ${fontStyle}`,
    `"letter-spacing": ${letterSpacingEm(letterSpacing)}`,
    `"margin-bottom": ${paragraphSpacing}`,
    `"text-transform": ${textCase}`,
    `"text-decoration": ${textDecoration}`
  ].join(', ')})`
}

/**
 * Encodes a resolved token that is neither covered by the `var(--…)` policy nor a
 * typography token.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {Object} context
 * @param {Function} context.resolveReference - Returns the resolved value of a
 *   `{path.to.token}` reference.
 * @returns {string} The SCSS value.
 */
export function encode(token, { resolveReference }) {
  const { $type: type, $value: value, path } = token

  if (type === 'lineHeight') {
    // A line height is relative to the font size at the same path.
    return lineHeightEm(value, resolveReference(`{typography.fontSize.${path[2]}.${path[3]}}`))
  }
  if (path[1] === 'letterSpacing') {
    return letterSpacingEm(value)
  }
  if (type === 'asset') {
    return `"${value}"`
  }
  return String(value)
}

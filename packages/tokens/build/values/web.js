/**
 * @file web.js
 * @description Web (SCSS) value rules. `remSize`, `pxSize`, `vwSize` and `cssShadow` back
 *              the `cx/size/*` and `cx/shadow/web` transforms; `encode` and
 *              `typographyMap` run at print time on resolved tokens. The reference
 *              policies are not here.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { removeTrailingZeros } from '../utils.js'

/**
 * Converts each space-separated px value to a unit, without rounding. Values already in
 * that unit pass through.
 *
 * @param {Object} token - A token whose `$value` holds one or more sizes.
 * @param {string} unit - `rem`, `px` or `vw`.
 * @param {number} pxPerUnit - Pixels per unit.
 * @returns {string} The sizes in the unit.
 */
function convertSizes(token, unit, pxPerUnit) {
  return String(token.$value)
    .split(' ')
    .map((value) => {
      if (value.endsWith(unit)) return value
      const parsed = parseFloat(value)
      if (isNaN(parsed)) {
        throw new Error(
          `Invalid Number: '${token.name}: ${token.$value}' is not a valid number, cannot transform to '${unit}'.`
        )
      }
      return `${parsed / pxPerUnit}${unit}`
    })
    .join(' ')
}

/**
 * Converts each space-separated px value to rem, without rounding. Values already in
 * rem pass through.
 *
 * @param {Object} token - A token whose `$value` holds one or more sizes.
 * @param {number} basePxFontSize - Pixels per rem.
 * @returns {string} e.g. `0.0625rem`, `0rem`
 */
export function remSize(token, basePxFontSize) {
  return convertSizes(token, 'rem', basePxFontSize)
}

/**
 * Gives each space-separated value the unit px. Values already in px pass through.
 *
 * @param {Object} token - A token whose `$value` holds one or more sizes.
 * @returns {string} e.g. `6px`, `0px`
 */
export function pxSize(token) {
  return convertSizes(token, 'px', 1)
}

/**
 * Converts each space-separated px value to vw, without rounding: `basePxFontSize`
 * pixels are 1vw. Values already in vw pass through.
 *
 * @param {Object} token - A token whose `$value` holds one or more sizes.
 * @param {number} basePxFontSize - Pixels per vw.
 * @returns {string} e.g. `0.375vw`, `0vw`
 */
export function vwSize(token, basePxFontSize) {
  return convertSizes(token, 'vw', basePxFontSize)
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
 * Converts a letter spacing to em. A value in px is divided by the base font size and
 * rounded to four decimals, as the math on rem values is. Other values keep their number
 * and drop their unit.
 *
 * @param {string|number} value - e.g. `-0.0313rem`, `-0.5px`
 * @param {number} [basePxFontSize] - Pixels per em, for values in px.
 * @returns {string} e.g. `-0.0313em`
 */
export function letterSpacingEm(value, basePxFontSize = 16) {
  if (String(value).endsWith('px')) {
    return `${removeTrailingZeros((parseFloat(String(value)) / basePxFontSize).toFixed(4))}em`
  }
  return `${parseFloat(String(value))}em`
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
  return `${removeTrailingZeros((parseFloat(String(lineHeight)) / parseFloat(String(fontSize))).toFixed(3))}em`
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
 * @param {number} [basePxFontSize] - Pixels per em, for a letter spacing in px.
 * @returns {string} e.g. `("font-family": var(--font-family-text), …)`
 */
export function typographyMap(
  {
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    fontStyle,
    letterSpacing,
    paragraphSpacing,
    textCase,
    textDecoration
  },
  basePxFontSize
) {
  return `(${[
    `"font-family": ${fontFamily}`,
    `"font-weight": ${fontWeight}`,
    `"font-size": ${fontSize}`,
    `"line-height": ${lineHeight}`,
    `"font-style": ${fontStyle}`,
    `"letter-spacing": ${letterSpacingEm(letterSpacing, basePxFontSize)}`,
    `"margin-bottom": ${paragraphSpacing}`,
    `"text-transform": ${textCase}`,
    `"text-decoration": ${textDecoration}`
  ].join(', ')})`
}

/**
 * Builds the Sass map for a typography token from its resolved value, without
 * references. The family list is quoted as one string. A line height is relative to the
 * font size, and a percent line height is converted to em.
 *
 * @param {Object} value - The resolved `$value` of a typography token.
 * @param {number} [basePxFontSize] - Pixels per em, for a letter spacing in px.
 * @returns {string} e.g. `("font-family": "Inter, system-ui", "font-weight": 700, …)`
 */
export function resolvedTypographyMap(value, basePxFontSize) {
  const { fontFamily, fontSize, lineHeight } = value
  return typographyMap(
    {
      ...value,
      fontFamily: `"${fontFamily}"`,
      lineHeight: String(lineHeight).endsWith('%')
        ? percentToEm(lineHeight)
        : lineHeightEm(lineHeight, fontSize)
    },
    basePxFontSize
  )
}

/**
 * Encodes a resolved token that is neither covered by a reference policy nor a
 * typography token.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {Object} context
 * @param {Function} context.resolveReference - Returns the resolved value of a
 *   `{path.to.token}` reference.
 * @param {number} [context.basePxFontSize] - Pixels per em, for a letter spacing in px.
 * @returns {string} The SCSS value.
 */
export function encode(token, { resolveReference, basePxFontSize }) {
  const { $type: type, $value: value, path } = token

  if (type === 'lineHeight') {
    // A line height is relative to the font size at the same path.
    return lineHeightEm(value, resolveReference(`{typography.fontSize.${path[2]}.${path[3]}}`))
  }
  if (path[1] === 'letterSpacing') {
    return letterSpacingEm(value, basePxFontSize)
  }
  if (type === 'asset') {
    return `"${value}"`
  }
  return String(value)
}

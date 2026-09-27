/**
 * @file scss-var-policy.js
 * @description Values of the SCSS variables format (`cx/scss-variables`), for teams that
 *              do not use chassis-css: every token prints its resolved value. Functions
 *              here are pure; token lookups are passed in as `references`, see
 *              `css-var-policy.js`.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { encode, resolvedTypographyMap } from './values/web.js'

/**
 * Returns the SCSS value of a web token: a typography map or the encoded value.
 *
 * @param {Object} token - A resolved token with `$type`, `$value` and `path`.
 * @param {Object} references - Token lookups.
 * @param {Object} [platform] - The platform configuration, for `basePxFontSize`.
 * @returns {string} The SCSS value.
 */
export function scssValue(token, references, { basePxFontSize } = {}) {
  try {
    if (token.$type === 'typography') {
      return resolvedTypographyMap(token.$value, basePxFontSize)
    }
    return encode(token, { resolveReference: references.value, basePxFontSize })
  } catch (error) {
    throw new Error(`${token.path.join('.')}: ${error.message}`, { cause: error })
  }
}

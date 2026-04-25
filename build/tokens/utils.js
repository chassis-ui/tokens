/**
 * @file utils.js
 * @description This file provides utility functions and mappings for Style Dictionary.
 *              It includes token type mappings, font weight utilities, and reference handling.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

/**
 * A mapping of token types to their respective categories.
 */
export const tokenTypes = {
  color: ['color'],
  font: [
    'fontFamily',
    'fontSize',
    'fontStyle',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'paragraphSpacing',
    'textCase',
    'textDecoration',
    'typography'
  ],
  gradient: ['gradient'],
  number: ['duration', 'letterSpacing', 'number', 'opacity'],
  shadow: ['shadow'],
  size: ['dimension', 'fontSize', 'lineHeight', 'paragraphSpacing'],
  string: [
    'asset',
    'content',
    'fontFamily',
    'fontStyle',
    'fontWeight',
    'string',
    'text',
    'textCase',
    'textDecoration',
    'type'
  ]
}

/**
 * A mapping of font weight names to their numeric values.
 */
export const fontWeightMap = {
  hairline: 100,
  thin: 100,
  extralight: 200,
  ultralight: 200,
  extraleicht: 200,
  light: 300,
  leicht: 300,
  normal: 400,
  regular: 400,
  buch: 400,
  book: 400,
  medium: 500,
  kraeftig: 500,
  kräftig: 500,
  semibold: 600,
  demibold: 600,
  halbfett: 600,
  bold: 700,
  dreiviertelfett: 700,
  extrabold: 800,
  ultrabold: 800,
  fett: 800,
  black: 900,
  heavy: 900,
  super: 900,
  extrafett: 900,
  ultra: 950,
  ultrablack: 950,
  extrablack: 950
}

/**
 * Retrieves the numeric font weight for a given value.
 *
 * @param {string|number} value - The font weight value (name or numeric).
 * @returns {number} - The numeric font weight.
 */
export function getFontWeight(value) {
  if (typeof value === 'string') {
    const cleanedValue = value.toLowerCase().replace(/normal|italic|oblique|\s/g, '')
    return fontWeightMap[cleanedValue] || 400
  }
  return value
}

/**
 * Determines the font style (normal, italic, or oblique) from a given value.
 *
 * @param {string} value - The font style value.
 * @returns {string} - The font style ('normal', 'italic', or 'oblique').
 */
export function getFontStyle(value) {
  if (typeof value === 'string') {
    if (/italic/i.test(value)) return 'italic'
    if (/oblique/i.test(value)) return 'oblique'
  }
  return 'normal'
}

/**
 * Checks if a token is referencing another token.
 *
 * @param {Object} token - The token object to check.
 * @returns {boolean} - True if the token is referencing another token, false otherwise.
 */
export function isReference(value) {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value)
}

/**
 * Splits a token reference string into its components.
 *
 * @param {string} value - The reference string to split.
 * @returns {Array<string>|string} - An array of reference components if valid, otherwise the original value.
 */
export function splitReference(value) {
  if (isReference(value)) {
    return value.slice(1, -1).split('.')
  }
  console.warn('Not a reference:', value)
  return value
}

/**
 * Removes unnecessary trailing zeros from a number.
 *
 * @param {number|string} value - The value to format.
 * @returns {string} - Formatted number without trailing zeros.
 */
export function removeTrailingZeros(value) {
  // Convert to string first if it's a number
  const strValue = String(value)

  // Only process if it contains a decimal point
  if (strValue.includes('.')) {
    return strValue.replace(/\.?0+$/, '')
  }

  return strValue
}

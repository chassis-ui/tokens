/**
 * @file utils.js
 * @description This file provides utility functions and mappings for Style Dictionary.
 *              It includes token type mappings and reference handling.
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

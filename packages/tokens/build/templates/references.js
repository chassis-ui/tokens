/**
 * @file references.js
 * @description The token lookups of the iOS and Android templates: the token a reference
 *              names, and the font size a typography part is encoded with.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { getReferences } from 'style-dictionary/utils'

/**
 * Returns the first token that a token's original value references, from the tokens of
 * the file being printed. Style Dictionary passes a format the tokens of its file only,
 * so a reference to a token of another file finds nothing.
 *
 * @param {Object} token - A resolved token with `original`.
 * @param {Object} tokens - The token tree of the file, `dictionary.tokens`.
 * @returns {Object|undefined}
 */
export function firstReferencedToken(token, tokens) {
  return getReferences(token.original.$value, tokens, {
    usesDtcg: true,
    warnImmediately: false
  })[0]
}

/**
 * Parts of a typography token whose value depends on the font size of the same token.
 */
const FONT_SIZE_PARTS = ['lineHeight', 'letterSpacing']

/**
 * Returns the encoding context of a token: for the line height and letter spacing parts
 * of a typography token, the resolved font size part of the same token. Style Dictionary
 * expands the parts of a typography token into the same file, next to each other.
 *
 * @param {Object} token - A resolved token with `path`.
 * @param {Object} tokens - The token tree of the file, `dictionary.tokens`.
 * @returns {Object} `{ fontSize }`, or `{}` for other tokens.
 */
export function encodingContext(token, tokens) {
  const { path } = token
  if (!FONT_SIZE_PARTS.includes(path[path.length - 1])) return {}
  const fontSize = [...path.slice(0, -1), 'fontSize'].reduce((node, key) => node?.[key], tokens)
  return fontSize?.$value === undefined ? {} : { fontSize: fontSize.$value }
}

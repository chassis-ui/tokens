/**
 * @file references.js
 * @description The reference lookup of the iOS and Android templates.
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

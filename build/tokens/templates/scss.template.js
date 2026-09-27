/**
 * @file scss.template.js
 * @description Template for generating SCSS variables from design tokens. Prints one
 *              `$name: value !default;` per token; values come from the policy of the
 *              format, `css-var-policy.js` or `scss-var-policy.js`.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { getReferences, resolveReferences } from 'style-dictionary/utils'

const usesDtcg = true

/**
 * Generates the SCSS variables template.
 *
 * @param {Object} opts - The options object containing the dictionary, file, header and
 *   platform, and `value`, the function of the format that returns the value of a token.
 * @returns {string} - The generated SCSS variables template as a string.
 */
export default (opts) => {
  const { dictionary, file, header, platform, value } = opts

  // Lookups in this file's token set, for the reference policy
  const references = {
    token: (reference) => getReferences(reference, dictionary.tokens, { usesDtcg })[0],
    value: (reference) => resolveReferences(reference, dictionary.tokens, { usesDtcg })
  }

  const tokenToLine = (token) =>
    `$${token.name}: ${value(token, references, platform)} !default;${token.comment ? ` // ${token.comment}` : ''}`

  return `
//
// ${file.destination}
//
${header}
${platform?.prefix ? `$prefix: ${platform.prefix}- !default;` : `$prefix: null !default;`}
// scss-docs-start design-tokens
${dictionary.allTokens.map(tokenToLine).join(`\n`)}
// scss-docs-end design-tokens
`
}

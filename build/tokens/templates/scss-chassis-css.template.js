/**
 * @file scss-chassis-css.template.js
 * @description Template for generating SCSS variables from design tokens. Prints one
 *              `$name: value !default;` per token; values come from `css-var-policy.js`.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { getReferences, resolveReferences } from 'style-dictionary/utils'
import { webValue } from '../css-var-policy.js'

const usesDtcg = true

/**
 * Generates the SCSS variables template.
 *
 * @param {Object} opts - The options object containing the dictionary, file, header and platform.
 * @returns {string} - The generated SCSS variables template as a string.
 */
export default (opts) => {
  const { dictionary, file, header, platform } = opts

  // Lookups in this file's token set, for the reference policy
  const references = {
    token: (value) => getReferences(value, dictionary.tokens, { usesDtcg })[0],
    value: (value) => resolveReferences(value, dictionary.tokens, { usesDtcg })
  }

  const tokenToLine = (token) =>
    `$${token.name}: ${webValue(token, references)} !default;${token.comment ? ` // ${token.comment}` : ''}`

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

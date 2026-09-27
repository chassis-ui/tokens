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
import { filters } from '../filters.js'

const usesDtcg = true

/**
 * Checks whether a file of the build declares a token: one of the file filters selects it.
 */
const isEmitted = (token) => Object.values(filters).some((filter) => filter(token))

/**
 * Generates the SCSS variables template.
 *
 * @param {Object} opts - The options object containing the dictionary, file, header and
 *   platform; `value`, the function of the format that returns the value of a token;
 *   and `settings`, which it passes to `value`.
 * @returns {string} - The generated SCSS variables template as a string.
 */
export default (opts) => {
  const { dictionary, file, header, platform, value, settings } = opts

  // Lookups for the reference policies. `token` and `value` see this file's token set;
  // `variable` sees every token of the build.
  const references = {
    token: (reference) => getReferences(reference, dictionary.tokens, { usesDtcg })[0],
    value: (reference) => resolveReferences(reference, dictionary.tokens, { usesDtcg }),
    variable: (path) => {
      const target = path.reduce((group, key) => group?.[key], dictionary.unfilteredTokens)
      if (!target?.name || !('$value' in target) || !isEmitted(target)) {
        throw new Error(`No file declares a variable for ${path.join('.')}`)
      }
      return `$${target.name}`
    }
  }

  const tokenToLine = (token) =>
    `$${token.name}: ${value(token, references, settings)} !default;${token.comment ? ` // ${token.comment}` : ''}`

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

/**
 * @file android-resources.template.js
 * @description Template for generating Android resources XML files from design tokens.
 *              Prints one element per token; the element, value and reference come from
 *              `values/android.js`.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { encode, reference, resourceTag } from '../values/android.js'
import { firstReferencedToken } from './references.js'

/**
 * Generates an Android resources XML file from the provided tokens.
 *
 * @param {Object} opts - The options object containing the following properties:
 *   @param {Object} opts.dictionary - The dictionary object containing all tokens.
 *   @param {string} opts.header - The header string to include at the top of the XML file.
 *   @param {Object} opts.settings - `outputReferences`: print references to other
 *     resources of the file where `reference` allows it.
 * @returns {string} - A string representing the Android resources XML file.
 */
export default (opts) => {
  const { dictionary, header, settings } = opts

  const tokenToLine = (token) => {
    const { tag, attributes } = resourceTag(token)
    const value =
      (settings.outputReferences &&
        reference(token, firstReferencedToken(token, dictionary.tokens))) ||
      encode(token)
    const comment = token.comment ? ` <!-- ${token.comment} -->` : ''
    return `<${tag} name="${token.name}"${attributes}>${value}</${tag}>${comment}`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>

${header}

<resources>
  ${dictionary.allTokens.map(tokenToLine).join(`\n  `)}
</resources>
`
}

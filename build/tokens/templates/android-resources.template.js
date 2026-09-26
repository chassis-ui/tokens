/**
 * @file android-resources.template.js
 * @description Template for generating Android resources XML files from design tokens.
 *              Prints one element per token; the element and value come from
 *              `values/android.js`.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { encode, resourceType } from '../values/android.js'

/**
 * Generates an Android resources XML file from the provided tokens.
 *
 * @param {Object} opts - The options object containing the following properties:
 *   @param {Object} opts.dictionary - The dictionary object containing all tokens.
 *   @param {string} opts.header - The header string to include at the top of the XML file.
 * @returns {string} - A string representing the Android resources XML file.
 */
export default (opts) => {
  const { dictionary, header } = opts

  const tokenToLine = (token) => {
    const element = resourceType(token)
    const comment = token.comment ? ` <!-- ${token.comment} -->` : ''
    return `<${element} name="${token.name}">${encode(token)}</${element}>${comment}`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>

${header}

<resources>
  ${dictionary.allTokens.map(tokenToLine).join(`\n  `)}
</resources>
`
}

/**
 * @file scss-chassis-css.template.js
 * @description Template for generating SCSS variables from design tokens. It processes tokens
 *              to create SCSS variable declarations, resolving references and formatting values
 *              for use in SCSS files.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { getReferences, resolveReferences } from 'style-dictionary/utils'
import { isReference, splitReference, abbreviateScale } from '../utils.js'
import { encode, percentToEm, typographyMap } from '../values/web.js'

const usesDtcg = true

/**
 * Resolves original typography properties (fontStyle, letterSpacing, etc.) from a token.
 *
 * @param {Object} originalValue - The original.$value object of the token.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {Object} - The resolved typography properties.
 */
function resolveOriginals(originalValue, dictionary) {
  return {
    fontStyle: originalValue.fontStyle,
    letterSpacing: resolveReferences(originalValue.letterSpacing, dictionary.tokens, { usesDtcg }),
    paragraphSpacing: resolveReferences(originalValue.paragraphSpacing, dictionary.tokens, {
      usesDtcg
    }),
    textCase: resolveReferences(originalValue.textCase, dictionary.tokens, { usesDtcg }),
    textDecoration: resolveReferences(originalValue.textDecoration, dictionary.tokens, { usesDtcg })
  }
}

/**
 * Resolves the value of a reference token.
 *
 * @param {Object} token - The token object containing the reference.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {string} - The resolved SCSS variable reference value.
 */
function resolveReferenceValue(token, dictionary) {
  const ref = splitReference(token.original.$value)
  const refMapping = {
    'color|context': (ref) => `var(--${ref[2]}-${ref[3]})`,
    'color|primitive': (ref) => `var(--${ref[2]}-${ref[3]})`,
    'space|context': (ref) => `var(--space-${ref[2]})`,
    'opacity|context': (ref) => `var(--opacity-${ref[2]})`,
    'shadow|context': (ref) => `var(--box-shadow-${abbreviateScale(ref[2])})`,
    'opacity|level': (ref) => `var(--opacity-${ref[2]})`,
    'borderRadius|context': (ref) => `var(--border-radius-${abbreviateScale(ref[2])})`,
    'borderWidth|context': (ref) => `var(--border-width-${abbreviateScale(ref[2])})`
  }

  const key = `${ref[0]}|${ref[1] || ''}`.trim()
  if (refMapping[key]) {
    return refMapping[key](ref)
  }

  // For borderRadius/borderWidth tokens referencing base tokens,
  // check if the reference ultimately points to a context token.
  if (['borderRadius', 'borderWidth'].includes(ref[0]) && ref[1] === 'base') {
    const cssProperty = ref[0] === 'borderRadius' ? 'border-radius' : 'border-width'
    // Direct base.context reference
    if (ref[2] === 'context') {
      return `var(--${cssProperty}-${abbreviateScale(ref[3])})`
    }
    // Follow chain: base.<component>.<size> → base.context.<size>
    try {
      const refToken = getReferences(token.original.$value, dictionary.tokens, { usesDtcg })[0]
      if (refToken && isReference(refToken.original.$value)) {
        const innerRef = splitReference(refToken.original.$value)
        if (innerRef[0] === ref[0] && innerRef.includes('context')) {
          const name = innerRef[innerRef.length - 1]
          return `var(--${cssProperty}-${abbreviateScale(name)})`
        }
      }
    } catch {
      /* base token not in this build config */
    }
  }

  return token.$value
}

/**
 * Resolves the value of a context typography token.
 *
 * @param {Object} token - The typography token object.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {string} - The resolved typography value as a SCSS-compatible string.
 */
function resolveContextTypographyValue(token, dictionary) {
  const fontFamily = splitReference(token.original.$value.fontFamily)[2]
  const fontWeight = splitReference(token.original.$extensions['chassis'].originalFontWeight)
  const referenceFs =
    getReferences(token.original.$value.fontSize, dictionary.tokens, {
      usesDtcg
    })[0] || token.original.$value.fontSize
  const referenceLh =
    getReferences(token.original.$value.lineHeight, dictionary.tokens, {
      usesDtcg
    })[0] || token.original.$value.lineHeight

  const fontSize =
    referenceFs && referenceFs.$type === 'fontSize'
      ? `var(--font-size-${referenceFs.path[2]}-${abbreviateScale(referenceFs.path[3])})`
      : referenceFs.$value
  // A literal (non-reference) line height may be a percentage
  const lineHeight =
    referenceLh && referenceLh.$type === 'lineHeight'
      ? `var(--line-height-${referenceLh.path[2]}-${abbreviateScale(referenceLh.path[3])})`
      : referenceLh.$value
        ? referenceLh.$value
        : percentToEm(referenceLh)

  return typographyMap({
    fontFamily: `var(--font-family-${fontFamily})`,
    fontWeight: `var(--font-weight-${fontWeight[2]}-${fontWeight[3]})`,
    fontSize,
    lineHeight,
    ...resolveOriginals(token.original.$value, dictionary)
  })
}

/**
 * Resolves the value of a component typography token.
 *
 * @param {Object} token - The typography token object.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {string} - The resolved typography value as a SCSS-compatible string.
 */
function resolveComponentTypographyValue(token, dictionary) {
  const ref = splitReference(token.original.$value)
  const res = getReferences(token.original.$value, dictionary.tokens, { usesDtcg })[0]

  return typographyMap({
    fontFamily: `var(--font-family-${ref[1]})`,
    fontWeight: `var(--font-weight-${ref[3]})`,
    fontSize: `var(--font-size-${abbreviateScale(ref[2])})`,
    lineHeight: `var(--line-height-${abbreviateScale(ref[2])})`,
    ...resolveOriginals(res.original.$value, dictionary)
  })
}

/**
 * Converts a token to its corresponding value.
 *
 * @param {Object} token - The token object to convert.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {string} - The token's resolved value as a SCSS-compatible string.
 */
function tokenToValue(token, dictionary) {
  if (
    token.original &&
    isReference(token.original.$value) &&
    ['color', 'space', 'opacity', 'shadow', 'borderRadius', 'borderWidth'].includes(
      token.path[0]
    ) &&
    !(['borderRadius', 'borderWidth'].includes(token.path[0]) && token.path[1] === 'context') &&
    !(['borderRadius', 'borderWidth'].includes(token.path[0]) && token.path[1] === 'base') &&
    !(
      token.path[0] === 'shadow' &&
      ['idle', 'hover', 'press', 'disabled', 'focus', 'highlight'].includes(token.path[2])
    )
  ) {
    return resolveReferenceValue(token, dictionary)
  } else if (token.$type === 'typography') {
    if (typeof token.original.$value !== 'object') {
      return resolveComponentTypographyValue(token, dictionary)
    }
    return resolveContextTypographyValue(token, dictionary)
  }
  return encode(token, {
    resolveReference: (reference) => resolveReferences(reference, dictionary.tokens, { usesDtcg })
  })
}

/**
 * Converts a token to a SCSS variable declaration line.
 *
 * @param {Object} token - The token object to convert.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @param {Object} options - Options for formatting the SCSS variable.
 * @returns {string} - The SCSS variable declaration line for the token.
 */
function tokenToLine(token, dictionary, options) {
  return `$${token.name}: ${tokenToValue(token, dictionary, options)} !default;${token.comment ? ` // ${token.comment}` : ''}`
}

/**
 * Generates the SCSS variables template.
 *
 * @param {Object} opts - The options object containing the dictionary, options, file, and header.
 * @returns {string} - The generated SCSS variables template as a string.
 */
export default (opts) => {
  const { dictionary, options, file, header, platform } = opts

  return `
//
// ${file.destination}
//
${header}
${platform?.prefix ? `$prefix: ${platform.prefix}- !default;` : `$prefix: null !default;`}
// scss-docs-start design-tokens
${dictionary.allTokens.map((token) => tokenToLine(token, dictionary, options)).join(`\n`)}
// scss-docs-end design-tokens
`
}

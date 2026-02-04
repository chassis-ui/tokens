/**
 * @file scss-references.template.js
 * @description Template for generating SCSS variables from design tokens. It processes tokens
 *              to create SCSS variable declarations, resolving references and formatting values
 *              for use in SCSS files.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { getReferences, resolveReferences } from 'style-dictionary/utils'
import { isReference, splitReference, removeTrailingZeros } from '../utils.js'

const usesDtcg = true
const prefix = '$cx'

/**
 * Resolves the value of a reference token.
 *
 * @param {Object} token - The token object containing the reference.
 * @returns {string} - The resolved SCSS variable reference value.
 */
function resolveReferenceValue(token) {
  const ref = splitReference(token.original.$value)
  const refMapping = {
    'color|context': (ref) => `${prefix}-color-context-${ref[2]}-${ref[3]}`,
    'color|palette': (ref) => `${prefix}-color-palette-${ref[2]}-${ref[3]}`,
    'space|context': (ref) => `${prefix}-space-context-${ref[2]}`,
    opacity: (ref) => `${prefix}-opacity-${ref[2]}`,
    'borderRadius|context': (ref) =>
      `${prefix}-border-radius-context-${ref[2].includes('round') ? 'round' : ref[2]}`,
    'borderWidth|context': (ref) => `${prefix}-border-width-context-${ref[2]}`
  }

  const key = `${ref[0]}|${ref[1] || ''}`.trim()
  return refMapping[key] ? refMapping[key](ref) : token.$value
  // return token.$value
}

/**
 * Resolves the value of a basic typography token.
 *
 * @param {Object} token - The typography token object.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {string} - The resolved typography value as a SCSS-compatible string.
 */
function resolveBasicTypographyValue(token, dictionary) {
  const fontFamily = splitReference(token.original.$value.fontFamily)[2]
  const fontWeight = splitReference(token.original.$extensions['chassis'].originalFontWeight)[3]
  const lineHeight = splitReference(token.original.$value.lineHeight)[3]
  const fontSize = splitReference(token.original.$value.fontSize)[3]

  const originals = {
    fontWeight: token.original.$value.fontWeight,
    fontStyle: token.original.$value.fontStyle,
    fontSize: resolveReferences(token.original.$value.fontSize, dictionary.tokens, {
      usesDtcg
    }),
    lineHeight: resolveReferences(token.original.$value.lineHeight, dictionary.tokens, {
      usesDtcg
    }),
    letterSpacing: resolveReferences(token.original.$value.letterSpacing, dictionary.tokens, {
      usesDtcg
    }),
    paragraphSpacing: resolveReferences(token.original.$value.paragraphSpacing, dictionary.tokens, {
      usesDtcg
    }),
    textCase: resolveReferences(token.original.$value.textCase, dictionary.tokens, { usesDtcg }),
    textDecoration: resolveReferences(token.original.$value.textDecoration, dictionary.tokens, {
      usesDtcg
    })
  }

  return `(${[
    `"font-family": ${prefix}-typography-font-family-${fontFamily}`,
    `"font-weight": ${originals.fontWeight}`,
    `"font-size": ${originals.fontSize}`,
    `"line-height": ${originals.lineHeight}`,
    `"font-style": ${originals.fontStyle}`,
    `"letter-spacing": ${parseFloat(originals.letterSpacing)}`,
    `"margin-bottom": ${originals.paragraphSpacing}`,
    `"text-transform": ${originals.textCase}`,
    `"text-decoration": ${originals.textDecoration}`
  ].join(', ')})`
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
      ? `${prefix}-typography-font-size-${referenceFs.path[2]}-${referenceFs.path[3]}`
      : referenceFs.$value
  // If the reference is a percentage, convert it to a decimal
  const lineHeight =
    referenceLh && referenceLh.$type === 'lineHeight'
      ? `${prefix}-typography-line-height-${referenceLh.path[2]}-${referenceLh.path[3]}`
      : referenceLh.$value
        ? referenceLh.$value
        : referenceLh.endsWith('%')
          ? `${parseFloat(referenceLh) / 100}em`
          : referenceLh

  const originals = {
    fontStyle: token.original.$value.fontStyle,
    letterSpacing: resolveReferences(token.original.$value.letterSpacing, dictionary.tokens, {
      usesDtcg
    }),
    paragraphSpacing: resolveReferences(token.original.$value.paragraphSpacing, dictionary.tokens, {
      usesDtcg
    }),
    textCase: resolveReferences(token.original.$value.textCase, dictionary.tokens, { usesDtcg }),
    textDecoration: resolveReferences(token.original.$value.textDecoration, dictionary.tokens, {
      usesDtcg
    })
  }

  return `(${[
    `"font-family": ${prefix}-typography-font-family-${fontFamily}`,
    `"font-weight": ${prefix}-typography-font-weight-${fontWeight[2]}-${fontWeight[3]}-weight`,
    `"font-size": ${fontSize}`,
    `"line-height": ${lineHeight}`,
    `"font-style": ${prefix}-typography-font-weight-${fontWeight[2]}-${fontWeight[3]}-style`,
    `"letter-spacing": ${parseFloat(originals.letterSpacing)}`,
    `"margin-bottom": ${originals.paragraphSpacing}`,
    `"text-transform": ${originals.textCase}`,
    `"text-decoration": ${originals.textDecoration}`
  ].join(', ')})`
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
  const original = resolveReferences(token.original.$value, dictionary.tokens)
  const originals = {
    fontStyle: original.original.$value.fontStyle,
    letterSpacing: resolveReferences(original.original.$value.letterSpacing, dictionary.tokens, {
      usesDtcg
    }),
    paragraphSpacing: resolveReferences(
      original.original.$value.paragraphSpacing,
      dictionary.tokens,
      { usesDtcg }
    ),
    textCase: resolveReferences(original.original.$value.textCase, dictionary.tokens, { usesDtcg }),
    textDecoration: resolveReferences(original.original.$value.textDecoration, dictionary.tokens, {
      usesDtcg
    })
  }

  return `(${[
    `"font-family": ${prefix}-typography-font-family-${ref[1]}`,
    `"font-weight": ${prefix}-typography-font-weight-${ref[1]}-${ref[3]}-weight`,
    `"font-size": ${prefix}-typography-font-size-${ref[1]}-${ref[2]}`,
    `"line-height": ${prefix}-typography-line-height-${ref[1]}-${ref[2]}`,
    `"font-style": ${prefix}-typography-font-weight-${ref[1]}-${ref[3]}-style`,
    `"letter-spacing": ${originals.letterSpacing}`,
    `"margin-bottom": ${originals.paragraphSpacing}`,
    `"text-transform": ${originals.textCase}`,
    `"text-decoration": ${originals.textDecoration}`
  ].join(', ')})`
}

/**
 * Converts a token to its corresponding value.
 *
 * @param {Object} token - The token object to convert.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @param {Object} options - Options for resolving references and formatting.
 * @returns {string} - The token's resolved value as a SCSS-compatible string.
 */
function tokenToValue(token, dictionary) {
  if (
    token.original &&
    isReference(token.original.$value) &&
    ['color', 'space', 'opacity', 'borderRadius', 'borderWidth'].includes(token.path[0])
  ) {
    return resolveReferenceValue(token)
  } else if (
    token.$type === 'typography' &&
    typeof token.original.$value === 'object' &&
    token.path[1] !== 'context'
  ) {
    return resolveBasicTypographyValue(token, dictionary)
  } else if (
    token.$type === 'typography' &&
    typeof token.original.$value === 'object' &&
    token.path[1] === 'context'
  ) {
    return resolveContextTypographyValue(token, dictionary)
  } else if (token.$type === 'typography' && typeof token.original.$value !== 'object') {
    return resolveComponentTypographyValue(token, dictionary)
  } else if (token.$type === 'lineHeight') {
    const fs = resolveReferences(
      `{typography.fontSize.${token.path[2]}.${token.path[3]}}`,
      dictionary.tokens,
      {
        usesDtcg
      }
    )
    const lh = parseFloat(token.$value) / parseFloat(fs)
    return `${removeTrailingZeros(lh.toFixed(3))}em`
  } else if (token.$type === 'asset') {
    return `"${token.$value}"`
  } else {
    return token.$value
  }
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
  const { dictionary, options, file, header } = opts

  return `
//
// ${file.destination}
//
${header}
$prefix: cx- !default;
// scss-docs-start design-tokens
${dictionary.allTokens.map((token) => tokenToLine(token, dictionary, options)).join(`\n`)}
// scss-docs-end design-tokens
`
}

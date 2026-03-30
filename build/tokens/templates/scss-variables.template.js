/**
 * @file scss-variables.template.js
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
let prefix

/**
 * Resolves token references for typography text properties.
 *
 * @param {Object} originalValue - The original.$value object of the token.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {Object} - The resolved typography text properties.
 */
function resolveOriginals(originalValue, dictionary) {
  return {
    letterSpacing: resolveReferences(originalValue.letterSpacing, dictionary.tokens, { usesDtcg }),
    paragraphSpacing: resolveReferences(originalValue.paragraphSpacing, dictionary.tokens, {
      usesDtcg
    }),
    textCase: resolveReferences(originalValue.textCase, dictionary.tokens, { usesDtcg }),
    textDecoration: resolveReferences(originalValue.textDecoration, dictionary.tokens, { usesDtcg })
  }
}

/**
 * Builds a SCSS-compatible typography map string from resolved values.
 *
 * @param {Object} params - The typography values.
 * @param {string} params.fontFamily - The font-family value.
 * @param {string} params.fontWeight - The font-weight value.
 * @param {string} params.fontSize - The font-size value.
 * @param {string} params.lineHeight - The line-height value.
 * @param {string} params.fontStyle - The font-style value.
 * @param {Object} params.resolvedValues - The resolved text properties.
 * @returns {string} - The SCSS typography map string.
 */
function buildTypographyMap({
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  fontStyle,
  resolvedValues
}) {
  return `(${[
    `"font-family": ${fontFamily}`,
    `"font-weight": ${fontWeight}`,
    `"font-size": ${fontSize}`,
    `"line-height": ${lineHeight}`,
    `"font-style": ${fontStyle}`,
    `"letter-spacing": ${parseFloat(resolvedValues.letterSpacing)}em`,
    `"margin-bottom": ${resolvedValues.paragraphSpacing}`,
    `"text-transform": ${resolvedValues.textCase}`,
    `"text-decoration": ${resolvedValues.textDecoration}`
  ].join(', ')})`
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
    'color|context': (ref) => `$${prefix}color-context-${ref[2]}-${ref[3]}`,
    'color|palette': (ref) => `$${prefix}color-palette-${ref[2]}-${ref[3]}`,
    'space|context': (ref) => `$${prefix}space-context-${ref[2]}`,
    'opacity|context': (ref) => `$${prefix}opacity-${ref[2]}`,
    'opacity|level': (ref) => `$${prefix}opacity-${ref[2]}`,
    'borderRadius|context': (ref) => `$${prefix}border-radius-context-${ref[2]}`,
    'borderWidth|context': (ref) => `$${prefix}border-width-context-${ref[2]}`
  }

  const key = `${ref[0]}|${ref[1] || ''}`.trim()
  if (refMapping[key]) {
    return refMapping[key](ref)
  }

  // For borderRadius tokens referencing base tokens,
  // check if the reference ultimately points to a context token.
  if (ref[0] === 'borderRadius' && ref[1] === 'base') {
    // Direct base.context reference
    if (ref[2] === 'context') {
      return `$${prefix}border-radius-context-${ref[3]}`
    }
    // Follow chain: base.<component>.<size> → base.context.<size>
    try {
      const refToken = getReferences(token.original.$value, dictionary.tokens, { usesDtcg })[0]
      if (refToken && isReference(refToken.original.$value)) {
        const innerRef = splitReference(refToken.original.$value)
        if (innerRef[0] === 'borderRadius' && innerRef.includes('context')) {
          const name = innerRef[innerRef.length - 1]
          return `$${prefix}border-radius-context-${name}`
        }
      }
    } catch {
      /* base token not in this build config */
    }
  }

  return token.$value
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
  const fontSize = splitReference(token.original.$value.fontSize)
  const lineHeight = splitReference(token.original.$value.lineHeight)
  const fontWeight = splitReference(token.original.$extensions['chassis'].originalFontWeight)

  return buildTypographyMap({
    fontFamily: `$${prefix}typography-font-family-${fontFamily}`,
    fontWeight: `$${prefix}typography-font-weight-${fontWeight[2]}-${fontWeight[3]}-weight`,
    fontSize: `$${prefix}typography-font-size-${fontSize[2]}-${fontSize[3]}`,
    lineHeight: `$${prefix}typography-line-height-${lineHeight[2]}-${lineHeight[3]}`,
    fontStyle: `$${prefix}typography-font-weight-${fontWeight[2]}-${fontWeight[3]}-style`,
    resolvedValues: resolveOriginals(token.original.$value, dictionary)
  })
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
      ? `$${prefix}typography-font-size-${referenceFs.path[2]}-${referenceFs.path[3]}`
      : referenceFs.$value
  // If the reference is a percentage, convert it to a decimal
  const lineHeight =
    referenceLh && referenceLh.$type === 'lineHeight'
      ? `$${prefix}typography-line-height-${referenceLh.path[2]}-${referenceLh.path[3]}`
      : referenceLh.$value
        ? referenceLh.$value
        : referenceLh.endsWith('%')
          ? `${parseFloat(referenceLh) / 100}em`
          : referenceLh

  return buildTypographyMap({
    fontFamily: `$${prefix}typography-font-family-${fontFamily}`,
    fontWeight: `$${prefix}typography-font-weight-${fontWeight[2]}-${fontWeight[3]}-weight`,
    fontSize,
    lineHeight,
    fontStyle: `$${prefix}typography-font-weight-${fontWeight[2]}-${fontWeight[3]}-style`,
    resolvedValues: resolveOriginals(token.original.$value, dictionary)
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
  const original = getReferences(token.original.$value, dictionary.tokens, { usesDtcg })[0]

  return buildTypographyMap({
    fontFamily: `$${prefix}typography-font-family-${ref[1]}`,
    fontWeight: `$${prefix}typography-font-weight-${ref[1]}-${ref[3]}-weight`,
    fontSize: `$${prefix}typography-font-size-${ref[1]}-${ref[2]}`,
    lineHeight: `$${prefix}typography-line-height-${ref[1]}-${ref[2]}`,
    fontStyle: `$${prefix}typography-font-weight-${ref[1]}-${ref[3]}-style`,
    resolvedValues: resolveOriginals(original.original.$value, dictionary)
  })
}

/**
 * Resolves a typography token to its direct computed values (no SCSS variable references).
 *
 * @param {Object} token - The typography token object.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @returns {string} - The resolved typography value as a SCSS-compatible map string.
 */
function resolveDirectTypographyValue(token, dictionary) {
  let originalValue
  let chassisExt

  if (typeof token.original.$value !== 'object') {
    // Component typography - resolve reference to get target token
    const refs = getReferences(token.original.$value, dictionary.tokens, {
      usesDtcg,
      warnImmediately: false
    })
    const refToken = refs[0]
    originalValue = refToken.original.$value
    chassisExt = refToken.original.$extensions?.['chassis']
  } else {
    originalValue = token.original.$value
    chassisExt = token.original.$extensions?.['chassis']
  }

  // Resolve font family
  const fontFamily = resolveReferences(originalValue.fontFamily, dictionary.tokens, { usesDtcg })

  // Resolve font weight and style from chassis extension
  const fwPath = splitReference(chassisExt.originalFontWeight)
  const fontWeight = resolveReferences(`{${fwPath.join('.')}.weight}`, dictionary.tokens, {
    usesDtcg
  })
  const fontStyle = resolveReferences(`{${fwPath.join('.')}.style}`, dictionary.tokens, {
    usesDtcg
  })

  // Resolve font size
  const fsRefs = getReferences(originalValue.fontSize, dictionary.tokens, {
    usesDtcg,
    warnImmediately: false
  })
  const fontSize = fsRefs[0]
    ? fsRefs[0].$value
    : resolveReferences(originalValue.fontSize, dictionary.tokens, { usesDtcg })

  // Resolve line height and convert to em
  const lhRefs = getReferences(originalValue.lineHeight, dictionary.tokens, {
    usesDtcg,
    warnImmediately: false
  })
  let lineHeight
  if (lhRefs[0]) {
    const lh = parseFloat(lhRefs[0].$value) / parseFloat(fontSize)
    lineHeight = `${removeTrailingZeros(lh.toFixed(3))}em`
  } else if (
    typeof originalValue.lineHeight === 'string' &&
    originalValue.lineHeight.endsWith('%')
  ) {
    lineHeight = `${parseFloat(originalValue.lineHeight) / 100}em`
  } else {
    lineHeight = originalValue.lineHeight
  }

  // Resolve text properties
  const resolvedValues = resolveOriginals(originalValue, dictionary)

  return buildTypographyMap({
    fontFamily: `"${fontFamily}"`,
    fontWeight,
    fontSize,
    lineHeight,
    fontStyle,
    resolvedValues
  })
}

/**
 * Converts a token to its corresponding value.
 *
 * @param {Object} token - The token object to convert.
 * @param {Object} dictionary - The token dictionary for resolving references.
 * @param {Object} options - Options including outputReferences flag.
 * @returns {string} - The token's resolved value as a SCSS-compatible string.
 */
function tokenToValue(token, dictionary, options) {
  if (options.outputReferences) {
    if (
      token.original &&
      isReference(token.original.$value) &&
      ['color', 'space', 'opacity', 'borderRadius', 'borderWidth'].includes(token.path[0]) &&
      !(['borderRadius', 'borderWidth'].includes(token.path[0]) && token.path[1] === 'context') &&
      !(['borderRadius', 'borderWidth'].includes(token.path[0]) && token.path[1] === 'base')
    ) {
      return resolveReferenceValue(token, dictionary)
    }
    if (token.$type === 'typography') {
      if (typeof token.original.$value !== 'object') {
        return resolveComponentTypographyValue(token, dictionary)
      }
      return token.path[1] === 'context'
        ? resolveContextTypographyValue(token, dictionary)
        : resolveBasicTypographyValue(token, dictionary)
    }
  } else if (token.$type === 'typography') {
    return resolveDirectTypographyValue(token, dictionary)
  }

  if (token.$type === 'lineHeight') {
    const fs = resolveReferences(
      `{typography.fontSize.${token.path[2]}.${token.path[3]}}`,
      dictionary.tokens,
      {
        usesDtcg
      }
    )
    const lh = parseFloat(token.$value) / parseFloat(fs)
    return `${removeTrailingZeros(lh.toFixed(3))}em`
  } else if (token.path[1] === 'letterSpacing') {
    return `${parseFloat(token.$value)}em`
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
  const { dictionary, options, file, header, platform } = opts
  prefix = platform?.prefix ? `${platform.prefix}-` : ''

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

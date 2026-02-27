/**
 * @file preprocessor.js
 * @description This file processes design tokens by aligning types, adding
 *              metadata and resolving font styles. Some code in this file is
 *              adapted from '@tokens-studio/sd-transforms'.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { typeDtcgDelegate, usesReferences, resolveReferences } from 'style-dictionary/utils'

/**
 * Aligns token types and updates metadata.
 * @param {Object} slice - The token or token group to process.
 */
function alignTypes(slice) {
  /**
   * Maps token types to their aligned types.
   */
  const typesMap = {
    fontFamilies: 'fontFamily',
    fontWeights: 'fontWeight',
    fontSizes: 'fontSize',
    lineHeights: 'lineHeight',
    boxShadow: 'shadow',
    spacing: 'dimension',
    sizing: 'dimension',
    borderRadius: 'dimension',
    borderWidth: 'dimension',
    letterSpacing: 'dimension',
    paragraphSpacing: 'dimension',
    paragraphIndent: 'dimension',
    text: 'content'
  }

  /**
   * Maps properties for specific token types.
   */
  const propsMap = {
    shadow: {
      x: 'offsetX',
      y: 'offsetY'
    }
  }

  const isToken = Object.hasOwn(slice, '$type') && Object.hasOwn(slice, '$value')
  if (isToken) {
    const t = slice.$type
    const v = slice.$value
    const newT = typesMap[t] || t

    if (newT !== t) {
      // Replace the type with the new type
      slice['$type'] = newT
      // Store the original type as metadata
      slice.$extensions = {
        ...slice.$extensions,
        ['chassis']: {
          ...(slice.$extensions?.['chassis'] ?? {}),
          originalType: t
        }
      }
    }

    // Map properties if applicable
    if (typeof v === 'object') {
      const pMap = propsMap[newT]
      if (pMap) {
        const convertProps = (obj) => {
          Object.entries(pMap).forEach(([key, propValue]) => {
            if (obj[key] !== undefined) {
              obj[propValue] = obj[key]
              delete obj[key]
            }
          })
        }

        if (Array.isArray(v)) {
          v.forEach(convertProps)
        } else {
          convertProps(v)
        }
        slice['$value'] = v
      }
    }
  } else {
    Object.values(slice).forEach((val) => {
      if (typeof val === 'object') {
        alignTypes(val)
      }
    })
  }
}

/**
 * Adds font weight metadata to typography tokens.
 * @param {Object} slice - The token or token group to process.
 */
function addFontWeightExtension(slice) {
  const isTypographyObj =
    Object.hasOwn(slice, '$type') &&
    slice.$type === 'typography' &&
    typeof slice.$value === 'object'
  if (isTypographyObj) {
    const fontWeight = slice.original?.$value.fontWeight
      ? slice.original.$value.fontWeight
      : slice.$value.fontWeight
    if (fontWeight) {
      slice.$extensions = {
        ...slice.$extensions,
        ['chassis']: {
          ...(slice.$extensions?.['chassis'] ?? {}),
          originalFontWeight: ` ${fontWeight}`.slice(1)
        }
      }
    }
  } else {
    Object.values(slice).forEach((val) => {
      if (typeof val === 'object') {
        addFontWeightExtension(val)
      }
    })
  }
}

/**
 * Adds font styles (e.g., italic, oblique) to typography tokens.
 * @param {Object} slice - The token or token group to process.
 * @param {Object} refCopy - A copy of the token dictionary for reference resolution.
 */
function addFontStyles(slice, refCopy) {
  /**
   * Regular expression to extract font weight and style.
   */
  const fontStyles = ['italic', 'oblique', 'normal']
  const fontWeightReg = new RegExp(`(?<weight>.+?)\\s?(?<style>${fontStyles.join('|')})?$`, 'i')

  /**
   * Resolves font weight references.
   * @param {string} fontWeight - The font weight to resolve.
   * @param {Object} refCopy - A copy of the token dictionary for reference resolution.
   * @returns {string} - Resolved font weight.
   */
  function resolveFontWeight(fontWeight, refCopy) {
    let resolved = fontWeight
    if (usesReferences(fontWeight)) {
      try {
        resolved = `${resolveReferences(fontWeight, refCopy, { usesDtcg: true })}`
      } catch (e) {
        console.error(e)
      }
    }
    return resolved
  }

  /**
   * Splits font weight and style from a combined string.
   * @param {string} fontWeight - The font weight string to split.
   * @returns {Object} - An object containing weight and style.
   */
  function splitWeightStyle(fontWeight) {
    let weight = fontWeight
    let style = 'normal'
    if (fontWeight) {
      const fontStyleMatch = fontWeight.match(fontWeightReg)
      if (fontStyleMatch?.groups?.weight && fontStyleMatch.groups.style) {
        style = fontStyleMatch.groups.style.toLowerCase()
        weight = fontStyleMatch.groups.weight
      }

      if (fontStyles.includes(fontWeight.toLowerCase())) {
        style = fontWeight.toLowerCase()
        weight = 'Regular'
      }
    }
    return { weight, style }
  }

  Object.keys(slice).forEach((key) => {
    const potentiallyToken = slice[key]
    const isToken =
      typeof potentiallyToken === 'object' && potentiallyToken.$type && potentiallyToken.$value

    if (isToken) {
      const token = potentiallyToken
      const { $value, $type } = token
      const tokenType = $type
      const tokenValue = $value

      if (tokenType === 'typography') {
        if (tokenValue.fontWeight === undefined) return

        const fontWeight = resolveFontWeight(`${tokenValue.fontWeight}`, refCopy)
        const { weight, style } = splitWeightStyle(fontWeight)
        if (style) {
          tokenValue.fontWeight = weight
          tokenValue.fontStyle = style
        }
      } else if (tokenType === 'fontWeight') {
        const fontWeight = resolveFontWeight(`${tokenValue}`, refCopy)
        const { weight, style } = splitWeightStyle(fontWeight)

        if (style) {
          slice[key] = {
            weight: {
              ...token,
              [`$type`]: 'fontWeight',
              [`$value`]: weight
            },
            style: {
              ...token,
              [`$type`]: 'fontStyle',
              [`$value`]: style
            }
          }
        }
      }
    } else if (typeof potentiallyToken === 'object') {
      addFontStyles(potentiallyToken, refCopy)
    }
  })
}

/**
 * Prepares the global token dictionary by aligning types and adding extensions.
 * @param {Object} dictionary - The token dictionary to process.
 * @returns {Object} - The processed token dictionary.
 */
export default function (dictionary) {
  const dict = typeDtcgDelegate(structuredClone(dictionary))
  alignTypes(dict)
  addFontWeightExtension(dict)
  addFontStyles(dict, structuredClone(dict))
  return dict
}

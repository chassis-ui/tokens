/**
 * @file preprocessor.js
 * @description Prepares the token dictionary. Types are aligned by
 *              '@tokens-studio/sd-transforms'. On top of that Chassis types letter
 *              spacing as a number, splits every font weight into weight and style,
 *              stores the font weight path of typography tokens, and numbers the tokens
 *              in source order.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { resolveReferences } from 'style-dictionary/utils'
import { alignTypes } from '@tokens-studio/sd-transforms'
import { isReference, referencePath } from './reference-policy.js'

const fontStyles = ['italic', 'oblique', 'normal']
const weightAndStyle = new RegExp(`(?<weight>.+?)\\s?(?<style>${fontStyles.join('|')})?$`, 'i')

/**
 * Calls `visit(token, key, group)` for every token, in source order.
 * @param {Object} group - The token group to walk.
 * @param {Function} visit - Receives the token, its key and the group that holds it.
 */
function eachToken(group, visit) {
  Object.entries(group).forEach(([key, value]) => {
    if (typeof value !== 'object' || value === null) return
    if (Object.hasOwn(value, '$type') && Object.hasOwn(value, '$value')) {
      visit(value, key, group)
    } else {
      eachToken(value, visit)
    }
  })
}

/**
 * Adds properties to the Chassis extension of a token.
 * @param {Object} token - The token to extend.
 * @param {Object} properties - The properties to add.
 */
function extend(token, properties) {
  token.$extensions = {
    ...token.$extensions,
    ['chassis']: { ...token.$extensions?.['chassis'], ...properties }
  }
}

/**
 * Types letter spacing as a number, and stores the path of the font weight that a
 * typography token references. The path is stored as segments, not as a reference: after
 * the weight and style split it is a group, and Style Dictionary 5 rejects references
 * to groups.
 * @param {Object} dictionary - The dictionary with aligned types.
 */
function addTypes(dictionary) {
  eachToken(dictionary, (token) => {
    if (token.$extensions?.['studio.tokens']?.originalType === 'letterSpacing') {
      token.$type = 'number'
    }
    if (token.$type === 'typography' && isReference(token.$value.fontWeight)) {
      extend(token, { fontWeightPath: referencePath(token.$value.fontWeight) })
    }
  })
}

/**
 * Splits a font weight such as `Light Italic` into weight and style.
 * @param {string} fontWeight - The resolved font weight.
 * @returns {Object} - e.g. `{ weight: 'Light', style: 'italic' }`; the style is `normal`
 *   when the font weight names none.
 */
function splitWeightStyle(fontWeight) {
  // `Italic` alone means the regular weight in italic
  if (fontStyles.includes(fontWeight.toLowerCase())) {
    return { weight: 'Regular', style: fontWeight.toLowerCase() }
  }
  const { weight, style } = fontWeight.match(weightAndStyle)?.groups ?? {}
  return weight && style
    ? { weight, style: style.toLowerCase() }
    : { weight: fontWeight, style: 'normal' }
}

/**
 * Adds the font style to typography tokens and splits every font weight token into a
 * `weight` and a `style` token. '@tokens-studio/sd-transforms' splits only the font
 * weight tokens that name a style.
 * @param {Object} dictionary - The dictionary with aligned types.
 */
function addFontStyles(dictionary) {
  const references = structuredClone(dictionary)
  const resolve = (fontWeight) =>
    splitWeightStyle(`${resolveReferences(`${fontWeight}`, references, { usesDtcg: true })}`)

  eachToken(dictionary, (token, key, group) => {
    if (token.$type === 'typography' && token.$value.fontWeight !== undefined) {
      const { weight, style } = resolve(token.$value.fontWeight)
      token.$value.fontWeight = weight
      token.$value.fontStyle = style
    } else if (token.$type === 'fontWeight') {
      const { weight, style } = resolve(token.$value)
      group[key] = {
        weight: { ...token, $value: weight },
        style: { ...token, $type: 'fontStyle', $value: style }
      }
    }
  })
}

/**
 * Numbers the tokens in source order. Style Dictionary 5 moves expanded typography and
 * shadow tokens to the end of the dictionary; the formats sort by this number to print
 * them where their source token is.
 * @param {Object} dictionary - The dictionary after the weight and style split.
 */
function addSourceOrder(dictionary) {
  let sourceOrder = 0
  eachToken(dictionary, (token) => extend(token, { sourceOrder: sourceOrder++ }))
}

/**
 * Prepares the global token dictionary.
 * @param {Object} dictionary - The token dictionary to process.
 * @returns {Object} - The processed token dictionary.
 */
export default function (dictionary) {
  const dict = alignTypes(dictionary)
  addTypes(dict)
  addFontStyles(dict)
  addSourceOrder(dict)
  return dict
}

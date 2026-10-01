/**
 * @file transforms.js
 * @description This file registers custom transforms for Style Dictionary. They run
 *              before references are resolved, and other web tokens rely on their output.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { tokenTypes } from './utils.js'
import { cssShadow, pxSize, remSize, vwSize } from './values/web.js'

/**
 * The custom transforms, as passed to `registerTransform`.
 */
export const transforms = [
  {
    // Transform size tokens to rem units.
    name: 'cx/size/rem',
    type: 'value',
    transitive: true,
    filter: (token) => tokenTypes.size.includes(token.$type),
    transform: (token, config) => remSize(token, config.basePxFontSize)
  },
  {
    // Transform size tokens to px units.
    name: 'cx/size/px',
    type: 'value',
    transitive: true,
    filter: (token) => tokenTypes.size.includes(token.$type),
    transform: (token) => pxSize(token)
  },
  {
    // Transform size tokens to vw units.
    name: 'cx/size/vw',
    type: 'value',
    transitive: true,
    filter: (token) => tokenTypes.size.includes(token.$type),
    transform: (token, config) => vwSize(token, config.basePxFontSize)
  },
  {
    // Transform shadow tokens to CSS-compatible shadow values.
    name: 'cx/shadow/web',
    type: 'value',
    transitive: true,
    filter: (token) => tokenTypes.shadow.includes(token.$type),
    transform: (token) => cssShadow(token.$value)
  }
]

/**
 * Registers custom transforms for Style Dictionary.
 *
 * @param {Object} StyleDictionary - The Style Dictionary instance.
 */
export default function (StyleDictionary) {
  transforms.forEach((transform) => StyleDictionary.registerTransform(transform))
}

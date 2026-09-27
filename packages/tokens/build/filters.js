/**
 * @file filters.js
 * @description This file defines custom filters for Style Dictionary. These filters
 *              are used to include or exclude specific tokens based on their type
 *              or other properties during the build process.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { tokenTypes } from './utils.js'

/**
 * Top-level groups that exist for Figma only and are never emitted: `figma` holds the
 * mode switches and the frame sizes of the Figma files, and `bg-blur` the background blur
 * effects of Figma.
 */
export const figmaOnlyGroups = ['figma', 'bg-blur']

/**
 * The palettes behind the theme: colors under `color.primitive`, `color.context` and
 * `color.utility`, and gradients under `gradient.primitive`. The main file leaves them to
 * the color files; the color parts of other groups, such as `shadow.context.*`, stay.
 * @param {Object} token - A resolved token.
 * @returns {boolean}
 */
const isPaletteColor = (token) =>
  ['color', 'gradient'].includes(token.path[0]) &&
  ['primitive', 'context', 'utility'].includes(token.path[1])

/**
 * The file filters by name, before the Figma-only groups are left out. The
 * `dimension.base.*` scale is emitted in the main and number files on purpose: other sizes
 * reference it, and with `outputReferences` they name it (`SizeUnit4 = DimensionBase4`).
 */
const fileFilters = {
  // Everything that goes into main: all emitted types, without the theme palettes.
  'cx/allTokens': (token) =>
    (tokenTypes.color.includes(token.$type) && !isPaletteColor(token)) ||
    tokenTypes.font.includes(token.$type) ||
    tokenTypes.gradient.includes(token.$type) ||
    tokenTypes.number.includes(token.$type) ||
    tokenTypes.shadow.includes(token.$type) ||
    tokenTypes.size.includes(token.$type) ||
    tokenTypes.string.includes(token.$type),

  // Base colors, the raw palette behind the context colors; only main has them otherwise.
  'cx/baseColorTokens': (token) =>
    tokenTypes.color.includes(token.$type) && token.path[1] === 'base',

  // What follows the theme: colors without base and utility colors, and the shadows, whose
  // colors are those of the theme. Only the web keeps shadow tokens whole; the mobile
  // platforms expand them, and their color parts are colors.
  'cx/themeTokens': (token) =>
    (tokenTypes.color.includes(token.$type) && !['base', 'utility'].includes(token.path[1])) ||
    tokenTypes.shadow.includes(token.$type),

  // Numbers and sizes, which change with the screen.
  'cx/numberTokens': (token) =>
    tokenTypes.number.includes(token.$type) || tokenTypes.size.includes(token.$type),

  // Strings, font names and assets.
  'cx/stringTokens': (token) => tokenTypes.string.includes(token.$type)
}

/**
 * The custom filters by name: the file filters, without the Figma-only groups.
 * @type {Record<string, (token: Object) => boolean>}
 */
export const filters = Object.fromEntries(
  Object.entries(fileFilters).map(([name, filter]) => [
    name,
    (token) => !figmaOnlyGroups.includes(token.path[0]) && filter(token)
  ])
)

/**
 * Registers custom filters with Style Dictionary.
 * @param {Object} StyleDictionary - The Style Dictionary instance.
 */
export default function (StyleDictionary) {
  Object.entries(filters).forEach(([name, filter]) =>
    StyleDictionary.registerFilter({ name, filter })
  )
}

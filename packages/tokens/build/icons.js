/**
 * @file icons.js
 * @description Icon assets for iOS and Android from the SVG icon tokens: an Xcode asset
 *              catalog with one vector image set per icon, and one Android vector drawable
 *              per icon. The string tokens stay; these files are written next to them by
 *              the actions `cx/ios-icons` and `cx/android-icons`.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import svg2vectordrawable from 'svg2vectordrawable'

/**
 * The asset catalog of the iOS output, and the drawable folder of the Android output.
 */
export const IOS_CATALOG = 'Icons.xcassets'
export const ANDROID_DRAWABLES = 'res/drawable'

/**
 * The `Contents.json` of an asset catalog folder.
 */
const CATALOG_INFO = { info: { author: 'xcode', version: 1 } }

/**
 * Returns the icon tokens of a dictionary: asset tokens whose value is an SVG document.
 *
 * @param {Object[]} tokens - Resolved tokens.
 * @returns {Object[]}
 */
export function iconTokens(tokens) {
  return tokens.filter(
    (token) => token.$type === 'asset' && /^\s*<svg[\s>]/i.test(String(token.$value))
  )
}

/**
 * Returns the files of an Xcode image set for an icon: the SVG, and a `Contents.json`
 * that keeps the vector (so it scales without blurring) and renders the image as a
 * template, so it takes the tint color as `currentcolor` does on the web.
 *
 * @param {Object} token - An icon token with `name` and `$value`.
 * @returns {Object} Contents by path inside the catalog, e.g.
 *   `{ 'IconChipRemove.imageset/IconChipRemove.svg': '<svg …' }`
 */
export function iosImageSet(token) {
  const folder = `${token.name}.imageset`
  const contents = {
    images: [{ filename: `${token.name}.svg`, idiom: 'universal' }],
    ...CATALOG_INFO,
    properties: {
      'preserves-vector-representation': true,
      'template-rendering-intent': 'template'
    }
  }
  return {
    [`${folder}/${token.name}.svg`]: `${String(token.$value).trim()}\n`,
    [`${folder}/Contents.json`]: `${JSON.stringify(contents, null, 2)}\n`
  }
}

/**
 * Returns the files of an Xcode asset catalog for the icon tokens.
 *
 * @param {Object[]} icons - Icon tokens.
 * @returns {Object} Contents by path inside the catalog.
 */
export function iosCatalog(icons) {
  return Object.assign(
    { 'Contents.json': `${JSON.stringify(CATALOG_INFO, null, 2)}\n` },
    ...icons.map(iosImageSet)
  )
}

/**
 * Converts an icon to an Android vector drawable. A vector path without a fill color
 * draws nothing, so paths without one are filled black, which a tint replaces as
 * `currentcolor` does on the web. Coordinates keep three decimals, as in the tokens.
 *
 * @param {Object} token - An icon token with `name`, `path` and `$value`.
 * @returns {Promise<string>} The drawable XML.
 * @throws {Error} When the SVG does not convert, with the token path.
 */
export async function androidDrawable(token) {
  try {
    return `${await svg2vectordrawable(String(token.$value), { fillBlack: true, floatPrecision: 3 })}\n`
  } catch (error) {
    throw new Error(`${token.path.join('.')}: the icon does not convert to a vector drawable`, {
      cause: error
    })
  }
}

/**
 * Writes files under a directory, creating folders as needed.
 *
 * @param {string} root - The directory.
 * @param {Object} files - Contents by path inside `root`.
 */
async function writeFiles(root, files) {
  for (const [path, text] of Object.entries(files)) {
    const file = join(root, path)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, text)
  }
}

/**
 * Registers the actions that write the icon assets. They run after a platform's files,
 * with the tokens of the whole dictionary.
 *
 * @param {Object} StyleDictionary - The Style Dictionary class.
 */
export default function registerIconActions(StyleDictionary) {
  StyleDictionary.registerAction({
    name: 'cx/ios-icons',
    do: async (dictionary, platform) => {
      const root = join(platform.buildPath, IOS_CATALOG)
      await rm(root, { recursive: true, force: true })
      await writeFiles(root, iosCatalog(iconTokens(dictionary.allTokens)))
    },
    undo: async (dictionary, platform) => {
      await rm(join(platform.buildPath, IOS_CATALOG), { recursive: true, force: true })
    }
  })

  StyleDictionary.registerAction({
    name: 'cx/android-icons',
    do: async (dictionary, platform) => {
      const files = {}
      for (const token of iconTokens(dictionary.allTokens)) {
        files[`${token.name}.xml`] = await androidDrawable(token)
      }
      await writeFiles(join(platform.buildPath, ANDROID_DRAWABLES), files)
    },
    undo: async (dictionary, platform) => {
      await rm(join(platform.buildPath, ANDROID_DRAWABLES), { recursive: true, force: true })
    }
  })
}

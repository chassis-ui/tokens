/**
 * @file theme-colors.js
 * @description The iOS color file whose colors follow the appearance. The light and dark
 *              color files are written by two Style Dictionary instances, so no format
 *              sees both themes. The iOS format collects the constants of each theme's
 *              color file here, and the build writes the combined file after all
 *              instances have run.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { swiftFile } from './templates/ios-swift-class.template.js'

/**
 * The themes that `userInterfaceStyle` tells apart.
 */
export const THEMES = ['light', 'dark']

/**
 * The combined file and the type it declares.
 */
export const THEME_COLORS_FILE = 'Color.swift'
export const THEME_COLORS_TYPE = 'ChassisTokensColor'

/**
 * Color files collected in this build, by output directory, then by theme.
 */
const collected = new Map()

/**
 * Records the constants of one theme's color file.
 *
 * @param {Object} colors
 * @param {string} colors.buildPath - The output directory of the file.
 * @param {string} colors.theme - The theme; other themes than `THEMES` are ignored.
 * @param {string} colors.header - The file header.
 * @param {Object} colors.options - The Swift file properties of the file.
 * @param {Object[]} colors.constants - From `swiftConstants`.
 */
export function collectThemeColors({ buildPath, theme, header, options, constants }) {
  if (!THEMES.includes(theme)) return
  if (!collected.has(buildPath)) collected.set(buildPath, {})
  collected.get(buildPath)[theme] = { header, options, constants }
}

/**
 * Combines the constants of the light and dark color files. A constant that prints the
 * same in both themes prints as it is: a value, or the name of another constant of the
 * combined type, which follows the appearance itself. A color that differs becomes a
 * `UIColor` that picks the dark or the light value by `userInterfaceStyle`.
 *
 * @param {Object[]} light - Constants of the light file, in order.
 * @param {Object[]} dark - Constants of the dark file.
 * @returns {Object[]} `{ name, printed }` in the order of the light file.
 * @throws {Error} When the themes declare other constants, or a constant that is not a
 *   color differs.
 */
export function combineThemeColors(light, dark) {
  const darkByName = new Map(dark.map((constant) => [constant.name, constant]))
  const lightNames = new Set(light.map((constant) => constant.name))
  const unmatched = [
    ...light.filter((constant) => !darkByName.has(constant.name)),
    ...dark.filter((constant) => !lightNames.has(constant.name))
  ].map((constant) => constant.name)
  if (unmatched.length > 0) {
    throw new Error(
      `The light and dark color files declare different constants: ${unmatched.slice(0, 5).join(', ')}`
    )
  }

  return light.map((lightConstant) => {
    const { name, type, value, printed } = lightConstant
    const darkConstant = darkByName.get(name)
    if (printed === darkConstant.printed) return { name, printed }
    if (type !== 'color') {
      throw new Error(
        `${name} differs between light and dark, but only colors follow the appearance`
      )
    }
    return {
      name,
      printed: `UIColor { $0.userInterfaceStyle == .dark ? ${darkConstant.value} : ${value} }`
    }
  })
}

/**
 * Writes the combined color file into every output directory that received a light and
 * a dark color file, and forgets what was collected.
 *
 * @returns {Promise<string[]>} The paths written.
 */
export async function writeThemeColors() {
  const written = []
  for (const [buildPath, themes] of collected) {
    if (!THEMES.every((theme) => themes[theme])) continue
    const { header, options } = themes.light
    const path = `${buildPath}${THEME_COLORS_FILE}`
    const text = swiftFile({
      file: { destination: THEME_COLORS_FILE },
      header,
      options: { ...options, className: THEME_COLORS_TYPE },
      constants: combineThemeColors(themes.light.constants, themes.dark.constants)
    })
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, text)
    written.push(path)
  }
  collected.clear()
  return written
}

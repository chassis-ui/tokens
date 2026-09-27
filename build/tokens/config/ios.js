/**
 * @file ios.js
 * @description iOS platform configuration, for UIKit (`ios`) and, through `swiftConfig`,
 *              for SwiftUI (`ios-swiftui`)
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const options = {
  fileHeader: 'cxFileHeader',
  commentStyle: 'short',
  formatting: { fileHeaderTimestamp: true },
  accessControl: 'public',
  // A caseless enum groups constants without instances; Objective-C cannot see them
  objectType: 'enum'
}

const transforms = ['name/pascal', 'ts/resolveMath', 'ts/color/modifiers', 'ts/color/css/hexrgba']

const expand = {
  typesMap: {
    typography: {
      lineHeight: 'dimension',
      paragraphSpacing: 'dimension',
      letterSpacing: 'number'
    }
  }
}

/**
 * Converts name to PascalCase for iOS
 */
function toPascalCase(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Returns a Swift file: its destination and the type it declares. The main file declares
 * `ChassisTokens`, and every other file `ChassisTokens<File>`, so all files can be in
 * one target.
 * @param {string} name - The file name without `.swift`, e.g. `ColorLight`.
 * @param {string} filter - The file's filter.
 * @param {string} format - The file's format.
 * @param {Object} [options] - More file options; `theme` marks a colour file for the
 *   colour file that follows the appearance (`theme-colors.js`).
 */
function swiftFile(name, filter, format, options = {}) {
  const className = name === 'ChassisTokens' ? name : `ChassisTokens${name}`
  return { destination: `${name}.swift`, filter, format, options: { className, ...options } }
}

/**
 * Returns the files of one output.
 * @param {Object} output - `{ kind: 'base' }`, `{ kind: 'color', theme }` or
 *   `{ kind: 'number', screen }`; `screen` is undefined when no screens are configured.
 */
function generateFiles({ kind, theme, screen }, { format, themeColors }) {
  switch (kind) {
    case 'base':
      return [
        swiftFile('ChassisTokens', 'cx/allTokens', format),
        swiftFile('String', 'cx/stringTokens', format)
      ]
    case 'color':
      return [
        swiftFile(
          `Color${toPascalCase(theme)}`,
          'cx/themeTokens',
          format,
          themeColors ? { theme } : {}
        )
      ]
    case 'number':
      return [swiftFile(`Number${screen ? toPascalCase(screen) : ''}`, 'cx/numberTokens', format)]
    default:
      throw new Error(`Unknown output: ${kind}`)
  }
}

/**
 * Returns a Swift platform configuration.
 * @param {Object} settings
 * @param {string} settings.format - The format of every file.
 * @param {string} settings.folder - The folder under the output root, e.g. `ios`.
 * @param {string[]} settings.imports - The modules every file imports.
 * @param {boolean} [settings.themeColors] - Mark the colour files for `Color.swift`.
 */
export function swiftConfig({ format, folder, imports, themeColors }) {
  return function (brand, app, outputs, outDir = 'dist') {
    return {
      transforms,
      expand,
      buildPath: `${outDir}/${folder}/${app}/${brand}/`,
      options: { ...options, import: imports },
      files: outputs.flatMap((output) => generateFiles(output, { format, themeColors }))
    }
  }
}

/**
 * The UIKit output. Its colour files also make `Color.swift`, whose colours follow the
 * appearance (`theme-colors.js`).
 */
export default swiftConfig({
  format: 'cx/ios-swift-class',
  folder: 'ios',
  imports: ['UIKit'],
  themeColors: true
})

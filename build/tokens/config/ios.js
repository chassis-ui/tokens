/**
 * @file ios.js
 * @description iOS platform configuration
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const format = 'cx/ios-swift-class'

const options = {
  fileHeader: 'cxFileHeader',
  commentStyle: 'short',
  formatting: { fileHeaderTimestamp: true },
  import: ['UIKit'],
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
 * @param {Object} [options] - More file options; `theme` marks a colour file for the
 *   colour file that follows the appearance (`theme-colors.js`).
 */
function swiftFile(name, filter, options = {}) {
  const className = name === 'ChassisTokens' ? name : `ChassisTokens${name}`
  return { destination: `${name}.swift`, filter, format, options: { className, ...options } }
}

/**
 * Returns the files of one output.
 * @param {Object} output - `{ kind: 'base' }`, `{ kind: 'color', theme }` or
 *   `{ kind: 'number', screen }`; `screen` is undefined when no screens are configured.
 */
function generateFiles({ kind, theme, screen }) {
  switch (kind) {
    case 'base':
      return [swiftFile('ChassisTokens', 'cx/allTokens'), swiftFile('String', 'cx/stringTokens')]
    case 'color':
      return [swiftFile(`Color${toPascalCase(theme)}`, 'cx/themeTokens', { theme })]
    case 'number':
      return [swiftFile(`Number${screen ? toPascalCase(screen) : ''}`, 'cx/numberTokens')]
    default:
      throw new Error(`Unknown output: ${kind}`)
  }
}

/**
 * iOS platform configuration
 */
export default function (brand, app, outputs, outDir = 'dist') {
  return {
    transforms,
    expand,
    buildPath: `${outDir}/ios/${app}/${brand}/`,
    options,
    files: outputs.flatMap(generateFiles)
  }
}

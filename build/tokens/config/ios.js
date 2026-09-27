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
  import: ['UIKit']
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
 * Returns the files of one output.
 * @param {Object} output - `{ kind: 'base' }`, `{ kind: 'color', theme }` or
 *   `{ kind: 'number', screen }`; `screen` is undefined when no screens are configured.
 */
function generateFiles({ kind, theme, screen }) {
  switch (kind) {
    case 'base':
      return [
        { destination: 'Main.swift', filter: 'cx/allTokens', format },
        { destination: 'String.swift', filter: 'cx/stringTokens', format }
      ]
    case 'color':
      return [
        { destination: `Color${toPascalCase(theme)}.swift`, filter: 'cx/themeTokens', format }
      ]
    case 'number':
      return [
        {
          destination: `Number${screen ? toPascalCase(screen) : ''}.swift`,
          filter: 'cx/numberTokens',
          format
        }
      ]
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

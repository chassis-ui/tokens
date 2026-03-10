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
 * Generates file configurations based on context
 */
function generateFiles(theme, screen) {
  // Base files (no theme, no screen)
  if (!theme && screen === undefined) {
    return [
      { destination: 'Main.swift', filter: 'cx/allTokens', format },
      { destination: 'String.swift', filter: 'cx/stringTokens', format }
    ]
  }

  // Color files (theme only)
  if (theme && !screen) {
    return [{ destination: `Color${toPascalCase(theme)}.swift`, filter: 'cx/themeTokens', format }]
  }

  // Number files (with screen suffix)
  if (screen) {
    return [
      { destination: `Number${toPascalCase(screen)}.swift`, filter: 'cx/numberTokens', format }
    ]
  }

  // Number files (without screen suffix when screens are optional)
  if (screen === null) {
    return [{ destination: 'Number.swift', filter: 'cx/numberTokens', format }]
  }

  return []
}

/**
 * iOS platform configuration
 */
export default function (brand, app, theme, screen) {
  return {
    transforms,
    expand,
    buildPath: `dist/ios/${brand}-${app}/`,
    options,
    files: generateFiles(theme, screen)
  }
}

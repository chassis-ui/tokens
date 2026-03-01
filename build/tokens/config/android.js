/**
 * @file android.js
 * @description Android platform configuration
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const format = 'cx/android-resources'

const options = {
  fileHeader: 'cxFileHeader',
  commentStyle: 'xml',
  formatting: { fileHeaderTimestamp: true }
}

const transforms = ['name/snake', 'ts/resolveMath', 'ts/color/modifiers', 'ts/color/css/hexrgba']

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
 * Generates file configurations based on context
 */
function generateFiles(theme, screen) {
  // Base files (no theme, no screen)
  if (!theme && screen === undefined) {
    return [
      { destination: 'main.xml', filter: 'cx/allTokens', format },
      { destination: 'string.xml', filter: 'cx/stringTokens', format }
    ]
  }

  // Color files (theme only)
  if (theme && !screen) {
    return [{ destination: `color_${theme}.xml`, filter: 'cx/themeTokens', format }]
  }

  // Number files (with screen suffix)
  if (screen) {
    return [{ destination: `number_${screen}.xml`, filter: 'cx/numberTokens', format }]
  }

  // Number files (without screen suffix when screens are optional)
  if (screen === null) {
    return [{ destination: 'number.xml', filter: 'cx/numberTokens', format }]
  }

  return []
}

/**
 * Android platform configuration
 */
export default function (brand, app, theme, screen) {
  return {
    transforms,
    expand,
    buildPath: `dist/android/${brand}-${app}/`,
    options,
    files: generateFiles(theme, screen)
  }
}

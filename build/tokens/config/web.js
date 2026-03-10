/**
 * @file web.js
 * @description Web platform configuration with rem units (default)
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const format = 'cx/scss-variables'

const options = {
  fileHeader: 'cxFileHeader',
  commentStyle: 'short',
  outputReferences: true,
  formatting: { fileHeaderTimestamp: true }
}

const transforms = [
  'name/kebab',
  'ts/resolveMath',
  'ts/color/modifiers',
  'ts/color/css/hexrgba',
  'ts/typography/fontWeight',
  'cx/typography/web',
  'cx/shadow/web',
  'cx/size/rem'
]

/**
 * Generates file configurations based on context
 */
function generateFiles(theme, screen) {
  // Base files (no theme, no screen)
  if (!theme && screen === undefined) {
    return [
      { destination: 'main.scss', filter: 'cx/allTokens', format },
      { destination: 'string.scss', filter: 'cx/stringTokens', format }
    ]
  }

  // Color files (theme only)
  if (theme && !screen) {
    return [{ destination: `color-${theme}.scss`, filter: 'cx/themeTokens', format }]
  }

  // Number files (with screen suffix)
  if (screen) {
    return [{ destination: `number-${screen}.scss`, filter: 'cx/numberTokens', format }]
  }

  // Number files (without screen suffix when screens are optional)
  if (screen === null) {
    return [{ destination: 'number.scss', filter: 'cx/numberTokens', format }]
  }

  return []
}

/**
 * Web platform configuration with rem units
 */
export default function (brand, app, theme, screen) {
  return {
    prefix: 'cx',
    basePxFontSize: 16,
    transforms,
    buildPath: `dist/web/${brand}-${app}/`,
    options,
    files: generateFiles(theme, screen)
  }
}

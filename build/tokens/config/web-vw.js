/**
 * @file web-vw.js
 * @description Web platform configuration with vw units
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const format = 'cx/scss-variables'

const options = {
  fileHeader: 'cxFileHeader',
  commentStyle: 'short',
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
  'cx/size/vw'
]

/**
 * Generates file configurations based on context
 */
function generateFiles(theme, screen) {
  // Base files (no theme, no screen)
  if (!theme && !screen) {
    return [
      { destination: 'main.scss', filter: 'cx/allTokens', format },
      { destination: 'string.scss', filter: 'cx/stringTokens', format }
    ]
  }

  // Color files (theme only)
  if (theme && !screen) {
    return [{ destination: `color-${theme}.scss`, filter: 'cx/themeTokens', format }]
  }

  // Number files (screen only)
  if (screen) {
    return [{ destination: `number-${screen}.scss`, filter: 'cx/numberTokens', format }]
  }

  return []
}

/**
 * Web platform configuration with vw units
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

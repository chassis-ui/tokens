/**
 * @file web.js
 * @description Web platform configuration with rem units (default)
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const format = 'cx/scss-chassis-css'

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
  'cx/shadow/web',
  'cx/size/rem'
]

/**
 * Returns the files of one output.
 * @param {Object} output - `{ kind: 'base' }`, `{ kind: 'color', theme }` or
 *   `{ kind: 'number', screen }`; `screen` is undefined when no screens are configured.
 */
function generateFiles({ kind, theme, screen }) {
  switch (kind) {
    case 'base':
      return [
        { destination: 'main.scss', filter: 'cx/allTokens', format },
        { destination: 'string.scss', filter: 'cx/stringTokens', format }
      ]
    case 'color':
      return [{ destination: `color-${theme}.scss`, filter: 'cx/themeTokens', format }]
    case 'number':
      return [
        {
          destination: screen ? `number-${screen}.scss` : 'number.scss',
          filter: 'cx/numberTokens',
          format
        }
      ]
    default:
      throw new Error(`Unknown output: ${kind}`)
  }
}

/**
 * Web platform configuration with rem units
 */
export default function (brand, app, outputs, outDir = 'dist') {
  return {
    prefix: 'cx',
    basePxFontSize: 16,
    transforms,
    buildPath: `${outDir}/web/${app}/${brand}/`,
    options,
    files: outputs.flatMap(generateFiles)
  }
}

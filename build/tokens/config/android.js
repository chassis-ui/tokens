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
      letterSpacing: 'letterSpacing'
    }
  }
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
        { destination: 'main.xml', filter: 'cx/allTokens', format },
        { destination: 'string.xml', filter: 'cx/stringTokens', format }
      ]
    case 'color':
      return [{ destination: `color_${theme}.xml`, filter: 'cx/themeTokens', format }]
    case 'number':
      return [
        {
          destination: screen ? `number_${screen}.xml` : 'number.xml',
          filter: 'cx/numberTokens',
          format
        }
      ]
    default:
      throw new Error(`Unknown output: ${kind}`)
  }
}

/**
 * Android platform configuration
 */
export default function (brand, app, outputs, outDir = 'dist') {
  return {
    transforms,
    expand,
    buildPath: `${outDir}/android/${app}/${brand}/`,
    options,
    files: outputs.flatMap(generateFiles)
  }
}

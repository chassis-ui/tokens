/**
 * @file android-compose.js
 * @description Jetpack Compose preset: one Kotlin object per file of the Android platform,
 *              with Compose values, written to `dist/android-compose/<app>/<brand>/`. The
 *              package is `options.packageName`, set with
 *              `chassis.build.options["android-compose"].packageName`.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const format = 'cx/compose-object'

const options = {
  fileHeader: 'cxFileHeader',
  commentStyle: 'short',
  formatting: { fileHeaderTimestamp: true },
  packageName: 'chassis.tokens'
}

const transforms = ['name/camel', 'ts/resolveMath', 'ts/color/modifiers', 'ts/color/css/hexrgba']

// The same types as the Android platform, so values match `values/android.js`
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
 * Converts a name to PascalCase.
 */
function toPascalCase(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Returns a Kotlin file: its destination and the object it declares, named as on iOS.
 * @param {string} name - The file name without `.kt`, e.g. `ColorLight`.
 * @param {string} filter - The file's filter.
 */
function kotlinFile(name, filter) {
  const className = name === 'ChassisTokens' ? name : `ChassisTokens${name}`
  return { destination: `${name}.kt`, filter, format, options: { className } }
}

/**
 * Returns the files of one output.
 * @param {Object} output - `{ kind: 'base' }`, `{ kind: 'color', theme }` or
 *   `{ kind: 'number', screen }`; `screen` is undefined when no screens are configured.
 */
function generateFiles({ kind, theme, screen }) {
  switch (kind) {
    case 'base':
      return [kotlinFile('ChassisTokens', 'cx/allTokens'), kotlinFile('String', 'cx/stringTokens')]
    case 'color':
      return [kotlinFile(`Color${toPascalCase(theme)}`, 'cx/themeTokens')]
    case 'number':
      return [kotlinFile(`Number${screen ? toPascalCase(screen) : ''}`, 'cx/numberTokens')]
    default:
      throw new Error(`Unknown output: ${kind}`)
  }
}

/**
 * Jetpack Compose platform configuration
 */
export default function (brand, app, outputs, outDir = 'dist') {
  return {
    transforms,
    expand,
    buildPath: `${outDir}/android-compose/${app}/${brand}/`,
    options,
    files: outputs.flatMap(generateFiles)
  }
}

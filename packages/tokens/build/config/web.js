/**
 * @file web.js
 * @description Web platform configuration: SCSS variables for Chassis CSS in rem units
 *              (default), and the factory of the other web presets
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

const options = {
  fileHeader: 'cxFileHeader',
  commentStyle: 'short',
  formatting: { fileHeaderTimestamp: true }
}

/**
 * Decimals that math on a size keeps. The sizes are pixels divided by 16, so ten decimals
 * never round one; they only drop the floating-point noise of the math.
 */
export const MATH_FRACTION_DIGITS = 10

const transforms = [
  'name/kebab',
  'ts/resolveMath',
  'ts/color/modifiers',
  'ts/color/css/hexrgba',
  'ts/typography/fontWeight',
  'cx/shadow/web'
]

/**
 * Returns the files of one output.
 * @param {Object} output - `{ kind: 'base' }`, `{ kind: 'color', theme }` or
 *   `{ kind: 'number', screen }`; `screen` is undefined when no screens are configured.
 * @param {string} format - The format of the files.
 */
function generateFiles({ kind, theme, screen }, format) {
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
 * Returns a web platform configuration.
 * @param {Object} [preset]
 * @param {string} [preset.unit] - Unit of sizes: `rem`, `px` or `vw`.
 * @param {string} [preset.format] - `cx/scss-chassis-css`, which prints `var(--…)`
 *   references for Chassis CSS, or `cx/scss-variables`, which prints resolved values.
 */
export function webConfig({ unit = 'rem', format = 'cx/scss-chassis-css' } = {}) {
  return function (brand, app, outputs, outDir = 'dist') {
    return {
      prefix: 'cx',
      basePxFontSize: 16,
      // Math on sizes (`ts/resolveMath`) rounds to four decimals by default, which would
      // round a size that references another: `0.03125rem` would become `0.0313rem`.
      mathFractionDigits: MATH_FRACTION_DIGITS,
      transforms: [...transforms, `cx/size/${unit}`],
      buildPath: `${outDir}/web/${app}/${brand}/`,
      options,
      files: outputs.flatMap((output) => generateFiles(output, format))
    }
  }
}

/**
 * Web platform configuration with rem units
 */
export default webConfig()

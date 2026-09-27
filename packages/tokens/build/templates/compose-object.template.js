/**
 * @file compose-object.template.js
 * @description Template for Kotlin files for Jetpack Compose: one `object` per file with
 *              one property per token, values from `values/compose.js`. Each property is a
 *              getter. With `outputReferences` a property may name one declared after it,
 *              which a stored property cannot (Kotlin: "variable must be initialized").
 *              Getters also leave the object without an initializer, which the JVM
 *              limits to 64 KB; the main object's would take about 51 KB.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

/**
 * The Compose names the values use.
 */
const IMPORTS = [
  'androidx.compose.ui.graphics.Color',
  'androidx.compose.ui.text.font.FontWeight',
  'androidx.compose.ui.unit.dp',
  'androidx.compose.ui.unit.em',
  'androidx.compose.ui.unit.sp'
]

/**
 * Prints a Kotlin file that declares one object with the given constants.
 *
 * @param {Object} opts
 * @param {Object} opts.file - File metadata including destination.
 * @param {string} opts.header - Header comment for the generated file.
 * @param {Object} opts.options - `packageName` and `className`.
 * @param {Object[]} opts.constants - `{ name, printed }` per constant.
 * @returns {string} - The Kotlin file.
 */
export default function ({ file, header, options, constants }) {
  const lines = constants.map(({ name, printed }) => `val ${name} get() = ${printed}`)
  return `//
// ${file.destination}
//
${header}
package ${options.packageName}

${IMPORTS.map((name) => `import ${name}`).join('\n')}

object ${options.className} {
    ${lines.join('\n    ')}
}
`
}

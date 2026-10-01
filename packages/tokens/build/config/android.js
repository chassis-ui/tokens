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
 * The resource folder of each screen when the build options set none: the smallest
 * screen in the default folder, and the Material Design width classes for the others.
 */
export const DEFAULT_SCREEN_QUALIFIERS = { small: '', medium: 'sw600dp', large: 'sw840dp' }

/**
 * Returns the resource qualifier of every configured screen: `''` for the default
 * `values` folder, or a qualifier such as `sw600dp`. Android uses the default folder
 * when no qualified folder matches, so it must hold one screen, normally the smallest.
 *
 * @param {string[]} [screens] - The configured screens.
 * @param {Object} [qualifiers] - Qualifiers by screen, from
 *   `chassis.build.options.android.screens`; `DEFAULT_SCREEN_QUALIFIERS` without it.
 * @returns {Object} Qualifiers by screen, for the configured screens.
 * @throws {Error} When a screen has no qualifier, or not exactly one screen is in the
 *   default folder.
 */
export function screenQualifiers(screens = [], qualifiers = DEFAULT_SCREEN_QUALIFIERS) {
  if (screens.length === 0) return {}
  const missing = screens.filter((screen) => typeof qualifiers[screen] !== 'string')
  if (missing.length > 0) {
    throw new Error(
      `no Android resource qualifier for the screens ${missing.join(', ')}; set them in options.android.screens`
    )
  }
  const defaults = screens.filter((screen) => qualifiers[screen] === '')
  if (defaults.length !== 1) {
    throw new Error(
      `options.android.screens must put exactly one screen in the default folder ("") but puts ${defaults.length}`
    )
  }
  return Object.fromEntries(screens.map((screen) => [screen, qualifiers[screen]]))
}

/**
 * Returns the path of a file in the resource tree.
 * @param {string} qualifier - e.g. `night`, `sw600dp`, or `''` for the default folder.
 * @param {string} name - e.g. `color.xml`
 */
function resourceFile(qualifier, name) {
  return `res/values${qualifier ? `-${qualifier}` : ''}/${name}`
}

/**
 * Returns the files of one output: the flat files (`main.xml`, `color_light.xml`, …) and
 * their place in the resource tree under `res/`. The tree has the strings and base
 * colors, the colors of the first theme in `values` and of `dark` in `values-night`,
 * and the numbers of each screen in the folder of its qualifier.
 *
 * @param {Object} output - `{ kind: 'base' }`, `{ kind: 'color', theme }` or
 *   `{ kind: 'number', screen }`; `screen` is undefined when no screens are configured.
 * @param {Object} settings - `themes` and `qualifiers` by screen.
 */
function generateFiles({ kind, theme, screen }, { themes = [], qualifiers }) {
  const file = (destination, filter) => ({ destination, filter, format })
  switch (kind) {
    case 'base':
      return [
        file('main.xml', 'cx/allTokens'),
        file('string.xml', 'cx/stringTokens'),
        file(resourceFile('', 'string.xml'), 'cx/stringTokens'),
        file(resourceFile('', 'color_base.xml'), 'cx/baseColorTokens')
      ]
    case 'color': {
      const tree = theme === themes[0] ? [''] : theme === 'dark' ? ['night'] : []
      return [
        file(`color_${theme}.xml`, 'cx/themeTokens'),
        ...tree.map((qualifier) => file(resourceFile(qualifier, 'color.xml'), 'cx/themeTokens'))
      ]
    }
    case 'number':
      if (screen && qualifiers[screen] === undefined) {
        throw new Error(`No Android resource qualifier for the screen ${screen}`)
      }
      return [
        file(screen ? `number_${screen}.xml` : 'number.xml', 'cx/numberTokens'),
        file(resourceFile(screen ? qualifiers[screen] : '', 'number.xml'), 'cx/numberTokens')
      ]
    default:
      throw new Error(`Unknown output: ${kind}`)
  }
}

/**
 * Android platform configuration
 */
export default function (brand, app, outputs, outDir = 'dist', settings = {}) {
  const qualifiers = screenQualifiers(settings.screens, settings.options?.screens)
  return {
    transforms,
    expand,
    buildPath: `${outDir}/android/${app}/${brand}/`,
    options,
    files: outputs.flatMap((output) =>
      generateFiles(output, { themes: settings.themes, qualifiers })
    ),
    // The icon tokens are in the build of the main file; they become vector drawables
    actions: outputs.some((output) => output.kind === 'base') ? ['cx/android-icons'] : []
  }
}

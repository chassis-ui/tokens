/**
 * @file scss-var-policy.js
 * @description Values of the SCSS variables format (`cx/scss-variables`), for teams that
 *              do not use chassis-css. Tokens print their resolved value. With
 *              `outputReferences`, the tokens that the Chassis CSS format prints as a
 *              custom property print the SCSS variable of the referenced token instead,
 *              except shadows. The rules shared with the Chassis CSS format are in
 *              `reference-policy.js`. Functions here are pure; token lookups are passed
 *              in as `references`, see `reference-policy.js`, plus:
 *
 *              - `references.variable(path)` returns the SCSS variable of the token at
 *                `path`, e.g. `$cx-color-context-default-fg-main`. It throws when no
 *                file of the build declares that variable.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import {
  printsReference,
  referenceTarget,
  typographyObject,
  typographyReference
} from './reference-policy.js'
import { encode, resolvedTypographyMap } from './values/web.js'

/**
 * Token groups (`path[0]`) whose single-reference tokens print a variable. The Chassis CSS
 * groups without `shadow`, as in the format before the rewrite.
 */
export const referencingGroups = ['color', 'space', 'opacity', 'borderRadius', 'borderWidth']

/**
 * Variables of the typography parts of an object-valued typography token. The weight
 * path is split into `<path>.weight` and `<path>.style` tokens by the preprocessor.
 */
function objectNames(references) {
  return {
    fontFamily: (path) => references.variable(path),
    fontWeight: (path) => references.variable([...path, 'weight']),
    fontStyle: (path) => references.variable([...path, 'style']),
    fontSize: (path) => references.variable(path),
    lineHeight: (path) => references.variable(path)
  }
}

/**
 * Variables of a reference-valued typography token, `font.<family>.<size>.<weight>`.
 */
function referenceNames(references) {
  return ({ family, size, weight }) => ({
    fontFamily: references.variable(['typography', 'fontFamily', family]),
    fontWeight: references.variable(['typography', 'fontWeight', family, weight, 'weight']),
    fontStyle: references.variable(['typography', 'fontWeight', family, weight, 'style']),
    fontSize: references.variable(['typography', 'fontSize', family, size]),
    lineHeight: references.variable(['typography', 'lineHeight', family, size])
  })
}

/**
 * Returns the SCSS value of a web token with references: a variable, a typography map
 * of variables, or the encoded value.
 */
function referenceValue(token, references, basePxFontSize) {
  if (printsReference(token, referencingGroups)) {
    const target = referenceTarget(token, references)
    return target ? references.variable(target) : token.$value
  }
  if (token.$type === 'typography') {
    return typeof token.original.$value === 'object'
      ? typographyObject(token, references, objectNames(references), basePxFontSize)
      : typographyReference(token, references, referenceNames(references), basePxFontSize)
  }
  return encode(token, { resolveReference: references.value, basePxFontSize })
}

/**
 * Returns the SCSS value of a web token.
 *
 * @param {Object} token - A resolved token with `$type`, `$value`, `path` and `original`.
 * @param {Object} references - Token lookups.
 * @param {Object} [settings]
 * @param {number} [settings.basePxFontSize] - Pixels per em, for a letter spacing in px.
 * @param {boolean} [settings.outputReferences] - Print variables instead of values.
 * @returns {string} The SCSS value.
 */
export function scssValue(token, references, { basePxFontSize, outputReferences } = {}) {
  try {
    if (outputReferences) {
      return referenceValue(token, references, basePxFontSize)
    }
    if (token.$type === 'typography') {
      return resolvedTypographyMap(token.$value, basePxFontSize)
    }
    return encode(token, { resolveReference: references.value, basePxFontSize })
  } catch (error) {
    throw new Error(`${token.path.join('.')}: ${error.message}`, { cause: error })
  }
}

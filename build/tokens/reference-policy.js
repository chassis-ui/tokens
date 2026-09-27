/**
 * @file reference-policy.js
 * @description Rules shared by the web reference policies, `css-var-policy.js` (Chassis
 *              CSS custom properties) and `scss-var-policy.js` (SCSS variables): which
 *              tokens print a reference, which token the reference names, and how
 *              typography maps are put together. The policies differ in the names they
 *              print. Functions here are pure; token lookups are passed in as
 *              `references`:
 *
 *              - `references.token(value)` returns the first token that `value`
 *                references, or `undefined` when `value` holds no reference. It throws
 *                when the referenced token is not in the file's token set.
 *              - `references.value(value)` returns `value` with its references resolved.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { percentToEm, typographyMap } from './values/web.js'

/**
 * Tokens in a referencing group that print their value anyway: the path segment at
 * `segment` is one of `names`.
 */
export const literalTokens = [
  { group: 'borderRadius', segment: 1, names: ['context', 'base'] },
  { group: 'borderWidth', segment: 1, names: ['context', 'base'] },
  {
    group: 'shadow',
    segment: 2,
    names: ['idle', 'hover', 'press', 'disabled', 'focus', 'highlight']
  }
]

/**
 * Referenced paths that print a reference, by their start. Other references print the
 * resolved value.
 */
export const referenceTargets = [
  'color.context',
  'color.primitive',
  'space.context',
  'opacity.context',
  'opacity.level',
  'shadow.context',
  'borderRadius.context',
  'borderWidth.context'
]

/**
 * Groups whose `<group>.base.<component>.<step>` tokens alias a context token. A
 * reference to one is followed to that context token, and a reference to
 * `<group>.base.context.<step>` names `<group>.context.<step>`.
 */
export const followedGroups = ['borderRadius', 'borderWidth']

/**
 * How many references the follow reads past the token's own.
 */
export const MAX_HOPS = 1

/**
 * Checks whether a value is a single reference and nothing else.
 *
 * @param {*} value - e.g. `{color.context.default.fg-main}`
 * @returns {boolean}
 */
export function isReference(value) {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value)
}

/**
 * Splits a single reference into its path.
 *
 * @param {string} value - e.g. `{space.context.small}`
 * @returns {string[]} e.g. `['space', 'context', 'small']`
 * @throws {Error} When the value is not a single reference.
 */
export function referencePath(value) {
  if (!isReference(value)) {
    throw new Error(`Not a single reference: ${JSON.stringify(value)}`)
  }
  return value.slice(1, -1).split('.')
}

/**
 * Checks whether a path starts with the segments of `start`.
 *
 * @param {string[]} path - e.g. `['color', 'context', 'default', 'fg-main']`
 * @param {string} start - e.g. `color.context`
 * @returns {boolean}
 */
export function startsWith(path, start) {
  return start.split('.').every((segment, index) => path[index] === segment)
}

/**
 * Checks whether a token prints a reference instead of its value, before looking at what
 * it references.
 *
 * @param {Object} token - A resolved token with `path` and `original`.
 * @param {string[]} groups - Token groups (`path[0]`) whose single-reference tokens
 *   print a reference.
 * @returns {boolean}
 */
export function printsReference(token, groups) {
  const { path } = token
  return (
    isReference(token.original?.$value) &&
    groups.includes(path[0]) &&
    !literalTokens.some(
      ({ group, segment, names }) => path[0] === group && names.includes(path[segment])
    )
  )
}

/**
 * Follows a reference to a `base.<component>` token until it reaches a context token of
 * the same group, reading at most `MAX_HOPS` further references.
 *
 * @param {Object} token - The token that holds the reference.
 * @param {string[]} reference - The referenced path.
 * @param {Object} references - Token lookups.
 * @returns {string|undefined} The last segment of the context token's path.
 * @throws {Error} When the references form a cycle.
 */
function followToContext(token, reference, references) {
  const seen = [token.path.join('.')]
  let path = reference

  for (let hop = 0; ; hop++) {
    const key = path.join('.')
    if (seen.includes(key)) {
      throw new Error(`Circular reference: ${[...seen, key].join(' → ')}`)
    }
    seen.push(key)

    if (hop > 0 && path[0] === reference[0] && path.includes('context')) {
      return path[path.length - 1]
    }
    if (hop === MAX_HOPS) return undefined

    let target
    try {
      target = references.token(`{${key}}`)
    } catch {
      // The referenced token is not in this file's token set.
      return undefined
    }
    if (!target || !isReference(target.original.$value)) return undefined
    path = referencePath(target.original.$value)
  }
}

/**
 * Returns the path of the token that a reference names, for a token for which
 * `printsReference` is true.
 *
 * @param {Object} token - The token that holds the reference.
 * @param {Object} references - Token lookups.
 * @returns {string[]|undefined} e.g. `['borderRadius', 'context', 'medium']`;
 *   `undefined` when the token prints its value.
 */
export function referenceTarget(token, references) {
  let reference = referencePath(token.original.$value)
  const [group, level, step] = reference
  const followed = followedGroups.includes(group) && level === 'base'

  if (followed && step === 'context') {
    reference = [group, ...reference.slice(2)]
  } else if (followed) {
    const contextStep = followToContext(token, reference, references)
    return contextStep ? [group, 'context', contextStep] : undefined
  }

  return referenceTargets.some((start) => startsWith(reference, start)) ? reference : undefined
}

/**
 * Resolves the typography parts that print as values.
 *
 * @param {Object} original - The original value of an object-valued typography token.
 * @param {Object} references - Token lookups.
 * @returns {Object} Resolved parts for `typographyMap`.
 */
function resolvedParts(original, references) {
  return {
    fontStyle: original.fontStyle,
    letterSpacing: references.value(original.letterSpacing),
    paragraphSpacing: references.value(original.paragraphSpacing),
    textCase: references.value(original.textCase),
    textDecoration: references.value(original.textDecoration)
  }
}

/**
 * Builds the map for an object-valued typography token (`font.context.*`,
 * `font.text.*`). Family and weight print references. Font size and line height print
 * references when they reference `fontSize` and `lineHeight` tokens, and their values
 * otherwise; a literal percent line height is converted to em.
 *
 * @param {Object} token - The typography token.
 * @param {Object} references - Token lookups.
 * @param {Object} names - The policy's names, each taking a token path:
 *   `fontFamily`, `fontWeight` (the path of the weight before the weight and style
 *   split), `fontSize`, `lineHeight`, and optionally `fontStyle` (the same path as
 *   `fontWeight`); without it the font style prints its value.
 * @param {number} [basePxFontSize] - Pixels per em, for a letter spacing in px.
 * @returns {string} The Sass map.
 * @throws {Error} When family, weight or size does not reference a token.
 */
export function typographyObject(token, references, names, basePxFontSize) {
  const original = token.original.$value
  const family = referencePath(original.fontFamily)
  const weight = token.original.$extensions?.['chassis']?.fontWeightPath
  const size = references.token(original.fontSize)
  const height = references.token(original.lineHeight)

  if (!weight) {
    throw new Error(`fontWeight does not reference a token: ${JSON.stringify(original.fontWeight)}`)
  }
  if (!size) {
    throw new Error(`fontSize does not reference a token: ${JSON.stringify(original.fontSize)}`)
  }

  let lineHeight
  if (!height) {
    // A literal line height may be a percentage
    lineHeight = percentToEm(original.lineHeight)
  } else if (height.$type === 'lineHeight') {
    lineHeight = names.lineHeight(height.path)
  } else {
    lineHeight = height.$value
  }

  return typographyMap(
    {
      ...resolvedParts(original, references),
      ...(names.fontStyle && { fontStyle: names.fontStyle(weight) }),
      fontFamily: names.fontFamily(family),
      fontWeight: names.fontWeight(weight),
      fontSize: size.$type === 'fontSize' ? names.fontSize(size.path) : size.$value,
      lineHeight
    },
    basePxFontSize
  )
}

/**
 * Builds the map for a reference-valued typography token (`font.button.medium` =
 * `{font.text.medium.strong}`). The references are named after the referenced path,
 * `font.<family>.<size>.<weight>`; the other parts are the referenced token's.
 *
 * @param {Object} token - The typography token.
 * @param {Object} references - Token lookups.
 * @param {Function} names - Takes `{ family, size, weight }` and returns the parts that
 *   print references: `fontFamily`, `fontWeight`, `fontSize`, `lineHeight` and
 *   optionally `fontStyle`.
 * @param {number} [basePxFontSize] - Pixels per em, for a letter spacing in px.
 * @returns {string} The Sass map.
 * @throws {Error} When the reference does not have four segments.
 */
export function typographyReference(token, references, names, basePxFontSize) {
  const reference = referencePath(token.original.$value)
  if (reference.length !== 4) {
    throw new Error(`Not a font.<family>.<size>.<weight> reference: ${token.original.$value}`)
  }
  const [, family, size, weight] = reference
  const target = references.token(token.original.$value)

  return typographyMap(
    {
      ...resolvedParts(target.original.$value, references),
      ...names({ family, size, weight })
    },
    basePxFontSize
  )
}

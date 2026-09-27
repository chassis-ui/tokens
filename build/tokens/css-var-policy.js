/**
 * @file css-var-policy.js
 * @description Web reference policy: which tokens print `var(--name)` instead of their
 *              value, and how the custom property is named. The names are the custom
 *              properties that chassis-css generates. Functions here are pure; token
 *              lookups are passed in as `references`:
 *
 *              - `references.token(value)` returns the first token that `value`
 *                references, or `undefined` when `value` holds no reference. It throws
 *                when the referenced token is not in the dictionary.
 *              - `references.value(value)` returns `value` with its references resolved.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { encode, percentToEm, typographyMap } from './values/web.js'

/**
 * Long scale-step names and the short forms chassis-css uses in custom property names
 * (`--border-radius-md`, `--box-shadow-lg`). Token names keep the long form.
 */
export const scaleAbbreviations = {
  '4xsmall': '4xs',
  '3xsmall': '3xs',
  '2xsmall': '2xs',
  xsmall: 'xs',
  small: 'sm',
  medium: 'md',
  large: 'lg',
  xlarge: 'xl',
  '2xlarge': '2xl',
  '3xlarge': '3xl',
  '4xlarge': '4xl',
  '5xlarge': '5xl',
  '6xlarge': '6xl'
}

/**
 * Token groups (`path[0]`) whose single-reference tokens print a custom property.
 */
export const referencingGroups = [
  'color',
  'space',
  'opacity',
  'shadow',
  'borderRadius',
  'borderWidth'
]

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
 * Custom property by referenced path. `reference` is the start of the referenced path;
 * `name` receives the segments after it.
 */
export const customProperties = [
  { reference: 'color.context', name: ([group, step]) => `${group}-${step}` },
  { reference: 'color.primitive', name: ([group, step]) => `${group}-${step}` },
  { reference: 'space.context', name: ([step]) => `space-${step}` },
  { reference: 'opacity.context', name: ([step]) => `opacity-${step}` },
  { reference: 'opacity.level', name: ([step]) => `opacity-${step}` },
  { reference: 'shadow.context', name: ([step]) => `box-shadow-${abbreviateScale(step)}` },
  { reference: 'borderRadius.context', name: ([step]) => `border-radius-${abbreviateScale(step)}` },
  {
    reference: 'borderRadius.base.context',
    name: ([step]) => `border-radius-${abbreviateScale(step)}`
  },
  { reference: 'borderWidth.context', name: ([step]) => `border-width-${abbreviateScale(step)}` },
  {
    reference: 'borderWidth.base.context',
    name: ([step]) => `border-width-${abbreviateScale(step)}`
  }
]

/**
 * Groups whose `<group>.base.<component>.<step>` tokens alias a context token, with the
 * property they name. A reference to one is followed to that context token.
 */
export const followedGroups = {
  borderRadius: 'border-radius',
  borderWidth: 'border-width'
}

/**
 * How many references the follow reads past the token's own.
 */
export const MAX_HOPS = 1

/**
 * Abbreviates a scale-step name; other names pass through.
 *
 * @param {string} name - e.g. `medium`, `h1`
 * @returns {string} e.g. `md`, `h1`
 */
export function abbreviateScale(name) {
  return scaleAbbreviations[name] || name
}

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
 * Checks whether a token prints a custom property instead of its value, before looking
 * at what it references.
 *
 * @param {Object} token - A resolved token with `path` and `original`.
 * @returns {boolean}
 */
export function printsReference(token) {
  const { path } = token
  return (
    isReference(token.original?.$value) &&
    referencingGroups.includes(path[0]) &&
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
 * Names the custom property for a token that prints a reference.
 *
 * @param {Object} token - A token for which `printsReference` is true.
 * @param {Object} references - Token lookups.
 * @returns {string|undefined} e.g. `var(--border-radius-md)`; `undefined` when the
 *   referenced token has no custom property.
 */
export function customProperty(token, references) {
  const reference = referencePath(token.original.$value)

  for (const { reference: start, name } of customProperties) {
    const segments = start.split('.')
    if (segments.every((segment, index) => reference[index] === segment)) {
      return `var(--${name(reference.slice(segments.length))})`
    }
  }

  const property = followedGroups[reference[0]]
  if (property && reference[1] === 'base') {
    const step = followToContext(token, reference, references)
    if (step) return `var(--${property}-${abbreviateScale(step)})`
  }
  return undefined
}

/**
 * Resolves the typography parts that print as values, not as custom properties.
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
 * `font.text.*`). Family and weight are named after the tokens they reference. Font size
 * and line height are named when they reference `fontSize` and `lineHeight` tokens.
 *
 * @param {Object} token - The typography token.
 * @param {Object} references - Token lookups.
 * @returns {string} The Sass map.
 * @throws {Error} When family, weight or size does not reference a token.
 */
function typographyObject(token, references) {
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
    lineHeight = `var(--line-height-${height.path[2]}-${abbreviateScale(height.path[3])})`
  } else {
    lineHeight = height.$value
  }

  return typographyMap({
    fontFamily: `var(--font-family-${family[2]})`,
    fontWeight: `var(--font-weight-${weight[2]}-${weight[3]})`,
    fontSize:
      size.$type === 'fontSize'
        ? `var(--font-size-${size.path[2]}-${abbreviateScale(size.path[3])})`
        : size.$value,
    lineHeight,
    ...resolvedParts(original, references)
  })
}

/**
 * Builds the map for a reference-valued typography token (`font.button.medium` =
 * `{font.text.medium.strong}`). The custom properties are named after the referenced
 * path, `font.<family>.<size>.<weight>`.
 *
 * @param {Object} token - The typography token.
 * @param {Object} references - Token lookups.
 * @returns {string} The Sass map.
 * @throws {Error} When the reference does not have four segments.
 */
function typographyReference(token, references) {
  const reference = referencePath(token.original.$value)
  if (reference.length !== 4) {
    throw new Error(`Not a font.<family>.<size>.<weight> reference: ${token.original.$value}`)
  }
  const [, family, size, weight] = reference
  const target = references.token(token.original.$value)

  return typographyMap({
    fontFamily: `var(--font-family-${family})`,
    fontWeight: `var(--font-weight-${weight})`,
    fontSize: `var(--font-size-${abbreviateScale(size)})`,
    lineHeight: `var(--line-height-${abbreviateScale(size)})`,
    ...resolvedParts(target.original.$value, references)
  })
}

/**
 * Returns the SCSS value of a web token: a custom property, a typography map, or the
 * encoded value.
 *
 * @param {Object} token - A resolved token with `$type`, `$value`, `path` and `original`.
 * @param {Object} references - Token lookups, see the file description.
 * @returns {string} The SCSS value.
 */
export function webValue(token, references) {
  try {
    if (printsReference(token)) {
      return customProperty(token, references) ?? token.$value
    }
    if (token.$type === 'typography') {
      return typeof token.original.$value === 'object'
        ? typographyObject(token, references)
        : typographyReference(token, references)
    }
    return encode(token, { resolveReference: references.value })
  } catch (error) {
    throw new Error(`${token.path.join('.')}: ${error.message}`, { cause: error })
  }
}

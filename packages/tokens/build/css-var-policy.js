/**
 * @file css-var-policy.js
 * @description Web reference policy of the Chassis CSS format (`cx/scss-chassis-css`):
 *              which tokens print `var(--name)` instead of their value, and how the
 *              custom property is named. The names are the custom properties that
 *              chassis-css generates. The rules shared with the SCSS variables format
 *              are in `reference-policy.js`, with the description of `references`.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import {
  printsReference,
  referenceTarget,
  startsWith,
  typographyObject,
  typographyReference
} from './reference-policy.js'
import { encode } from './values/web.js'

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
 * Custom property by referenced path, one row per entry of `referenceTargets`.
 * `reference` is the start of the referenced path; `name` receives the segments after it.
 */
/** @type {{ reference: string, name: (segments: string[]) => string }[]} */
export const customProperties = [
  { reference: 'color.context', name: ([group, step]) => `${group}-${step}` },
  { reference: 'color.primitive', name: ([group, step]) => `${group}-${step}` },
  { reference: 'space.context', name: ([step]) => `space-${step}` },
  { reference: 'opacity.context', name: ([step]) => `opacity-${step}` },
  { reference: 'opacity.level', name: ([step]) => `opacity-${step}` },
  { reference: 'shadow.context', name: ([step]) => `box-shadow-${abbreviateScale(step)}` },
  { reference: 'borderRadius.context', name: ([step]) => `border-radius-${abbreviateScale(step)}` },
  { reference: 'borderWidth.context', name: ([step]) => `border-width-${abbreviateScale(step)}` }
]

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
 * Names the custom property for a token that prints a reference.
 *
 * @param {Object} token - A token for which `printsReference` is true.
 * @param {Object} references - Token lookups.
 * @returns {string|undefined} e.g. `var(--border-radius-md)`; `undefined` when the
 *   referenced token has no custom property.
 * @throws {Error} When a reference target has no row in `customProperties`.
 */
export function customProperty(token, references) {
  const target = referenceTarget(token, references)
  if (!target) return undefined

  const row = customProperties.find(({ reference }) => startsWith(target, reference))
  if (!row) {
    throw new Error(`No custom property for ${target.join('.')}`)
  }
  return `var(--${row.name(target.slice(row.reference.split('.').length))})`
}

/**
 * Custom property names of the typography parts of an object-valued typography token.
 */
const objectNames = {
  fontFamily: (path) => `var(--font-family-${path[2]})`,
  fontWeight: (path) => `var(--font-weight-${path[2]}-${path[3]})`,
  fontSize: (path) => `var(--font-size-${path[2]}-${abbreviateScale(path[3])})`,
  lineHeight: (path) => `var(--line-height-${path[2]}-${abbreviateScale(path[3])})`
}

/**
 * Custom property names of a reference-valued typography token.
 */
const referenceNames = ({ family, size, weight }) => ({
  fontFamily: `var(--font-family-${family})`,
  fontWeight: `var(--font-weight-${weight})`,
  fontSize: `var(--font-size-${abbreviateScale(size)})`,
  lineHeight: `var(--line-height-${abbreviateScale(size)})`
})

/**
 * Returns the SCSS value of a web token: a custom property, a typography map, or the
 * encoded value.
 *
 * @param {Object} token - A resolved token with `$type`, `$value`, `path` and `original`.
 * @param {Object} references - Token lookups, see `reference-policy.js`.
 * @returns {string} The SCSS value.
 */
export function webValue(token, references) {
  try {
    if (printsReference(token, referencingGroups)) {
      return customProperty(token, references) ?? token.$value
    }
    if (token.$type === 'typography') {
      return typeof token.original.$value === 'object'
        ? typographyObject(token, references, objectNames)
        : typographyReference(token, references, referenceNames)
    }
    return encode(token, { resolveReference: references.value })
  } catch (error) {
    throw new Error(`${token.path.join('.')}: ${error.message}`, { cause: error })
  }
}

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
  followAliases,
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
 * Typography groups that hold one token per role group (`heading`, `body`, `title`…),
 * which a brand points at a family. A part that references one follows the alias to the
 * family token it leads to, and the token itself prints the custom property of that
 * family token.
 */
export const roleGroups = ['typography.fontFamily.context', 'typography.fontWeight.context']

/**
 * Typography groups that hold one value per role (`h1`, `title-large`…). Chassis CSS
 * declares a custom property for each, named without the group (`--font-size-h1`); a
 * role whose alias leads to a token of another group (`{size.unit.96}`) prints its value.
 */
export const roleValueGroups = ['typography.fontSize.context', 'typography.lineHeight.context']

/**
 * Names the custom property suffix of a role: the scale step after the last hyphen is
 * abbreviated.
 *
 * @param {string} role - e.g. `title-large`, `h1`
 * @returns {string} e.g. `title-lg`, `h1`
 */
export function roleName(role) {
  const segments = role.split('-')
  return [...segments.slice(0, -1), abbreviateScale(segments[segments.length - 1])].join('-')
}

/**
 * Names the scale part of a size or line height custom property: `<family>-<short step>`
 * for a scale token, the role name for a role token.
 */
const scaleName = (path) =>
  path[2] === 'context' ? roleName(path[3]) : `${path[2]}-${abbreviateScale(path[3])}`

/**
 * Custom property names of the typography parts of an object-valued typography token.
 */
const propertyNames = {
  fontFamily: (path) => `var(--font-family-${path[2]})`,
  fontWeight: (path) => `var(--font-weight-${path[2]}-${path[3]})`,
  fontSize: (path) => `var(--font-size-${scaleName(path)})`,
  lineHeight: (path) => `var(--line-height-${scaleName(path)})`
}

/**
 * Values of the typography parts that name no custom property, from the role token the
 * part references (its `weight` part for a font weight). A family list is quoted as one
 * string, and a line height is relative to the font size of the same role.
 */
const partValues = {
  fontFamily: (token) => `"${token.$value}"`,
  fontWeight: (token) => String(token.$value),
  fontSize: (token) => String(token.$value),
  lineHeight: (token, references) => encode(token, { resolveReference: references.value })
}

const inGroups = (path, groups) => groups.some((start) => startsWith(path, start))

/**
 * Returns the names of the typography parts. A part that references a role group token
 * (`roleGroups`) follows the alias and names the custom property of the token it leads
 * to: `typography.fontFamily.context.heading` = `{typography.fontFamily.display}` prints
 * `var(--font-family-display)`. A part that references a role value (`roleValueGroups`)
 * names the role's own custom property, `var(--font-size-h1)`. When a role group holds a
 * value of its own, or an alias leads to a token of another group (`{size.unit.96}`),
 * the part prints the value.
 *
 * @param {Object} references - Token lookups.
 * @returns {Record<string, (path: string[]) => string>} One function per part, taking
 *   the referenced path (for a font weight, the path before the weight and style split).
 */
function objectNames(references) {
  const followed = [...roleGroups, ...roleValueGroups]

  return Object.fromEntries(
    Object.entries(propertyNames).map(([property, name]) => [
      property,
      (/** @type {string[]} */ path) => {
        if (!inGroups(path, followed)) return name(path)

        const target = followAliases(path, references, followed)
        if (startsWith(target, `typography.${property}`) && !inGroups(target, roleGroups)) {
          return name(target)
        }
        const suffix = property === 'fontWeight' ? '.weight' : ''
        return partValues[property](references.token(`{${path.join('.')}${suffix}}`), references)
      }
    ])
  )
}

/**
 * Returns the custom property of a role group token that aliases a family token:
 * `typography.fontFamily.context.heading` = `{typography.fontFamily.display}` prints
 * `var(--font-family-display)`, and the `weight` part of
 * `typography.fontWeight.context.heading` = `{typography.fontWeight.display.mass}`
 * prints `var(--font-weight-display-mass)`. Chassis CSS declares the role group property
 * from it (`--font-family-heading`), so a brand swap is one custom property.
 *
 * @param {Object} token - A resolved token.
 * @param {Object} references - Token lookups.
 * @returns {string|undefined} `undefined` for other tokens, the `style` part of a weight,
 *   and a role group that holds a value.
 */
function roleGroupProperty(token, references) {
  const { path } = token
  const property = path[1]
  if (!inGroups(path, roleGroups)) return undefined
  if (property === 'fontWeight' && path[path.length - 1] !== 'weight') return undefined

  const role = property === 'fontWeight' ? path.slice(0, -1) : path
  const target = followAliases(role, references, roleGroups)
  if (inGroups(target, roleGroups) || !startsWith(target, `typography.${property}`)) {
    return undefined
  }
  return propertyNames[property](target)
}

/**
 * Custom property names of a reference-valued typography token, from the referenced
 * `font.<family>.<size>.<weight>` path.
 */
const referenceNames = ({ family, size, weight }) => ({
  fontFamily: `var(--font-family-${family})`,
  fontWeight: `var(--font-weight-${family}-${weight})`,
  fontSize: `var(--font-size-${family}-${abbreviateScale(size)})`,
  lineHeight: `var(--line-height-${family}-${abbreviateScale(size)})`
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
        ? typographyObject(token, references, objectNames(references))
        : typographyReference(token, references, referenceNames)
    }
    return (
      roleGroupProperty(token, references) ?? encode(token, { resolveReference: references.value })
    )
  } catch (error) {
    throw new Error(`${token.path.join('.')}: ${error.message}`, { cause: error })
  }
}

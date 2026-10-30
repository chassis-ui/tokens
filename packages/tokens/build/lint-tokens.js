/**
 * @file lint-tokens.js
 * @description Token source lint. Checks the token sets that `source/$themes.json` selects
 *              before a build, and names the token set and the token of every mistake:
 *
 *              - same-names:    the options of the `theme` and `screen` groups declare the
 *                               same names in their enabled sets
 *              - name-format:   names use letters, digits and single hyphens, start with a
 *                               letter, and no two names of one token-set list become the
 *                               same platform name
 *              - font-weight:   every font weight names a weight the build knows
 *              - token-type:    every token has a type, and every value is a token
 *              - type-conflict: no two sets of one token-set list declare the same name
 *                               with different types
 *              - letter-spacing: no letter spacing is a percentage or in em, which
 *                               Figma variables cannot hold; it is in pixels, with
 *                               or without `px`, or a reference
 *              - font-weight-family: a set that sets a font family sets all of its
 *                               weights too, and in each token-set list the weight of
 *                               a font token and of a text role group belongs to the
 *                               family that the token takes its family from
 *
 *              Sets that no theme selects are not built, so they are not checked.
 *
 * Usage:
 *   chassis-tokens lint-source [--cwd <dir>] [--dir <dir>]
 *
 *   --cwd <dir>  The repository of tokens (default: the nearest folder upward whose
 *                package.json has a chassis block).
 *   --dir <dir>  The token source directory (default: source, at the root of the repository).
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { permutateThemes } from '@tokens-studio/sd-transforms'
import StyleDictionary from 'style-dictionary'
import { splitWeightStyle } from './preprocessor.js'
import { fontWeightNumber } from './values/shared.js'
import { isEntry, readRepository, resolveRoot } from './root.js'

/** Theme groups whose options must declare the same names. */
export const SAME_NAME_GROUPS = ['theme', 'screen']

/** The name transforms of the platform configurations in `config/`. */
const NAME_TRANSFORMS = ['name/kebab', 'name/pascal', 'name/snake', 'name/camel']

const NAME_SEGMENT = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/
const FONT_WEIGHT_TYPES = new Set(['fontWeights', 'fontWeight'])
const RELATIVE_SIZE = /^-?(\d+(\.\d+)?|\.\d+)(%|em)$/

/**
 * Reads `$themes.json` and every token set it selects.
 * @param {string} dir - The token source directory.
 * @returns {Promise<{themes: Object[], sets: Object<string, Object>}>}
 * @throws {Error} When a selected set has no file.
 */
export async function loadSource(dir) {
  const themes = JSON.parse(await readFile(join(dir, '$themes.json'), 'utf8'))
  const sets = {}
  for (const set of selectedSets(themes)) {
    try {
      sets[set] = JSON.parse(await readFile(join(dir, `${set}.json`), 'utf8'))
    } catch (error) {
      throw new Error(`Token set ${set}, selected in $themes.json: ${error.message}`, {
        cause: error
      })
    }
  }
  return { themes, sets }
}

/**
 * The token sets that any theme selects, enabled or as source.
 * @param {Object[]} themes - `$themes.json`
 * @returns {string[]}
 */
function selectedSets(themes) {
  const sets = new Set()
  for (const theme of themes) {
    for (const [set, status] of Object.entries(theme.selectedTokenSets)) {
      if (status !== 'disabled') sets.add(set)
    }
  }
  return [...sets]
}

/**
 * Reads the tokens of a token set, as the preprocessor finds them: an object with `$value`
 * is a token; any other object is a group. A value that is not an object is not a token,
 * such as `value` and `type` of the Tokens Studio format before DTCG.
 * @param {Object} group - The token set.
 * @returns {{tokens: Map<string, Object>, strays: string[]}} Tokens by dotted name, and
 *   the dotted names of values that are not tokens.
 */
export function readTokens(group, path = [], result = { tokens: new Map(), strays: [] }) {
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$')) continue
    const name = [...path, key]
    if (typeof value !== 'object' || value === null) {
      result.strays.push(name.join('.'))
    } else if (Object.hasOwn(value, '$value')) {
      result.tokens.set(name.join('.'), value)
    } else {
      readTokens(value, name, result)
    }
  }
  return result
}

function isReference(value) {
  return typeof value === 'string' && value.includes('{')
}

/**
 * Checks a letter spacing value. Figma reads a number variable bound to letter spacing
 * as pixels and cannot hold a percentage, so Tokens Studio exports no variable for one.
 * The build converts pixels to the unit of each platform.
 * @param {*} value - The letter spacing of a `letterSpacing` or typography token.
 * @returns {string|undefined} What is wrong, or `undefined`.
 */
export function letterSpacingProblem(value) {
  const text = String(value).trim()
  if (!RELATIVE_SIZE.test(text)) return undefined
  return `is "${text}", which Figma variables cannot hold; write it in pixels, such as "-0.5"`
}

/**
 * Checks the token sources.
 * @param {{themes: Object[], sets: Object<string, Object>}} source - From `loadSource`.
 * @returns {{rule: string, set: string, token: string, message: string}[]} The mistakes, by
 *   rule, then in set order.
 */
export function lintTokens({ themes, sets }) {
  const errors = []
  const report = (rule, set, token, message) => errors.push({ rule, set, token, message })
  const tokensBySet = Object.fromEntries(
    Object.entries(sets).map(([set, json]) => [set, readTokens(json)])
  )
  const lists = permutateThemes(themes, { separator: '_' })

  // same-names
  for (const group of SAME_NAME_GROUPS) {
    const options = themes
      .filter((theme) => theme.group === group)
      .map((theme) => {
        const declaredIn = new Map()
        for (const [set, status] of Object.entries(theme.selectedTokenSets)) {
          if (status !== 'enabled') continue
          for (const name of tokensBySet[set].tokens.keys()) {
            if (!declaredIn.has(name)) declaredIn.set(name, set)
          }
        }
        return { name: theme.name, declaredIn }
      })
    const names = new Set(options.flatMap((option) => [...option.declaredIn.keys()]))
    for (const name of names) {
      const having = options.filter((option) => option.declaredIn.has(name))
      const lacking = options.filter((option) => !option.declaredIn.has(name))
      if (lacking.length === 0) continue
      const quote = (list) => list.map((option) => `"${option.name}"`).join(', ')
      const declaringSets = [...new Set(having.map((option) => option.declaredIn.get(name)))]
      report(
        'same-names',
        declaringSets.join(', '),
        name,
        `is declared by ${group} ${quote(having)}, not by ${group} ${quote(lacking)}`
      )
    }
  }

  // name-format: characters of each set's names
  const badNames = new Set()
  for (const [set, { tokens }] of Object.entries(tokensBySet)) {
    for (const name of tokens.keys()) {
      const segments = name.split('.')
      const bad = segments.find((segment) => !NAME_SEGMENT.test(segment))
      if (bad !== undefined || !/^[A-Za-z]/.test(name)) badNames.add(name)
      if (bad !== undefined) {
        report(
          'name-format',
          set,
          name,
          `"${bad}" has characters other than letters, digits and single hyphens`
        )
      } else if (!/^[A-Za-z]/.test(name)) {
        report('name-format', set, name, 'starts with a digit, which Swift and Android reject')
      }
    }
  }

  // name-format: platform names, and type-conflict, per token-set list
  /** @type {[string, Omit<import('style-dictionary/types').Transform, 'name'>][]} */
  const transforms = NAME_TRANSFORMS.map((id) => [id, StyleDictionary.hooks.transforms[id]])
  const reported = new Set()
  const once = (key) => !reported.has(key) && reported.add(key)
  for (const [list, listSets] of Object.entries(lists)) {
    const declared = new Map()
    const platformNames = new Map(transforms.map(([id]) => [id, new Map()]))
    for (const set of listSets) {
      for (const [name, token] of tokensBySet[set].tokens) {
        const first = declared.get(name)
        if (first === undefined) {
          declared.set(name, { set, type: token.$type })
          // A name with bad characters is reported above
          if (badNames.has(name)) continue
          const collisions = new Map()
          for (const [id, { transform }] of transforms) {
            // The name transforms read the path only
            const pathOnly = /** @type {import('style-dictionary/types').TransformedToken} */ ({
              path: name.split('.')
            })
            const platformName = transform(pathOnly, {}, {})
            const other = platformNames.get(id).get(platformName)
            if (other) {
              if (!collisions.has(other.name)) collisions.set(other.name, { ...other, names: [] })
              collisions.get(other.name).names.push(`"${platformName}" (${id})`)
            }
            platformNames.get(id).set(platformName, { name, set })
          }
          for (const other of collisions.values()) {
            if (!once(`name ${other.name} ${name}`)) continue
            report(
              'name-format',
              set,
              name,
              `has the platform names of ${other.name} in ${other.set}: ${other.names.join(', ')}`
            )
          }
        } else if (
          token.$type !== first.type &&
          once(`type ${name} ${first.set} ${set} ${token.$type}`)
        ) {
          report(
            'type-conflict',
            set,
            name,
            `has type "${token.$type}", but ${first.set} declares it as "${first.type}" ` +
              `(token-set list ${list})`
          )
        }
      }
    }
  }

  // font-weight and token-type
  for (const [set, { tokens, strays }] of Object.entries(tokensBySet)) {
    for (const name of strays) {
      report('token-type', set, name, 'is not a token: it has no $value')
    }
    for (const [name, token] of tokens) {
      if (typeof token.$type !== 'string' || token.$type === '') {
        report('token-type', set, name, 'has no $type')
      }
      const weight = FONT_WEIGHT_TYPES.has(token.$type)
        ? token.$value
        : token.$type === 'typography'
          ? token.$value?.fontWeight
          : undefined
      if (weight === undefined || isReference(weight)) continue
      try {
        fontWeightNumber({ $value: splitWeightStyle(`${weight}`).weight, path: name.split('.') })
      } catch {
        report('font-weight', set, name, `"${weight}" is not a font weight the build knows`)
      }
    }
  }

  // letter-spacing
  for (const [set, { tokens }] of Object.entries(tokensBySet)) {
    for (const [name, token] of tokens) {
      const spacing =
        token.$type === 'letterSpacing'
          ? token.$value
          : token.$type === 'typography'
            ? token.$value?.letterSpacing
            : undefined
      if (spacing === undefined) continue
      const problem = letterSpacingProblem(spacing)
      if (problem) {
        const part = token.$type === 'typography' ? 'has a letter spacing that ' : ''
        report('letter-spacing', set, name, `${part}${problem}`)
      }
    }
  }

  // font-weight-family: a set that sets a family sets its weights
  const familyWeights = new Map()
  for (const { tokens } of Object.values(tokensBySet)) {
    for (const name of tokens.keys()) {
      const [group, part, family, weight] = name.split('.')
      if (group !== 'typography' || part !== 'fontWeight' || family === ROLE_GROUP || !weight)
        continue
      if (!familyWeights.has(family)) familyWeights.set(family, new Set())
      familyWeights.get(family).add(name)
    }
  }
  for (const [set, { tokens }] of Object.entries(tokensBySet)) {
    for (const name of tokens.keys()) {
      const [group, part, family] = name.split('.')
      if (group !== 'typography' || part !== 'fontFamily' || family === ROLE_GROUP) continue
      const missing = [...(familyWeights.get(family) ?? [])].filter((weight) => !tokens.has(weight))
      if (missing.length > 0) {
        report(
          'font-weight-family',
          set,
          name,
          `sets the family "${family}" without its weights ${missing.join(', ')}`
        )
      }
    }
  }

  // font-weight-family: the weight of a font token belongs to its family
  for (const listSets of Object.values(lists)) {
    /** @type {Map<string, {set: string, token: any}>} */
    const declared = new Map()
    for (const set of listSets) {
      for (const [name, token] of tokensBySet[set].tokens) declared.set(name, { set, token })
    }
    for (const mismatch of weightFamilyMismatches(declared)) {
      if (!once(`weight-family ${mismatch.set} ${mismatch.token} ${mismatch.message}`)) continue
      report('font-weight-family', mismatch.set, mismatch.token, mismatch.message)
    }
  }

  const ruleOrder = [
    'same-names',
    'name-format',
    'font-weight',
    'token-type',
    'type-conflict',
    'letter-spacing',
    'font-weight-family'
  ]
  const setOrder = Object.keys(sets)
  return errors.sort(
    (a, b) =>
      ruleOrder.indexOf(a.rule) - ruleOrder.indexOf(b.rule) ||
      setOrder.indexOf(a.set) - setOrder.indexOf(b.set)
  )
}

/** The text role groups, whose family and weight tokens alias a family token. */
const ROLE_GROUP = 'context'

/**
 * Returns the family that a font family or font weight reference leads to: the first
 * `typography.fontFamily.<family>` or `typography.fontWeight.<family>.<weight>` on its way
 * that is not a text role group. A role group that holds a value of its own, or a reference
 * to a token that the list does not declare, leads to no family.
 *
 * @param {string} name - A token name, such as `typography.fontWeight.context.lead`.
 * @param {'fontFamily'|'fontWeight'} property
 * @param {Map<string, {set: string, token: any}>} declared - The tokens of one token-set list.
 * @returns {string|undefined} e.g. `prose`
 */
export function familyOf(name, property, declared) {
  const seen = new Set()
  let current = name
  while (!seen.has(current)) {
    seen.add(current)
    const [group, part, family] = current.split('.')
    if (group !== 'typography' || part !== property || family === undefined) return undefined
    if (family !== ROLE_GROUP) return family
    const value = declared.get(current)?.token.$value
    if (!isReference(value)) return undefined
    current = value.slice(1, -1)
  }
  return undefined
}

/**
 * Finds the font tokens and the text role groups of one token-set list whose weight
 * belongs to another family than their family. A role group is checked once, on its weight
 * token; a font token whose family and weight both reference role groups is checked
 * through them.
 *
 * @param {Map<string, {set: string, token: any}>} declared - The tokens of one token-set list.
 * @returns {{set: string, token: string, message: string}[]}
 */
export function weightFamilyMismatches(declared) {
  const mismatches = []
  const prefix = `typography.fontFamily.${ROLE_GROUP}.`
  for (const [name] of declared) {
    if (!name.startsWith(prefix)) continue
    const weightName = `typography.fontWeight.${ROLE_GROUP}.${name.slice(prefix.length)}`
    const weight = declared.get(weightName)
    if (!weight) continue
    const family = familyOf(name, 'fontFamily', declared)
    const weightFamily = familyOf(weightName, 'fontWeight', declared)
    if (family && weightFamily && family !== weightFamily) {
      mismatches.push({
        set: weight.set,
        token: weightName,
        message: `is a weight of the family "${weightFamily}", but ${name} leads to the family "${family}"`
      })
    }
  }
  for (const [name, { set, token }] of declared) {
    if (token.$type !== 'typography' || typeof token.$value !== 'object') continue
    const { fontFamily, fontWeight } = token.$value
    if (!isReference(fontFamily) || !isReference(fontWeight)) continue
    const familyName = fontFamily.slice(1, -1)
    const weightName = fontWeight.slice(1, -1)
    if (familyName.startsWith(prefix) && weightName.split('.')[2] === ROLE_GROUP) continue
    const family = familyOf(familyName, 'fontFamily', declared)
    const weightFamily = familyOf(weightName, 'fontWeight', declared)
    if (family && weightFamily && family !== weightFamily) {
      mismatches.push({
        set,
        token: name,
        message: `has a weight of the family "${weightFamily}" (${weightName}), but its family leads to "${family}"`
      })
    }
  }
  return mismatches
}

/**
 * Formats a mistake as one line.
 * @param {{rule: string, set: string, token: string, message: string}} error
 * @returns {string}
 */
export function formatError({ rule, set, token, message }) {
  return `${set}: ${token} ${message} [${rule}]`
}

const HELP = `Usage: chassis-tokens lint-source [options]

Checks the token files in source/: equal names across themes and screens, usable names, known
font weights, typed tokens, no name with two types.

Options:
  --cwd <dir>  The repository of tokens (default: the nearest folder upward whose package.json
               has a chassis block)
  --dir <dir>  The folder of the token files (default: source/ of the repository)
  --help, -h   Print this help
`

async function main(args) {
  const { values } = parseArgs({
    args,
    options: {
      cwd: { type: 'string' },
      dir: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false }
    }
  })
  if (values.help) {
    console.log(HELP)
    return
  }
  const source = await loadSource(values.dir ?? readRepository(resolveRoot(values.cwd)).source)
  const errors = lintTokens(source)
  const sets = Object.keys(source.sets).length

  if (errors.length > 0) {
    for (const error of errors) console.error(`❌ ${formatError(error)}`)
    console.error(`\n${errors.length} problems in the token source (${sets} token sets)`)
    process.exit(1)
  }
  console.log(`✅ Token source lint passed: ${sets} token sets`)
}

/**
 * The command line of the lint: `chassis-tokens lint-source`.
 * @param {string[]} [argv] - The arguments. Default: `process.argv.slice(2)`.
 */
export function cli(argv = process.argv.slice(2)) {
  main(argv).catch((error) => {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  })
}

if (isEntry(import.meta.url)) cli()

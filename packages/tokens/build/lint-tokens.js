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
 *
 *              Sets that no theme selects are not built, so they are not checked.
 *
 * Usage:
 *   node build/lint-tokens.js [--dir <dir>]
 *
 *   --dir <dir>  The token source directory (default: source, at the root of the repository).
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { permutateThemes } from '@tokens-studio/sd-transforms'
import StyleDictionary from 'style-dictionary'
import { splitWeightStyle } from './preprocessor.js'
import { fontWeightNumber } from './values/shared.js'

const SOURCE_DIR = fileURLToPath(new URL('../../../source', import.meta.url))

/** Theme groups whose options must declare the same names. */
export const SAME_NAME_GROUPS = ['theme', 'screen']

/** The name transforms of the platform configurations in `config/`. */
const NAME_TRANSFORMS = ['name/kebab', 'name/pascal', 'name/snake', 'name/camel']

const NAME_SEGMENT = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/
const FONT_WEIGHT_TYPES = new Set(['fontWeights', 'fontWeight'])

/**
 * Reads `$themes.json` and every token set it selects.
 * @param {string} dir - The token source directory.
 * @returns {Promise<{themes: Object[], sets: Object<string, Object>}>}
 * @throws {Error} When a selected set has no file.
 */
export async function loadSource(dir = SOURCE_DIR) {
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

  const ruleOrder = ['same-names', 'name-format', 'font-weight', 'token-type', 'type-conflict']
  const setOrder = Object.keys(sets)
  return errors.sort(
    (a, b) =>
      ruleOrder.indexOf(a.rule) - ruleOrder.indexOf(b.rule) ||
      setOrder.indexOf(a.set) - setOrder.indexOf(b.set)
  )
}

/**
 * Formats a mistake as one line.
 * @param {{rule: string, set: string, token: string, message: string}} error
 * @returns {string}
 */
export function formatError({ rule, set, token, message }) {
  return `${set}: ${token} ${message} [${rule}]`
}

async function main() {
  const { values } = parseArgs({ options: { dir: { type: 'string', default: SOURCE_DIR } } })
  const source = await loadSource(values.dir)
  const errors = lintTokens(source)
  const sets = Object.keys(source.sets).length

  if (errors.length > 0) {
    for (const error of errors) console.error(`❌ ${formatError(error)}`)
    console.error(`\n${errors.length} problems in the token source (${sets} token sets)`)
    process.exit(1)
  }
  console.log(`✅ Token source lint passed: ${sets} token sets`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  })
}

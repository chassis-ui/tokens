/**
 * @file verify.js
 * @description Golden check. Builds the tokens into a scratch directory and compares
 *              every file with the committed `dist/`, ignoring the timestamp and
 *              version header lines. Also fails when a token name appears twice in
 *              one file, because Sass rejects duplicate `$cx-*` variables.
 *
 * Usage:
 *   node build/tokens/verify.js [--out <dir>] [--platform <name>] [--skip-build]
 *
 *   --out <dir>        Scratch output directory (default: dist-next). Deleted before the build.
 *   --platform <name>  Build and compare one platform only; repeat or comma-separate for more.
 *   --skip-build       Compare an existing output directory without building.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { spawn } from 'node:child_process'
import { readdir, readFile, rm } from 'node:fs/promises'
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

export const ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url))
export const DIST_DIR = join(ROOT_DIR, 'dist')
const BUILD_SCRIPT = fileURLToPath(new URL('./build.js', import.meta.url))

/**
 * Header lines that change on every build or release, in SCSS/Swift (`// …`)
 * and XML (indented inside `<!-- … -->`) headers.
 */
const HEADER_LINE = /^\s*(\/\/\s*)?(Generated on |Chassis - Tokens v)/

/**
 * Token name declarations per output format.
 */
const NAME_PATTERNS = {
  '.scss': /^\$([\w-]+):/gm,
  '.swift': /static let (\w+)/g,
  '.xml': /^\s*<\w+ name="([^"]+)"/gm
}

const MAX_REPORTED_LINES = 5

/**
 * Lists files under a directory as sorted, `/`-separated relative paths.
 * Dotfiles (e.g. `.DS_Store`) are ignored. A missing directory yields no files.
 */
async function listFiles(root) {
  let entries
  try {
    entries = await readdir(root, { recursive: true, withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort()
}

/**
 * Splits a file into lines, dropping header lines and keeping 1-based line numbers.
 */
function significantLines(text) {
  return text
    .split('\n')
    .map((line, index) => ({ number: index + 1, text: line }))
    .filter((line) => !HEADER_LINE.test(line.text))
}

/**
 * Returns the token names declared more than once in a file.
 */
function findDuplicateNames(file, text) {
  const pattern = NAME_PATTERNS[extname(file)]
  if (!pattern) return []
  const seen = new Set()
  const duplicates = new Set()
  for (const [, name] of text.matchAll(pattern)) {
    if (seen.has(name)) duplicates.add(name)
    seen.add(name)
  }
  return [...duplicates]
}

/**
 * Compares two files line by line, position for position.
 */
function diffLines(expectedText, actualText) {
  const expected = significantLines(expectedText)
  const actual = significantLines(actualText)
  const lines = []
  let count = 0
  for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
    if (expected[i]?.text === actual[i]?.text) continue
    count++
    if (lines.length < MAX_REPORTED_LINES) {
      lines.push({
        number: expected[i]?.number ?? actual[i]?.number,
        expected: expected[i]?.text,
        actual: actual[i]?.text
      })
    }
  }
  return { count, lines }
}

/**
 * Compares a build output directory with the reference directory.
 *
 * @param {string} expectedDir - Reference output, normally the committed `dist/`.
 * @param {string} actualDir - Output of the build under test.
 * @param {Object} [options]
 * @param {string[]} [options.platforms] - Limit the reference files to these platforms.
 * @returns {Promise<Object>} `{ ok, compared, missing, extra, differing, duplicates }`
 */
export async function compareOutput(expectedDir, actualDir, { platforms = [] } = {}) {
  const inScope = (file) => platforms.length === 0 || platforms.includes(file.split('/')[0])
  const expected = (await listFiles(expectedDir)).filter(inScope)
  if (expected.length === 0) {
    throw new Error(`No reference files found in ${expectedDir}`)
  }
  const actual = await listFiles(actualDir)
  const expectedSet = new Set(expected)
  const actualSet = new Set(actual)

  const result = {
    compared: 0,
    missing: expected.filter((file) => !actualSet.has(file)),
    extra: actual.filter((file) => !expectedSet.has(file)),
    differing: [],
    duplicates: []
  }

  for (const file of expected.filter((file) => actualSet.has(file))) {
    const [expectedText, actualText] = await Promise.all([
      readFile(join(expectedDir, file), 'utf8'),
      readFile(join(actualDir, file), 'utf8')
    ])
    result.compared++

    const diff = diffLines(expectedText, actualText)
    if (diff.count > 0) result.differing.push({ file, ...diff })

    const names = findDuplicateNames(file, actualText)
    if (names.length > 0) result.duplicates.push({ file, names })
  }

  result.ok =
    result.missing.length === 0 &&
    result.extra.length === 0 &&
    result.differing.length === 0 &&
    result.duplicates.length === 0
  return result
}

/**
 * Formats a comparison result as a readable report.
 */
export function formatReport(result) {
  if (result.ok) {
    return `✅ Golden check passed: ${result.compared} files match dist/`
  }
  const out = ['❌ Golden check failed']
  for (const file of result.missing) out.push(`  missing    ${file}`)
  for (const file of result.extra) out.push(`  extra      ${file}`)
  for (const { file, count, lines } of result.differing) {
    out.push(`  differs    ${file} (${count} line${count === 1 ? '' : 's'})`)
    for (const line of lines) {
      out.push(`    line ${line.number}`)
      out.push(`      - ${line.expected ?? '<no line>'}`)
      out.push(`      + ${line.actual ?? '<no line>'}`)
    }
  }
  for (const { file, names } of result.duplicates) {
    out.push(`  duplicate  ${file}: ${names.join(', ')}`)
  }
  out.push(
    `  ${result.compared} compared, ${result.missing.length} missing, ${result.extra.length} extra, ` +
      `${result.differing.length} differing, ${result.duplicates.length} with duplicate names`
  )
  return out.join('\n')
}

/**
 * Throws when deleting `outDir` would delete the reference output or the repo.
 */
function assertSafeOutDir(outDir) {
  const toDist = relative(outDir, DIST_DIR)
  const containsDist = toDist === '' || (!toDist.startsWith('..') && !isAbsolute(toDist))
  if (containsDist) {
    throw new Error(`Refusing to use ${outDir}: it is or contains the reference dist/`)
  }
}

/**
 * Deletes `outDir`, then runs the token build into it from the repo root.
 *
 * @param {string} outDir - Absolute output directory.
 * @param {Object} [options]
 * @param {string[]} [options.platforms] - Passed to the build as `--platform`.
 * @returns {Promise<{ code: number, output: string }>} Exit code and combined build output.
 */
export async function runBuild(outDir, { platforms = [] } = {}) {
  assertSafeOutDir(outDir)
  await rm(outDir, { recursive: true, force: true })

  const args = [BUILD_SCRIPT, '--out', outDir]
  if (platforms.length > 0) args.push('--platform', ...platforms)

  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, { cwd: ROOT_DIR })
    const chunks = []
    child.stdout.on('data', (chunk) => chunks.push(chunk))
    child.stderr.on('data', (chunk) => chunks.push(chunk))
    child.on('error', reject)
    child.on('close', (code) => resolvePromise({ code, output: Buffer.concat(chunks).toString() }))
  })
}

async function main() {
  const { values } = parseArgs({
    options: {
      out: { type: 'string', default: 'dist-next' },
      platform: { type: 'string', multiple: true, default: [] },
      'skip-build': { type: 'boolean', default: false }
    }
  })
  const outDir = resolve(ROOT_DIR, values.out)
  const platforms = values.platform.flatMap((value) => value.split(',')).filter(Boolean)

  if (!values['skip-build']) {
    const started = Date.now()
    const build = await runBuild(outDir, { platforms })
    if (build.code !== 0) {
      console.error(build.output.split('\n').slice(-40).join('\n'))
      console.error(`❌ Build failed with exit code ${build.code}`)
      process.exit(1)
    }
    console.log(
      `Built into ${relative(ROOT_DIR, outDir)}/ in ${((Date.now() - started) / 1000).toFixed(1)}s`
    )
  }

  const result = await compareOutput(DIST_DIR, outDir, { platforms })
  console.log(formatReport(result))
  process.exit(result.ok ? 0 : 1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

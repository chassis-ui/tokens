/**
 * @file diff.js
 * @description Token diff report. Compares two `dist/` trees and reports, by platform and
 *              file, the token names added, removed and changed in value. A removed and an
 *              added name with the same value in the same file are reported as a possible
 *              rename. Removed and renamed names are breaking: apps that use them stop
 *              compiling. Files without token declarations (the icon assets) are compared
 *              whole. Header lines are not declarations, so a rebuild that only changes
 *              them reports nothing. The report is Markdown, for a CI job summary.
 *
 * Usage:
 *   node build/diff.js [--base <ref|dir>] [--head <ref|dir>]
 *
 *   --base <ref|dir>  The `dist/` to compare against: a directory, or a git ref whose
 *                     `packages/tokens/dist/` (or `dist/`, before the workspace split) is
 *                     read (default: main).
 *   --head <ref|dir>  The `dist/` to report on (default: this package's `dist/`).
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { execFile } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DIST_DIR = fileURLToPath(new URL('../dist', import.meta.url))

/** Where `dist/` is in a commit: after the workspace split, then before it. */
const DIST_PATHS = ['packages/tokens/dist', 'dist']

/** Items listed per category and file; the rest are counted. */
const MAX_LISTED = 25

/** Characters of a value shown in the report. */
const MAX_VALUE_LENGTH = 80

// `$cx-name: value !default;`
const SCSS_DECLARATION = /^\$([\w-]+):\s*(.*?)(?:\s*!default)?;\s*$/
// `public static let Name = value`, in an enum or class
const SWIFT_DECLARATION =
  /^\s*(?:@objc\s+)?(?:public\s+)?static let (\w+)(?:\s*:[^=]+)?\s*=\s*(.*?)\s*$/
// `<dimen name="name">value</dimen>`, `<item name="name" type="dimen" …>value</item>`
const XML_DECLARATION = /^\s*<(\w+) name="([^"]+)"([^>]*)>(.*)<\/\1>\s*$/

/**
 * Whether a file holds token declarations. Android drawables are XML without them.
 * @param {string} file - `/`-separated path relative to `dist/`
 * @returns {boolean}
 */
export function isDeclarationFile(file) {
  const ext = extname(file)
  if (ext === '.scss' || ext === '.swift') return true
  return ext === '.xml' && !file.split('/').some((part) => part.startsWith('drawable'))
}

/**
 * Reads the token declarations of an output file, in file order.
 * @param {string} file - `/`-separated path relative to `dist/`
 * @param {string} text - The file's content
 * @returns {Map<string, string>} Token name to printed value. An Android value includes its
 *   element and attributes (`<dimen>16dp`), so a changed resource type is a changed value.
 */
export function parseDeclarations(file, text) {
  const declarations = new Map()
  const ext = extname(file)

  for (const line of text.split('\n')) {
    let match
    if (ext === '.scss' && (match = SCSS_DECLARATION.exec(line))) {
      declarations.set(`$${match[1]}`, match[2])
    } else if (ext === '.swift' && (match = SWIFT_DECLARATION.exec(line))) {
      declarations.set(match[1], match[2])
    } else if (ext === '.xml' && (match = XML_DECLARATION.exec(line))) {
      declarations.set(match[2], `<${match[1]}${match[3]}>${match[4]}`)
    }
  }

  return declarations
}

/**
 * Compares the declarations of one file.
 * @param {Map<string, string>} base
 * @param {Map<string, string>} head
 * @returns {{added: {name: string, value: string}[], removed: {name: string, value: string}[],
 *   changed: {name: string, from: string, to: string}[],
 *   renamed: {from: string, to: string, value: string}[]}}
 *   Names in file order. A removed and an added name with the same value are paired as a
 *   possible rename, in file order when several share a value, and are not listed as
 *   removed or added.
 */
export function diffDeclarations(base, head) {
  const added = []
  const removed = []
  const changed = []

  for (const [name, value] of base) {
    if (!head.has(name)) removed.push({ name, value })
    else if (head.get(name) !== value) changed.push({ name, from: value, to: head.get(name) })
  }
  for (const [name, value] of head) {
    if (!base.has(name)) added.push({ name, value })
  }

  const addedByValue = new Map()
  for (const entry of added) {
    if (!addedByValue.has(entry.value)) addedByValue.set(entry.value, [])
    addedByValue.get(entry.value).push(entry)
  }

  const renamed = []
  const paired = new Set()
  for (const entry of removed) {
    const target = addedByValue.get(entry.value)?.shift()
    if (target) {
      renamed.push({ from: entry.name, to: target.name, value: entry.value })
      paired.add(entry).add(target)
    }
  }

  return {
    added: added.filter((entry) => !paired.has(entry)),
    removed: removed.filter((entry) => !paired.has(entry)),
    changed,
    renamed
  }
}

/**
 * Lists files under a directory as sorted, `/`-separated relative paths, without dotfiles.
 */
async function listFiles(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort()
}

/**
 * Compares two `dist/` directories.
 * @param {string} baseDir
 * @param {string} headDir
 * @returns {Promise<{files: object[]}>} One entry per file that changed, sorted by path:
 *   `{file, platform, status}` with status `added`, `removed` or `changed`; a declaration
 *   file also has `declarations: true` and the result of `diffDeclarations`.
 */
export async function compareDist(baseDir, headDir) {
  const baseFiles = new Set(await listFiles(baseDir))
  const headFiles = new Set(await listFiles(headDir))
  const allFiles = [...new Set([...baseFiles, ...headFiles])].sort()
  const files = []

  for (const file of allFiles) {
    const baseText = baseFiles.has(file) ? await readFile(join(baseDir, file), 'utf8') : null
    const headText = headFiles.has(file) ? await readFile(join(headDir, file), 'utf8') : null
    const status = baseText === null ? 'added' : headText === null ? 'removed' : 'changed'
    const platform = file.split('/')[0]

    if (isDeclarationFile(file)) {
      const diff = diffDeclarations(
        parseDeclarations(file, baseText ?? ''),
        parseDeclarations(file, headText ?? '')
      )
      const count =
        diff.added.length + diff.removed.length + diff.changed.length + diff.renamed.length
      if (count > 0 || status !== 'changed') {
        files.push({ file, platform, status, declarations: true, ...diff })
      }
    } else if (baseText !== headText) {
      files.push({ file, platform, status, declarations: false })
    }
  }

  return { files }
}

function code(value) {
  const text = value.length > MAX_VALUE_LENGTH ? `${value.slice(0, MAX_VALUE_LENGTH)}…` : value
  return `\`${text.replaceAll('`', "'").replaceAll('\n', ' ')}\``
}

function listItems(items, format) {
  const lines = items.slice(0, MAX_LISTED).map((item) => `- ${format(item)}`)
  if (items.length > MAX_LISTED) lines.push(`- …and ${items.length - MAX_LISTED} more`)
  return lines
}

/**
 * Writes the report as Markdown.
 * @param {{files: object[]}} result - From `compareDist`
 * @returns {string} The report; one line when nothing changed
 */
export function formatReport(result) {
  const lines = ['## Token changes', '']
  const { files } = result

  if (files.length === 0) {
    return `${lines.join('\n')}\nNo token changes in \`dist/\`.\n`
  }

  const declarationFiles = files.filter((entry) => entry.declarations)
  const assetFiles = files.filter((entry) => !entry.declarations)
  const sum = (key) => declarationFiles.reduce((total, entry) => total + entry[key].length, 0)
  const removedFiles = files.filter((entry) => entry.status === 'removed').length
  const breaking = sum('removed') + sum('renamed')

  lines.push(
    `${sum('added')} added, ${sum('removed')} removed, ${sum('changed')} changed in value, ` +
      `${sum('renamed')} possible renames, in ${declarationFiles.length} files` +
      (assetFiles.length > 0 ? `; ${assetFiles.length} asset files changed.` : '.'),
    ''
  )

  if (breaking > 0 || removedFiles > 0) {
    lines.push(
      `**Breaking:** ${sum('removed')} removed and ${sum('renamed')} renamed names` +
        (removedFiles > 0 ? `, ${removedFiles} removed files` : '') +
        '. Apps that use them must change.',
      ''
    )
  }

  if (declarationFiles.length > 0) {
    lines.push(
      '| Platform | File | Added | Removed | Changed | Possible renames |',
      '| -------- | ---- | ----: | ------: | ------: | ---------------: |'
    )
    for (const entry of declarationFiles) {
      const note = entry.status === 'changed' ? '' : ` (${entry.status} file)`
      const path = entry.file.slice(entry.platform.length + 1)
      lines.push(
        `| ${entry.platform} | \`${path}\`${note} | ${entry.added.length} | ` +
          `${entry.removed.length} | ${entry.changed.length} | ${entry.renamed.length} |`
      )
    }
    lines.push('')
  }

  if (assetFiles.length > 0) {
    lines.push('| Platform | Asset file | Change |', '| -------- | ---------- | ------ |')
    for (const entry of assetFiles.slice(0, MAX_LISTED)) {
      const change = entry.status === 'removed' ? 'removed (breaking)' : entry.status
      lines.push(
        `| ${entry.platform} | \`${entry.file.slice(entry.platform.length + 1)}\` | ${change} |`
      )
    }
    if (assetFiles.length > MAX_LISTED) {
      lines.push(`| | …and ${assetFiles.length - MAX_LISTED} more | |`)
    }
    lines.push('')
  }

  for (const entry of declarationFiles) {
    lines.push(`<details><summary><code>${entry.file}</code></summary>`, '')
    if (entry.renamed.length > 0) {
      lines.push('Possible renames (breaking):', '')
      lines.push(
        ...listItems(
          entry.renamed,
          (item) => `${code(item.from)} → ${code(item.to)}: ${code(item.value)}`
        ),
        ''
      )
    }
    if (entry.removed.length > 0) {
      lines.push('Removed (breaking):', '')
      lines.push(
        ...listItems(entry.removed, (item) => `${code(item.name)}: ${code(item.value)}`),
        ''
      )
    }
    if (entry.changed.length > 0) {
      lines.push('Changed:', '')
      lines.push(
        ...listItems(
          entry.changed,
          (item) => `${code(item.name)}: ${code(item.from)} → ${code(item.to)}`
        ),
        ''
      )
    }
    if (entry.added.length > 0) {
      lines.push('Added:', '')
      lines.push(...listItems(entry.added, (item) => `${code(item.name)}: ${code(item.value)}`), '')
    }
    lines.push('</details>', '')
  }

  return lines.join('\n')
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

/**
 * Extracts `dist/` of a git ref into a temporary directory.
 * @param {string} ref
 * @returns {Promise<string>} The directory; the caller removes it
 */
async function extractRef(ref) {
  const git = (...args) => execFileAsync('git', args, { maxBuffer: 256 * 1024 * 1024 })
  const { stdout: top } = await git('rev-parse', '--show-toplevel')
  const cwd = top.trim()

  for (const path of DIST_PATHS) {
    const { stdout } = await execFileAsync('git', ['ls-tree', '-d', '--name-only', ref, path], {
      cwd
    })
    if (stdout.trim() === '') continue

    const dir = await mkdtemp(join(tmpdir(), 'chassis-tokens-diff-'))
    // `git archive` writes paths with their prefix; tar strips it
    const depth = path.split('/').length
    await execFileAsync(
      'sh',
      [
        '-c',
        'git archive --format=tar "$1" "$2" | tar -x -C "$3" --strip-components "$4"',
        'sh',
        ref,
        path,
        dir,
        String(depth)
      ],
      { cwd }
    )
    return dir
  }

  throw new Error(`${ref} has no ${DIST_PATHS.join('/ or ')}/`)
}

async function resolveSide(value, temporary) {
  if (await isDirectory(value)) return value
  const dir = await extractRef(value)
  temporary.push(dir)
  return dir
}

async function main() {
  const { values } = parseArgs({
    options: {
      base: { type: 'string', default: 'main' },
      head: { type: 'string', default: DIST_DIR }
    }
  })

  const temporary = []
  try {
    const baseDir = await resolveSide(values.base, temporary)
    const headDir = await resolveSide(values.head, temporary)
    process.stdout.write(formatReport(await compareDist(baseDir, headDir)))
  } finally {
    await Promise.all(temporary.map((dir) => rm(dir, { recursive: true, force: true })))
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  })
}

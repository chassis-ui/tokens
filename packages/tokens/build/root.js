/**
 * @file root.js
 * @description Where the build runs and which version it is. A repository of tokens holds
 *              `source/`, `Package.swift` and the `chassis` block of its `package.json` at
 *              its root, and the build is in a package it installs. So the root is found,
 *              not assumed: from the working directory upward, or given with `--cwd`.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync, realpathSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The output folder of a repository, unless `chassis.dist` names another. */
const DEFAULT_DIST = 'dist'

/**
 * Reads a `package.json`.
 * @param {string} dir - Its folder.
 * @returns {Object|undefined} Its content, or `undefined` when there is none to read.
 */
function readPackage(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  } catch {
    return undefined
  }
}

/**
 * The nearest folder, from `start` upward, whose `package.json` has a `chassis` block.
 * @param {string} [start] - Default: the working directory.
 * @returns {string} The folder, or `start` when no folder above it has such a file.
 */
export function findRoot(start = process.cwd()) {
  const from = resolve(start)
  for (let dir = from; ; dir = dirname(dir)) {
    if (readPackage(dir)?.chassis) return dir
    if (dir === dirname(dir)) return from
  }
}

/**
 * The repository of a run: `cwd` as it is when given, else `findRoot()`.
 * @param {string} [cwd] - The `--cwd` option.
 * @returns {string} An absolute path.
 */
export function resolveRoot(cwd) {
  return cwd ? resolve(cwd) : findRoot()
}

/**
 * The version of the build: that of the `package.json` of this package, wherever it runs.
 * @returns {string}
 */
export function buildVersion() {
  return readPackage(fileURLToPath(new URL('..', import.meta.url))).version
}

/**
 * Reads a repository of tokens. The version is the one its output is published under: of the
 * nearest `package.json` with a version, from the output folder upward to the root, so that
 * a workspace whose root has no version and whose output is in a package names that package.
 * @param {string} root - From `resolveRoot`.
 * @returns {{root: string, source: string, dist: string, version: string, build: Object}}
 *   Absolute folders, the version and `chassis.build`. Without any version, that of the build.
 */
export function readRepository(root) {
  const { chassis } = readPackage(root) ?? {}
  const dist = resolve(root, chassis?.dist ?? DEFAULT_DIST)
  let version
  for (let dir = dirname(dist); !version; dir = dirname(dir)) {
    version = readPackage(dir)?.version
    if (dir === root || dir === dirname(dir)) break
  }
  return {
    root,
    source: join(root, 'source'),
    dist,
    version: version ?? buildVersion(),
    build: chassis?.build
  }
}

/**
 * The path of a folder in a message: relative to the working directory, as a command gets it.
 * @param {string} dir
 * @returns {string}
 */
export function shownPath(dir) {
  return relative(process.cwd(), dir) || '.'
}

/**
 * Whether a module is the file Node.js was started with, and not imported.
 * @param {string} moduleUrl - `import.meta.url` of the module.
 * @returns {boolean}
 */
export function isEntry(moduleUrl) {
  if (!process.argv[1]) return false
  // By the real paths: a folder reached through a link, or a path with a space, is the same
  // file under another spelling
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(process.argv[1])
  } catch {
    return false
  }
}

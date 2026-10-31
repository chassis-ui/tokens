/**
 * @file helpers.js
 * @description Where the tests find their repositories of tokens. `FIXTURE_DIR` and `DIST_DIR`
 *              are in this package, so that the tests need nothing outside it. `WORKSPACE_DIR`
 *              is the workspace around the package and `TOKENS_DIR` the repository of tokens it
 *              vendors, when there are: the few tests that read the root `package.json` or the
 *              real `source/` and `dist/` skip without them.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GOLDEN_DIR } from '../build/verify.js'
export { FIXTURE_DIR } from '../build/verify.js'

export const PACKAGE_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)))
export const CLI = resolve(PACKAGE_DIR, 'build/cli.js')

/** The output of the default platforms for one brand, built from `FIXTURE_DIR`. */
export const DIST_DIR = join(GOLDEN_DIR, 'default')

const readPackage = (dir) => {
  try {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  } catch {
    return undefined
  }
}

const parent = resolve(PACKAGE_DIR, '../..')

/** The workspace of this package; `undefined` in a copy of the package without it. */
export const WORKSPACE_DIR =
  readPackage(parent)?.name === 'chassis-tokens-workspace' ? parent : undefined

const vendored = WORKSPACE_DIR && join(WORKSPACE_DIR, 'vendor/tokens')

/** The `vendor/tokens` submodule; `undefined` while it is not checked out. */
export const TOKENS_DIR = vendored && readPackage(vendored)?.chassis ? vendored : undefined

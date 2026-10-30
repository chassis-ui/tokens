/**
 * @file helpers.js
 * @description Where the tests find their repositories of tokens. `FIXTURE_DIR` is in this
 *              package, so that the tests need nothing outside it. `WORKSPACE_DIR` is the
 *              workspace around the package, when there is one: the few tests that compare the
 *              real `source/` and configuration with the committed `dist/` skip without it.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findRoot, readRepository } from '../build/root.js'
export { FIXTURE_DIR } from '../build/verify.js'

export const PACKAGE_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)))
export const CLI = resolve(PACKAGE_DIR, 'build/cli.js')

const found = findRoot(PACKAGE_DIR)

/** The workspace whose output is the `dist/` of this package; `undefined` without one. */
export const WORKSPACE_DIR =
  readRepository(found).dist === resolve(PACKAGE_DIR, 'dist') && found !== PACKAGE_DIR
    ? found
    : undefined

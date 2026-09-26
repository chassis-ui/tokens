/**
 * @file golden.test.js
 * @description Acceptance test for the build rewrite. Runs the real token build into a
 *              temporary directory and requires every file to match the committed
 *              `dist/`, apart from the timestamp and version header lines.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { DIST_DIR, compareOutput, formatReport, runBuild } from '../verify.js'

describe('Golden output', () => {
  let outDir

  afterAll(async () => {
    if (outDir) await rm(outDir, { recursive: true, force: true })
  })

  test('build reproduces the committed dist/', { timeout: 180_000 }, async () => {
    outDir = await mkdtemp(join(tmpdir(), 'chassis-tokens-golden-'))

    const build = await runBuild(outDir)
    expect(build.code, build.output.split('\n').slice(-40).join('\n')).toBe(0)

    const result = await compareOutput(DIST_DIR, outDir)
    expect(result.ok, formatReport(result)).toBe(true)
  })
})

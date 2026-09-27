/**
 * @file golden.test.js
 * @description Acceptance test for the build rewrite. Runs the real token build into a
 *              temporary directory and requires every file to match the committed
 *              `dist/`, apart from the timestamp and version header lines. Does the
 *              same for every preset and its baseline in `golden/`.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import {
  DIST_DIR,
  compareOutput,
  formatReport,
  listPresets,
  presetPaths,
  runBuild
} from '../verify.js'

const presets = await listPresets()

describe('Golden output', () => {
  const outDirs = []

  async function build(options) {
    const outDir = await mkdtemp(join(tmpdir(), 'chassis-tokens-golden-'))
    outDirs.push(outDir)
    const result = await runBuild(outDir, options)
    expect(result.code, result.output.split('\n').slice(-40).join('\n')).toBe(0)
    return outDir
  }

  afterAll(async () => {
    await Promise.all(outDirs.map((outDir) => rm(outDir, { recursive: true, force: true })))
  })

  test('build reproduces the committed dist/', { timeout: 180_000 }, async () => {
    const result = await compareOutput(DIST_DIR, await build())
    expect(result.ok, formatReport(result)).toBe(true)
  })

  test('the presets with a baseline are the SCSS variable presets', () => {
    expect(presets).toEqual(['web-px', 'web-scss', 'web-vw'])
  })

  test.each(presets)('preset %s reproduces its baseline', { timeout: 60_000 }, async (preset) => {
    const { config, expectedDir } = presetPaths(preset)
    const result = await compareOutput(expectedDir, await build({ config }))
    expect(result.ok, formatReport(result, `golden/${preset}/`)).toBe(true)
    expect(result.compared).toBe(7)
  })
})

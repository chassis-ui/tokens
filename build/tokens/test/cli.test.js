/**
 * @file cli.test.js
 * @description Tests for the command line arguments of the build.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, expect, test } from 'vitest'
import { parseArgs } from '../build.js'

describe('parseArgs', () => {
  test('selects everything and writes to dist by default', () => {
    expect(parseArgs([])).toEqual({
      brands: [],
      apps: [],
      platforms: [],
      themes: [],
      screens: [],
      out: 'dist',
      dryRun: false,
      help: false,
      version: false
    })
  })

  test.each([
    ['--brand', 'brands', ['chassis', 'sinefil']],
    ['--app', 'apps', ['docs', 'demo']],
    ['--platform', 'platforms', ['web', 'ios']],
    ['--theme', 'themes', ['light', 'dark']],
    ['--screen', 'screens', ['small', 'large']]
  ])('%s takes several values', (flag, key, values) => {
    expect(parseArgs([flag, ...values])[key]).toEqual(values)
  })

  test('reads several filters at once', () => {
    const options = parseArgs([
      '--brand',
      'chassis',
      '--theme',
      'light',
      'dark',
      '--platform',
      'web'
    ])
    expect(options).toMatchObject({
      brands: ['chassis'],
      themes: ['light', 'dark'],
      platforms: ['web']
    })
  })

  test('--out takes one directory and drops trailing slashes', () => {
    expect(parseArgs(['--out', 'dist-next/', '--brand', 'chassis'])).toMatchObject({
      out: 'dist-next',
      brands: ['chassis']
    })
  })

  test.each([[['--out']], [['--out', '--brand', 'chassis']]])(
    '--out without a directory throws (%j)',
    (args) => {
      expect(() => parseArgs(args)).toThrow('--out requires a directory')
    }
  )

  test.each([
    ['--dry-run', 'dryRun'],
    ['--help', 'help'],
    ['-h', 'help'],
    ['--version', 'version'],
    ['-v', 'version']
  ])('%s sets %s', (flag, key) => {
    expect(parseArgs([flag])[key]).toBe(true)
  })

  test('ignores unknown arguments', () => {
    expect(parseArgs(['--verbose', 'x'])).toEqual(parseArgs([]))
  })
})

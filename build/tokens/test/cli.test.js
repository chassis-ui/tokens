/**
 * @file cli.test.js
 * @description Tests for the command line arguments and the configuration of the build.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { loadConfig, parseArgs } from '../build.js'

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

  test('--config takes one file', () => {
    expect(
      parseArgs(['--config', 'build/tokens/test/golden/web-px.json', '--dry-run'])
    ).toMatchObject({ config: 'build/tokens/test/golden/web-px.json', dryRun: true })
    expect(parseArgs([])).not.toHaveProperty('config')
  })

  test.each([[['--config']], [['--config', '--brand', 'chassis']]])(
    '--config without a file throws (%j)',
    (args) => {
      expect(() => parseArgs(args)).toThrow('--config requires a file')
    }
  )

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

describe('loadConfig', () => {
  let dir
  const write = async (content) => {
    dir ??= await mkdtemp(join(tmpdir(), 'chassis-tokens-config-'))
    const file = join(dir, 'build.json')
    await writeFile(file, JSON.stringify(content))
    return file
  }
  const base = { brands: ['chassis'], themes: ['light'], apps: { docs: ['web-px'] } }

  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true })
  })

  test('reads chassis.build of package.json by default', async () => {
    const { version, buildOptions } = await loadConfig()
    expect(version).toMatch(/^\d+\.\d+\.\d+/)
    expect(buildOptions.apps).toEqual({ docs: ['web'], demo: ['ios', 'android'] })
  })

  test('reads a configuration file with platform options', async () => {
    const options = { 'web-px': { outputReferences: true } }
    const { buildOptions } = await loadConfig(await write({ ...base, options }))
    expect(buildOptions).toEqual({ ...base, options })
  })

  test('throws on options for a platform that no app uses', async () => {
    const file = await write({ ...base, options: { 'web-vw': { outputReferences: true } } })
    await expect(loadConfig(file)).rejects.toThrow(
      `Invalid ${file}: options for platforms no app uses: web-vw`
    )
  })

  test('throws on a configuration without apps', async () => {
    const file = await write({ brands: ['chassis'], themes: ['light'] })
    await expect(loadConfig(file)).rejects.toThrow(
      `Invalid ${file}: missing brands, themes or apps`
    )
  })
})

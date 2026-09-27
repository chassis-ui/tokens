/**
 * @file config.test.js
 * @description Tests for the Style Dictionary configuration of a planned build.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, expect, test } from 'vitest'
import config from '../config/index.js'

const outputs = [
  { kind: 'base' },
  { kind: 'color', theme: 'light' },
  { kind: 'number', screen: 'large' }
]
const build = {
  brand: 'chassis',
  app: 'demo',
  platforms: ['ios', 'android'],
  outputs,
  source: ['tokens/base/metric-source.json', 'tokens/brand-chassis/brand-base.json']
}

const files = (platform, outputList = outputs) =>
  config({ ...build, platforms: [platform], outputs: outputList }).platforms[platform].files

describe('config', () => {
  test('passes the token files through, in order, as source only', () => {
    const result = config(build)
    expect(result.source).toEqual(build.source)
    expect(result).not.toHaveProperty('include')
  })

  test('runs the chassis preprocessor and throws on broken references', () => {
    expect(config(build)).toMatchObject({
      preprocessors: ['cx/global'],
      log: { errors: { brokenReferences: 'throw' } }
    })
  })

  test('has one platform per target platform', () => {
    expect(Object.keys(config(build).platforms)).toEqual(['ios', 'android'])
  })

  test('writes under the output directory, dist by default', () => {
    expect(config(build).platforms.ios.buildPath).toBe('dist/ios/demo/chassis/')
    expect(config({ ...build, outDir: 'dist-next' }).platforms.android.buildPath).toBe(
      'dist-next/android/demo/chassis/'
    )
  })

  // File names, filters and formats of the output contract
  test.each([
    [
      'web',
      'cx/scss-chassis-css',
      ['main.scss', 'string.scss', 'color-light.scss', 'number-large.scss', 'number.scss']
    ],
    [
      'ios',
      'cx/ios-swift-class',
      ['Main.swift', 'String.swift', 'ColorLight.swift', 'NumberLarge.swift', 'Number.swift']
    ],
    [
      'android',
      'cx/android-resources',
      ['main.xml', 'string.xml', 'color_light.xml', 'number_large.xml', 'number.xml']
    ]
  ])('%s writes each output with its filter', (platform, format, names) => {
    expect(files(platform, [...outputs, { kind: 'number' }])).toEqual([
      { destination: names[0], filter: 'cx/allTokens', format },
      { destination: names[1], filter: 'cx/stringTokens', format },
      { destination: names[2], filter: 'cx/themeTokens', format },
      { destination: names[3], filter: 'cx/numberTokens', format },
      { destination: names[4], filter: 'cx/numberTokens', format }
    ])
  })

  test('throws on an unknown platform', () => {
    expect(() => config({ ...build, platforms: ['windows'] })).toThrow('Unknown platform: windows')
  })

  test('throws on an unknown output', () => {
    expect(() => files('web', [{ kind: 'icons' }])).toThrow('Unknown output: icons')
  })
})

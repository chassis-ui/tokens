/**
 * @file config.test.js
 * @description Tests for the Style Dictionary configuration of a planned build.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, expect, test } from 'vitest'
import config from '../build/config/index.js'

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
  themes: ['light', 'dark'],
  screens: ['large', 'medium', 'small'],
  source: ['../../source/base/metric-source.json', '../../source/brand-chassis/brand-base.json']
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
      [
        'ChassisTokens.swift',
        'String.swift',
        'ColorLight.swift',
        'NumberLarge.swift',
        'Number.swift'
      ]
    ],
    [
      'android',
      'cx/android-resources',
      ['main.xml', 'string.xml', 'color_light.xml', 'number_large.xml', 'number.xml']
    ]
  ])('%s writes each output with its filter', (platform, format, names) => {
    const written = files(platform, [...outputs, { kind: 'number' }]).filter(
      (file) => !file.destination.startsWith('res/')
    )
    expect(
      written.map(({ destination, filter, format }) => ({ destination, filter, format }))
    ).toEqual([
      { destination: names[0], filter: 'cx/allTokens', format },
      { destination: names[1], filter: 'cx/stringTokens', format },
      { destination: names[2], filter: 'cx/themeTokens', format },
      { destination: names[3], filter: 'cx/numberTokens', format },
      { destination: names[4], filter: 'cx/numberTokens', format }
    ])
  })

  test('Android writes a resource tree next to the flat files', () => {
    const tree = files('android', [
      ...outputs,
      { kind: 'color', theme: 'dark' },
      { kind: 'number', screen: 'medium' },
      { kind: 'number', screen: 'small' }
    ]).filter((file) => file.destination.startsWith('res/'))
    expect(tree.map(({ destination, filter }) => [destination, filter])).toEqual([
      ['res/values/string.xml', 'cx/stringTokens'],
      ['res/values/color_base.xml', 'cx/baseColorTokens'],
      ['res/values/color.xml', 'cx/themeTokens'],
      ['res/values-sw840dp/number.xml', 'cx/numberTokens'],
      ['res/values-night/color.xml', 'cx/themeTokens'],
      ['res/values-sw600dp/number.xml', 'cx/numberTokens'],
      ['res/values/number.xml', 'cx/numberTokens']
    ])
  })

  test('Android puts the screens in the folders of options.android.screens', () => {
    const platformOptions = {
      android: { screens: { large: '', medium: 'w600dp', small: 'h480dp' } }
    }
    const tree = config({
      ...build,
      platforms: ['android'],
      platformOptions
    }).platforms.android.files.filter((file) => file.destination.endsWith('/number.xml'))
    expect(tree.map((file) => file.destination)).toEqual(['res/values/number.xml'])
    const small = config({
      ...build,
      platforms: ['android'],
      outputs: [{ kind: 'number', screen: 'small' }],
      platformOptions
    }).platforms.android.files
    expect(small.map((file) => file.destination)).toEqual([
      'number_small.xml',
      'res/values-h480dp/number.xml'
    ])
  })

  test('Android puts no theme but the first and dark in the tree', () => {
    const contrast = files('android', [{ kind: 'color', theme: 'contrast' }])
    expect(contrast.map((file) => file.destination)).toEqual(['color_contrast.xml'])
  })

  test.each([
    ['ios-swiftui', 'cx/swiftui', 'dist/ios-swiftui/demo/chassis/', 'ChassisTokens.swift'],
    [
      'android-compose',
      'cx/compose-object',
      'dist/android-compose/demo/chassis/',
      'ChassisTokens.kt'
    ]
  ])('the %s preset writes its own folder', (platform, format, buildPath, main) => {
    const { platforms } = config({ ...build, platforms: [platform] })
    expect(platforms[platform].buildPath).toBe(buildPath)
    expect(platforms[platform].files[0]).toMatchObject({
      destination: main,
      format,
      options: { className: 'ChassisTokens' }
    })
  })

  test('SwiftUI files import SwiftUI and make no Color.swift', () => {
    const { options, files } = config({ ...build, platforms: ['ios-swiftui'] }).platforms[
      'ios-swiftui'
    ]
    expect(options).toMatchObject({
      import: ['SwiftUI'],
      accessControl: 'public',
      objectType: 'enum'
    })
    expect(files.some((file) => file.options.theme)).toBe(false)
  })

  test('Compose files are in the package chassis.tokens unless set', () => {
    const { options } = config({ ...build, platforms: ['android-compose'] }).platforms[
      'android-compose'
    ]
    expect(options.packageName).toBe('chassis.tokens')
    const platformOptions = { 'android-compose': { packageName: 'com.example.tokens' } }
    const set = config({ ...build, platforms: ['android-compose'], platformOptions })
    expect(set.platforms['android-compose'].options.packageName).toBe('com.example.tokens')
  })

  test('iOS files declare one type each, so they can share a target', () => {
    const written = files('ios', [...outputs, { kind: 'number' }])
    expect(written.map((file) => file.options.className)).toEqual([
      'ChassisTokens',
      'ChassisTokensString',
      'ChassisTokensColorLight',
      'ChassisTokensNumberLarge',
      'ChassisTokensNumber'
    ])
    expect(config(build).platforms.ios.options.objectType).toBe('enum')
  })

  // Presets for other CSS frameworks than Chassis CSS
  test.each([
    ['web', 'cx/scss-chassis-css', 'cx/size/rem'],
    ['web-scss', 'cx/scss-variables', 'cx/size/rem'],
    ['web-px', 'cx/scss-variables', 'cx/size/px'],
    ['web-vw', 'cx/scss-variables', 'cx/size/vw']
  ])('%s prints %s with %s', (platform, format, sizeTransform) => {
    const result = config({ ...build, app: 'docs', platforms: [platform] }).platforms[platform]
    expect(result.files.map((file) => file.format)).toEqual(Array(4).fill(format))
    expect(result.transforms.filter((name) => name.startsWith('cx/size/'))).toEqual([sizeTransform])
    expect(result).toMatchObject({ prefix: 'cx', basePxFontSize: 16 })
  })

  test('the web presets write the same files to the same directory', () => {
    const web = config({ ...build, app: 'docs', platforms: ['web'] }).platforms.web
    for (const platform of ['web-scss', 'web-px', 'web-vw']) {
      const preset = config({ ...build, app: 'docs', platforms: [platform] }).platforms[platform]
      expect(preset.buildPath).toBe('dist/web/docs/chassis/')
      expect(preset.files.map((file) => [file.destination, file.filter])).toEqual(
        web.files.map((file) => [file.destination, file.filter])
      )
      expect(preset.transforms.slice(0, -1)).toEqual(web.transforms.slice(0, -1))
    }
  })

  test('merges the options of a platform into its Style Dictionary options', () => {
    const platformOptions = { 'web-px': { outputReferences: true } }
    const result = config({ ...build, app: 'docs', platforms: ['web-px', 'web'], platformOptions })
    expect(result.platforms['web-px'].options).toEqual({
      fileHeader: 'cxFileHeader',
      commentStyle: 'short',
      formatting: { fileHeaderTimestamp: true },
      outputReferences: true
    })
    expect(result.platforms.web.options).not.toHaveProperty('outputReferences')
  })

  test('throws on an unknown platform', () => {
    expect(() => config({ ...build, platforms: ['windows'] })).toThrow('Unknown platform: windows')
  })

  test('throws on an unknown output', () => {
    expect(() => files('web', [{ kind: 'icons' }])).toThrow('Unknown output: icons')
  })
})

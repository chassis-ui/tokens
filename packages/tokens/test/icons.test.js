/**
 * @file icons.test.js
 * @description Tests for the icon assets: the Xcode image sets and the Android vector
 *              drawables made from the SVG icon tokens of the real build.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { androidDrawable, iconTokens, iosCatalog, iosImageSet } from '../build/icons.js'
import config from '../build/config/index.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/mobile-tokens.json', import.meta.url), 'utf8')
)
// An icon token of the real build, as the iOS and Android formats see it
const asset = fixture.ios.find(({ token }) => token.$type === 'asset').token
const icon = (name) => ({ ...asset, name })

describe('iconTokens', () => {
  test('takes asset tokens whose value is an SVG document', () => {
    const other = { ...asset, $value: 'https://example.com/logo.png' }
    const string = { ...asset, $type: 'string' }
    expect(iconTokens([asset, other, string])).toEqual([asset])
  })
})

describe('iOS image sets', () => {
  test('hold the SVG of the token and keep it a template vector', () => {
    const files = iosImageSet(icon('IconAccordionIndicator'))
    expect(Object.keys(files)).toEqual([
      'IconAccordionIndicator.imageset/IconAccordionIndicator.svg',
      'IconAccordionIndicator.imageset/Contents.json'
    ])
    expect(files['IconAccordionIndicator.imageset/IconAccordionIndicator.svg']).toBe(
      `${asset.$value}\n`
    )
    expect(JSON.parse(files['IconAccordionIndicator.imageset/Contents.json'])).toEqual({
      images: [{ filename: 'IconAccordionIndicator.svg', idiom: 'universal' }],
      info: { author: 'xcode', version: 1 },
      properties: {
        'preserves-vector-representation': true,
        'template-rendering-intent': 'template'
      }
    })
  })

  test('are in a catalog with its own Contents.json', () => {
    const catalog = iosCatalog([icon('IconA'), icon('IconB')])
    expect(Object.keys(catalog)).toHaveLength(5)
    expect(JSON.parse(catalog['Contents.json'])).toEqual({ info: { author: 'xcode', version: 1 } })
  })
})

describe('Android drawables', () => {
  test('fill the paths black and keep three decimals', async () => {
    const xml = await androidDrawable(icon('icon_accordion_indicator'))
    expect(xml).toContain('android:viewportWidth="24"')
    expect(xml).toContain('android:fillColor="#FF000000"')
    // The source path has three decimals, such as 11.121 and 1.205
    expect(xml).toContain('M11.121 16.629')
    expect(xml).toContain('1.205')
  })

  test('fail with the token path when the SVG does not convert', async () => {
    const broken = { ...icon('icon_broken'), $value: '<svg><path d="M0 0' }
    await expect(androidDrawable(broken)).rejects.toThrow(
      `${asset.path.join('.')}: the icon does not convert to a vector drawable`
    )
  })
})

describe('icon actions', () => {
  const build = {
    brand: 'chassis',
    app: 'demo',
    platforms: ['ios', 'android', 'ios-swiftui', 'android-compose'],
    themes: ['light', 'dark'],
    screens: ['large', 'medium', 'small'],
    source: []
  }
  const actions = (outputs) =>
    Object.fromEntries(
      Object.entries(config({ ...build, outputs }).platforms).map(([name, platform]) => [
        name,
        platform.actions ?? []
      ])
    )

  test('run in the build of the main file of iOS and Android', () => {
    expect(actions([{ kind: 'base' }])).toEqual({
      ios: ['cx/ios-icons'],
      android: ['cx/android-icons'],
      'ios-swiftui': [],
      'android-compose': []
    })
  })

  test('do not run in the builds of the color and number files', () => {
    const none = { ios: [], android: [], 'ios-swiftui': [], 'android-compose': [] }
    expect(actions([{ kind: 'color', theme: 'dark' }])).toEqual(none)
    expect(actions([{ kind: 'number', screen: 'small' }])).toEqual(none)
  })
})

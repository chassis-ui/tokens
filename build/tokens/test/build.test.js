/**
 * @file build.test.js
 * @description Tests for the build plan, using the real package.json configuration,
 *              tokens/$themes.json and the files of the committed dist/.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import StyleDictionary from 'style-dictionary'
import { permutateThemes } from '@tokens-studio/sd-transforms'
import { describe, expect, test } from 'vitest'
import { planBuilds, planThemeColors } from '../build.js'
import config from '../config/index.js'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const read = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))
const buildOptions = read('package.json').chassis.build
const $themes = read('tokens/$themes.json')
const sets = permutateThemes($themes, { separator: '_' })

/**
 * The files the planned builds write, as `dist/…` paths.
 */
function destinations(builds) {
  return builds
    .flatMap((build) =>
      Object.values(config({ ...build, outDir: 'dist' }).platforms).flatMap((platform) =>
        platform.files.map((file) => `${platform.buildPath}${file.destination}`)
      )
    )
    .sort()
}

const distFiles = readdirSync(join(ROOT, 'dist'), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
  .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)))
  .sort()

describe('planBuilds', () => {
  const builds = planBuilds(sets, buildOptions)

  // The icon actions write files whose names come from the icon tokens
  const isIconFile = (file) => file.includes('/Icons.xcassets/') || file.includes('/res/drawable/')

  test('writes exactly the files of dist/', () => {
    expect(distFiles).toHaveLength(114)
    expect([...destinations(builds), ...planThemeColors(builds, 'dist')].sort()).toEqual(
      distFiles.filter((file) => !isIconFile(file))
    )
  })

  test('writes the icons of each brand as iOS image sets and Android drawables', () => {
    for (const brand of ['chassis', 'sinefil']) {
      const swift = readFileSync(join(ROOT, `dist/ios/demo/${brand}/String.swift`), 'utf8')
      const icons = [...swift.matchAll(/static let (Icon\w+) = "<svg/g)].map(([, name]) => name)
      expect(icons).toHaveLength(9)
      const sets = distFiles.filter((file) =>
        file.startsWith(`dist/ios/demo/${brand}/Icons.xcassets/`)
      )
      expect(sets).toHaveLength(1 + icons.length * 2)
      const drawables = distFiles.filter((file) =>
        file.startsWith(`dist/android/demo/${brand}/res/drawable/`)
      )
      expect(drawables).toHaveLength(icons.length)
    }
  })

  test('writes an iOS colour file that follows the appearance for each brand', () => {
    expect(planThemeColors(builds, 'dist')).toEqual([
      'dist/ios/demo/chassis/Color.swift',
      'dist/ios/demo/sinefil/Color.swift'
    ])
  })

  test('writes no such file when a build has only one of light and dark', () => {
    expect(planThemeColors(planBuilds(sets, buildOptions, { themes: ['light'] }), 'dist')).toEqual(
      []
    )
    expect(planThemeColors(planBuilds(sets, buildOptions, { platforms: ['android'] }))).toEqual([])
  })

  test('plans one build per brand, app and token-set list', () => {
    expect(builds).toHaveLength(16)
    expect(builds.flatMap((build) => build.platforms)).toHaveLength(24)
    expect(new Set(builds.map((build) => build.key)).size).toBe(16)
  })

  test('builds the base output from the first theme and screen', () => {
    const outputs = builds
      .filter((build) => build.brand === 'chassis' && build.app === 'demo')
      .map((build) => [build.key, build.platforms, build.outputs])
    expect(outputs).toEqual([
      [
        'chassis_demo_light_large',
        ['ios', 'android'],
        [{ kind: 'base' }, { kind: 'color', theme: 'light' }, { kind: 'number', screen: 'large' }]
      ],
      ['chassis_demo_dark_large', ['ios', 'android'], [{ kind: 'color', theme: 'dark' }]],
      ['chassis_demo_light_medium', ['ios', 'android'], [{ kind: 'number', screen: 'medium' }]],
      ['chassis_demo_light_small', ['ios', 'android'], [{ kind: 'number', screen: 'small' }]]
    ])
  })

  test('uses the token-set lists of $themes.json in their order', () => {
    for (const build of builds) {
      expect(build.source).toEqual(sets[build.key].map((tokenSet) => `tokens/${tokenSet}.json`))
    }
  })

  test('throws when $themes.json has no token sets for a build', () => {
    expect(() => planBuilds(sets, { ...buildOptions, brands: ['acme'] })).toThrow(
      'No token sets for acme_docs_light_large in tokens/$themes.json'
    )
  })

  test('writes number files without a screen suffix when no screens are configured', () => {
    const withoutScreens = permutateThemes(
      $themes.filter((theme) => theme.group !== 'screen'),
      { separator: '_' }
    )
    const planned = planBuilds(
      withoutScreens,
      { ...buildOptions, screens: [] },
      { brands: ['chassis'] }
    )
    expect(planned.map((build) => build.key)).toEqual([
      'chassis_docs_light',
      'chassis_docs_dark',
      'chassis_demo_light',
      'chassis_demo_dark'
    ])
    expect(destinations(planned)).toEqual([
      'dist/android/demo/chassis/color_dark.xml',
      'dist/android/demo/chassis/color_light.xml',
      'dist/android/demo/chassis/main.xml',
      'dist/android/demo/chassis/number.xml',
      'dist/android/demo/chassis/res/values-night/color.xml',
      'dist/android/demo/chassis/res/values/color.xml',
      'dist/android/demo/chassis/res/values/color_base.xml',
      'dist/android/demo/chassis/res/values/number.xml',
      'dist/android/demo/chassis/res/values/string.xml',
      'dist/android/demo/chassis/string.xml',
      'dist/ios/demo/chassis/ChassisTokens.swift',
      'dist/ios/demo/chassis/ColorDark.swift',
      'dist/ios/demo/chassis/ColorLight.swift',
      'dist/ios/demo/chassis/Number.swift',
      'dist/ios/demo/chassis/String.swift',
      'dist/web/docs/chassis/color-dark.scss',
      'dist/web/docs/chassis/color-light.scss',
      'dist/web/docs/chassis/main.scss',
      'dist/web/docs/chassis/number.scss',
      'dist/web/docs/chassis/string.scss'
    ])
  })
})

describe('planBuilds with filters', () => {
  const plan = (filters) => planBuilds(sets, buildOptions, filters)

  test.each([
    [{ brands: ['sinefil'] }, 28],
    [{ apps: ['docs'] }, 14],
    [{ platforms: ['android'] }, 28],
    [{ themes: ['dark'] }, 48],
    [{ screens: ['small'] }, 40],
    [{ screens: ['xlarge'] }, 32]
  ])('%o writes %i files of dist/', (filters, count) => {
    const files = destinations(plan(filters))
    expect(files).toHaveLength(count)
    expect(distFiles).toEqual(expect.arrayContaining(files))
  })

  test('builds only the selected files', () => {
    const builds = plan({ brands: ['chassis'], platforms: ['ios'], themes: ['dark'], screens: [] })
    expect(builds.map((build) => [build.key, build.platforms])).toEqual([
      ['chassis_demo_light_large', ['ios']],
      ['chassis_demo_dark_large', ['ios']],
      ['chassis_demo_light_medium', ['ios']],
      ['chassis_demo_light_small', ['ios']]
    ])
    expect(destinations(builds)).toEqual([
      'dist/ios/demo/chassis/ChassisTokens.swift',
      'dist/ios/demo/chassis/ColorDark.swift',
      'dist/ios/demo/chassis/NumberLarge.swift',
      'dist/ios/demo/chassis/NumberMedium.swift',
      'dist/ios/demo/chassis/NumberSmall.swift',
      'dist/ios/demo/chassis/String.swift'
    ])
  })

  test('builds the base output from the first theme when another theme is selected', () => {
    const [base] = plan({ brands: ['chassis'], apps: ['docs'], themes: ['dark'] })
    expect(base.key).toBe('chassis_docs_light_large')
    expect(base.outputs).toEqual([{ kind: 'base' }, { kind: 'number', screen: 'large' }])
  })

  test('plans nothing for an unknown brand or platform', () => {
    expect(plan({ brands: ['acme'] })).toEqual([])
    expect(plan({ platforms: ['windows'] })).toEqual([])
  })
})

describe('token-set order', () => {
  const [build] = planBuilds(sets, buildOptions, { brands: ['chassis'], apps: ['docs'] })
  const brandBase = read('tokens/base/brand-base.json').typography.fontFamily.text.$value
  const chassisBase = read('tokens/brand-chassis/brand-base.json').typography.fontFamily.text.$value

  test('lists brand-chassis/brand-base after base/brand-base, in source only', () => {
    expect(build.source.indexOf('tokens/brand-chassis/brand-base.json')).toBeGreaterThan(
      build.source.indexOf('tokens/base/brand-base.json')
    )
    expect(config(build)).not.toHaveProperty('include')
  })

  test('lets brand-chassis/brand-base values win over base/brand-base', async () => {
    expect(chassisBase).not.toBe(brandBase)

    const sd = new StyleDictionary({
      source: build.source.map((file) => join(ROOT, file)),
      log: { verbosity: 'silent', warnings: 'disabled' }
    })
    await sd.hasInitialized
    expect(sd.tokens.typography.fontFamily.text.$value).toBe(chassisBase)
  })
})

/**
 * @file swift-package.test.js
 * @description Tests for the Swift package manifest at the root of the repository: its
 *              libraries follow the build configuration and the built folders of `dist/`.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, test } from 'vitest'
import { MANIFEST, swiftLibraries, swiftPackage } from '../build/swift-package.js'

const packageDir = fileURLToPath(new URL('..', import.meta.url))
const repositoryDir = fileURLToPath(new URL('../../..', import.meta.url))
const { build } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).chassis

const temporary = mkdtempSync(join(tmpdir(), 'swift-package-'))
afterAll(() => rmSync(temporary, { recursive: true }))

/** Makes the built folders of a configuration in a temporary package folder. */
function builtFolders(name, folders) {
  const dir = join(temporary, name, 'packages', 'tokens')
  for (const folder of folders) mkdirSync(join(dir, 'dist', folder), { recursive: true })
  return { packageDir: dir, repositoryDir: join(temporary, name) }
}

describe('the libraries of the real configuration', () => {
  const libraries = swiftLibraries(build)

  test('one for every brand of the app with an iOS platform', () => {
    expect(libraries).toEqual([
      {
        name: 'ChassisTokensDemoChassis',
        path: 'packages/tokens/dist/ios/demo/chassis',
        resources: ['Icons.xcassets']
      },
      {
        name: 'ChassisTokensDemoSinefil',
        path: 'packages/tokens/dist/ios/demo/sinefil',
        resources: ['Icons.xcassets']
      }
    ])
  })

  test('each folder holds Swift files, and no type named like its library', () => {
    for (const { name, path } of libraries) {
      const files = readdirSync(join(repositoryDir, path)).filter((file) => file.endsWith('.swift'))
      expect(files).toHaveLength(8)
      // A type named like its module hides the module in qualified names
      for (const file of files) {
        const text = readFileSync(join(repositoryDir, path, file), 'utf8')
        expect(text).not.toMatch(new RegExp(`\\b(enum|class|struct) ${name}\\b`))
      }
    }
  })

  test('the committed manifest is the manifest of the configuration', () => {
    const committed = readFileSync(join(repositoryDir, MANIFEST), 'utf8')
    // If this fails, run `pnpm tokens:swift-package`
    expect(committed).toBe(swiftPackage(libraries))
  })
})

describe('swiftLibraries', () => {
  test('names a library after its app, brand and platform', () => {
    const dirs = builtFolders('names', [
      'ios/my-app/chassis',
      'ios/my-app/brand_two',
      'ios-swiftui/my-app/chassis',
      'ios-swiftui/my-app/brand_two',
      'ios/shop/chassis/Icons.xcassets',
      'ios/shop/brand_two'
    ])
    const options = {
      brands: ['chassis', 'brand_two'],
      apps: { 'my-app': ['web', 'ios', 'ios-swiftui'], docs: ['web'], shop: ['android', 'ios'] }
    }
    expect(swiftLibraries(options, dirs)).toEqual([
      {
        name: 'ChassisTokensMyAppChassis',
        path: 'packages/tokens/dist/ios/my-app/chassis',
        resources: []
      },
      {
        name: 'ChassisTokensMyAppBrandTwo',
        path: 'packages/tokens/dist/ios/my-app/brand_two',
        resources: []
      },
      {
        name: 'ChassisTokensMyAppChassisSwiftUI',
        path: 'packages/tokens/dist/ios-swiftui/my-app/chassis',
        resources: []
      },
      {
        name: 'ChassisTokensMyAppBrandTwoSwiftUI',
        path: 'packages/tokens/dist/ios-swiftui/my-app/brand_two',
        resources: []
      },
      {
        name: 'ChassisTokensShopChassis',
        path: 'packages/tokens/dist/ios/shop/chassis',
        resources: ['Icons.xcassets']
      },
      {
        name: 'ChassisTokensShopBrandTwo',
        path: 'packages/tokens/dist/ios/shop/brand_two',
        resources: []
      }
    ])
  })

  test('has no library without an iOS platform', () => {
    const options = { brands: ['chassis'], apps: { docs: ['web'], demo: ['android'] } }
    expect(swiftLibraries(options, builtFolders('none', []))).toEqual([])
  })

  test('fails when a folder is not built', () => {
    const dirs = builtFolders('missing', ['ios/demo/chassis'])
    const options = { brands: ['chassis', 'sinefil'], apps: { demo: ['ios'] } }
    expect(() => swiftLibraries(options, dirs)).toThrow(
      'dist/ios/demo/sinefil does not exist: build the tokens first'
    )
  })

  test('fails when two libraries get the same name', () => {
    const dirs = builtFolders('same', ['ios/my-app/chassis', 'ios/my_app/chassis'])
    const options = { brands: ['chassis'], apps: { 'my-app': ['ios'], my_app: ['ios'] } }
    expect(() => swiftLibraries(options, dirs)).toThrow(
      'Two libraries are named ChassisTokensMyAppChassis: rename the app or the brand'
    )
  })
})

describe('swiftPackage', () => {
  test('starts with the tools version, which Swift Package Manager reads first', () => {
    expect(swiftPackage([]).split('\n')[0]).toBe('// swift-tools-version:5.9')
  })

  test('declares a product and a target for each library', () => {
    const manifest = swiftPackage([
      {
        name: 'ChassisTokensShopChassis',
        path: 'dist/ios/shop/chassis',
        resources: ['A.xcassets']
      },
      { name: 'ChassisTokensShopSinefil', path: 'dist/ios/shop/sinefil', resources: [] }
    ])
    expect(manifest).toContain(`    products: [
        .library(name: "ChassisTokensShopChassis", targets: ["ChassisTokensShopChassis"]),
        .library(name: "ChassisTokensShopSinefil", targets: ["ChassisTokensShopSinefil"])
    ],
    targets: [
        .target(
            name: "ChassisTokensShopChassis",
            path: "dist/ios/shop/chassis",
            resources: [.process("A.xcassets")]
        ),
        .target(
            name: "ChassisTokensShopSinefil",
            path: "dist/ios/shop/sinefil"
        )
    ]
)
`)
  })
})

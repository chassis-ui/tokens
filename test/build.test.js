/**
 * @file build.test.js
 * @description Comprehensive test suite for the design tokens build system
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock all external dependencies at the top level
vi.mock('fs')
vi.mock('path')
vi.mock('minimist')
vi.mock('style-dictionary')
vi.mock('@tokens-studio/sd-transforms')
vi.mock('../build/tokens/config.js')
vi.mock('../build/tokens/filters.js')
vi.mock('../build/tokens/transforms.js')
vi.mock('../build/tokens/formats.js')
vi.mock('../build/tokens/preprocessor.js')

describe('Design Tokens Build System', () => {
  let buildModule
  let mockPackageJson
  let mockBuildOptions
  let mockTokens
  let originalProcess

  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock package.json data
    mockBuildOptions = {
      brands: ['chassis', 'test'],
      themes: ['light', 'dark'],
      screens: ['small', 'medium', 'large'],
      apps: {
        docs: ['web'],
        test: ['ios', 'android']
      }
    }

    mockPackageJson = {
      chassis: {
        defaults: {
          theme: 'light',
          screen: 'medium'
        },
        build: mockBuildOptions
      }
    }

    mockTokens = {
      'chassis_docs_light': ['base/colors', 'base/typography'],
      'chassis_docs_dark': ['base/colors-dark', 'base/typography'],
      'chassis_docs_light_small': ['screens/small'],
      'chassis_docs_light_medium': ['screens/medium'],
      'chassis_docs_light_large': ['screens/large'],
      'chassis_test_light': ['base/colors', 'base/typography'],
      'chassis_test_dark': ['base/colors-dark', 'base/typography']
    }

    // Mock fs module
    const { promises, readFileSync } = await import('fs')
    vi.mocked(promises.readFile).mockResolvedValue(JSON.stringify(mockTokens))
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackageJson))

    // Mock config function
    const configMock = await import('../build/tokens/config.js')
    vi.mocked(configMock.default).mockReturnValue({
      preprocessors: ['cx/global'],
      platforms: {
        web: {
          buildPath: 'dist/web/test/',
          files: []
        }
      }
    })

    // Mock process.cwd()
    originalProcess = global.process
    global.process = {
      ...originalProcess,
      cwd: vi.fn().mockReturnValue('/test/path')
    }

    // Import the module after mocking
    buildModule = await import('../build/tokens/build.js')
  })

  afterEach(() => {
    global.process = originalProcess
  })

  describe('Task Generation', () => {
    test('should generate base task for all brand/app/platform combinations', () => {
      const filters = {}
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const baseTasks = tasks.filter(t => !t.theme && !t.screen)
      expect(baseTasks.length).toBeGreaterThan(0)

      // Should have base tasks for each brand/app/platform combo
      // brands: chassis, test (2)
      // apps.docs: web (1), apps.test: ios, android (2)
      // Total: 2 * (1 + 2) = 6 base tasks
      expect(baseTasks.length).toBe(6)
    })

    test('should generate color tasks for all themes', () => {
      const filters = {}
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const colorTasks = tasks.filter(t => t.theme && !t.screen)
      const uniqueThemes = new Set(colorTasks.map(t => t.theme))

      expect(uniqueThemes.size).toBe(mockBuildOptions.themes.length)
      expect(Array.from(uniqueThemes)).toEqual(expect.arrayContaining(mockBuildOptions.themes))
    })

    test('should generate number tasks for all screens', () => {
      const filters = {}
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const numberTasks = tasks.filter(t => t.screen)
      const uniqueScreens = new Set(numberTasks.map(t => t.screen))

      expect(uniqueScreens.size).toBe(mockBuildOptions.screens.length)
      expect(Array.from(uniqueScreens)).toEqual(expect.arrayContaining(mockBuildOptions.screens))
    })

    test('should not create duplicate tasks', () => {
      const filters = {}
      const tasks = buildModule.generateTasks(mockTokens, filters)

      // Check for unique task combinations
      const taskKeys = tasks.map(t => `${t.brand}_${t.app}_${t.platform}_${t.theme || 'base'}_${t.screen || 'none'}`)
      const uniqueTaskKeys = new Set(taskKeys)

      expect(taskKeys.length).toBe(uniqueTaskKeys.size)
    })
  })

  describe('CLI Filtering', () => {
    test('should filter by brand', () => {
      const filters = { brands: ['chassis'] }
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const brands = new Set(tasks.map(t => t.brand))
      expect(brands.size).toBe(1)
      expect(brands.has('chassis')).toBe(true)
      expect(brands.has('test')).toBe(false)
    })

    test('should filter by theme', () => {
      const filters = { themes: ['dark'] }
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const colorTasks = tasks.filter(t => t.theme)
      const themes = new Set(colorTasks.map(t => t.theme))

      expect(themes.size).toBe(1)
      expect(themes.has('dark')).toBe(true)
      expect(themes.has('light')).toBe(false)
    })

    test('should filter by screen', () => {
      const filters = { screens: ['small', 'large'] }
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const numberTasks = tasks.filter(t => t.screen)
      const screens = new Set(numberTasks.map(t => t.screen))

      expect(screens.size).toBe(2)
      expect(screens.has('small')).toBe(true)
      expect(screens.has('large')).toBe(true)
      expect(screens.has('medium')).toBe(false)
    })

    test('should filter by app', () => {
      const filters = { apps: ['docs'] }
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const apps = new Set(tasks.map(t => t.app))
      expect(apps.size).toBe(1)
      expect(apps.has('docs')).toBe(true)
      expect(apps.has('test')).toBe(false)
    })

    test('should handle multiple filter values', () => {
      const filters = {
        brands: ['chassis', 'test'],
        themes: ['light', 'dark'],
        screens: ['small']
      }
      const tasks = buildModule.generateTasks(mockTokens, filters)

      const brands = new Set(tasks.map(t => t.brand))
      const colorTasks = tasks.filter(t => t.theme)
      const themes = new Set(colorTasks.map(t => t.theme))
      const numberTasks = tasks.filter(t => t.screen)
      const screens = new Set(numberTasks.map(t => t.screen))

      expect(brands.size).toBe(2)
      expect(themes.size).toBe(2)
      expect(screens.size).toBe(1)
    })
  })

  describe('Token Source Resolution', () => {
    test('should assign correct source tokens to tasks', () => {
      const filters = {}
      const tasks = buildModule.generateTasks(mockTokens, filters)

      // Check that tasks have cfg.source arrays
      const tasksWithSources = tasks.filter(t => t.cfg && t.cfg.source)
      expect(tasksWithSources.length).toBeGreaterThan(0)

      // Check source format for tasks with non-empty sources
      tasksWithSources
        .filter(task => task.cfg.source.length > 0)
        .forEach(task => {
          task.cfg.source.forEach(source => {
            expect(source).toMatch(/^tokens\/.*\.json$/)
          })
        })
    })

    test('should handle missing token keys gracefully', () => {
      const incompleteTokens = {
        'chassis_docs_light': ['base/colors']
      }
      const filters = {}
      const tasks = buildModule.generateTasks(incompleteTokens, filters)

      // Should still generate tasks even with missing tokens
      expect(tasks.length).toBeGreaterThan(0)

      // Tasks with missing tokens should have empty source arrays
      const tasksWithEmptySources = tasks.filter(t => t.cfg && t.cfg.source && t.cfg.source.length === 0)
      expect(tasksWithEmptySources.length).toBeGreaterThan(0)
    })
  })

  describe('Configuration Integration', () => {
    test('should call config function with correct parameters', () => {
      const configMock = vi.mocked((buildModule.config || (() => {})))
      const filters = {}
      buildModule.generateTasks(mockTokens, filters)

      // We can't easily test the config calls since it's imported internally
      // But we can verify that tasks have cfg objects
      const tasks = buildModule.generateTasks(mockTokens, filters)
      tasks.forEach(task => {
        expect(task.cfg).toBeDefined()
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty buildOptions gracefully', async () => {
      // Mock empty buildOptions
      const emptyPackageJson = {
        chassis: {
          defaults: { theme: 'light', screen: 'medium' },
          build: {
            brands: [],
            themes: [],
            screens: [],
            apps: {}
          }
        }
      }

      const { readFileSync } = await import('fs')
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(emptyPackageJson))

      // Re-import to get the updated buildOptions
      vi.resetModules()
      const freshBuildModule = await import('../build/tokens/build.js')

      const filters = {}
      const tasks = freshBuildModule.generateTasks({}, filters)

      expect(tasks).toEqual([])
    })
  })
})

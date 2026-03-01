/**
 * @file cli.test.js
 * @description Test suite for CLI argument parsing and helper functions
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock all dependencies
vi.mock('fs')
vi.mock('style-dictionary')
vi.mock('@tokens-studio/sd-transforms')
vi.mock('../config/index.js')
vi.mock('../filters.js')
vi.mock('../transforms.js')
vi.mock('../formats.js')
vi.mock('../preprocessor.js')
vi.mock('../logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    header: vi.fn(),
    progress: vi.fn(),
    summary: vi.fn(),
    dryRun: vi.fn()
  }
}))

describe('CLI Functions', () => {
  let buildModule
  let originalArgv
  let originalExit

  beforeEach(async () => {
    vi.clearAllMocks()
    originalArgv = process.argv
    originalExit = process.exit
    process.exit = vi.fn()

    // Mock fs
    const { promises, readFileSync } = await import('fs')
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '0.1.0' }))
    vi.mocked(promises.readFile).mockResolvedValue(JSON.stringify({}))

    // Mock config function
    const configMock = await import('../config/index.js')
    vi.mocked(configMock.default).mockReturnValue({
      preprocessors: ['cx/global'],
      platforms: {
        web: { buildPath: 'dist/', files: [] },
        ios: { buildPath: 'dist/', files: [] },
        android: { buildPath: 'dist/', files: [] }
      }
    })

    buildModule = await import('../build.js')
  })

  afterEach(() => {
    process.argv = originalArgv
    process.exit = originalExit
  })

  describe('parseArgs', () => {
    test('should parse brand filter from CLI arguments', () => {
      process.argv = ['node', 'build.js', '--brand', 'chassis', 'test']
      const args = buildModule.parseArgs()

      expect(args.brands).toEqual(['chassis', 'test'])
    })

    test('should parse theme filter from CLI arguments', () => {
      process.argv = ['node', 'build.js', '--theme', 'light', 'dark']
      const args = buildModule.parseArgs()

      expect(args.themes).toEqual(['light', 'dark'])
    })

    test('should parse screen filter from CLI arguments', () => {
      process.argv = ['node', 'build.js', '--screen', 'small', 'large']
      const args = buildModule.parseArgs()

      expect(args.screens).toEqual(['small', 'large'])
    })

    test('should parse app filter from CLI arguments', () => {
      process.argv = ['node', 'build.js', '--app', 'docs', 'test']
      const args = buildModule.parseArgs()

      expect(args.apps).toEqual(['docs', 'test'])
    })

    test('should parse platform filter from CLI arguments', () => {
      process.argv = ['node', 'build.js', '--platform', 'web', 'ios']
      const args = buildModule.parseArgs()

      expect(args.platforms).toEqual(['web', 'ios'])
    })

    test('should parse multiple filters at once', () => {
      process.argv = [
        'node',
        'build.js',
        '--brand',
        'chassis',
        '--theme',
        'light',
        'dark',
        '--platform',
        'web'
      ]
      const args = buildModule.parseArgs()

      expect(args.brands).toEqual(['chassis'])
      expect(args.themes).toEqual(['light', 'dark'])
      expect(args.platforms).toEqual(['web'])
    })

    test('should detect dry-run flag', () => {
      process.argv = ['node', 'build.js', '--dry-run']
      const args = buildModule.parseArgs()

      expect(args.dryRun).toBe(true)
    })

    test('should return empty arrays when no filters specified', () => {
      process.argv = ['node', 'build.js']
      const args = buildModule.parseArgs()

      expect(args.brands).toEqual([])
      expect(args.themes).toEqual([])
      expect(args.screens).toEqual([])
      expect(args.apps).toEqual([])
      expect(args.platforms).toEqual([])
      expect(args.dryRun).toBe(false)
    })

    test('should handle help flag', () => {
      process.argv = ['node', 'build.js', '--help']
      buildModule.parseArgs()

      expect(process.exit).toHaveBeenCalledWith(0)
    })

    test('should handle short help flag', () => {
      process.argv = ['node', 'build.js', '-h']
      buildModule.parseArgs()

      expect(process.exit).toHaveBeenCalledWith(0)
    })

    test('should handle version flag', () => {
      process.argv = ['node', 'build.js', '--version']
      buildModule.parseArgs()

      expect(process.exit).toHaveBeenCalledWith(0)
    })

    test('should handle short version flag', () => {
      process.argv = ['node', 'build.js', '-v']
      buildModule.parseArgs()

      expect(process.exit).toHaveBeenCalledWith(0)
    })
  })

  describe('findTokenKey', () => {
    const mockTokens = {
      chassis_docs_light: ['tokens'],
      chassis_docs_dark: ['tokens'],
      chassis_docs_light_small: ['tokens'],
      chassis_docs_light_medium: ['tokens'],
      chassis_docs_dark_large: ['tokens'],
      test_app_light: ['tokens']
    }

    test('should find exact theme match', () => {
      const key = buildModule.findTokenKey(mockTokens, 'chassis', 'docs', 'light')
      expect(key).toBe('chassis_docs_light')
    })

    test('should find exact screen match', () => {
      const key = buildModule.findTokenKey(mockTokens, 'chassis', 'docs', 'light', 'small')
      expect(key).toBe('chassis_docs_light_small')
    })

    test('should find theme with screen suffix when exact theme not found', () => {
      const tokens = {
        chassis_docs_light_medium: ['tokens']
      }
      const key = buildModule.findTokenKey(tokens, 'chassis', 'docs', 'light')
      expect(key).toBe('chassis_docs_light_medium')
    })

    test('should find base key without theme or screen', () => {
      const key = buildModule.findTokenKey(mockTokens, 'chassis', 'docs')
      expect(key).toBe('chassis_docs_light')
    })

    test('should return null when screen key not found', () => {
      const key = buildModule.findTokenKey(mockTokens, 'chassis', 'docs', 'light', 'xlarge')
      expect(key).toBeNull()
    })

    test('should return undefined when no matching key found', () => {
      const key = buildModule.findTokenKey(mockTokens, 'nonexistent', 'app')
      expect(key).toBeUndefined()
    })

    test('should handle different brand/app combinations', () => {
      const key = buildModule.findTokenKey(mockTokens, 'test', 'app', 'light')
      expect(key).toBe('test_app_light')
    })
  })

  describe('Optional Screens Behavior', () => {
    test('should generate single number file when screens undefined', () => {
      const mockBuildOptions = {
        brands: ['chassis'],
        themes: ['light'],
        apps: { docs: ['web'] },
        screens: undefined
      }

      const tasks = buildModule.generateTasks({}, {}, mockBuildOptions)
      const numberTasks = tasks.filter((t) => t.screen === null)

      expect(numberTasks.length).toBeGreaterThan(0)
    })

    test('should generate single number file when screens empty array', () => {
      const mockBuildOptions = {
        brands: ['chassis'],
        themes: ['light'],
        apps: { docs: ['web'] },
        screens: []
      }

      const tasks = buildModule.generateTasks({}, {}, mockBuildOptions)
      const numberTasks = tasks.filter((t) => t.screen === null)

      expect(numberTasks.length).toBeGreaterThan(0)
    })

    test('should generate per-screen files when screens defined', () => {
      const mockBuildOptions = {
        brands: ['chassis'],
        themes: ['light'],
        apps: { docs: ['web'] },
        screens: ['small', 'large']
      }

      const tasks = buildModule.generateTasks({}, {}, mockBuildOptions)
      const numberTasks = tasks.filter((t) => t.screen !== null && t.screen !== undefined)

      expect(numberTasks.length).toBeGreaterThan(0)

      const screens = new Set(numberTasks.map((t) => t.screen))
      expect(screens.has('small')).toBe(true)
      expect(screens.has('large')).toBe(true)
    })
  })
})

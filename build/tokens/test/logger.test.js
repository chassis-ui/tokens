/**
 * @file logger.test.js
 * @description Test suite for logging utilities
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Logger Module', () => {
  let loggerModule
  let originalConsole
  let originalEnv

  beforeEach(async () => {
    // Save originals
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    }
    originalEnv = process.env.DEBUG

    // Mock console methods
    console.log = vi.fn()
    console.error = vi.fn()
    console.warn = vi.fn()

    // Clear DEBUG env
    delete process.env.DEBUG

    // Force module reload to respect new env
    vi.resetModules()
    loggerModule = await import('../logger.js')
  })

  afterEach(() => {
    // Restore originals
    console.log = originalConsole.log
    console.error = originalConsole.error
    console.warn = originalConsole.warn

    if (originalEnv !== undefined) {
      process.env.DEBUG = originalEnv
    } else {
      delete process.env.DEBUG
    }
  })

  describe('Error Logging', () => {
    test('should log error messages', () => {
      loggerModule.default.error('Test error')

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌'))
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Test error'))
    })

    test('should log error with exception message', () => {
      const error = new Error('Something went wrong')
      loggerModule.default.error('Test error', error)

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'))
    })

    test('should not log stack trace without DEBUG', () => {
      const error = new Error('Something went wrong')
      loggerModule.default.error('Test error', error)

      const calls = console.error.mock.calls.flat().join(' ')
      expect(calls).not.toContain('at ')
    })

    test('should log stack trace with DEBUG', async () => {
      process.env.DEBUG = '1'
      vi.resetModules()
      const debugLogger = await import('../logger.js')

      const error = new Error('Debug error')
      error.stack = 'Error: Debug error\n    at test.js:1:1'

      debugLogger.default.error('Test error', error)

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('at test.js'))
    })
  })

  describe('Warning Logging', () => {
    test('should log warning messages', () => {
      loggerModule.default.warn('Test warning')

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('⚠️'))
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Test warning'))
    })
  })

  describe('Info Logging', () => {
    test('should log info messages', () => {
      loggerModule.default.info('Test info')

      expect(console.log).toHaveBeenCalledWith('Test info')
    })
  })

  describe('Debug Logging', () => {
    test('should not log debug messages without DEBUG env', () => {
      loggerModule.default.debug('Debug message')

      expect(console.log).not.toHaveBeenCalled()
    })

    test('should log debug messages with DEBUG env', async () => {
      process.env.DEBUG = '1'
      vi.resetModules()
      const debugLogger = await import('../logger.js')

      debugLogger.default.debug('Debug message')

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🔍'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Debug message'))
    })
  })

  describe('Header Logging', () => {
    test('should log header messages with newlines', () => {
      loggerModule.default.header('Test Header')

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Test Header'))
    })
  })

  describe('Progress Logging', () => {
    test('should log progress indicator', () => {
      loggerModule.default.progress(3, 10)

      expect(console.log).toHaveBeenCalledWith('[3/10]')
    })

    test('should format progress with different numbers', () => {
      loggerModule.default.progress(1, 5)

      expect(console.log).toHaveBeenCalledWith('[1/5]')
    })
  })

  describe('Divider Logging', () => {
    test('should log divider line', () => {
      loggerModule.default.divider()

      expect(console.log).toHaveBeenCalledWith('='.repeat(40))
    })
  })

  describe('Summary Logging', () => {
    test('should log summary with success count and duration', () => {
      const startTime = Date.now() - 2000 // 2 seconds ago
      loggerModule.default.summary(5, 0, startTime)

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('5 succeeded'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('s'))
    })

    test('should include error count when errors present', () => {
      const startTime = Date.now() - 1000
      loggerModule.default.summary(3, 2, startTime)

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('3 succeeded'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 failed'))
    })

    test('should format duration correctly', () => {
      const startTime = Date.now() - 2500 // 2.5 seconds ago
      loggerModule.default.summary(1, 0, startTime)

      const calls = console.log.mock.calls.flat().join(' ')
      expect(calls).toMatch(/2\.\d{2}s/)
    })
  })

  describe('Dry Run Logging', () => {
    test('should log dry run task list', () => {
      const tasks = [
        { platform: 'web', brand: 'chassis', app: 'docs', theme: 'light', screen: null },
        { platform: 'ios', brand: 'test', app: 'mobile', theme: 'dark', screen: 'large' }
      ]

      loggerModule.default.dryRun(tasks)

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 task(s)'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('web/chassis-docs-light'))
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ios/test-mobile-dark-large')
      )
    })

    test('should format tasks without optional parameters', () => {
      const tasks = [
        { platform: 'web', brand: 'chassis', app: 'docs', theme: undefined, screen: undefined }
      ]

      loggerModule.default.dryRun(tasks)

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('web/chassis-docs'))
    })
  })
})

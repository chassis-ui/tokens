/**
 * @file config.test.js
 * @description Test suite for the Style Dictionary configuration generator
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock all external dependencies
vi.mock('../build/tokens/filters.js', () => ({ default: vi.fn() }));
vi.mock('../build/tokens/transforms.js', () => ({ default: vi.fn() }));
vi.mock('../build/tokens/formats.js', () => ({ default: vi.fn() }));

describe('Style Dictionary Configuration Generator', () => {
  let configModule;

  beforeEach(async () => {
    vi.clearAllMocks();
    configModule = await import('../build/tokens/config.js');
  });

  describe('File Generation Logic', () => {
    test('should generate base.scss and string.scss for base configurations', () => {
      const params = {
        brand: 'chassis',
        app: 'docs',
        platform: 'web'
      };

      const config = configModule.default(params);
      const files = config.platforms.web.files;

      // Should include base.scss and string.scss
      expect(files.some(f => f.destination.includes('base.scss'))).toBe(true);
      expect(files.some(f => f.destination.includes('string.scss'))).toBe(true);

      // Should not include theme or screen specific files
      expect(files.some(f => f.destination.includes('color-'))).toBe(false);
      expect(files.some(f => f.destination.includes('number-'))).toBe(false);
    });

    test('should generate color-theme.scss for theme configurations', () => {
      const params = {
        brand: 'chassis',
        app: 'docs',
        platform: 'web',
        theme: 'dark'
      };

      const config = configModule.default(params);
      const files = config.platforms.web.files;

      // Should include color-dark.scss
      expect(files.some(f => f.destination.includes('color-dark.scss'))).toBe(true);

      // Should not include base files or number files
      expect(files.some(f => f.destination.includes('base.scss'))).toBe(false);
      expect(files.some(f => f.destination.includes('string.scss'))).toBe(false);
      expect(files.some(f => f.destination.includes('number-'))).toBe(false);
    });

    test('should generate number-screen.scss for screen configurations', () => {
      const params = {
        brand: 'chassis',
        app: 'docs',
        platform: 'web',
        screen: 'large'
      };

      const config = configModule.default(params);
      const files = config.platforms.web.files;

      // Should include number-large.scss
      expect(files.some(f => f.destination.includes('number-large.scss'))).toBe(true);

      // Should not include base files or color files
      expect(files.some(f => f.destination.includes('base.scss'))).toBe(false);
      expect(files.some(f => f.destination.includes('string.scss'))).toBe(false);
      expect(files.some(f => f.destination.includes('color-'))).toBe(false);
    });
  });

  describe('Platform-specific Configurations', () => {
    test('should generate web platform configuration correctly', () => {
      const params = {
        brand: 'chassis',
        app: 'docs',
        platform: 'web'
      };

      const config = configModule.default(params);

      expect(config.platforms.web).toBeDefined();
      expect(config.platforms.web.buildPath).toContain('dist/web/chassis-docs/');
      expect(config.platforms.web.files).toBeInstanceOf(Array);
    });

    test('should generate ios platform configuration correctly', () => {
      const params = {
        brand: 'chassis',
        app: 'test',
        platform: 'ios'
      };

      const config = configModule.default(params);

      expect(config.platforms.ios).toBeDefined();
      expect(config.platforms.ios.buildPath).toContain('dist/ios/chassis-test/');
      expect(config.platforms.ios.files).toBeInstanceOf(Array);
    });

    test('should generate android platform configuration correctly', () => {
      const params = {
        brand: 'chassis',
        app: 'test',
        platform: 'android'
      };

      const config = configModule.default(params);

      expect(config.platforms.android).toBeDefined();
      expect(config.platforms.android.buildPath).toContain('dist/android/chassis-test/');
      expect(config.platforms.android.files).toBeInstanceOf(Array);
    });
  });

  describe('Build Path Generation', () => {
    test('should create correct build path for different brand/app combinations', () => {
      const testCases = [
        { brand: 'chassis', app: 'docs', platform: 'web', expected: 'dist/web/chassis-docs/' },
        { brand: 'test', app: 'mobile', platform: 'ios', expected: 'dist/ios/test-mobile/' },
        { brand: 'custom', app: 'admin', platform: 'android', expected: 'dist/android/custom-admin/' }
      ];

      testCases.forEach(({ brand, app, platform, expected }) => {
        const config = configModule.default({ brand, app, platform });
        expect(config.platforms[platform].buildPath).toBe(expected);
      });
    });
  });

  describe('File Filter Application', () => {
    test('should apply correct filters to different file types', () => {
      const params = {
        brand: 'chassis',
        app: 'docs',
        platform: 'web'
      };

      const config = configModule.default(params);
      const files = config.platforms.web.files;

      // Each file should have a filter property
      files.forEach(file => {
        expect(file.filter).toBeDefined();
      });
    });
  });

  describe('Format Application', () => {
    test('should apply correct formats based on platform', () => {
      const webConfig = configModule.default({
        brand: 'chassis',
        app: 'docs',
        platform: 'web'
      });

      const iosConfig = configModule.default({
        brand: 'chassis',
        app: 'test',
        platform: 'ios'
      });

      const androidConfig = configModule.default({
        brand: 'chassis',
        app: 'test',
        platform: 'android'
      });

      // Web should have scss format
      const webFiles = webConfig.platforms.web.files;
      expect(webFiles.some(f => f.format === 'cx/scss-variables')).toBe(true);

      // iOS should have swift format
      const iosFiles = iosConfig.platforms.ios.files;
      expect(iosFiles.some(f => f.format === 'cx/ios-swift-class')).toBe(true);

      // Android should have xml format
      const androidFiles = androidConfig.platforms.android.files;
      expect(androidFiles.some(f => f.format === 'cx/android-resources')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing optional parameters gracefully', () => {
      const minimalParams = {
        brand: 'chassis',
        app: 'docs',
        platform: 'web'
      };

      expect(() => configModule.default(minimalParams)).not.toThrow();
      const config = configModule.default(minimalParams);
      expect(config.platforms.web).toBeDefined();
    });

    test('should generate unique configurations for different parameter combinations', () => {
      const config1 = configModule.default({
        brand: 'chassis',
        app: 'docs',
        platform: 'web',
        theme: 'light'
      });

      const config2 = configModule.default({
        brand: 'chassis',
        app: 'docs',
        platform: 'web',
        theme: 'dark'
      });

      // Should have different file outputs
      const files1 = config1.platforms.web.files;
      const files2 = config2.platforms.web.files;

      const destinations1 = files1.map(f => f.destination);
      const destinations2 = files2.map(f => f.destination);

      expect(destinations1).not.toEqual(destinations2);
    });
  });
});

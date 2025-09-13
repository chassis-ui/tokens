/**
 * @file config.js
 * @description This file defines the configuration for Style Dictionary, including
 *              platform-specific settings and file generation logic for design tokens.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
)
const buildOptions = packageJson.chassis.build
const DEFAULT_THEME = packageJson.chassis.defaults.theme
const DEFAULT_SCREEN = packageJson.chassis.defaults.screen

/**
 * Main configuration function for Style Dictionary.
 *
 * @param {Object} params - Configuration parameters.
 * @param {string} params.brand - The brand name.
 * @param {string} params.app - The application name.
 * @param {string} params.platform - The target platform (e.g., 'web', 'ios', 'android').
 * @param {string} params.theme - The theme name.
 * @param {string} params.screen - The screen size.
 * @returns {Object} - The Style Dictionary configuration object.
 */
export default function ({ brand, app, platform, theme, screen }) {

  return {
    preprocessors: ['cx/global'],
    // log: { verbosity: 'verbose' }, // default, verbose, silent
    platforms: {
      [platform]: {
        ...getPlatformSettings(brand, app, platform),
        files: generateFiles(platform, theme, screen),
      },
    },
  };
}

/**
 * Generates platform-specific settings for Style Dictionary.
 *
 * @param {string} brand - The brand name.
 * @param {string} app - The application name.
 * @param {string} platform - The target platform (e.g., 'web', 'ios', 'android').
 * @returns {Object} - The platform-specific configuration object.
 */
function getPlatformSettings(brand, app, platform) {
  const commonOptions = {
    fileHeader: 'cxFileHeader',
    commentStyle: platform === 'android' ? 'xml' : 'short',
    formatting: { fileHeaderTimestamp: true },
  };

  const webBaseConfig = {
    prefix: 'cx',
    transforms: [
      'name/kebab',
      'ts/resolveMath',
      'ts/color/modifiers',
      'ts/color/css/hexrgba',
      'ts/typography/fontWeight',
      'cx/typography/web',
      'cx/shadow/web',
    ],
    buildPath: `dist/web/${brand}-${app}/`,
    options: { ...commonOptions },
  };

  const platformConfigs = {
    'web': {
      ...webBaseConfig,
      basePxFontSize: 16,
      transforms: [...webBaseConfig.transforms, 'cx/size/rem'],
    },
    'web-px': {
      ...webBaseConfig,
      transforms: [...webBaseConfig.transforms, 'cx/size/px'],
    },
    'web-vw': {
      ...webBaseConfig,
      basePxFontSize: 16,
      transforms: [...webBaseConfig.transforms, 'cx/size/vw'],
    },
    ios: {
      transforms: [
        'name/pascal',
        'ts/resolveMath',
        'ts/color/modifiers',
        'ts/color/css/hexrgba',
      ],
      expand: {
        typesMap: {
          typography: {
            lineHeight: 'dimension',
            paragraphSpacing: 'dimension',
            letterSpacing: 'number',
          },
        },
      },
      buildPath: `dist/ios/${brand}-${app}/`,
      options: { ...commonOptions, import: ['UIKit'] },
    },
    android: {
      transforms: [
        'name/snake',
        'ts/resolveMath',
        'ts/color/modifiers',
        'ts/color/css/hexrgba',
      ],
      expand: {
        typesMap: {
          typography: {
            lineHeight: 'dimension',
            paragraphSpacing: 'dimension',
            letterSpacing: 'number',
          },
        },
      },
      buildPath: `dist/android/${brand}-${app}/`,
      options: commonOptions,
    },
  };

  return platformConfigs[platform];
}

/**
 * Generates the list of files to be created for a given platform, theme, and screen.
 *
 * @param {string} platform - The target platform (e.g., 'web', 'ios', 'android').
 * @param {string} theme - The theme name.
 * @param {string} screen - The screen size.
 * @returns {Array<Object>} - An array of file configuration objects.
 */
function generateFiles(platform, theme, screen) {
  const fileExtensionMap = {
    'web': 'scss',
    'web-px': 'scss',
    'web-vw': 'scss',
    ios: 'swift',
    android: 'xml',
  };

  const formatMap = {
    scss: 'cx/scss-variables',
    swift: 'cx/ios-swift-class',
    xml: 'cx/android-resources',
  };

  const fileExtension = fileExtensionMap[platform];
  const format = formatMap[fileExtension];

  // If neither theme nor screen is set, return base and string files
  if (!theme && !screen) {
    return [
      { destination: `base.${fileExtension}`, filter: 'cx/allTokens', format },
      { destination: `string.${fileExtension}`, filter: 'cx/stringTokens', format },
    ];
  }

  // If only theme is set, return color-<theme> file
  if (theme && !screen) {
    return [
      { destination: `color-${theme}.${fileExtension}`, filter: 'cx/themeTokens', format },
    ];
  }

  // If only screen is set, return number-<screen> file
  if (screen) {
    return [
      { destination: `number-${screen}.${fileExtension}`, filter: 'cx/numberTokens', format },
    ];
  }

  // Fallback: return nothing
  return [];
}

/**
 * @file config.js
 * @description This file defines the configuration for Style Dictionary, including
 *              platform-specific settings and file generation logic for design tokens.
 *
 * @copyright Copyright (c) 2025 Ozgur Gunes
 * @license MIT
 */

/**
 * Main configuration function for Style Dictionary.
 *
 * @param {Object} params - Configuration parameters.
 * @param {string} params.brand - The brand name.
 * @param {string} params.app - The application name.
 * @param {string} params.platform - The target platform (e.g., 'web', 'ios', 'android').
 * @param {string} params.theme - The theme name.
 * @param {boolean} [params.defaultTheme=true] - Whether to include default theme tokens.
 * @returns {Object} - The Style Dictionary configuration object.
 */
export default function ({ brand, app, platform, theme, defaultTheme = true }) {

  return {
    preprocessors: ['cx/global'],
    // log: { verbosity: 'default' }, // default, verbose, silent
    platforms: {
      [platform]: {
        ...getPlatformSettings(brand, app, platform),
        files: generateFiles(platform, theme, defaultTheme),
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
    buildPath: `dist/tokens/web/${brand}-${app}/`,
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
      buildPath: `dist/tokens/ios/${brand}-${app}/`,
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
      buildPath: `dist/tokens/android/${brand}-${app}/`,
      options: commonOptions,
    },
  };

  return platformConfigs[platform];
}

/**
 * Generates the list of files to be created for a given platform and theme.
 *
 * @param {string} platform - The target platform (e.g., 'web', 'ios', 'android').
 * @param {string} theme - The theme name.
 * @param {boolean} defaultTheme - Whether to include default theme tokens.
 * @returns {Array<Object>} - An array of file configuration objects.
 */
function generateFiles(platform, theme, defaultTheme) {
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

  const baseFiles = [
    { destination: `allTokens.${fileExtension}`, filter: 'cx/allTokens', format },
    { destination: `colorTokens.${fileExtension}`, filter: 'cx/themeTokens', format },
    { destination: `theme-${theme}Tokens.${fileExtension}`, filter: 'cx/themeTokens', format },
    { destination: `numberTokens.${fileExtension}`, filter: 'cx/numberTokens', format },
    { destination: `stringTokens.${fileExtension}`, filter: 'cx/stringTokens', format },
  ];

  return defaultTheme ? baseFiles : baseFiles.filter(file => file.destination.includes(`theme-${theme}Tokens`));
}

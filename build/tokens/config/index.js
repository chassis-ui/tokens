/**
 * @file index.js
 * @description Main configuration entry point for Style Dictionary
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import web from './web.js'
import ios from './ios.js'
import android from './android.js'

const platforms = {
  web,
  ios,
  android
}

/**
 * Main configuration function for Style Dictionary
 */
export default function ({ brand, app, platform, theme, screen, outDir }) {
  const getPlatformConfig = platforms[platform]

  if (!getPlatformConfig) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  const config = getPlatformConfig(brand, app, theme, screen, outDir)

  return {
    preprocessors: ['cx/global'],
    // verbosity: default, verbose, silent
    log: { errors: { brokenReferences: 'throw' } },
    platforms: {
      [platform]: config
    }
  }
}

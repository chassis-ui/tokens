/**
 * @file index.js
 * @description Main configuration entry point for Style Dictionary
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import web from './web.js'
import webPx from './web-px.js'
import webVw from './web-vw.js'
import ios from './ios.js'
import android from './android.js'

const platforms = {
  web,
  'web-px': webPx,
  'web-vw': webVw,
  ios,
  android
}

/**
 * Main configuration function for Style Dictionary
 */
export default function ({ brand, app, platform, theme, screen }) {
  const getPlatformConfig = platforms[platform]

  if (!getPlatformConfig) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  const config = getPlatformConfig(brand, app, theme, screen)

  return {
    preprocessors: ['cx/global'],
    platforms: {
      [platform]: config
    }
  }
}

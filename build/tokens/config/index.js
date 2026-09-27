/**
 * @file index.js
 * @description Main configuration entry point for Style Dictionary
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import web from './web.js'
import webPx from './web-px.js'
import webScss from './web-scss.js'
import webVw from './web-vw.js'
import ios from './ios.js'
import android from './android.js'

const platformConfigs = {
  web,
  'web-px': webPx,
  'web-scss': webScss,
  'web-vw': webVw,
  ios,
  android
}

/**
 * Returns the Style Dictionary configuration for one token-set list: one platform per
 * target platform of the app, each writing the files of every output.
 *
 * @param {Object} build
 * @param {string} build.brand - Brand name.
 * @param {string} build.app - App name.
 * @param {string[]} build.platforms - Target platforms, e.g. `['ios', 'android']`.
 * @param {Object[]} build.outputs - The outputs built from this token-set list.
 * @param {string[]} build.source - Token files, in override order.
 * @param {string} [build.outDir] - Output root directory.
 * @returns {Object} The Style Dictionary configuration.
 */
export default function ({ brand, app, platforms, outputs, source, outDir }) {
  return {
    source,
    preprocessors: ['cx/global'],
    // verbosity: default, verbose, silent
    log: { errors: { brokenReferences: 'throw' } },
    platforms: Object.fromEntries(
      platforms.map((platform) => {
        const platformConfig = platformConfigs[platform]
        if (!platformConfig) {
          throw new Error(`Unknown platform: ${platform}`)
        }
        return [platform, platformConfig(brand, app, outputs, outDir)]
      })
    )
  }
}

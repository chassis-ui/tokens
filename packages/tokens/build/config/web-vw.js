/**
 * @file web-vw.js
 * @description Web platform configuration with vw units: SCSS variables with resolved
 *              values, for other CSS frameworks than Chassis CSS
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { webConfig } from './web.js'

export default webConfig({ unit: 'vw', format: 'cx/scss-variables' })

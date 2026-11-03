/**
 * @file ios-swiftui.js
 * @description SwiftUI preset: the files of the iOS platform with SwiftUI values
 *              (`Color`, `Font.Weight`), written to `dist/ios-swiftui/<app>/<brand>/`.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { swiftConfig } from './ios.js'

export default swiftConfig({ format: 'cx/swiftui', folder: 'ios-swiftui', imports: ['SwiftUI'] })

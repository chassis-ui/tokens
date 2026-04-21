#!/usr/bin/env node

/*!
 * Token Archive Creation Script
 *
 * Creates a versioned ZIP archive containing built tokens.
 *
 * Copyright 2025 Ozgur Gunes
 * Licensed under MIT
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import picocolors from 'picocolors'

const execAsync = promisify(exec)

async function getPackageVersion() {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8')
  )
  return packageJson.version
}

async function main() {
  try {
    const basename = path.basename(import.meta.url.replace('file://', ''))
    console.log(picocolors.cyan(`🔄 [${basename}] started`))

    console.time(picocolors.cyan(`[${basename}] finished`))

    const version = await getPackageVersion()
    const baseDir = `chassis-tokens-${version}`
    const zipFile = `${baseDir}.zip`

    console.log(picocolors.cyan(`📦 Creating ${zipFile}...`))

    await execAsync(`rm -rf "${baseDir}" "${zipFile}"`)
    await execAsync(`mkdir -p "${baseDir}"`)
    await execAsync(`cp -r dist/* "${baseDir}/"`)
    await execAsync(`cp MUNDI.md "${baseDir}/README.md"`)
    await execAsync(`zip -qr9 "${zipFile}" "${baseDir}"`)
    await execAsync(`rm -rf "${baseDir}"`)

    console.log(picocolors.green(`✅ Created: ${zipFile}`))
    console.timeEnd(picocolors.cyan(`[${basename}] finished`))
  } catch (error) {
    console.error(picocolors.red('❌ Error:'), error.message)
    process.exit(1)
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

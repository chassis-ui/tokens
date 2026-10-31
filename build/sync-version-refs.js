#!/usr/bin/env node

/*!
 * Version Reference Sync Script
 *
 * Copies the version of @chassis-ui/tokens into the place that shows it but is not part of the
 * workspace's dependency graph, so `changeset version` cannot update it:
 * packages/site/config.yml's `currentVersion`.
 *
 * Runs as part of `pnpm changeset:version`, after `changeset version` has bumped
 * packages/tokens/package.json, which is the source of the version.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/

async function readTokensVersion() {
  const pkgPath = path.resolve('packages/tokens/package.json')
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'))

  if (!pkg.version || !SEMVER_RE.test(pkg.version)) {
    console.error(`❌ Invalid or missing version in packages/tokens/package.json: "${pkg.version}"`)
    process.exit(1)
  }

  return pkg.version
}

async function syncSiteConfig(version) {
  const file = 'packages/site/config.yml'
  const original = await fs.readFile(file, 'utf8')

  if (!/^currentVersion:/m.test(original)) {
    console.error(`❌ No currentVersion field in ${file}`)
    process.exit(1)
  }

  const updated = original.replace(
    /^currentVersion:(\s*)"[^"]*"/m,
    (_match, spacing) => `currentVersion:${spacing}"${version}"`
  )

  if (updated === original) {
    return false
  }

  await fs.writeFile(file, updated, 'utf8')
  console.log(`📄 Updated ${file}'s currentVersion → ${version}`)
  return true
}

async function main() {
  const version = await readTokensVersion()
  console.log(`🔄 Syncing version references to v${version}`)

  const updated = await syncSiteConfig(version)

  if (!updated) {
    console.log('ℹ️  Already in sync, nothing to update')
  }
}

main().catch((error) => {
  console.error(`❌ Unexpected error: ${error.message}`)
  process.exit(1)
})

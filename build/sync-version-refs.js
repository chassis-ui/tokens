#!/usr/bin/env node

/*!
 * Version Reference Sync Script
 *
 * Copies the version of @chassis-ui/tokens into the places that show it but are not part of the
 * workspace's dependency graph, so `changeset version` cannot update them:
 * packages/site/config.yml's `currentVersion`, and the `Chassis - Tokens v…` header of the files
 * in packages/tokens/dist/, which it updates by rebuilding dist/ when a header names another
 * version. A version step that bumps nothing (only empty changesets) leaves dist/ as it is.
 *
 * Runs as part of `pnpm changeset:version`, after `changeset version` has bumped
 * packages/tokens/package.json, which is the source of the version.
 *
 * Copyright 2025-2026 Ozgur Gunes
 * Licensed under MIT
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const DIST_DIR = 'packages/tokens/dist'
const HEADER_RE = /Chassis - Tokens v(\S+)/

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

/**
 * Rebuilds dist/ when the header of one of its files names another version
 * @param {string} version - The package version
 * @returns {Promise<boolean>} True if dist/ was rebuilt
 */
async function syncDistHeaders(version) {
  const files = await fs.readdir(DIST_DIR, { recursive: true, withFileTypes: true })
  let stale = 0

  for (const file of files) {
    if (!file.isFile()) {
      continue
    }

    const match = HEADER_RE.exec(await fs.readFile(path.join(file.parentPath, file.name), 'utf8'))

    if (match && match[1] !== version) {
      stale++
    }
  }

  if (stale === 0) {
    return false
  }

  console.log(`🔨 ${stale} files in ${DIST_DIR} name another version, rebuilding dist/`)
  execFileSync('pnpm', ['tokens:build'], { stdio: 'inherit' })
  return true
}

async function main() {
  const version = await readTokensVersion()
  console.log(`🔄 Syncing version references to v${version}`)

  const results = [await syncSiteConfig(version), await syncDistHeaders(version)]
  const updatedCount = results.filter(Boolean).length

  console.log(
    updatedCount > 0
      ? `✅ Synced ${updatedCount} of ${results.length} references`
      : 'ℹ️  Already in sync, nothing to update'
  )
}

main().catch((error) => {
  console.error(`❌ Unexpected error: ${error.message}`)
  process.exit(1)
})

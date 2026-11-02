/**
 * @file release-notes.test.js
 * @description `chassis-tokens release-notes`: the entry of a version in a changelog, in both
 *              heading styles, and a command that fails without one.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { releaseNotes } from '../build/release-notes.js'
import { CLI } from './helpers.js'

const temporary = mkdtempSync(join(tmpdir(), 'chassis-tokens-notes-'))
afterAll(() => rmSync(temporary, { recursive: true }))

const CHANGELOG = `# Changelog

## 0.3.0

- Three.

\`\`\`md
## 0.2.0 in a code block
\`\`\`

## [0.2.0] - 2026-10-01

- Two.

## 0.1.0

`

describe('releaseNotes', () => {
  test('finds the entry in both heading styles, past a heading in a code block', () => {
    expect(releaseNotes(CHANGELOG, '0.3.0')).toContain('## 0.2.0 in a code block')
    expect(releaseNotes(CHANGELOG, '0.3.0')).not.toContain('- Two.')
    expect(releaseNotes(CHANGELOG, '0.2.0')).toBe('- Two.')
  })

  test('an empty entry is empty, and a version without one is null', () => {
    expect(releaseNotes(CHANGELOG, '0.1.0')).toBe('')
    expect(releaseNotes(CHANGELOG, '0.4.0')).toBeNull()
  })
})

describe('the command', () => {
  let count = 0
  const repository = (version, changelog) => {
    const dir = join(temporary, `repository-${++count}`)
    spawnSync('mkdir', [dir])
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ version, chassis: {} }))
    if (changelog !== undefined) writeFileSync(join(dir, 'CHANGELOG.md'), changelog)
    return dir
  }
  const run = (...args) =>
    spawnSync(process.execPath, [CLI, 'release-notes', ...args], { encoding: 'utf8' })

  test('prints the entry of the version of package.json, or of the version given', () => {
    const dir = repository('0.2.0', CHANGELOG)
    expect(run('--cwd', dir)).toMatchObject({ status: 0, stdout: '- Two.\n' })
    expect(run('v0.2.0', '--cwd', dir)).toMatchObject({ status: 0, stdout: '- Two.\n' })
  })

  test('exits 1 without a changelog, an entry or a text, and 2 on a wrong call', () => {
    expect(run('--cwd', repository('0.2.0')).stderr).toContain('has no CHANGELOG.md')
    expect(run('--cwd', repository('0.4.0', CHANGELOG)).status).toBe(1)
    expect(run('--cwd', repository('0.1.0', CHANGELOG)).stderr).toContain('is empty')
    expect(run('--zip').status).toBe(2)
  })
})

/**
 * @file test-ci.test.js
 * @description Tests that `pnpm test:ci` in the root `package.json` runs every script the CI
 *              workflow runs. A check added to `.github/workflows/ci.yml` and not to `test:ci`
 *              makes a local pass say less than it claims.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repositoryDir = fileURLToPath(new URL('../../..', import.meta.url))
const { scripts } = JSON.parse(readFileSync(join(repositoryDir, 'package.json'), 'utf8'))
const workflow = readFileSync(join(repositoryDir, '.github/workflows/ci.yml'), 'utf8')

// What CI runs and `test:ci` does not, with the reason
const NOT_LOCAL = {
  install: 'the dependencies are installed',
  audit: 'reports only; `check:pnpm` is the audit that fails the job'
}

// The scripts of the steps that are one command: `run: pnpm tokens:lint`
const ciScripts = [...workflow.matchAll(/^\s+run: pnpm ([a-z][\w:-]*)/gm)].map((match) => match[1])
const localScripts = scripts['test:ci'].split(' && ').map((command) => command.replace('pnpm ', ''))

describe('pnpm test:ci', () => {
  test('finds the steps of the workflow', () => {
    expect(ciScripts).toContain('tokens:verify')
    expect(ciScripts.length).toBeGreaterThanOrEqual(12)
  })

  test('runs every script the workflow runs', () => {
    const missing = ciScripts.filter(
      (script) => !(script in NOT_LOCAL) && !localScripts.includes(script)
    )
    expect([...new Set(missing)]).toEqual([])
  })

  test('runs scripts that exist, once', () => {
    expect(localScripts.filter((script) => !(script in scripts))).toEqual([])
    expect(new Set(localScripts).size).toBe(localScripts.length)
  })
})

#!/usr/bin/env node
/**
 * @file cli.js
 * @description The `chassis-tokens` command: one entry for the build and its checks. Each
 *              command is the `cli()` of its module and takes the options that module
 *              documents. The modules load only when their command runs, so that a command
 *              that needs Node.js only, such as `diff`, runs without an install.
 *
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { buildVersion } from './root.js'

/** The commands, each with the module that runs it. */
export const COMMANDS = {
  build: { module: './build.js', about: 'Build the tokens into the output folder' },
  verify: { module: './verify.js', about: 'Check that a fresh build equals the committed output' },
  diff: {
    module: './diff.js',
    about: 'Report the tokens added, removed and changed in the output'
  },
  'lint-source': { module: './lint-tokens.js', about: 'Check the token files in source/' },
  'swift-package': { module: './swift-package.js', about: 'Write Package.swift from the output' },
  init: { module: './init.js', about: 'Write the baseline of a repository of tokens into a folder' }
}

export const HELP = `Usage: chassis-tokens <command> [options]

Commands:
${Object.entries(COMMANDS)
  .map(([name, { about }]) => `  ${name.padEnd(15)}${about}`)
  .join('\n')}

Every command but init works on one repository of tokens: --cwd <dir>, by default the nearest
folder upward from the working directory whose package.json has a chassis block. Each command
takes --help.

Options:
  --help, -h     Print this help
  --version, -v  Print the version
`

const [name, ...rest] = process.argv.slice(2)

if (name === undefined || name === '--help' || name === '-h') {
  console.log(HELP)
  process.exit(name === undefined ? 2 : 0)
} else if (name === '--version' || name === '-v') {
  console.log(buildVersion())
} else if (!Object.hasOwn(COMMANDS, name)) {
  console.error(`❌ Unknown command ${name}. Commands: ${Object.keys(COMMANDS).join(', ')}`)
  process.exit(2)
} else {
  const { cli } = await import(COMMANDS[name].module)
  cli(rest)
}

/**
 * @file archive.test.js
 * @description The archives of a release: one zip per platform, app and brand of an output, read
 *              back entry by entry and compared with the files of the golden output.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { inflateRawSync } from 'node:zlib'
import { afterAll, describe, expect, test } from 'vitest'
import { archive, archivePrefix, crc32, dosDateTime, zipFolder } from '../lib/commands/archive.js'
import { CLI, DIST_DIR } from './helpers.js'

const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'chassis-tokens-archive-')))
afterAll(() => rmSync(temporary, { recursive: true }))

let count = 0

/** A repository of tokens whose output is the golden output of the default platforms. */
function repository(pkg = { name: '@acme/brand-tokens', version: '1.2.3', chassis: {} }) {
  const dir = join(temporary, `repository-${++count}`)
  mkdirSync(dir)
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
  cpSync(DIST_DIR, join(dir, pkg.chassis.dist ?? 'dist'), { recursive: true })
  return dir
}

/** The jobs of the golden output, as its folders of three levels. */
function goldenJobs() {
  const folders = (dir) =>
    readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  const jobs = []
  for (const platform of folders(DIST_DIR)) {
    for (const app of folders(join(DIST_DIR, platform))) {
      for (const brand of folders(join(DIST_DIR, platform, app))) {
        jobs.push(`${platform}/${app}/${brand}`)
      }
    }
  }
  return jobs.sort()
}

/** Every file under a folder that an archive holds, as sorted relative paths. */
function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== '.DS_Store')
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort()
}

/** The entries of a ZIP archive, from its central directory, each with its content inflated. */
function readZip(zip) {
  const end = zip.length - 22
  expect(zip.readUInt32LE(end)).toBe(0x06_05_4b_50)
  const total = zip.readUInt16LE(end + 10)
  let offset = zip.readUInt32LE(end + 16)
  const entries = []
  for (let n = 0; n < total; n++) {
    expect(zip.readUInt32LE(offset)).toBe(0x02_01_4b_50)
    const method = zip.readUInt16LE(offset + 10)
    const crc = zip.readUInt32LE(offset + 16)
    const compressed = zip.readUInt32LE(offset + 20)
    const nameLength = zip.readUInt16LE(offset + 28)
    const mode = zip.readUInt32LE(offset + 38) >>> 16
    const local = zip.readUInt32LE(offset + 42)
    const name = zip.toString('utf8', offset + 46, offset + 46 + nameLength)
    expect(zip.readUInt32LE(local)).toBe(0x04_03_4b_50)
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
    const data = zip.subarray(start, start + compressed)
    const content = method === 8 ? inflateRawSync(data) : Buffer.from(data)
    entries.push({ name, crc, method, mode, content })
    offset += 46 + nameLength
  }
  return entries
}

describe('archive()', () => {
  test('writes one archive per job of the output, named by the repository', () => {
    const root = repository()
    const { archives, to } = archive({ cwd: root })
    expect(to).toBe(join(root, 'archives'))
    expect(archives.map(({ job }) => job)).toEqual(goldenJobs())
    for (const { name, job, file } of archives) {
      const [platform, app, brand] = job.split('/')
      expect(name).toBe(`brand-tokens-${platform}-${app}-${brand}-1.2.3.zip`)
      expect(existsSync(file)).toBe(true)
    }
  })

  test('an archive holds the files of its job at the top level, as they are', () => {
    const { archives } = archive({ cwd: repository() })
    for (const { job, file, files } of archives) {
      const entries = readZip(readFileSync(file))
      const expected = listFiles(join(DIST_DIR, job))
      expect(entries.map(({ name }) => name)).toEqual(expected)
      expect(files).toBe(expected.length)
      for (const { name, content, crc } of entries) {
        expect(content.equals(readFileSync(join(DIST_DIR, job, name)))).toBe(true)
        expect(crc).toBe(crc32(content))
      }
    }
  })

  test('takes the output of chassis.dist and another folder, prefix and version', () => {
    const root = repository({ name: 'tokens', version: '1.0.0', chassis: { dist: 'output' } })
    const { archives, to } = archive({ cwd: root, to: 'out', prefix: 'acme', release: '2.0.0' })
    expect(to).toBe(join(root, 'out'))
    expect(archives.map(({ job }) => job)).toEqual(goldenJobs())
    expect(archives[0].name).toMatch(/^acme-.+-2\.0\.0\.zip$/)
  })

  test('removes the archives of the prefix from an earlier run, and only those', () => {
    const root = repository()
    mkdirSync(join(root, 'archives'))
    writeFileSync(join(root, 'archives', 'brand-tokens-old.zip'), '')
    writeFileSync(join(root, 'archives', 'other.zip'), '')
    archive({ cwd: root })
    expect(existsSync(join(root, 'archives', 'brand-tokens-old.zip'))).toBe(false)
    expect(existsSync(join(root, 'archives', 'other.zip'))).toBe(true)
  })

  test('writes none for an output without a job', () => {
    const root = join(temporary, 'empty')
    mkdirSync(root)
    writeFileSync(join(root, 'package.json'), '{"name":"x","version":"1.0.0","chassis":{}}')
    expect(archive({ cwd: root }).archives).toEqual([])
  })
})

describe('zipFolder()', () => {
  test('leaves out the files macOS adds, and keeps the mode of a file', () => {
    const dir = join(temporary, 'modes')
    mkdirSync(join(dir, 'nested'), { recursive: true })
    writeFileSync(join(dir, '.DS_Store'), 'x')
    writeFileSync(join(dir, 'nested', 'tool.sh'), 'x'.repeat(1000))
    chmodSync(join(dir, 'nested', 'tool.sh'), 0o755)
    const { zip, files } = zipFolder(dir)
    expect(files).toBe(1)
    const [entry] = readZip(zip)
    expect(entry.name).toBe('nested/tool.sh')
    expect(entry.method).toBe(8)
    expect(entry.mode & 0o777).toBe(0o755)
  })

  test('stores a file that deflate would not make smaller', () => {
    const dir = join(temporary, 'stored')
    mkdirSync(dir)
    writeFileSync(join(dir, 'a'), 'a')
    const [entry] = readZip(zipFolder(dir).zip)
    expect(entry.method).toBe(0)
    expect(entry.content.toString()).toBe('a')
  })

  test('takes a file from before 1980', () => {
    const dir = join(temporary, 'old')
    mkdirSync(dir)
    writeFileSync(join(dir, 'a'), 'a')
    utimesSync(join(dir, 'a'), new Date(0), new Date(0))
    expect(zipFolder(dir).files).toBe(1)
  })
})

describe('the helpers', () => {
  test('crc32() is the checksum of the ZIP format', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcb_f4_39_26)
  })

  test('dosDateTime() holds a date of 1980 or later, and raises an earlier one', () => {
    expect(dosDateTime(new Date(1970, 0, 1))).toEqual({ time: 0, date: 33 })
    const { date } = dosDateTime(new Date(1980, 0, 2))
    expect(date).toBe((1 << 5) | 2)
  })

  test('archivePrefix() leaves out the scope, and needs a name', () => {
    const root = join(temporary, 'nameless')
    mkdirSync(root)
    writeFileSync(join(root, 'package.json'), '{}')
    expect(() => archivePrefix(root)).toThrow('has no name')
    expect(() => archivePrefix(join(temporary, 'missing'))).toThrow('Cannot read')
    expect(archivePrefix(repository())).toBe('brand-tokens')
  })
})

describe('chassis-tokens archive', () => {
  const run = (cwd, ...args) =>
    spawnSync(process.execPath, [CLI, 'archive', ...args], { cwd, encoding: 'utf8' })

  test('lists the archives it writes', () => {
    const { status, stdout } = run(repository())
    expect(status).toBe(0)
    expect(stdout).toContain(`✅ ${goldenJobs().length} archives in archives`)
  })

  test('fails on an output without a job, and on an unknown option', () => {
    const root = join(temporary, 'nothing')
    mkdirSync(root)
    writeFileSync(join(root, 'package.json'), '{"name":"x","version":"1.0.0","chassis":{}}')
    const empty = run(root)
    expect(empty.status).toBe(1)
    expect(empty.stderr).toContain('Run the build first')
    expect(run(root, '--nope').status).toBe(2)
  })
})

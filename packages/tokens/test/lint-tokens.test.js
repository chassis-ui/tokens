/**
 * @file lint-tokens.test.js
 * @description Tests for the token source lint, on the real `source/` and on token sets
 *              copied from it (`fixtures/lint-tokens.json`), with one broken copy per rule.
 * @copyright Copyright (c) 2026 Ozgur Gunes
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { formatError, lintTokens, loadSource, readTokens } from '../build/lint-tokens.js'

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/lint-tokens.json', import.meta.url), 'utf8')
)

const SMALL = 'screen-website/screen-small'
const BASE = 'screen-website/screen-base'
const BRAND = 'base/brand-base'
const BRAND_CHASSIS = 'brand-chassis/brand-base'

/**
 * Lints a copy of the fixture after `edit` changes its sets.
 */
function lintWith(edit) {
  const source = structuredClone({ themes: fixture.themes, sets: fixture.sets })
  edit(source.sets)
  return lintTokens(source)
}

describe('the real token source', () => {
  test('passes', async () => {
    const source = await loadSource()
    expect(Object.keys(source.sets).length).toBe(19)
    expect(lintTokens(source)).toEqual([])
  })

  test('passes as the fixture copies it', () => {
    expect(lintTokens(fixture)).toEqual([])
  })
})

describe('same-names', () => {
  test('fails on headers-gap in the small screen set, naming the sets and tokens', () => {
    const errors = lintWith((sets) => {
      const website = sets[SMALL].space.website
      website['content-headers-gap'] = website['content-header-gap']
      delete website['content-header-gap']
    })
    expect(errors.map(formatError)).toEqual([
      'screen-website/screen-large, screen-website/screen-medium: space.website.content-header-gap is declared by screen "large", "medium", not by screen "small" [same-names]',
      'screen-website/screen-small: space.website.content-headers-gap is declared by screen "small", not by screen "large", "medium" [same-names]'
    ])
  })

  test('compares theme options by all their enabled sets', () => {
    // `theme-base` declares every theme switch; a light-only token is a mistake
    const errors = lintWith((sets) => {
      sets['base/theme-light'].figma.switch.theme['mode-5'] = { $type: 'boolean', $value: 'true' }
    })
    expect(errors).toEqual([
      {
        rule: 'same-names',
        set: 'base/theme-light',
        token: 'figma.switch.theme.mode-5',
        message: 'is declared by theme "light", not by theme "dark"'
      }
    ])
  })

  test('does not compare brands', () => {
    const themes = [
      ...fixture.themes,
      { group: 'brand', name: 'other', selectedTokenSets: { 'base/theme-light': 'enabled' } }
    ]
    expect(lintTokens({ themes, sets: fixture.sets })).toEqual([])
  })
})

describe('name-format', () => {
  test('fails on characters the platforms cannot use', () => {
    const errors = lintWith((sets) => {
      const website = sets[SMALL].space.website
      website['content gap'] = website['content-header-gap']
      website.content_gap = website['content-header-gap']
      website['content--gap'] = website['content-header-gap']
    })
    expect(errors.filter(({ rule }) => rule === 'name-format').map(formatError)).toEqual([
      'screen-website/screen-small: space.website.content gap "content gap" has characters other than letters, digits and single hyphens [name-format]',
      'screen-website/screen-small: space.website.content_gap "content_gap" has characters other than letters, digits and single hyphens [name-format]',
      'screen-website/screen-small: space.website.content--gap "content--gap" has characters other than letters, digits and single hyphens [name-format]'
    ])
  })

  test('fails on a name that starts with a digit', () => {
    const errors = lintWith((sets) => {
      sets[BASE]['2xl'] = { gap: { $type: 'spacing', $value: '8' } }
    })
    expect(errors.map(formatError)).toContain(
      'screen-website/screen-base: 2xl.gap starts with a digit, which Swift and Android reject [name-format]'
    )
  })

  test('fails on two names that become the same platform name', () => {
    const errors = lintWith((sets) => {
      // `typography.fontSize` exists in the small set; `font-size` is the same in every case
      sets[SMALL].typography['font-size'] = {
        website: { 'hero-title': { $type: 'fontSizes', $value: '32' } }
      }
    })
    expect(errors.filter(({ rule }) => rule === 'name-format').map(formatError)).toEqual([
      'screen-website/screen-small: typography.font-size.website.hero-title has the platform names of typography.fontSize.website.hero-title in screen-website/screen-small: "typography-font-size-website-hero-title" (name/kebab), "TypographyFontSizeWebsiteHeroTitle" (name/pascal), "typography_font_size_website_hero_title" (name/snake), "typographyFontSizeWebsiteHeroTitle" (name/camel) [name-format]'
    ])
  })

  test('accepts camelCase group names and digits inside names', () => {
    const names = [...readTokens(fixture.sets[SMALL]).tokens.keys()]
    expect(names).toContain('typography.fontSize.website.hero-title')
    expect(lintTokens(fixture)).toEqual([])
  })
})

describe('font-weight', () => {
  test('accepts the weight names of the source, with and without a style', () => {
    const weights = new Set(
      [BRAND, BRAND_CHASSIS].flatMap((set) =>
        [...readTokens(fixture.sets[set]).tokens.values()].map((token) => token.$value)
      )
    )
    expect([...weights].filter((weight) => !weight.includes('{')).sort()).toEqual([
      'Bold',
      'Light',
      'Light Italic',
      'Medium',
      'Regular',
      'Semi Bold',
      'SemiBold'
    ])
    const errors = lintWith((sets) => {
      sets[BRAND].typography.fontWeight.text.normal.$value = 600
      sets[BRAND].typography.fontWeight.text.strong.$value = 'semi-bold'
      sets[BRAND].typography.fontWeight.text.mass.$value = 'Italic'
    })
    expect(errors).toEqual([])
  })

  test('fails on an unknown weight in a font weight token', () => {
    const errors = lintWith((sets) => {
      sets[BRAND].typography.fontWeight.text.mass.$value = 'Heavyish'
    })
    expect(errors.map(formatError)).toEqual([
      'base/brand-base: typography.fontWeight.text.mass "Heavyish" is not a font weight the build knows [font-weight]'
    ])
  })

  test('fails on an unknown weight in a typography token', () => {
    const errors = lintWith((sets) => {
      sets[BASE].font.website['hero-title'].$value.fontWeight = 'Chunky Italic'
    })
    expect(errors.map(formatError)).toEqual([
      'screen-website/screen-base: font.website.hero-title "Chunky Italic" is not a font weight the build knows [font-weight]'
    ])
  })
})

describe('token-type', () => {
  test('fails on a token without a type', () => {
    const errors = lintWith((sets) => {
      delete sets[SMALL].space.website['section-gap'].$type
    })
    expect(errors.map(formatError)).toEqual([
      'screen-website/screen-small: space.website.section-gap has no $type [token-type]'
    ])
  })

  test('fails on a token in the format before DTCG, which the build drops', () => {
    // As in brand-demo-a/app-base.json, which no theme selects
    const errors = lintWith((sets) => {
      sets[SMALL].space.website['section-gap'] = { value: '{space.unit.32}', type: 'spacing' }
    })
    expect(errors.filter(({ rule }) => rule === 'token-type').map(formatError)).toEqual([
      'screen-website/screen-small: space.website.section-gap.value is not a token: it has no $value [token-type]',
      'screen-website/screen-small: space.website.section-gap.type is not a token: it has no $value [token-type]'
    ])
  })
})

describe('type-conflict', () => {
  test('fails when a later set of a list gives a name another type', () => {
    const errors = lintWith((sets) => {
      sets[SMALL].figma.switch.screen['mode-3'].$type = 'text'
    })
    expect(errors.map(formatError)).toEqual([
      'screen-website/screen-small: figma.switch.screen.mode-3 has type "text", but screen-website/screen-base declares it as "boolean" (token-set list chassis_light_small) [type-conflict]'
    ])
  })
})

describe('loadSource', () => {
  const dirs = []
  afterAll(async () => {
    await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })))
  })

  test('names a selected set without a file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'chassis-tokens-lint-'))
    dirs.push(dir)
    await writeFile(join(dir, '$themes.json'), JSON.stringify(fixture.themes))
    await expect(loadSource(dir)).rejects.toThrow(
      'Token set base/brand-base, selected in $themes.json'
    )
  })
})

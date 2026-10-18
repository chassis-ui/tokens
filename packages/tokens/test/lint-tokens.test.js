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
        [...readTokens(fixture.sets[set]).tokens.values()]
          .filter((token) => token.$type === 'fontWeights')
          .map((token) => token.$value)
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
      sets[BRAND].typography.fontWeight.ui.normal.$value = 600
      sets[BRAND].typography.fontWeight.ui.strong.$value = 'semi-bold'
      sets[BRAND].typography.fontWeight.ui.mass.$value = 'Italic'
    })
    expect(errors).toEqual([])
  })

  test('fails on an unknown weight in a font weight token', () => {
    const errors = lintWith((sets) => {
      sets[BRAND].typography.fontWeight.ui.mass.$value = 'Heavyish'
    })
    expect(errors.map(formatError)).toEqual([
      'base/brand-base: typography.fontWeight.ui.mass "Heavyish" is not a font weight the build knows [font-weight]'
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

describe('letter-spacing', () => {
  const spacing = (value) => ({ $type: 'letterSpacing', $value: value })

  test('accepts pixels, with and without px, and references', () => {
    const errors = lintWith((sets) => {
      sets[BRAND_CHASSIS].typography.letterSpacing = {
        display: { mass: spacing('-0.5'), normal: spacing('0'), strong: spacing('1px') },
        context: {
          jumbo: spacing('{typography.letterSpacing.display.mass}'),
          hero: spacing('{size.unit.nd05}')
        }
      }
    })
    expect(errors).toEqual([])
  })

  test('fails on a percentage or em in a letter spacing token, which Figma cannot hold', () => {
    const errors = lintWith((sets) => {
      sets[BRAND_CHASSIS].typography.letterSpacing = {
        context: { hero: spacing('-2.5%'), jumbo: spacing('-0.02em') }
      }
    })
    expect(errors.map(formatError)).toEqual([
      'brand-chassis/brand-base: typography.letterSpacing.context.hero is "-2.5%", which Figma variables cannot hold; write it in pixels, such as "-0.5" [letter-spacing]',
      'brand-chassis/brand-base: typography.letterSpacing.context.jumbo is "-0.02em", which Figma variables cannot hold; write it in pixels, such as "-0.5" [letter-spacing]'
    ])
  })

  test('fails on a percentage in the letter spacing of a typography token', () => {
    const errors = lintWith((sets) => {
      sets[BASE].font.website['hero-title'].$value.letterSpacing = '-2.5%'
    })
    expect(errors.map(formatError)).toEqual([
      'screen-website/screen-base: font.website.hero-title has a letter spacing that is "-2.5%", which Figma variables cannot hold; write it in pixels, such as "-0.5" [letter-spacing]'
    ])
  })
})

describe('font-weight-family', () => {
  const reference = (path) => `{${path}}`

  test('accepts a role group that a brand points at another family with its weight', () => {
    const { fontFamily, fontWeight } = fixture.sets[BRAND_CHASSIS].typography
    expect(fontFamily.context.heading.$value).toBe(reference('typography.fontFamily.display'))
    expect(fontWeight.context.heading.$value).toBe(reference('typography.fontWeight.display.mass'))
    expect(lintTokens(fixture)).toEqual([])
  })

  test('accepts a role group weight that holds a style name of its own', () => {
    const weight = fixture.sets[BRAND].typography.fontWeight.context.blockquote.$value
    expect(weight).toBe('Light Italic')
    expect(lintTokens(fixture)).toEqual([])
  })

  test('fails on a role group whose weight belongs to another family', () => {
    const errors = lintWith((sets) => {
      sets[BRAND_CHASSIS].typography.fontWeight.context.lead.$value = reference(
        'typography.fontWeight.ui.elegant'
      )
    })
    expect(errors.map(formatError)).toEqual([
      'brand-chassis/brand-base: typography.fontWeight.context.lead is a weight of the family "ui", but typography.fontFamily.context.lead leads to the family "prose" [font-weight-family]'
    ])
  })

  test('follows the family of a role group that a brand overrides', () => {
    const errors = lintWith((sets) => {
      sets[BRAND_CHASSIS].typography.fontFamily.context.label = {
        $type: 'fontFamilies',
        $value: reference('typography.fontFamily.display')
      }
    })
    expect(errors.map(formatError)).toEqual([
      'base/brand-base: typography.fontWeight.context.label is a weight of the family "ui", but typography.fontFamily.context.label leads to the family "display" [font-weight-family]'
    ])
  })

  test('fails on a set that sets a family without its weights', () => {
    const errors = lintWith((sets) => {
      delete sets[BRAND_CHASSIS].typography.fontWeight.code.strong
    })
    expect(errors.map(formatError)).toEqual([
      'brand-chassis/brand-base: typography.fontFamily.code sets the family "code" without its weights typography.fontWeight.code.strong [font-weight-family]'
    ])
  })

  test('accepts a set that sets the weights of a family it takes from another set', () => {
    const { fontFamily, fontWeight } = fixture.sets[BRAND_CHASSIS].typography
    expect(fontFamily.prose).toBeUndefined()
    expect(Object.keys(fontWeight.prose)).toEqual(['normal', 'strong', 'mass', 'elegant'])
    expect(lintTokens(fixture)).toEqual([])
  })

  test('fails on a font token whose weight belongs to another family', () => {
    const errors = lintWith((sets) => {
      sets[BASE].font.website['hero-title'].$value.fontWeight = reference(
        'typography.fontWeight.prose.mass'
      )
    })
    expect(errors.map(formatError)).toEqual([
      'screen-website/screen-base: font.website.hero-title has a weight of the family "prose" (typography.fontWeight.prose.mass), but its family leads to "ui" [font-weight-family]'
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

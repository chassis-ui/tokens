# Documentation Style Guide

How to write token reference, guide, and platform docs for chassis-tokens. This guide sets the conventions for the docs site (`packages/site/content/docs/**/*.mdx`) so contributors and reviewers have one place to reference. It follows the language and voice of the [chassis-css guide](https://github.com/chassis-ui/css/blob/main/WRITING.md), adapted to design tokens.

**The guide is the reference, not the existing pages.** Most pages predate it and break several of its rules. Don't copy a convention from a page because the page does it; check it here. Migrate a page when editing it, and don't gate unrelated PRs on the migration.

## How this guide is organized

- **Language (§1–6)** — voice, tone, vocabulary, token names and code references in prose.
- **Accuracy (§7–8)** — where names, values, and counts come from.
- **Structure (§9–13)** — frontmatter, section order per doc type, headings, the closing platform section.
- **Components and conventions (§14–17)** — token tables, callouts, troubleshooting entries, cross-references.
- **Code blocks and doc length (§18–21)** — language tags, generated vs hand-written code, when to split a doc.
- **Lint checklist** — what to verify before opening a PR.
- **Appendix A** — MDX component reference.

The language and accuracy rules also apply to the repository docs (`README.md`, `.github/CONTRIBUTING.md`, `docs/`) and to changeset entries. The structure rules are for site pages only.

---

## Language

### 1. Voice by doc type

The right prose voice depends on the doc category. There are two conventions, and mixing them in the wrong context produces prose that either feels like a marketing page or sounds robotic.

| Doc type                                  | Voice       | Second-person `you/your` | First-person `we/our` |
| ----------------------------------------- | ----------- | ------------------------ | --------------------- |
| Token reference (`design-tokens/*.mdx`)   | Instructive | ✗ Avoid                  | ✗ Avoid               |
| Getting Started (`getting-started/*.mdx`) | Tutorial    | ✓ Appropriate            | ✗ Avoid               |
| Use in Project (`use-in-project/*.mdx`)   | Tutorial    | ✓ Appropriate            | ✗ Avoid               |

---

**Instructive voice** (token reference docs) avoids `you`, `your`, `yours`, `we`, `our`, `ours`, and `us` in prose — the reader is consulting these docs to find a token and understand what it holds, not following a guided procedure. Removing the narrator keeps prose focused on the tokens and reads as reference documentation rather than marketing copy.

**Good:** "Use `space.context.medium` for the gap between stacked elements. It references `size.unit.16`, so it follows the base scale."

**Bad:** "You can use `space.context.medium` for your stacked elements. We reference our base scale in it."

**Imperative vs descriptive.** Both are correct instructive voice: imperative ("Use `space.context.medium`") for what the reader does; descriptive ("It references `size.unit.16`") for what the token system or the build does. A typical paragraph mixes both.

**Exceptions:** direct quotes keep their original voice; callouts may use imperative voice as direct guidance; code comments and generated output aren't prose and are unaffected.

---

**Tutorial voice** (getting-started and use-in-project docs) allows second-person "you"/"your" — they read naturally in a step-by-step guide where the reader installs a package, runs a build, or adds files to an app. Reference sections inside a guide (a table of build options, a list of generated files) still read better without a pronoun.

**Good:** "If you build the tokens from your own fork, use the URL of your repository in place of this one."

**Bad (still avoid even in tutorial docs):** "We've now built the tokens. Our next step is to add them to the app."

**First-person plural is discouraged across all doc types.** "We"/"us"/"our" imply a narrator who is neither the project nor the reader — there's always a clearer alternative ("the previous step" instead of "what we built"). Universal imperative steps ("Install the package") don't need a pronoun at all.

### 2. Every heading earns its paragraph

Every `##`, `###`, and `####` heading must be followed by at least one explanatory sentence before any code example, table, bullet list, or sub-heading, naming what the section is about and why it matters — a bare heading followed by a table tells readers _what_ exists but not _when to reach for it_.

**Floor:** one full sentence is enough — don't pad.

**Exception:** `## Best practices`, `## Troubleshooting`, and `## Next steps` may go directly into their entries. Their names say what follows, and a sentence there is filler.

**Good:**

```mdx
## Context tokens

Context tokens name a step of the spacing scale by its role, from `zero` to `6xlarge`. Reach for them in layouts and in components that have no token of their own.

<CxTable>
| Token | Value | Purpose |
| --- | --- | --- |
| `space.context.medium` | `16px` | Default gap between elements |
</CxTable>
```

**Bad:**

```mdx
## Context tokens

<CxTable>
| Token | Value | Purpose |
| --- | --- | --- |
| `space.context.medium` | `16px` | Default gap between elements |
</CxTable>
```

**Anti-pattern: container phrases.** Intro sentences starting with "The following…" or "Below is…" announce content without describing it — state what the content does instead. **Bad:** "The following table lists the button spacing tokens." **Good:** "Button spacing tokens set the padding and the icon gap of each button size." Exception: a colon-terminated sentence introducing a bullet list is fine, since the colon signals enumeration rather than vague pointing.

**Anti-pattern: label paragraphs.** A bold label on its own line (`**How it works:**`, `**Benefits:**`) is a heading in disguise. Promote it to a real heading with an intro sentence, or fold it into the paragraph.

### 3. Describe behavior, not benefits

Documentation explains what a token holds and what the build writes; it does not sell the token system. Skip adjectives like "comprehensive", "powerful", "seamless", "harmonious", "production-ready" — state the behavior and let it demonstrate the value.

**Good:** "Each brand overrides the base radius scale in its own token set, so one build writes a different `border-radius` per brand."

**Bad:** "Our powerful theming architecture enables seamless brand customization with unmatched flexibility."

**Exception:** the frontmatter `description` field may include a light positioning phrase (it's the SEO meta description) under 160 characters and free of superlatives. **Use-case lists are permitted** — "for margins, padding, and gaps" names concrete use cases rather than qualitative adjectives.

**Generic advice is not documentation.** A guideline that would be true of any design system ("maintain consistent spacing", "test with real content") says nothing about Chassis Tokens. Keep a guideline only when it names a token, a level, or a value.

### 4. Active voice over passive where natural

Prefer active voice, with the actor named: the build, the format, the token, the platform. Passive is acceptable when the subject is genuinely unknown or unimportant.

**Good:** "The build writes one file per theme. The iOS format splits a shadow token into one constant per part."

**Bad (when avoidable):** "One file per theme is written, and shadow tokens are split into parts by the format that is used for iOS."

### 5. Vocabulary

The project has one word for each concept. Using a synonym makes the reader wonder whether it's a second concept.

| Use                             | For                                                                                       | Not                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| brand                           | An option of the `brand` group; the build writes `chassis` and `sinefil`                  | product, tenant                              |
| group, option                   | A group of `$themes.json` (`brand`, `app`, `theme`, `screen`) and one choice of it        | theme group, theme (Tokens Studio's words)   |
| app                             | An option of the `app` group: `docs`, `demo`                                              | project, application (except in page titles) |
| theme                           | `light`, `dark`                                                                           | mode, color scheme                           |
| screen                          | `large`, `medium`, `small`                                                                | breakpoint, viewport, device                 |
| platform                        | A build target: `web`, `ios`, `android`, and the presets                                  | target, output format                        |
| preset                          | A platform for adopters: `web-scss`, `web-px`, `web-vw`, `ios-swiftui`, `android-compose` | variant, flavor                              |
| token set                       | One JSON file of `source/`                                                                | token file, collection                       |
| base, context, component tokens | The three token levels (see [§10](#10-standard-section-order))                            | semantic, alias, global tokens               |
| the build                       | The Style Dictionary build in `packages/tokens/build/`                                    | the pipeline, the generator, the script      |

Figma has its own terms: a **Variable**, a **Collection**, a **Mode**. Use them capitalized, and only for Figma; a Figma Mode that holds the dark theme is still "the dark theme" outside Figma.

Product names keep their spelling: Chassis Tokens, Chassis CSS, Tokens Studio, Style Dictionary, Figma, Node.js, npm, pnpm, Swift Package Manager, SwiftUI, UIKit, Jetpack Compose.

Write in American English (`color`, `behavior`, `customize`), which is the spelling of the token names and of the other Chassis docs.

### 6. Token names and code references in prose

Backtick every code reference. A token has one name in the source and one per platform; which one to write depends on what the sentence is about.

| Referring to                                  | Form                                          | Example                                                                   |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| The token itself (design, levels, references) | Dot path                                      | `` `space.context.medium` ``                                              |
| A reference inside a token value              | Dot path in braces                            | `` `{size.unit.16}` ``                                                    |
| A group of tokens                             | Dot path with `*`                             | `` `space.context.*` ``                                                   |
| Web output                                    | SCSS variable with `$cx-`                     | `` `$cx-space-context-medium` ``                                          |
| iOS output                                    | Constant, with its type when the file matters | `` `SpaceContextMedium` ``, `` `ChassisTokens.SpaceContextMedium` ``      |
| Android output                                | Resource reference                            | `` `@dimen/space_context_medium` ``, `` `R.dimen.space_context_medium` `` |
| Compose output                                | Property                                      | `` `spaceContextMedium` ``                                                |
| Figma Variable                                | Slash path                                    | `` `space/context/medium` ``                                              |
| Custom property of Chassis CSS                | In full, with `var()` when it's a value       | `` `--space-medium` ``, `` `var(--space-medium)` ``                       |

Token reference docs use dot paths; platform docs use the names of their platform. Don't use a platform name where the dot path is meant — `$cx-space-context-medium` doesn't exist for an Android developer.

**Placeholders** go in angle brackets, lowercase: `` `dist/<platform>/<app>/<brand>/` ``, `` `space.<component>.*` ``. Don't use square brackets or braces for placeholders; braces are token references.

**Other references:** file paths relative to the repository root (`` `packages/tokens/package.json` ``), or to the installed package when the reader has only that (`` `node_modules/@chassis-ui/tokens/dist/web/` ``); commands in full (`` `pnpm tokens --platform ios` ``); configuration keys as a path (`` `chassis.build.apps` ``); values with their unit (`` `16px` ``, `` `1rem` ``, `` `16dp` ``). Interface labels of Figma, Tokens Studio, and Xcode are bold, not code: **File → Add Package Dependencies…**.

---

## Accuracy

### 7. Names and values come from the source

Every token name and value in a doc must exist in `packages/tokens/source/` or `packages/tokens/dist/` as written. Don't write a token from memory, don't extend a scale by analogy, and don't invent an example token — a reader will search for it.

Before adding a name, find it:

```bash
grep -rn "space-context-medium" packages/tokens/dist/web/docs/chassis/
```

**Generated code is copied, not retyped.** A code block that shows what the build writes holds lines of `dist/` exactly as they are, including their order and spacing. Shorten a block by leaving lines out, never by editing a line.

**Values belong to a brand, a theme, and a screen.** A value in a doc is the value of the `chassis` brand, the `light` theme, and the `large` screen unless the doc says otherwise. Say so when the value differs elsewhere: "`#161a1b` in the light theme, `#e9eced` in the dark theme."

**Sizes are design pixels.** Write a size as `16px`, also when the source holds `16` without a unit and the build treats it as a size. A value that the build prints without a unit, such as an opacity or a column count, is written without one.

### 8. Counts, versions, and configuration

A doc that states a number makes a promise the next release can break. State a count ("eight files", "16 builds") only when the reader needs it, and verify it with `pnpm tokens --dry-run`. Prefer naming the things over counting them.

**Versions.** Write "Node.js 22 or later", not "the latest Node.js". For the version of Chassis Tokens, use the `[[config:current_version]]` token ([§17](#17-cross-references)) instead of a number typed by hand.

**Configuration.** The docs describe the configuration committed in `chassis.build` of `packages/tokens/package.json`. Name it as such ("the configured iOS app is `demo`") so an adopter with another configuration can follow.

**The output contract is in [docs/architecture.md](docs/architecture.md#output-contract).** A site page that describes what the build writes must agree with it. When they disagree, check `dist/`, then fix the one that is wrong.

---

## Structure

### 9. Frontmatter

Every doc starts with YAML frontmatter. Required fields:

```yaml
---
title: Space Tokens
description: One-sentence summary, under 160 characters.
toc: true
---
```

Optional fields and their accepted values:

| Field      | Values                                     | Effect                                                                               |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `added`    | `version` (string), `show_badge` (boolean) | Marks the version that introduced the page's subject.                                |
| `aliases`  | A path or a list of paths                  | Redirects old URLs to the page.                                                      |
| `sections` | List of `{title, description, slug}`       | Renders the cards of an index page. Used by `getting-started/introduction.mdx` only. |

`description` follows the body rules for behavior over benefits — see [§3](#3-describe-behavior-not-benefits). Start with what the page covers, not with "Comprehensive guide to" or "Learn how to".

**Titles.** Page titles are in title case, because `packages/site/data/sidebar.yml` finds a page by the slug of its sidebar title: the entry `Space Tokens` loads `space-tokens.mdx`. A new page needs a sidebar entry whose slug is its file name. Token reference pages are named `<Category> Tokens`; platform pages are named `<Platform> Applications`.

### 10. Standard section order

Each doc type has a section order. Skip sections that don't apply; don't reorder them.

**Token reference docs** (`design-tokens/*.mdx`) walk down the three token levels, then close with reference material:

```text
## Introduction              (what the category defines and where it applies)
   ### Token levels          (how base, context, and component tokens reference each other)
## Base tokens               (the raw scale or palette)
## Context tokens            (the scale named by role)
## Component tokens          (one ### per component or component family)
## Usage                     (choosing a level; patterns that name tokens)
## Accessibility             (when the category has a nontrivial a11y concern)
## Platform output           (always last)
```

**The three levels.** _Base tokens_ hold raw values (`space.unit.16`, `color.base.*`). _Context tokens_ name a value by its role (`space.context.medium`, `color.context.default.fg-main`). _Component tokens_ assign a value to a part of a component (`space.button.medium-gap`). Use these three names in headings and prose; a category that lacks a level skips its section. A category without levels, such as `typography.*`, names its sections after what the tokens hold ("Font sizes", "Line heights"), between `## Introduction` and `## Usage`.

**Color has a fourth group.** `color.base.*` holds the palettes and the context colors of every theme. `color.primitive.*` holds the palette of the current theme, next to the context tokens: both reference `color.base.*`, and gradients and shadows use the primitive colors. "Primitive" is the name of that group only; it gets a `## Primitive colors` section after `## Base tokens`, and no other category uses the word.

**Platform docs** (`use-in-project/*.mdx`) follow the order in which a developer meets the tokens. The three platform docs share this order, so a section added to one usually belongs in all three:

```text
## Introduction              (what the platform gets: file format, types, one short sample)
## Generated files           (the files the build writes, as a table)
## Installation              (package, Swift package, Android library, or a build from the repository)
## Basic usage               (the minimal working example: one import, one token)
## Themes                    (light and dark)
## Screen sizes
## Typography
## Shadows, gradients, icons (one ## each, as they apply to the platform)
## Build options             (presets and options that change the output, one ### each)
## Continuous integration
## Best practices
## Troubleshooting           (see §16)
## Next steps                (always last)
```

**Guides** (`getting-started/*.mdx`) use a looser structure but still lead with an intro paragraph under `## Introduction`, list requirements under `## Prerequisites`, order their sections as the reader performs them, and close with `## Troubleshooting` and `## Next steps`.

**Canonical section names.** Older docs use variants like "Overview", "Usage Guidelines", "Related Topics", and "See Also" — going forward, **use `## Introduction`, `## Usage`, and `## Next steps`**.

### 11. Heading hierarchy

Don't skip levels. `##` → `###` → `####`, never `##` → `####`. Use `####` sparingly — three levels of nesting usually signals a section that wants to be promoted to its own `###` or split into a sibling page.

### 12. Heading length, case, and punctuation

**Length.** Keep `##` and `###` headings under **~25 characters** — the ToC sidebar is ~200px wide and longer titles wrap, which makes it hard to scan. **Good:** `Context tokens`, `Screen sizes`, `Generated files`. **Bad:** `Presets for other CSS frameworks and their options` — shorten and push the longer phrasing into the intro paragraph.

**Sentence case, no trailing punctuation.** Capitalize only the first word and proper nouns (`### Base tokens`, not `### Base Tokens`; `### Swift Package Manager` stays); no `.`, `:`, `?`, or `!` at the end. Write "and", not `&`. Fix title-case slips opportunistically.

**Code in headings.** A heading that names code keeps the code's spelling without backticks (`### cx/size/rem`, `### outputReferences`), so the anchor stays readable. Don't put a token name in a heading; name the group ("Button spacing") and list the tokens in the table.

### 13. The `## Platform output` section

A token reference doc closes with a section that shows how the category prints on each platform, so a developer who found the token knows what to type. It uses a fixed template:

```mdx
## Platform output

One sentence naming the unit or type of the category on each platform.

<CxTable>
| Platform | Name | Value |
| --- | --- | --- |
| Web | `$cx-space-context-medium` | `1rem` |
| iOS | `SpaceContextMedium` | `CGFloat(16)` |
| Android | `@dimen/space_context_medium` | `16dp` |
</CxTable>

See the [web]([[docsref:/use-in-project/web-applications]]), [iOS]([[docsref:/use-in-project/ios-applications]]), and [Android]([[docsref:/use-in-project/android-applications]]) docs for the files that hold these names.
```

Use one token of the page as the example, the same on every platform, with the values of `dist/`. Add a sentence for each platform rule the reader would not guess: a line height in percent that prints in points, letter spacing with a different unit per platform, a shadow split into parts. Rules that apply to every category belong in the platform docs, not here.

A composite token, such as a font or a shadow, prints as one value on the web and as one constant per part on iOS and Android. Show one part in the template table, say which, and add a second table or an excerpt of `dist/` for the other parts.

---

## Components and conventions

### 14. Token tables

Tokens are listed in Markdown tables wrapped in `<CxTable>`, which makes them scroll on narrow viewports. One table per level or per component; don't merge levels into one table.

| Column | Header    | Content                                                                                                                                                                       |
| ------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First  | `Token`   | The dot path, in backticks                                                                                                                                                    |
| Second | `Value`   | The resolved value in backticks, with its unit (`` `16px` ``); for a token that references another, the reference (`` `{size.unit.16}` ``) may follow in a `Reference` column |
| Last   | `Purpose` | A phrase, no trailing period: what the token is applied to                                                                                                                    |

A table may replace `Value` with one column per variant when the values differ: `Light` and `Dark`, `large`, `medium`, and `small`, or `chassis` and `sinefil`. A composite token gets one column per property in place of `Value`.

List tokens in source order, which is the order of the generated files. A scale of more than ~20 steps shows the steps in use and names the pattern of the rest in the intro sentence.

**Purpose is not a restatement.** "Medium button horizontal padding" for `space.button.medium-padding-x` repeats the name. Leave the cell out of the table (drop the column) when the name says it all, and spend the words on tokens whose role isn't in their name.

### 15. Callouts

Use `<Callout>` for asides that interrupt the reading flow but are important enough to highlight. Types and intent:

- **`<Callout type="info">`** — helpful but non-essential context: tips, alternatives, related tokens.
- **`<Callout type="warning">`** — real gotchas: output that doesn't compile, a value that differs per platform, a breaking rename.
- **`<Callout type="warning" name="work-in-progress" />`** — named callouts reuse content from `packages/site/content/callouts/`. The status callouts `work-in-progress` and `created-by-ai` go first on the page, before `## Introduction`.

**Good warning:** "`main.xml` cannot share a resource folder with the flat color and number files: aapt2 fails with `has a conflicting value`. Add either `main.xml` or the flat files to a module."

**Bad warning (this should be prose, not a callout):** "Note that tokens can be customized per brand."

**Status callouts are a claim.** Removing `work-in-progress` from a page says that the page was checked against the current `source/` and `dist/` ([§7](#7-names-and-values-come-from-the-source)). Remove it in the PR that does the check, not before.

**No `title` attribute.** `<Callout>` has no `title` prop and ignores one. Titles like "Note", "Important", and "Key Concept" add nothing; when a callout needs a lead-in, start its body with a bold phrase.

**No emoji** in headings or prose, and no emoji as a substitute for a callout (`⚠️`). The one exception is `✅` and `❌` as markers of the entries of a `## Best practices` section, each followed by a bold imperative phrase, a colon, and one or two sentences that name tokens.

### 16. Troubleshooting entries

Each entry of `## Troubleshooting` is a `###` heading that names the symptom in a few words, followed by the exact message in backticks, the cause, and the fix in imperative voice.

**Good:**

```mdx
### Undefined variable

Sass stops with `Error: Undefined variable.` and points at `$cx-color-context-default-fg-main`. Context colors are declared in the color files only, so `main.scss` alone does not have them. Load `color-light.scss` or `color-dark.scss` next to `main.scss`.
```

**Bad:**

```mdx
### "Error: Undefined Variable" When Compiling Your SCSS Files

You may run into this error if something is wrong with your imports. Check your setup.
```

Quote the message as the tool prints it, so a search for the error finds the page. Keep the heading to the symptom; the full message with its token or type name belongs in the body. Write the variable parts of a message as placeholders in angle brackets. A problem without a message, such as a dark theme that stays light, starts with the symptom as the reader sees it.

### 17. Cross-references

**Within Chassis Tokens docs.** Use the `[[docsref:/path/to/doc]]` token inside Markdown link syntax — the build resolves it against the configured docs path at compile time, so the link stays correct across deployments. Append a heading slug to link a sub-section:

```mdx
[space tokens]([[docsref:/design-tokens/space-tokens]])
[the build options]([[docsref:/getting-started/style-dictionary#build-options]])
```

**Within the same doc.** Use plain `#anchor` links — IDs are auto-generated from heading text by slugifying (`### Screen sizes` becomes `#screen-sizes`). Don't create two headings with the same slug in a doc, and re-verify anchors after renaming a heading — internal links to the old slug silently break. Migrating a heading to sentence case doesn't change its slug.

**Configuration values.** `[[config:<key>]]` prints a value of `packages/site/config.yml`, in prose, links, and code blocks: `[[config:current_version]]`, `[[config:repo]]`.

**Other Chassis docs.** Use a standard Markdown link. Chassis CSS owns the custom properties that the `web` platform prints; link [its repository](https://github.com/chassis-ui/css) rather than describing them here, until a page of its docs is agreed on as the target.

**External references.** Standard Markdown links. Prefer the official docs of Tokens Studio, Style Dictionary, Figma, Apple, and Android over blog posts.

**Repository files.** From a site page, link the file on GitHub with `[[config:repo]]`. From a repository doc, use a relative link: `[docs/architecture.md](docs/architecture.md)`.

---

## Code blocks and doc length

### 18. Fenced code language tags

Always tag fenced code blocks with the source language — untagged blocks display without highlighting. Conventions in use:

| Block kind                    | Language tag             | Notes                                                   |
| ----------------------------- | ------------------------ | ------------------------------------------------------- |
| Shell commands                | ` ```bash `              | Installation, build, and CLI commands. No `$` prompt.   |
| Token sets and configuration  | ` ```json `              | Tokens Studio files, `chassis.build`, `$themes.json`.   |
| Web output and usage          | ` ```scss ` / ` ```css ` | `css` for compiled output only.                         |
| iOS output and usage          | ` ```swift `             |                                                         |
| Android resources             | ` ```xml `               |                                                         |
| Android and Compose usage     | ` ```kotlin `            |                                                         |
| JavaScript                    | ` ```js `                | Build code and bundler configuration.                   |
| CI workflows                  | ` ```yaml `              |                                                         |
| Directory trees, token chains | ` ```text `              | Anything that is not code.                              |
| MDX/Markdown                  | ` ```mdx ` / ` ```md `   | When this guide or a meta-doc shows authoring patterns. |

### 19. Generated vs hand-written code

A doc shows two kinds of code, and the reader must be able to tell them apart. Introduce each block with a sentence that says which it is: "The build writes…" for generated code, "Use…" or "Add…" for code the reader writes.

- **Generated code** is an excerpt of `dist/`, copied as it is ([§7](#7-names-and-values-come-from-the-source)). It can be partial: show the lines under discussion.
- **Usage code** is standalone: a reader copying it into a project with the tokens installed should see it compile. Start with the imports (`import ChassisTokensDemoChassis`, `@use`), and use real token names.
- **Configuration** shows the key inside its parent, and the intro sentence names the file: "In `chassis.build` of `packages/tokens/package.json`:".

When an option changes the output, show the configuration block, then the output block, in that order. Commands run from the repository root unless the sentence before them says otherwise. Prefer working code over comment-only placeholders.

### 20. Inline code vs code blocks

- **Inline backticks** for single identifiers, token names, file paths, and short literal values. `` `space.context.medium` ``, `` `--platform ios` ``, `` `dist/web/` ``.
- **Fenced blocks** for anything that spans multiple lines, or for single lines that the reader will copy and run.

If a one-liner is _demonstrating syntax_ rather than something to copy, prefer an inline-code form. If it's _something to run_, prefer a fenced block.

### 21. Document length and splitting

A doc is too long when a `##` section has more than three `###` sub-sections on distinct topics, the doc exceeds ~600 lines of MDX, or the ToC requires scrolling to see all top-level sections. Split along the natural axis: **by concern** (the build reference, the presets, and the troubleshooting of one tool become sibling docs) or **by platform**. Sections that are lists are the exception: the component tables of a token reference doc, the formats of the build, and the entries of `## Troubleshooting` are scanned, not read, so many `###` sub-sections there are fine. Don't split for size alone — a 700-line doc that reads end-to-end beats three 200-line stubs that force the reader to chase context across pages.

---

## Lint checklist

Before opening a PR with a doc change, verify:

- [ ] **Voice check ([§1](#1-voice-by-doc-type)):**
  - _Token reference docs:_ No second-person or first-person plural in prose. Quick check: `grep -niE "\b(you|your|yours|we|our|ours|us)\b" <file>` returns nothing relevant.
  - _Getting-started and use-in-project docs:_ "you/your" are acceptable; confirm "we/us/our" are absent.
- [ ] Every `##`/`###`/`####` heading has an explanatory sentence before the next block ([§2](#2-every-heading-earns-its-paragraph)).
- [ ] No container phrases ("The following…", "Below is…") and no bold label paragraphs ([§2](#2-every-heading-earns-its-paragraph)).
- [ ] No marketing adjectives and no generic advice in prose ([§3](#3-describe-behavior-not-benefits)).
- [ ] Project vocabulary: brand, app, theme, screen, platform, preset, token set ([§5](#5-vocabulary)).
- [ ] Token names use the form of their context, and placeholders use angle brackets ([§6](#6-token-names-and-code-references-in-prose)).
- [ ] Every token name and value exists in `source/` or `dist/` as written ([§7](#7-names-and-values-come-from-the-source)).
- [ ] Counts are verified, and versions are not typed by hand ([§8](#8-counts-versions-and-configuration)).
- [ ] Frontmatter `description` is under 160 characters and describes the page ([§9](#9-frontmatter)).
- [ ] A new page has an entry in `packages/site/data/sidebar.yml` whose slug is its file name ([§9](#9-frontmatter)).
- [ ] Section order matches the doc type ([§10](#10-standard-section-order)). For **token reference** docs: Introduction → Base tokens → Context tokens → Component tokens → Usage → Accessibility → Platform output.
- [ ] A change to one platform doc was considered for the other two ([§10](#10-standard-section-order)).
- [ ] Heading levels don't skip (`##` → `####`) ([§11](#11-heading-hierarchy)).
- [ ] All `##` / `###` headings under ~25 characters, sentence case, no trailing punctuation, no `&` ([§12](#12-heading-length-case-and-punctuation)).
- [ ] `## Platform output` follows the template ([§13](#13-the--platform-output-section)).
- [ ] Every table is wrapped in `<CxTable>` and token tables use the standard columns ([§14](#14-token-tables)).
- [ ] Callouts have no `title`, and there is no emoji outside `## Best practices` ([§15](#15-callouts)).
- [ ] Troubleshooting entries name the symptom, quote the message, give the cause and the fix ([§16](#16-troubleshooting-entries)).
- [ ] Cross-references use `[[docsref:/...]]` for internal links and Markdown for external ([§17](#17-cross-references)).
- [ ] All fenced code blocks have a language tag ([§18](#18-fenced-code-language-tags)).
- [ ] `pnpm site:lint` and `pnpm site:build` pass.

---

## What's not in this guide (yet)

These conventions haven't been formalized here. To propose one: write the section, apply it to at least one doc in the same PR as evidence, and link contested proposals in an issue for discussion before merging.

Currently unwritten:

- Generating token tables from `source/` instead of writing them by hand, so that values cannot go stale.
- Documenting the values of brands other than `chassis`, and of the dark theme, in token reference docs.
- Color swatches and other visual previews of token values.
- Screenshot conventions for Figma and Tokens Studio — when to embed images, alt text rules, where to store source files.
- A doc type for the build reference (transforms, filters, formats), which is reference material inside a getting-started guide today.
- Conventions for changeset entries beyond what [CONTRIBUTING.md](.github/CONTRIBUTING.md#changesets) says.

---

## Appendix A — MDX component reference

The docs site uses two MDX components and two text tokens. The components come from [`@chassis-ui/docs`](https://www.npmjs.com/package/@chassis-ui/docs) and are imported automatically; a doc needs no `import` line for them.

### `<CxTable>`

Wraps a Markdown table in a responsive scroll container and gives the table its styling. Use for every table. Write the table directly inside the tags, with no blank line between a tag and the table.

| Prop    | Type     | Default | Purpose                                                        |
| ------- | -------- | ------- | -------------------------------------------------------------- |
| `class` | `string` | `table` | CSS class applied to the inner `<table>` by the rehype plugin. |

### `<Callout>`

Highlighted aside. See [§15](#15-callouts) for when to use each type.

| Prop     | Type                              | Default  | Purpose                                                                                              |
| -------- | --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `type`   | `'info' \| 'warning' \| 'danger'` | `'info'` | Visual treatment.                                                                                    |
| `name`   | `string`                          | —        | Render a shared callout from `packages/site/content/callouts/<name>.md`. Overrides the slot content. |
| `class`  | `string`                          | —        | Classes added to the callout wrapper.                                                                |
| _(slot)_ | MDX content                       | —        | Inline callout body. Ignored when `name` is set.                                                     |

### Text tokens

Replaced at build time in prose, link targets, code blocks, and frontmatter.

| Token                 | Replaced with                                                | Example                                                  |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| `[[docsref:/<path>]]` | The URL of a doc of this site, with an optional `#anchor`    | `[[docsref:/design-tokens/space-tokens#context-tokens]]` |
| `[[config:<key>]]`    | A value of `packages/site/config.yml`; nested keys with dots | `[[config:current_version]]`                             |

### Other components

`@chassis-ui/docs` also provides `<Example>`, `<ResizableExample>`, `<ScssDocs>`, `<JsDocs>`, `<AddedIn>`, `<DeprecatedIn>`, and `<InFigma>`, which the Chassis CSS docs use. The tokens docs don't use them yet; their props are in Appendix A of the chassis-css guide. Propose a convention here ([What's not in this guide](#whats-not-in-this-guide-yet)) before the first use.

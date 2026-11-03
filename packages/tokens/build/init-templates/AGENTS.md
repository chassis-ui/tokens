# AGENTS.md

Instructions for AI coding agents working in this repository. It holds the rules an agent
breaks without being told; the README explains the rest.

## Project

__NAME__ holds design tokens in the Tokens Studio format, in `source/`, synced with Figma. They
are built with [`@chassis-ui/tokens`](https://www.npmjs.com/package/@chassis-ui/tokens) into
`dist/<platform>/<app>/<brand>/`. `chassis.build` in `package.json` lists the brands, the themes
and the apps.

## Commands

Once, with Node.js 22.12 or later: `__INSTALL__`.

| Command                 | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| `__RUN__ lint`          | Checks the token files in `source/`                 |
| `__RUN__ build`         | Builds the tokens into `dist/`                      |
| `__RUN__ verify`        | Fails when `dist/` differs from a fresh build       |
| `__RUN__ diff`          | Reports the tokens added, removed and changed       |
| `__RUN__ swift-package` | Writes `Package.swift` from `chassis.build`         |
| `__RUN__ release-notes` | Prints the changelog entry of the version, or fails |

## Rules

- **Edit `source/`, never `dist/`.** `dist/` and `Package.swift` are committed, and are the output
  of `__RUN__ build` and `__RUN__ swift-package`. Commit them with the change to `source/`.
- **`source/` follows Figma.** A sync from Figma writes these files, so a change that belongs in
  the design is made there. `$themes.json` and `$metadata.json` are written by Tokens Studio.
- **Keep `chassis.build` in step with `$themes.json`.** A brand, an app or a theme is in both.
- **The names in `dist/` are public.** Apps read them by name, and a removed or renamed token
  stops them compiling. `__RUN__ diff` names such a change, and the changelog says so.

## Releases

A push to `main` with a new version in `package.json` releases it and publishes it to npm, so:

- A new version and its entry in `CHANGELOG.md` go in one commit. The release stops without the
  entry.
- Before that commit, run `__RUN__ build`, which writes the version into `dist/`, and
  `__RUN__ verify`.
- Do not push, tag or raise the version unless asked.

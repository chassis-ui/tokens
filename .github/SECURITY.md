# Security Policy

## Supported versions

`@chassis-ui/tokens` is pre-1.0. Only the latest published version gets fixes; there are no
maintenance branches for older versions.

The published package holds generated files only (SCSS, Swift, Android XML and the icon assets in
`dist/`); it has no runtime dependencies and runs no code in your app. The build scripts in
`packages/tokens/build/` and the documentation site run on contributors' machines and in CI.

## Reporting a vulnerability

**Please don't open a public GitHub issue for a security vulnerability.**

Instead, use GitHub's private vulnerability reporting for this repository:
[github.com/chassis-ui/tokens/security/advisories/new](https://github.com/chassis-ui/tokens/security/advisories/new).
This opens a private thread visible only to you and the maintainers, so a fix can be released
before any public write-up.

If you can't use GitHub's private reporting, open a regular issue asking a maintainer to reach out
for a private channel, without including any details of the vulnerability.

We'll acknowledge new reports and keep you updated while we investigate and fix a confirmed issue.
Please give us reasonable time to release a fix before any public disclosure.

# Security Policy

## Supported versions

`@chassis-ui/tokens` is pre-1.0. Only the latest published version gets fixes; there are no
maintenance branches for older versions.

The published package is the builder, the `chassis-tokens` command, with Style Dictionary among
its dependencies. It runs on the machines and in the CI of the teams that build their tokens with
it, and runs no code in an app. The tokens of the Chassis sites and apps are generated files in
[chassis-ui/website-tokens](https://github.com/chassis-ui/website-tokens). The documentation site
runs on contributors' machines and in CI.

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

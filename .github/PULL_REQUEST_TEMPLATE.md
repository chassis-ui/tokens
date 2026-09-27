## What this changes

<!-- One or two sentences. If it fixes an open issue, add "Fixes #123". -->

## Why

<!-- The problem this solves. For a token or output change, which apps or platforms need it. -->

## How to check it

<!--
The quickest way for a reviewer to see it: the tokens and files to look at in `dist/`, a docs
page, or the test that fails without the change.
-->

---

See [CONTRIBUTING.md](CONTRIBUTING.md#what-a-pull-request-needs-before-merge) for the details
behind each of these.

- [ ] `pnpm tokens:lint`, `pnpm tokens:lint:source`, `pnpm tokens:test`, `pnpm tokens:verify` and `pnpm tokens:verify:presets`
      pass locally
- [ ] **`dist/` rebuilt** with `pnpm tokens` and committed, and the preset baselines written again,
      if tokens or the build changed the output
- [ ] **Changeset** (`pnpm changeset`) if the published package changed, saying what an app has
      to change; an empty one (`pnpm changeset --empty`) if `source/`, `build/` or `dist/` changed
      but nothing is released
- [ ] Swift files and the Android `res/` tree checked in an app, if the iOS or Android output
      changed
- [ ] `pnpm site:lint` and `pnpm check:astro` pass, if the site changed

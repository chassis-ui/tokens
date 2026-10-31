## What this changes

<!-- One or two sentences. If it fixes an open issue, add "Fixes #123". -->

## Why

<!-- The problem this solves. For an output change, which apps or platforms need it. -->

## How to check it

<!--
The quickest way for a reviewer to see it: a preset baseline to look at in `test/golden/`, a docs
page, or the test that fails without the change.
-->

---

See [CONTRIBUTING.md](CONTRIBUTING.md#what-a-pull-request-needs-before-merge) for the details
behind each of these.

- [ ] `pnpm tokens:lint`, `pnpm tokens:lint:source`, `pnpm tokens:typecheck`, `pnpm tokens:test`, `pnpm tokens:verify` and `pnpm tokens:verify:presets`
      pass locally
- [ ] **The preset baselines written again** with `pnpm tokens:verify:update:presets`, if the build
      changed the output
- [ ] **Changeset** (`pnpm changeset`) if the published package changed, saying what an app has
      to change; an empty one (`pnpm changeset --empty`) if `build/` changed
      but nothing is released
- [ ] The **Native iOS** and **Native Android** checks of CI pass, if the iOS or Android output
      changed
- [ ] `pnpm site:lint` and `pnpm check:astro` pass, if the site changed

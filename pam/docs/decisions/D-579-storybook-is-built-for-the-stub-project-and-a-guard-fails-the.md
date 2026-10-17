# D-579 — Storybook is built for the stub project and a guard fails the build if a bundle names the live one

**Date:** 2026-10-15 · **Branch:** `claude/pam-design-storybook-stub`

**Asked by:** Mira, relaying Iris's Case manager pass (card a91 batch, 13:51): the Storybook build ignored `NEXT_PUBLIC_SUPABASE_URL`, and 8 bundles named the live project even with the stub env set. D-576 (Piper) covers only the web e2e suite.

## What was wrong

`src/lib/project.ts` (and the public site's `src/lib/links.ts`) fall back to the live URL and publishable key when no `NEXT_PUBLIC_SUPABASE_*` is set. Next inlines those variables; Storybook does not. So every Storybook bundle carried the live address whatever CI or a person set. Nothing reached it in Iris's runs, because story fixtures answer inside the page, but the published Storybook is public: a story missing a fixture would send a viewer's browser to production.

## What was decided

1. **Storybook sets the stub itself** (`.storybook/main.ts`, `env`): `https://stub.supabase.co` and a placeholder key, not read from the environment, so no build can get it wrong.
2. **The live fallback is rewritten away at build time** (`.storybook/stub-live-project.cjs`, a webpack loader on `lib/project.ts` and the site's `lib/links.ts` only): the live URL and key in those two files become the stub's. Setting the env alone left the live address in the bundle as the dead branch of `env ?? live`; this removes it, so the built Storybook never contains it. The app's own source and build are untouched.
3. **A guard fails the build** (`scripts/check-storybook-stub.mjs`, chained after `storybook build` in `build-storybook`): any `.js`, `.html`, `.json` or `.map` in `storybook-static` naming `shobqzuhicoiymtumiaz` stops it, as does a build naming no stub at all. It is the Storybook twin of D-576's `liveGuard`, tested in `src/lib/storybookGuard.test.ts`.

## Proof

`pnpm --filter @pam/web build-storybook`, then `grep -rl shobqzuhicoiymtumiaz apps/web/storybook-static` finds 0 files (before: 8 bundles and their maps). The guard first failed this build while only the env was set, which is how the second step was found.

## What a later session might reverse

The loader is two string replacements by name: if a third file ever falls back to the live project, the guard fails the build and says which bundle; add the file to the loader's `test`. Chromatic's CI env (`stub-anon-key-for-storybook`) is now redundant but harmless.

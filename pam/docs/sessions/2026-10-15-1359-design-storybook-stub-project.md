# 2026-10-15 — design storybook stub project

**Branch:** `claude/pam-design-storybook-stub` · **Lane:** design system (Dot)

## What changed

- `.storybook/main.ts`: `env` sets the stub Supabase URL and key for every Storybook build and dev run; a pre-loader
  (`.storybook/stub-live-project.cjs`) rewrites the live URL and key out of `src/lib/project.ts` and the site's `src/lib/links.ts`.
- `scripts/check-storybook-stub.mjs`, chained after `storybook build`: fails if any bundle names `shobqzuhicoiymtumiaz`, or none names the stub.
- `src/lib/storybookGuard.test.ts`: the guard passes a stub build, fails a live one and names the file, fails an empty or missing build.
- D-579 records it.

## What was wrong, and what missed it

Storybook does not inline `NEXT_PUBLIC_*` the way Next does, so the `env ?? live` fallback in two files was live in every bundle even with CI's stub
env set (8 bundles, Iris's case manager pass). D-576 guarded only `out/`. Setting the env alone was not enough: the live address stayed as the dead
branch of the fallback, which the new guard caught on the first build.

## Decisions made

D-579.

## Verified

`pnpm --filter @pam/web build-storybook` passes with the guard; `grep -rl shobqzuhicoiymtumiaz apps/web/storybook-static` finds 0 files.
`storybookGuard.test.ts` 3 passed; `tsc` clean. The two remaining `sb_publishable` mentions are supabase-js's own key-prefix check, not a key.

## Left undone

Nothing for this job. The `pam-fit` and Chromatic workflows keep their stub env, now redundant.

## Needs a human

Nothing.

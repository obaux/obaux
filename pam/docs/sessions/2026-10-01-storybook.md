# 2026-10-01 — Storybook, journeys, and the member dock

**Phase:** 1 · branch `claude/pam-storybook` off `main` at `23cb190` (kept
apart from `claude/hopeful-thompson-07nj7n`, which waits on a DB-suite run
and a migration deploy)

## What changed

Will asked for a new workflow: front-end work shown in Storybook, updated
from these sessions, with journeys (whole screens) and the full app shell
there too. Hosted on Chromatic, his choice (D-208).

- **Storybook 10** (`@storybook/nextjs`) in `apps/web/.storybook/`: the
  app's providers, English/Spanish and light/dark toolbar switches, phone
  viewports, the a11y addon. `pnpm --filter @pam/web storybook` /
  `build-storybook`.
- **`.github/workflows/pam-storybook.yml`** publishes to Chromatic on every
  push touching `pam/**`; it skips itself until `CHROMATIC_PROJECT_TOKEN` is
  a repository secret.
- **Components:** a story file for every `@pam/ui` export (152 stories,
  each with a Spanish variant and its empty / long-name / error / loading /
  disabled states where it has them). Written by a subagent, checked here.
- **Journeys:** 19 screens × the roles that reach them (43 stories), real
  `page.tsx` components against a pretend Supabase (`journeys/fixtures.ts`,
  `mockSupabase.ts`) built from `scripts/journeys.mjs`'s data. Unmatched
  requests are answered empty and logged, never sent.
- **Shell:** `TabBar` (`@pam/ui/TabBar`, new — D-209), the five member
  tabs and Help in one dock, with `Shell/TabBar` and `Shell/Member app`
  (real screens inside the dock). Not mounted in the app.
- `pam/CLAUDE.md` gained a "Storybook is where front-end work is shown"
  section.

## What was wrong, and what missed it

**Every story first died on "`stylex.keyframes` must be compiled by
`@stylexjs/babel-plugin`".** `@storybook/nextjs` uses Babel only for a file
named exactly `.babelrc` or `babel.config.js` (read in its `preset.js`);
this app's is `.babelrc.js`, so it fell back to SWC. Fixed with a StyleX-only
Babel pre-step in `main.ts` that reads the app's own plugin options, rather
than renaming the app's config. Then confirmed by measuring a rendered
button, not by the build passing — the build passed while broken.

**`npx serve` makes Storybook look empty.** It rewrites `/iframe.html?id=…`
to `/iframe`, dropping the query, so every story said "No Preview". Use
`python3 -m http.server`. Written into CLAUDE.md.

**The first dock had 42px-wide tabs at 320px**, under §2.5's 48px. Help's
padding and the row's end padding paid for it; now 49×56.

## Decisions

- D-208 — Storybook/Chromatic as the review surface; what it is not (a
  deploy path; keystroke-live); the StyleX pre-step; journeys never touch
  the live project.
- D-209 — `TabBar`, from D-029/D-039; three open questions for Will.

Numbered from D-208 because `claude/hopeful-thompson-07nj7n` holds
D-204–D-207 and has not merged.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/web typecheck` | clean |
| `pnpm --filter @pam/config test` | 231 pass (incl. locale parity, with `tab.label`) |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/web build` + budget | OK; 94.7 kB to spare — unchanged from `main` (`TabBar` is a subpath export, unmounted) |
| `build-storybook` | OK |
| Every story opened in Chromium at 375px | **205 stories, 0 page errors**, 0 unanswered Supabase calls (3 flagged by text match are `Notice` stories whose content is the error copy) |
| `BigButton` measured | 64px, `rgb(15, 88, 71)`, Figtree, 18px |
| `TabBar` measured | 320px: tabs 49×56, Help 64×48; 375px: tabs 61×56 |

Not run: the Playwright suite (no app code changed beyond the new,
unmounted `TabBar` and one locale key) and Chromatic itself (no token yet).

## Left undone

- Chromatic publishing needs Will's project token.
- The dock is not mounted; D-209's three questions decide how.
- Staff roles have no shell design.

## Needs a human

- Will: sign in at chromatic.com with GitHub, link `obaux/obaux`, and add
  the project token as the repository secret `CHROMATIC_PROJECT_TOKEN`.
- Will: where People and My Plan lead; whether per-screen Help comes off
  once the dock is in.

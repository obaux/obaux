# 2026-10-09 — a public website: Home and Support

**Phase:** 1 (member-facing), pre-launch · **Sessions so far:** one, on
`claude/compassionate-bohr-mzrchf`; other sessions were on
`claude/gallant-clarke-0dhizj` and `claude/affectionate-goldberg-tvu4sz`.

## What changed

Will asked for a public-facing site on the design system — Home, and Support —
so members can learn how a complex system works. First support post: "Case
manager assignments", with an introduction and the table he pasted (a case
manager's and a super admin's powers over assigning, limiting and pausing).

- **`pam/apps/site`**, a new workspace app (D-433): Next 15 static export,
  StyleX via the same Babel and PostCSS setup as `apps/web`, `@pam/ui`'s theme
  and fonts, Astryx `TopNav`, `Table`, `Card`, `Grid`, `Breadcrumbs`.
- **Pages:** `/` (hero, how Pam helps, who it is for, a pointer to Support),
  `/support/` (list of posts), `/support/case-manager-assignments/`.
- **`@pam/ui/TextLink`** is now a package export.
- CI builds and tests it; `docs/deploying.md` has the deploy steps;
  `docs/before-launch.md` has the item that blocks deploying it.

## What was wrong, and what missed it

- **First build failed** importing `TextLink` from the `@pam/ui` barrel in a
  server component: the barrel re-exports `VoiceInput`, which uses `useState`
  with no `'use client'`. The app never hit it because every screen there is a
  client component. Fixed with a subpath export, not by marking the site's
  server components as client.
- **The pasted table pointed at a conversation**: "see question 2", "see
  question 3", "(as today)". Rewritten so each cell stands alone; a test fails
  if such a pointer comes back.
- **The post describes unbuilt behaviour.** Checking STATUS before writing the
  copy found that assigning, handing over, unassigning and the Unassigned filter
  have no screen. Nothing in the build or the tests could have caught this —
  they cannot know what the app does. It is recorded in D-433 and before-launch.

## Decisions

- D-433 — its own app; stacked cards on a phone; the table's two stray cells;
  the post is ahead of the product.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/site typecheck` | clean |
| `pnpm --filter @pam/site build` | 6 static pages |
| `pnpm --filter @pam/site test` | 5 pass |
| `pnpm --filter @pam/config test` (includes the numbering test) | 699 pass |
| `pnpm --filter @pam/ui test` | 79 pass |
| Screenshots, Chromium, 1280px light, 1280px dark, 390px light | no horizontal scroll on any of the three pages; table at 1280, cards at 390 |

Not run: the `@pam/web` suite, axe, and the
Playwright a11y suite (it does not cover `apps/site`). The site's touch targets
and contrast were looked at, not measured.

## Left undone

- Not deployed. No Vercel project exists for it; no domain.
- Not measured against §12's first-load budget: the post page is 535 kB
  first-load (the Astryx table and its client runtime), well over the app's
  budget. The app's `check-bundle-budget.mjs` does not look at it.
- No axe run, no a11y test for the site.
- The user-flow map is untouched (the site is not an app screen).

## Needs a human

- Will: build the assignment screens first, or soften the post to what is live,
  before it goes online. And choose the address.

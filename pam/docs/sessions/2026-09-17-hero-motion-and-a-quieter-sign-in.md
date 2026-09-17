# 2026-09-17 — Hero motion, a quieter sign-in, and a latent contrast bug

**Phase:** 1 (UI/product polish on Foundation) · **Sessions so far:** 24

## What changed

A large batch of sign-in/hero requests from Will, all in one round:

- **The locale-switcher icon on the hero is bigger, bolder, and sits on a
  darker chip.** `GlobeIcon` doubled to `2em` at `strokeWidth: 2.5` when
  rendered `tone="onPhoto"`; the chip's background darkened from
  `rgba(38, 38, 38, 0.35)` to `rgba(15, 15, 15, 0.6)`.
- **The hero reaches under an iOS status bar the way Arc renders it, without
  the mark colliding with a notch.** The header's `top` offset became
  `calc(24px + env(safe-area-inset-top, 0px))` — 0 extra on Chrome, the real
  inset on Arc/Safari.
- **The gradient wash darkened** (0.50 → 0.70 alpha) for contrast against
  white text; **slide text went to Medium weight**; **12px of clearance**
  now sits between the dots row and the text above it, with the text moved
  slightly higher; **8px more gap** between the mark and the Philadelphia
  pill (on top of an earlier round's 8px, so 16px total from the original).
- **The STOP/rates line is off the sign-in screen** — see D-139. It moved to
  `/reminders/`, which already carries it, on the reasoning that sign-in
  codes aren't optional the way reminders are.
- **Home no longer shows its dark splash to a signed-out visitor** — it
  redirects straight to `/signin/` (D-146). The splash still exists for
  `no-profile`/`suspended`, which are real states, not the redirect target.
- **The carousel transition has its own eased animation and two more
  seconds per slide** (D-141), and **slide images preload behind a
  skeleton** so a slow connection doesn't jump the layout (D-142).
- **The alert banner is a custom, solid-colour, in-flow composition** instead
  of Astryx's `Banner` (D-143, D-144), fixing both "transparent, hard to
  read" and "overlaps the nav" in one rewrite — then **shrunk to one
  compact row** in the same session after a follow-up that it was still too
  tall (D-145).
- **Corner radius on the hero is responsive**: none below 561px (edge-to-edge
  on mobile, matching last session's D-138), `25px` at and above it
  (matching the sign-in card), rather than none everywhere.

## What was wrong, and what missed it

- **A ~30kB bundle-size regression across every route**, caught by
  `check-bundle-budget.mjs` rather than any test: adding `framer-motion`'s
  `animate` to `OnboardingSlides` leaked into pages that never render the
  hero, because it was still exported from `packages/ui`'s main barrel and
  nearly every page imports *something* from `@pam/ui` (D-140 — the same
  shape as D-125/D-132, not a new class of bug, just the same one
  recurring on a new component).
- **A real, pre-existing WCAG contrast bug in the vendor theme, only
  surfaced by this session's changes.** `admin.spec.ts`'s axe check started
  failing on the case manager screen's "Messages off" badge, light mode,
  320px only. Confirmed with `git stash` against a clean baseline that this
  session's diff was responsible before spending any time on it — then
  bisected by reverting one file at a time and rebuilding, which pointed at
  `AlertBannerHost.tsx` and was **wrong**: nothing in that file touches the
  admin page. The actual defect was `@astryxdesign/theme-neutral` itself
  shipping `--color-on-warning: #111111` as a flat value against
  `--color-warning: light-dark(#4b3900, #f8d36a)` — fine in dark mode,
  1.69:1 in light. It was always there; moving `OnboardingSlides` off the
  barrel (D-140) evidently shifted a CSS chunk's load order enough to make
  Playwright see it for the first time. See D-147 for the fix and the full
  bisection story. *Nothing in this repo's own typecheck, unit tests, or
  Astryx's own component tests could have caught this — it lives entirely
  in a third-party theme package's own token pairing, and needed a real
  browser at a real width running real axe rules.*

## Decisions

D-139 through D-147, all above. The two worth re-reading if this recurs:
D-140 (barrel-export leaks are a recurring *class* of bug, not a one-off —
check `check-bundle-budget.mjs` after adding any new dependency to a
`packages/ui` component, even one used on only one or two screens) and
D-147 (a revert that makes a failing test pass is a lead pointing at
*something in the diff*, not a diagnosis of *what in the diff* — the file
whose revert fixed the symptom was not the file with the actual defect).

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/ui typecheck` | clean |
| `pnpm --filter web typecheck` | clean |
| `pnpm --filter web build` | succeeds, static export |
| `node scripts/check-bundle-budget.mjs` | 500.7 kB gz — 0.7 kB over, same pre-existing disclosed overage as before this session, not a new regression |
| `pnpm --filter @pam/ui test` | 65 passed |
| `pnpm --filter @pam/config test` | 211 passed |
| Playwright `e2e/admin.spec.ts` WCAG check, isolated re-run after the D-147 fix | 6 passed (was 2 failing before the fix) |
| Playwright e2e, full suite, 3 viewport/theme projects, after the D-139 test updates (`consent.spec.ts`, `join.spec.ts`) | 426 passed, 0 failed |

## Left undone

Same two larger pieces as the last several session logs: client-side
routing for a genuinely non-reloading header, and the full
share-places-with-people feature. Neither touched this pass.

## Needs a human

None new.

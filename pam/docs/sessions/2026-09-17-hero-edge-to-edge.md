# 2026-09-17 — Hero edge-to-edge

**Phase:** 1 (UI/product polish on Foundation) · **Sessions so far:** 23

## What changed

Four bug reports on the sign-in hero from the same day's earlier autoplay
work, all from Will:

- **The hero now touches the true top of the screen.** It was inheriting
  `Page`'s own 24px top padding, meant for a column of stacked content, not
  a full-bleed photo. Cancelled with a matching `-24px` margin on the
  hero's wrapping group (D-138) — the same negative-margin technique the
  hero's sides already used to reach both edges.
- **The dots were covered, not missing.** They sat `bottom: 24px` inside
  the hero, which put them inside the sign-in card's own 32px overlap band
  — under the card's opaque white surface. Moved to `bottom: 48px`, clear
  of it (D-138).
- **Looping no longer shows a blank flash.** `Carousel`'s `hasLoop` wraps by
  continuing to scroll past the last item, and with nothing there to
  scroll into, that showed empty track before correcting itself. Replaced
  with an explicit `carousel.current.scrollTo((here + 1) % slides.length)`
  for both autoplay and the loop-back (D-137) — there was never anything to
  wrap around, since all three slides already exist at indices 0-2.
- **Corner radius removed.** The hero now runs flush to every edge, so a
  rounded corner had nothing left to read against.
- The hero's internal header (mark, badge, globe) moved from `top: 16px` to
  `top: 24px` to compensate for the page's own padding no longer sitting
  above it — 16px alone would have sat too close to a phone's status bar.

## What was wrong, and what missed it

- **The dots bug is the same shape as a bug two sessions back**: a fixed
  pixel offset (`bottom: 24px`) that was correct when written became wrong
  once something else in the same layout changed size (the hero's overall
  height, and separately the card's overlap amount) — nothing broke loudly,
  the element was just quietly covered. Neither typecheck, build, nor any
  existing test caught it, because nothing asserts that a decorative,
  `aria-hidden` element is actually *visible* rather than merely present in
  the DOM with valid geometry — which is exactly what my own verification
  after the previous session's autoplay change checked and passed. Caught
  this time only because Will looked at the actual rendered screen.
- **`hasLoop`'s wrap behavior was never actually inspected** in the previous
  session — I reasoned from the library's own prop name and docs
  ("wrap-around scrolling") rather than watching what it does at the seam.
  Replacing it with an explicit `scrollTo` sidesteps needing to understand
  or trust that internal behavior at all.

## Decisions

- D-137 — looping is a direct `scrollTo(0)` (via modulo), not `Carousel`'s
  own `hasLoop`, because there is nothing to actually wrap around.
- D-138 — the hero runs flush to the real top and every side of the
  viewport; `Page`'s top padding is cancelled the same way its side padding
  already was, and the dots moved clear of the card's overlap band.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/ui typecheck` | clean |
| `pnpm --filter web typecheck` | clean |
| `pnpm --filter web build` | succeeds, static export |
| `node scripts/check-bundle-budget.mjs` | 501.4 kB gz — 1.4 kB over budget, unchanged by this session |
| `pnpm --filter @pam/ui test` | 65 passed |
| Playwright `e2e/consent.spec.ts` + `motion.spec.ts` + `a11y.spec.ts` (all 3 projects) | 105 passed |
| Playwright e2e (full suite, 3 viewport/theme projects) | 426 passed, 0 failed |
| Manual: computed hero top offset | 0px from viewport top |
| Manual: computed track border-radius | 0px |
| Manual: dot geometry | visible, positioned above the card's overlap band |
| Manual: screenshot at last slide, then 4.3s later | confirmed direct jump to slide 1, no intermediate blank frame |

## Left undone

Same two larger pieces as the last three session logs: client-side routing
for a genuinely non-reloading header, and the full share-places-with-people
feature. Neither touched this pass.

## Needs a human

None new.

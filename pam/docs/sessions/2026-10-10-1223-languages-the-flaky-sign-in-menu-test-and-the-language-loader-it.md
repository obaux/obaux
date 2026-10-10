# 2026-10-10 — Languages — the flaky sign-in menu test, and the language loader it found

**Branch:** `claude/lena-steady-tag-test` · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), at a lighter effort to spare the shared usage limit: `languages.spec.ts` "ru: every language has its tag before its
name…" failed once on iphone-se in her full run and passed on retry. Find what it races; no retries, no longer timeout; prove it with
`--repeat-each=20`.

## What changed

- **`apps/web/src/lib/i18n.tsx`:** the "Switching to…" loader comes down whenever no language is pending, even if it went up a moment after the
  language arrived (D-471). This was a real bug, not a test problem.
- **`e2e/languages.spec.ts`, `e2e/join.spec.ts`:** the tests settle the page (`settled`) before they open a menu or measure, and again after the
  menu opens, and read every row's position in one `evaluateAll` snapshot instead of seven awaited reads.

## What was wrong, and what missed it

- **The loader could stick** (above). Passing runs hid it: it needs the show-delay's timer to fire in the gap between a render and its effect,
  which only a busy machine produces. A single run, or thirty on an idle machine, passed. The browser suite only caught it as a 30 s timeout on
  a click, which looks like a test problem. What found it: running the test twenty times, four at a time, and reading the Playwright call log
  ("`<div role=status>` intercepts pointer events") and the page snapshot at the failure ("Switching to Traditional Chinese…" over a page already in Chinese).
- **My own tests did not follow the repo's rule** that every geometry assertion goes through `settled` (its doc says why). They measured the menu the
  moment it was visible. That was not the cause here but was the next flake in waiting.
- **A stale `out` build made a different test fail** for a while (Profile moved to a real route on `main`); the run was measuring a build from before it.
  Rebuild before a repeat run on a moving `main`.

## Decisions made

- **D-471** — the loader comes down whenever the language has arrived.

## Verified

`--project=iphone-se-viewport --repeat-each=20 --workers=4 --retries=0` over the 13 tag tests (260 runs): before the fix 5 or 6 failed per 260,
each a stalled click behind the loader; after: 260 passed, and again 260 passed; the sign-in menu and Language screen tests alone 220 of 220.
Language, join, legal and account specs on all three projects: 279 passed. Typecheck clean. (`next lint` does not run here: it asks to set ESLint up,
before and after this change.)

## Left undone

- The full browser suite and the fit audit were not run: this changes no copy and no layout; the merge desk's full run is the check.

## Needs a human

Nothing.

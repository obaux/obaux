# D-471 — The language loader comes down whenever the language has arrived, even if it went up a moment late

**Date:** 2026-10-10 · **Branch:** `claude/lena-steady-tag-test`

Mira (the merge desk), 10 October 2026: `e2e/languages.spec.ts` "ru: every language has its tag before its name…" failed once on the iPhone SE viewport in her full run and passed on retry. "A test that passes only on retry isn't a pass. Find what it races … no retries, no bigger timeout."

## What it raced

Not the menu, and not the fonts (though the test now waits for both). The **"Switching to…" loader** (`role="status"`, in `I18nProvider`)
sometimes stayed up, over a page that was already in the new language, and swallowed every tap: Playwright's click on the globe sat
behind it ("`<div role=status …>` intercepts pointer events") until the 30 s timeout. A person could have had the same.

`I18nProvider` raises the loader after a short delay if a language is still downloading (`SHOW_AFTER_MS`), and takes it down once the
language has arrived (`pendingLocale` back to null). The take-down effect did `if (!switching) return;`, reading `switching` from the render
that cleared `pendingLocale`. Effects run after paint; on a busy machine the delay's timer can fire in the gap between that render and its
effect, raising the loader *after* the language arrived. That render never saw it, so the effect returned, the old effect's cleanup had
nothing left to cancel, and nothing ever took the loader down again (until another language change).

## What was decided

- **The take-down no longer asks whether the loader is up:** whenever `pendingLocale` is null it schedules `setSwitching(null)` after the
  minimum visible time (counted from when the loader was shown). Clearing a loader that is not up changes nothing. One line, no new state.
- **The test waits for the real conditions** (`settled`: the network idle and fonts ready, before opening the menu and again after, because the
  menu is the first place the other scripts appear) and **reads every row's position in one snapshot** (`evaluateAll`) instead of seven awaited
  reads. The join chips test settles before it measures too. No retry, no longer timeout.

## Proof

`--project=iphone-se-viewport --repeat-each=20 --workers=4 --retries=0` over the tag tests (13 tests, 260 runs): **before, 5 or 6 runs per 260 failed**
(each a stalled click behind the loader); **after, 260 of 260 passed, twice** (and 220 of 220 on the sign-in menu and Language screen tests alone),
and the language, join, legal and account specs passed 279 of 279 on all three projects. A single run on an idle machine passed 30 of 30 before the
fix as well, which is why it was rare: it needs load.

## What a later session might reverse

Nothing about the wait. If the loader is ever redesigned, keep this property: *whenever no language is pending, no loader stays up.*

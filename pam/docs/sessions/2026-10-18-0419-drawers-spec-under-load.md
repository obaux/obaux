# 2026-10-18 — drawers spec under load

**Branch:** `claude/pam-design-calendar-redesign` · **Lane:** design system (Dot)

## What changed

`e2e/drawers.spec.ts`: `open()` now waits for the sheet to have arrived (`sheetHasArrived`): no animation or transition left on the dialog or inside it, fonts loaded, the panel's box the same on three frames running. Nothing in the app changed.

## What was wrong, and what missed it

The `<dialog>` runs `pam-rise` (Astryx's enter, 8px up and a fade) and the panel is inside it. The spec read the panel's box, then a point or a child's box a moment later; the animation is on the panel's ancestor, so `panel.getAnimations()` never sees it, and `toBeVisible()` on the input returns while it runs. Probed on the e2e build: the panel sits at y=59 for about 40ms after the input shows, then at y=51 once the dialog's `pam-rise` finishes. Both full-run failures are exactly that 8px: 'the top is a 48px band' read the point 40px into a panel at y=59 (the band is 48px) after it had moved to 51, so the point landed on the H2, `Expected: BUTTON, Received: H2`; 'one round 48px button' read `c.y - box.y` as 8 for 16, `Expected: >= 12, Received: 8`. Run alone the reads are close enough together to agree; under load they straddle the move.

## Decisions made

None.

## Verified

On Piper's tip 97cbce51, narrow-320 and dark-320, `drawers.spec` + `add-visit-to-calendar` + `calendar-link`, `--repeat-each=10 --workers=4 --retries=0`: before 2 failed of 520 (the two above, both on dark-320); after 520 of 520. `drawers.spec` alone at `--repeat-each=30 --workers=8`: 300 of 300 before and after, so that load alone did not reproduce it; the mix with the calendar specs did. I could not make the old spec fail on demand (slowing every animation tenfold, or throttling the CPU sixfold, kept both reads inside the same state), so the proof is the failure messages, the timeline of the 8px move, and the after runs, not a forced failure.

## Left undone

Other specs that read a sheet's box twice (`trip-booked.spec`'s Bring a friend picture, `add-visit-to-calendar`) did not fail in these runs; if one does under load it is the same cause and the same wait.

## Needs a human

Piper re-merges the calendar branch.

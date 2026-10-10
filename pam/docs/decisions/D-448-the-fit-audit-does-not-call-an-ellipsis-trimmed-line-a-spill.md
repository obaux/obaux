# D-448 — The fit audit does not call an ellipsis-trimmed line a spill

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-areachip-long-address`

Will asked the design-system session to fix the `AreaChip` long address in Spanish, Portuguese and
Russian ("Go for it", 10 October 2026), which `audit:fit` reported as a **spill**: text 16..318 in a
button 16..304 at 320px. The definition below is the session's own call, not Will's; he may reverse it.

## What was wrong

Nothing on the screen. At 320px the chip reads "Cerca de 1231 N Broad St, North Phila…" with the
pencil in place (screenshot, 10 October). Astryx's `Button` puts its label in a block with
`overflow: hidden` and `text-overflow: ellipsis`, so a long address is already trimmed inside the
button. The audit's spill check measures each line's **full** width, and a line an ellipsis is
trimming still reports it, so it saw text past the button's edge although nothing is drawn there.
A first attempt, wrapping the label in a shrinkable box as the Arabic path (D-435) does, changed
nothing in the measurement, which is how this was found: the box was already there.

## What was decided

`scripts/audit-language-fit.mjs`: a line is not a spill when an element between it and its control
has `text-overflow: ellipsis` and `overflow-x: hidden`. The trimming is still reported by the
audit's own **ellipsis** check, so nothing that is cut goes unseen; only the double count goes.

Measured on `main` at `d4f325e`: of 35 defects new in a language, exactly 9 stopped being reported,
all `spill` (3 on the `AreaChip` long address, 6 on the conversation-files attachment row); every
`cut`, `overlap` and `ellipsis` remained. The English baseline lost 21 spills too (140 to 119);
those were not reviewed one by one, but the rule can only drop a line that an ellipsis box inside
its own control trims.

Five defects that were not in `scripts/fit-known.json` were looked at with screenshots and accepted,
each with its reason there: the three limited-account overlaps (an earlier message scrolled under
the opaque header) and the zh-HK "ID office letter.pdf" ellipsis in the two attachment lists (the
name reads in full; its box measures 4px under). A sixth, the Arabic address's own ellipsis (the
intended D-435 behaviour; the English baseline's box is a different element, so the key differs),
I had also looked at and added; `main` recorded the same entry at the same time (`0bdb0c8`), so mine
was dropped in the merge and `main`'s stands.

## Numbers, so the next session does not repeat my mistake

STATUS's "29 defects" is the count **not in the known list**. The raw count the audit prints is a
different measure (39 on `16cd437`, 35 on `d4f325e` before this change, 26 after). On `d4f325e` the
unexplained count was 8; after this decision it is 0 with the entries accepted above and `main`'s Arabic one.

## What a later session might want to reverse

- A clip that is an ellipsis box but sits *outside* the control cannot hide a spill (the walk stops
  at the control), but a control whose own root clips and ellipsizes now never spills. If a button
  ever needs to be reported for text running past it, remove the check and accept the known entries.
- The accepted entries are judgements from screenshots at 320px in one build. The scroll-under
  ones say the thread is reached by scrolling; if the thread header ever becomes translucent they
  stop being true.
- Seen and **not** fixed, outside this lane: in the attachment lists some English file names are
  cut hard at the timestamp column with no ellipsis ("Free resume worksl", "The way in is round th").
  It is in the English baseline, so the audit does not report it as new.

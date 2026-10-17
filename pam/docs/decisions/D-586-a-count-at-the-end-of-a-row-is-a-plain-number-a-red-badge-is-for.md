# D-586 — A count at the end of a row is a plain number; a red badge is for what is new

**Date:** 2026-10-16 · **Branch:** `claude/pam-design-count-style` · **Asked by:** Mira (merge desk, 06:06), after b44 and b45 left two styles side by side on the super admin's Home.

## What was wrong

`RequestsScreen` (the super admin's Home) shows two rows that each carry a count, in two styles. Programs to check (Ava, D-584) uses `value`: a plain number at the row's end, like the request rows and Profile's rows. Reported places (Piper, D-585) uses `badge` plus `badgeLabel`: a filled red count with a spoken label. Same kind of number (how many are waiting for a decision), two looks, next to each other.

## What was decided

**Pick `value`** (the plain number) for both rows, and make it the rule for every Home and list in Pam:

- **`value`** says *how many there are*: how many programs wait for a look, how many places were reported, how many past visits a member has (the person page already does this), "English" on the Language row. It is quiet, and the same weight on every row.
- **`badge`** (filled, red) says *something is new since you last looked*: the unread count on a message row. It is the only thing in Pam that asks to be noticed, so it is kept for the one thing that changes by the minute and clears when seen.

The two super admin rows are a standing queue, not an arrival: they are never zero for long, and a red badge on each of them would be on the Home all day, which stops anyone seeing it. The Home's own job is the queue (D-257), the bell already says what is new, and the rows below the two are the requests themselves. Pictured at 390 and 320, light and dark, in `docs/design/review/2026-10-16-count-style/`.

**Who changes what.** Piper changes Reported places (`places.reported.count` stays as the row's spoken meaning if Piper wants it; the plain number reads "Reported places, 2" to a screen reader). Ava's Programs to check does not change. No new words. `MenuList` is unchanged; `badge` stays for unread.

## What a later session might reverse

If Will wants the super admin's queue to shout, the rule is the thing to change, not one row: say which counts are urgent, and give `badge` that meaning in this record.

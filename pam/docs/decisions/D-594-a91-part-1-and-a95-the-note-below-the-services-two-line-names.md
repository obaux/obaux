# D-594 — a91 part 1 and a95: the note below the services, two-line names, six dates, no Help on When or the lead's Home

**Date:** 2026-10-17 · **Branch:** `claude/places-programs-a91-note-a95`

**Decided by:** Will, on card a91 (05:39, yes to the note move) and card a95 (05:50), relayed by the merge desk.

- **The note below the services (a91 part 1).** `place.lead.sees` and `place.noLead` are one banner (`programNote`) that renders after the services (and the drop-in card) while a member is picking a service, so they read it after choosing and before they book. No new words; Sage is shortening `place.lead.sees` separately and Will signs it, so the current words stay until that arrives. Once a visit is booked the note stays where it was, until a91 part 3 puts it behind an icon on the visit card.
- **Trip names on Trips wrap to two lines at most, then "…"** (`TripCard`). It was one line, then it wrapped without limit after Iris's second member pass (P3, D-578); Will wants two. The whole name is the card's accessible name, which `TripsView` already set, so nothing is lost to a screen reader.
- **New trip's When? step: no Help; the next six weekdays.** This **reverses D-578's W4 for that one screen and goes against A26** (a visible way to get help on each step of a multi-step task), by Will's choice: the dates and the times should fit in view. The date and time chips are 40px pills with a 48px hit area (Dot's number, 6351ac7c): 4px of invisible hit area above and below each pill, so the touch floor (§2.5) holds while the picture is shorter, and `e2e/new-trip-chips.spec.ts` holds it. A walk-in program still offers the days it meets (four).
- **A program lead's Coming in: no Help beside the bell.** **This reverses D-582's W1 and also goes against A26**, by Will's choice. The 48px Day, Week and Month tabs and the week starting today stay (D-582). The dashed circles stay off Get started and the green page with a tick stays (b43): no change.

**Tests changed.** The assertions that required Help on New trip's When and on the lead's Home are now the opposite (no Help there) in `member-flow-pass.spec.ts` and `lead-flow-pass.spec.ts`. Help on Check and Done, and on every other screen, is unchanged. The long-name test now asserts the two-line clamp instead of "never cut".

## What a later session might reverse

Help on When and on the lead's Home, if A26 is ever held to without exception. The two-line limit.

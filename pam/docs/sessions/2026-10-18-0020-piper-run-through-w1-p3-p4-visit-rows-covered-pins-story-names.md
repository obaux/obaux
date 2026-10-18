# 2026-10-18 — Piper run-through W1 P3 P4 visit rows, covered pins, story names

**Branch:** `claude/places-programs-run-through` @ `97ca390e` (off main `62ba50e4`; b61 and b62 are not in it, the merge desk merges in the batch) · **Lane:** Places & programs (Piper)

## What changed

Iris's interaction run-through (`docs/research/2026-10-17-interaction-run-through.md`), three items:

- **W1, a program lead's visit rows.** On Home ("Coming in", week and day) and Your calendar, a row with a check-in circle opened the member
  only from the member's name, a 24px link. `ScheduleView.tsx` gave the row no `href` when `canCheckIn` (the old comment said a button cannot sit
  inside a link; Astryx draws a row's link round its words only, and the circle is a sibling). So b60's one handler (`useRowTaps`,
  `packages/ui/src/tapRows.ts`), which clicks a row's direct-child link for a tap on anything that is not itself a control, had nothing to click.
  The row now always carries its `href` and the inner name link is gone. The check-in circle is still a button, so it still checks in.
- **P3, Trips.** With the sheet up, the covered map pins stayed in the page, so a screen reader and Tab reached them while a finger landed on
  the sheet's card. `MapDrawer` takes an optional `onTopChange(top)` (its resting top edge in pixels); `TripsView` keeps it and hands it to
  `TripsMap`, whose drawn preview marks a pin `aria-hidden` and `tabIndex={-1}` when the sheet covers it whole (the pin's block starts at or below
  the sheet's top). A pin covered only in part keeps its link. A real Google map's markers are Google's own and untouched.
- **P4, Storybook only.** `ProgramLead.stories.tsx`'s Home — folded booked Jordan, Keisha and Miguel under the names Marcus, Tanya and Luis;
  the rows open `dummy-m1/m2/m3`, who are Jordan, Keisha and Miguel in `dummy-people.ts`. The story's names now match.

**Outside my lane:** `packages/ui/src/MapDrawer.tsx` is Dot's package; one optional prop was added (Mira told Dot).

## What was wrong, and what missed it

- b60's fix tested every row that *has* a link. A row built without one was never in its list, so "every link row opens from anywhere" was true
  and a visit row was still dead. The check that would have caught it taps the row, not the link: `e2e/visit-row-taps.spec.ts` (below).
- **Members interested** was on Iris's list but already opens from anywhere on main: `PersonRow` draws a stretched link over the whole card
  and the 24px she measured is the name link inside it. Changed nothing; the spec locks it.
- My first draft of the spec found nothing to tap on a Sunday. **The example schedule is empty on a Sunday:** `dummy-appointments.ts` counts
  `|offset * 7 + weekday| % 4` people for a day, and on a Sunday every weekday of the coming week (offset 1..5, weekday 1..5) makes that a
  multiple of 4, so this week shows "Nobody booked" five times. Pre-existing, not part of this change; the spec steps on to the first
  week or day with a visit, and Mira put the fix on its own branch next.

## Decisions made

None needing a number: a row that is a link carries it, the control inside it keeps its own tap, and a pin the sheet covers whole is not offered
to a reader or the keyboard. A partly covered pin keeps its link because what shows can be tapped.

## Verified

- Old code (main `62ba50e4`'s src and ui, narrow-320): `visit-row-taps` and `trips-covered-pins` 4 failed, 2 passed. The failures: Home week,
  Home day, Your calendar ("a tap on the top-left of row 0"; the tap itself, not a wait) and the pins staying reachable under the sheet. The two
  passes are the check-in circle and Members interested, as intended.
- New code: those two specs on narrow-320, dark-320 and iphone-se-viewport, 18 passed. web tsc clean, web test 188, `@pam/ui` test 130.
  One sweep of case-manager-pass, connect-examples-only, lead-flow-pass, messages, program-visits, trips-past, trips-real-account, row-taps,
  checkin and im-here: 383 passed, and 9 failures that were all `visit-row-taps` on a Sunday (the finding above, since fixed in the spec). The
  other ten were not re-run after that; the code was not changed.
- Not run: Storybook (P4 is Storybook data; ids and names checked against `dummy-people.ts`).

## Left undone

- The Sunday hole in `dummy-appointments.ts` (next, its own branch).
- a91's widget (`claude/places-programs-a91-widget` @ `741cc0f7`) waits on Will's footer word and his signature on the note; a98 plan C
  (the calendar link shown again, which calendar the member picked, one visit added) waits for Mira's go after Will's "yes C".

## Needs a human

Nothing new. Will: a91's word and note; a98's "yes C".

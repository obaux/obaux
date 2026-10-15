# Member flow W3 and W5: proposal for Will (15 October 2026)

From Iris's second pass (`docs/research/2026-10-15-member-flow.md`). Pictures only: nothing ships
until Will picks. `proposal.patch` is the exact change used for the "after" pictures (two small
edits, 6 lines); Piper builds whichever Will picks. Shot from Storybook built from `main`
(7b58b1f9) with and without the patch: `member-created--place-with-lead` and
`member-created-states-saved-trips--im-here`, English at 320×568 and 390×844, Arabic at 320×568.

- `w3-before-after.png`: the place page, before (top row) and after (bottom row).
- `w5-before-after.png`: the visit-day page, before and after.
- `raw/`: each picture on its own.

## W3. "Pick a service" hidden behind Plan a trip (320×568)

**Proposal:** on a place with services to pick, the services come straight after the name, the
open line and the rule. The blue "<place> will see your visit" note moves from above them to
below them. Nothing is added or reworded.

- At 320×568 the first two choices are fully in view and the third shows behind the button
  (before: the first choice was cut off). At 390×844 all three are in view, then the note, then
  About. Arabic matches English.
- The note is still on the page before the member plans anything (D-526); it just no longer
  stands between him and the choice he has to make.
- Cost: the note is no longer the first thing read. A member who never scrolls past the choices
  sees it only after picking.
- Left alone: the 12px "Pick a service above to plan a trip." line under the button. It says
  why the button is grey; now the choices it points to are above it in view.
- Code: `PlaceDetail.tsx`, in the `chooseFirst` layout `notice` renders after `extra`.

## W5. Visit day: Get directions is a screen down

**Proposal:** until the member has marked the visit (I'm here or I went), a secondary button
"How to get there" (the footer wording from D-440) sits right under the visit card. The row
"Get directions" lower down is hidden meanwhile, so the page doesn't say it twice. Once the visit
is marked, the button goes and the row comes back.

- One primary action still holds (D-239): I'm here stays the only dark button; the new one is
  secondary.
- 390×844: card, How to get there, Cancel this visit, I'm here, I went all in view (before: only
  down to I went, directions cut off at the bottom edge).
- 320×568: the visit card still fills the first screen (its day wraps to two lines), so the button
  starts just under the fold, one short scroll away instead of a whole screen. Arabic the same.
  Nothing smaller than today's text was used to get that.
- Cancel this visit is left where it is: Piper is hiding it once the visit is marked (P6).
- Medium confidence (Iris): worth one real member before building.
- Alternative not drawn: Get directions in the sticky footer. It would be always in reach, but
  the footer's button is primary, so it would sit with I'm here as a second primary (D-239), or the
  footer would need a secondary style it has never had. Not recommended.
- Code: `place/page.tsx`: `directionsUpTop` (`visit && !visit.attendance && directions`).

## For Will to pick

1. W3: move the note below the services?  2. W5: directions button under the visit card?
Each is independent.

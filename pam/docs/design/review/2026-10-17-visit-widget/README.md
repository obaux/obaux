# The visit card as a widget (card a91, Will 17 October 2026): proposal pictures

Pictures and a prototype only: `VisitWidget` in `packages/ui/src/VisitWidget.tsx` with stories under Components/Cards/VisitWidget.
Nothing uses it yet; Piper builds the screen if Will says yes. Words marked "stand-in" are not signed (Sage).

- `views-390.png`, `views-320.png`, `views-320-ar.png`: the visit (rest), Check in, Change, Marked. Light and dark at 390 and 320; Arabic at 320.
- `footers.png`: the two footers, A "Check in" | "Change" and B Sage's word ("I made it", signed by Sage, ledger d457b5f9) | "Change". Inner views are the same.
- `notes.png`, `notes-320-ar.png`: the small icon at the top right, open: an open eye for a program on Pam, a crossed-out eye for a place not on
  Pam (`EyeIcon`/`EyeOffIcon`, D-416: what somebody can and cannot see), opening an Astryx Popover that holds the blue note
  (`place.lead.sees` / `place.noLead`, unchanged). No "verified". The eye is 22px in a 48px target.

How it behaves:
- One green card (the VisitCard look). The footer is a hairline with two equal 48px actions. A tap opens the view in the same card:
  Check in = "I'm here" (the one dark button) and "I went"; Change = "Change date and time" and "Cancel visit". Each has Back (arrow and word)
  to the visit; focus moves into the new view and back to the footer action that opened it.
- No height jump: the three views sit in one grid cell, so the card is as tall as the tallest (249px at 390, 280 at 320 in English) and moving
  between them changes nothing; a hidden view is inert. Moving fades in 160ms; with reduced motion it is instant.
- Marked: no buttons; a green note says the visit is marked and the points (taller by the note, 276 at 390, since it replaces the footer).
- A result of "I'm here" or "I went" (not there yet, no location, limit) is said inside the card, above the buttons, as a Banner. That one grows
  the card (318 at 390) once, after a tap. Alternative if Will minds: it replaces the Back row.
- Get directions is then free to sit under the card, not behind a stack of buttons.

Piper's side: the results, the real handlers (`onHere`, `onWent`, `onCancelVisit`, the confirm dialog stays D-234/D-255), what is marked.

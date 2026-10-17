# D-597 — The visit on a place is one widget (a91 part 3)

**Date:** 2026-10-17 · **Branch:** `claude/places-programs-a91-widget`

## Decided

Will, 17 October (card a91): the visit on a place's page should be a widget, not a card with a link, a text button and a second
card under it. Dot drew it (`VisitWidget` in `packages/ui/src/VisitCard.tsx`); this wires it into
`apps/web/src/app/place/page.tsx` and `ImHereCard.tsx`.

- **One green card, three views in one grid cell** (so the card never changes height): the visit, Check in ("I'm here" and "I went"),
  and Change ("Change date and time" and "Cancel this visit"). Each view has Back. A marked visit shows no buttons and says so.
- **The footer.** "Check in" shows only where it did before: a real visit, in its window (two hours before to four after), at a program
  with a lead on Pam, not marked (D-535, D-545). Outside the window the footer is "Change" alone. The first button's word is still
  Will's choice; it is one key, `place.visit.checkIn`, which says what `checkin.here` says today.
- **Who sees this visit** is an eye in the card's top corner with a popover: the blue note ("{place} will see your visit…", or
  "This is only to help you plan. Pam does not tell {place} you are coming.") moved there from under the card. The eye's name is the
  same words, `place.visit.whoSees`. The note stays under the services before a visit is booked (D-594).
- **Cancel** is the same confirm as before (D-234, D-255), opened from the Change view. A failed cancel says so inside the card.
- **A visit that has started and is not marked** keeps Change and Cancel (Dot's call; the Change view is where Cancel lives now).
- **Not a widget:** a visit with nobody to tell (a role other than member) and a place whose visit has ended and is unmarked keep the
  old card, so nothing offers a past visit a check-in it does not have.
- `useCheckIn` in `ImHereCard.tsx` is the check-in itself, so the widget draws the buttons and `ImHereCard` stays for any screen that
  wants the card.

New keys (Sage signed the words, ledger 824a0724; Lena's translations): `place.visit.whoSees`, `place.visit.changeDate`. Reused:
`trips.confirm.close`, `action.back`, `trips.new.change`, `place.visit.cancel`, `checkin.here`, `checkin.went`. Never the word "verified".

## Reverse it by

Render `VisitCard` and `ImHereCard` as before in the place page's notice; nothing else depends on the widget.

# D-578 — Member flow second pass: Help on every step, wrap, 48px, signing

**Date:** 2026-10-15 · **Branch:** `claude/places-programs-member-flow-pass`

Iris's second pass over the Member flow (`docs/research/2026-10-15-member-flow.md`) routed these to Piper by the merge desk. Decided here, with no new words (every label already existed and was signed):

- **W4 — Help on every step of a form (A26).** New trip's first step, "When?", and the three policy screens (Policies to sign, each policy, and so its signature sheet) carry the same round Help as "Check your trip". It sits beside Done where Done is. This reverses "no Help on When either (Will)" from D-235's note: Iris found A26 asks for a visible way to get help on each step of a multi-step task and on forms, and 10 October's pass named it too. Reverse it by removing `HelpButton` from `NewTripView`'s `actions` for `when`.
- **P3 — a place's name wraps.** `TripCard`'s name no longer ends in "…" (it was Will's 3 October one-line rule): a long name takes more lines, with `overflow-wrap: anywhere`. The full name is still the card's label.
- **P7 — 48px targets (§2.5).** The copy icon in an address card is 48px to tap and draws as before, pulled into the card's corner (margin above and beside it only, so it never lies over the address under it: axe's target-size). "View all places to visit" is a button row, like the places above it. A link row's target is its words, 24px tall.
- **W1.** The signature sheet forgets its ink, its typed name and its mode when it closes, so the next opening is an empty box and Sign is greyed until something is drawn.
- **W2.** `AWARDED_TODAY` lists `attend_appointment_verified` and `attend_appointment_sms` (the database has paid both since D-535). Ways to earn shows "I'm here" +100 and "I went" +60 first, in the buttons' own words (`checkin.here`, `checkin.went`), so no new label was needed. `points.way.attend` is no longer shown.
- **P6.** "Cancel this visit" is hidden once the visit is marked, from the stored mark or at once from the card's `onMarked`.
- **P8.** Storybook answers `policy_signatures`, `member_signatures`, `sign_policy` and `forget_my_signature`, and remembers a signature for the life of the story. An example place keeps its drawing on the browser, so `useMySignatures` falls back to it when the account has none; the fallback applies only where examples are shown (`examplesOn()`), and sign-out clears the tab's drawing, so a real member on a borrowed phone is never offered a demo's; the prototype then signs every policy after the first in one tap, as it did on 10 October.

- **P1, P2 (Sage's signed words, 15 October).** `trips.new.missing.both/day/time` say "Pick a day and a time.", "Pick a day.", "Pick a time.". A trip nobody comes along to is named by the new `trips.card.label.alone` ("{place}, {when}"); `trips.card.label` (with {name}) is kept for a companion. The six other languages keep their existing missing.* translations on purpose (same meaning, `copy:ack --keep`) and carry the English for the new `.alone` key until Lena translates both.

Not here: W3 and W5 (Dot), W6 (Will's phone).

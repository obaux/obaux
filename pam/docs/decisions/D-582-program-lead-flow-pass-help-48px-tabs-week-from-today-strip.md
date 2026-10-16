# D-582 — Program lead flow pass: Help, 48px tabs, week from today, strip heading

**Date:** 2026-10-15 · **Branch:** `claude/places-programs-lead-flow-pass`

From Iris's first pass over the program lead flow (`docs/research/2026-10-15-program-lead-flow.md`), routed to Piper by the merge desk. No new words, except where noted.

- **S1 — Book a visit lists the people who wrote.** Since D-509 a real lead always saw an empty list. It now comes from the lead's own conversations (`useConversations`), members only, showing the first name, when they last wrote and the last message: nothing beyond what a conversation's own member already sees (D-541 part 2, D-542). Booking itself is unchanged: it is still the example path, kept in this tab, which the success screen says.
- **W1 — Help on a lead's Home**, beside the bell, on Coming in and on Get started (`hasHelp={false}` removed).
- **W3 — Day, Week and Month are 48px**, in 16px type, each at least 48 wide. **This reverses D-355's "small tabs, 38px touch target" (Will, 7 October)**, on the 48px floor (§2.5, A27); the merge desk asked for it and the picture card for Will should say so. The week now runs from the day shown, today on opening, so the days already gone are not above it (it was Monday first; Will's "opens on the week", D-267, is kept). The arrows move it by seven days. The month grid still starts its weeks on Monday.
- **W4 — the people strip.** A program lead's strip has a visible heading, "People interested in your program" (an existing key), over the rings or the faint circles. A lead with no program yet has no strip at all (no examples either), since nobody can be interested in a program that is not on Pam; inviting is still there in "You can also". This reverses D-486's (+) circle for that one screen only: a lead with a program and nobody yet still has it. A case manager's row is unchanged.
- **P1 — Add a program:** from step 2 the back arrow is named "Back a step" (`trips.new.back`), not "Back to Home".
- **P6 — the member page's number** is past visits, so its label is the existing "Past visits" (`trips.past.title`), not "Visits with you" over a list of upcoming ones.
- **P7 — Search in the + menu** sits under a rule, apart from the three things the menu creates. It was not moved out of the menu (D-358).
- **P9 — info tips** (About services, signed every policy, Use Pam as, the code hint) are 48px to tap and drawn as before: the button has no fill, so a negative margin keeps the layout. This reverses D-368's "the smaller target is the rule here" for the target, not for the mark. Copy address is fixed on the member branch (D-578).

Not here: P2, P4 (words from Sage and Lena), P5 (the mark: Dot), P3 (a timing promise: Will), W2 and P8 (Ava), P10 (Lena).

# 2026-10-12 — website place-told live b25

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** public website (Wren)

## What changed

- Mira, 05:48: b22 put attendance live but the site still said Pam tells no place. `PlaceTold.tsx` is Sage's held version (e06fab16), unchanged in its words; only the file comment changed. Its sentences were checked against D-535 and the migration: 2 hours before to 3 hours after (not named in the post), the lead can fix it for 14 days, missed a day after the visit ends, a no-lead place is told nothing.
- `is-the-place-told`: new summary (Sage's, from Mira), `updated` 12 October, section labels "Who sees it" and "Not told".
- Home, Will's a65 answers: the band says "Find help, plan your visit, and talk to a real person." and the programs row ends "…and you see who's coming on your calendar." Two HELD entries are gone; the 24/7 line stays held, with Will's reason (the website needs translating first). The Home test no longer bans "real person".

## What was wrong, and what missed it

The b22 attendance change did not list the site post that said the opposite. The post's text was held for exactly that day and nobody was told to release it.

## Decisions made

None new (D-531 covers the Home words).

## Verified

Site tests 94, tsc clean, build, a11y 120 scans 0 problems, usability all clear, scrollspy (see the READY).

## Left undone

The 24/7 line waits for launch and translation. The globe button waits for a second signed language.

## Needs a human

Nothing.

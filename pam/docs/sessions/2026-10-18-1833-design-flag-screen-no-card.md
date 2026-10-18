# 2026-10-18 — design flag screen no card

**Branch:** `claude/pam-design-flag-no-card` (off main 615e1078) · **Lane:** design system (Dot), Piper's screen, told first

## What changed

`/flag/` ("Something is wrong here") drew its radio list, note and button inside one `Card` (padding 4). By Will's rule, no card around a single list (D-615, Foundations › Patterns), the card is gone: the same `VStack`, same spacing, same strings, same send. Spec: no `.astryx-card` on the form (fails on main, passes here).

- Merged main bc96890b (b73: Piper's D-608 cuts removed the intro line); the conflict was STATUS.md only. flag.spec 21 pass on 3 projects; pictures re-shot from the build (the form moved up under the title).

## What was wrong, and what missed it

The screen was drawn before the rule existed; nothing named a card around one form as the wrong frame until Will's 17:51 note on Text alerts.

## Decisions made

None new; D-615.

## Verified

flag.spec 21 passed (3 projects x 7). On main's real build (615e1078) the new check fails: `.astryx-card` count 1, expected 0. tsc clean. Pictures: `docs/design/review/2026-10-18-flag-no-card/` (390 light, 320 dark, 390 Arabic, 320 ru).

## Left undone

Will looks at the pictures before it ships. Other single-list screens in cards (found by eye, not audited): none checked yet.

## Needs a human

Will's yes.

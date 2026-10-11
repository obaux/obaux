# 2026-10-11 — explore card clamp fit findings

**Branch:** `claude/places-programs-explore-card-clamp` · **Lane:** Places & programs (Piper)

## What changed

Dot found 4 unaccepted fit-audit findings on main in `member-created-states-explore--live` (the place cards' name and descriptions clamping in the pseudo-language, "65 > 44"). Reproduced from origin/main abf68eaa: Explore stories in the seven languages plus pseudo gave 12 findings, 4 unaccepted. Neither the card nor its fixture changed: `PlaceCard` has clamped the name and description to two lines since 7 October (D-213) and the same four cards were already accepted under `member-created--explore`; `member-created-states-explore--live` renders the same cards from the example places, and only its tab-label cut had been accepted. I accepted the four clamps (`fit-known.json`) with a reason: the card is a way in, the place page shows the full description under About, no real language trims. No card change.

## What was wrong, and what missed it

Nothing in the product: the baseline accepted the findings under one story id and not the other.

## Decisions made

None.

## Verified

Fit audit, Explore stories, en, es, pt-BR, zh-CN, zh-HK, ru, ar and pseudo (9 stories × 8 languages): before 12 findings, 4 not accepted (all pseudo, all `member-created-states-explore--live`: 3 descriptions and "Example Workforce Center"); after 12 findings, 0 not accepted. The seven real languages: 0 new findings before and after.

## Left undone

Nothing.

## Needs a human

Nobody.

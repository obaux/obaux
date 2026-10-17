# 2026-10-14 — places-programs drawer closes on a pick (D-575)

**Branch:** `claude/places-programs-drawer-closes-on-pick` · **Lane:** Places & programs (Piper)

## What changed

In the Location drawer (`AreaSearch`), a pick (ZIP, neighborhood, City Hall, Google address, Use my current location) calls `onChange` and closes the drawer at once. Done is replaced by Cancel (leaves the area as it was). e2e: a test for each kind of pick, Cancel, Escape; `street-search`, `area-picker`, `focus-text-boxes` no longer press Done.

## What was wrong, and what missed it

Will tried street search live and found the drawer stayed open after a pick (D-275 held the choice until Done).

## Decisions made

D-575.

## Verified

tsc; `area-picker`, `street-search`, `focus-text-boxes` on all three projects: 81 passed.

## Left undone

Nothing for this change. `places.area.done` is unused by the drawer (still used by the policy screen).

## Needs a human

Merge desk: merge and deploy. Screens: the Location drawer's top-right Done becomes Cancel, and a pick closes it.

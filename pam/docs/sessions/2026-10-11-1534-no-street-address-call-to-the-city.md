# 2026-10-11 — no street-address call to the city

**Branch:** `claude/places-programs-no-city-call` (off main f62ba03) · **Lane:** Places & programs (Piper)

## What changed

`useAreaSearch.ts` no longer calls `phl.carto.com`; the picker's label, hint and privacy line say ZIP code or neighborhood and drop the City-list sentence; the first name no longer travels in `/person/policies/?…&name=` (`lib/personNames.ts`). Tests: `noCityCall.test.ts`, `personNames.test.ts`, the e2e in `area-picker.spec.ts` (the two tests that stubbed the City are replaced by one that watches nothing leaves).

## What was wrong, and what missed it

The typed address went to the City on every pause and Privacy was silent; D-054 said it never left the device. Nothing tested what a screen sends to hosts other than Pam's.

## Decisions made

D-536.

## Verified

Config 1094, web tests, tsc, e2e area-picker, focus-text-boxes, places (74 passed on the three phones).

## Left undone

Street-address search through Pam's own server (Mira: after "I'm here"). Picker strings signed by Sage: `places.areaLabel` "ZIP code", `places.areaHint` "Like 19107.", `places.areaPrivacy` "Pam remembers the area you pick on this phone only." (translations by Lena, merged).

## Needs a human

Nothing to apply; no migration.

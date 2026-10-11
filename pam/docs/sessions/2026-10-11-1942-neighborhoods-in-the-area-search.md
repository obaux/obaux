# 2026-10-11 — neighborhoods in the area search

**Branch:** `claude/places-programs-neighborhoods` · **Lane:** Places & programs (Piper)

## What changed

- Migration `20261011194237_the_area_search_knows_philadelphia_s_neighborhoods`: 159 neighborhoods into `areas`, expand-only, with the
  source, checksum, licence wording and the 0026 correction in its header. Made by `packages/db/scripts/neighborhood-points.mjs`.
- Legal › Data sources (`LegalView`), `legal.sources.*` (English in all seven files until Sage signs and Lena translates).
- Tests: DB test 63; `neighborhood-points.test.ts`; `legal-sources.spec.ts`; host entries for github.com and creativecommons.org.

## What was wrong, and what missed it

0026's header said an address was looked up from the browser; D-536 made that false and nothing re-read the header. Corrected in the new header.

## Decisions made

D-540.

## Verified

DB suite (all checks), the new vitest against the real file, see the READY message for web tests, e2e, Storybook and fit.

## Left undone

Sage restores "or neighborhood" in `places.areaLabel` / `places.areaHint`; Lena translates both and the four `legal.sources.*` strings.
Label spellings asked of Lena (odd ones: "Fishtown - Lower Kensington", "Germantown, East", "Mount Airy, West", "Kensington, Old", "Aston-Woodbridge").

## Needs a human

Nothing for Will. Mira applies the migration live (public reference data, expand-only).

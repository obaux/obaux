# D-540 — Pam's area search knows Philadelphia's neighborhoods

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-neighborhoods`

**Decided by:** the merge desk (Mira), 11 October 2026, after D-536 removed the typed-address lookup and left ZIP codes and City Hall
as the only starting points. Will had asked for neighborhoods ("Fishtown") in the search; no Privacy or Terms line changes.

## What

159 Philadelphia neighborhoods are rows in `public.areas` (kind `neighborhood`): a name and one point each. `search_areas` already
matches any part of a label, so it needed no change. "South Philly" and "Center City" stay out until there is a sourced list.

## The source, and what makes it safe to use

- azavea/geo-data, `philadelphia-neighborhoods`, pinned to commit `5c4538b`; the script checks the GeoJSON's SHA-256 before computing.
- Licence: Creative Commons 4.0 Attribution, "attribute the data to Abaca Labs" (the source's `license.txt`, quoted word for word in the
  script and the migration). The GeoJSON is not committed; the migration holds names and points only.
- Attribution is a short **Data sources** section on the Legal screen under the menu: creator, licence with its link, a link to the
  source, and that it was changed (one point kept per area). It is a licence notice, not a promise, so it is not in Privacy or Terms
  (A29: Sage's English, Lena's translations; Will not needed).

## Points

The area-weighted centre of the largest part; where that falls outside the shape, a point on the surface (the middle of the widest
stretch). Every point is checked to lie inside its own shape after rounding to five decimals (`neighborhood-points.test.ts`, which also
runs against the real file when `NEIGHBORHOODS_GEOJSON` is set).

## 0026

0026 is applied history and is not edited. Its stale lines (an address "looked up live … from the browser"; no list of places) are
corrected in the new migration's header: the browser no longer calls the City (D-536), and a published, widely used list of
neighborhood names is acceptable because it is not about a person and Pam keeps a name and a point, never boundaries.

## What a later session might reverse

A fuller or different list (the City's own, with sourced "Center City" / "South Philly"). Rows are public reference data; replace
them with a new expand-only migration.

## Every word, in any order (Lena's catch, 11 October)

The source's names are sorted names ("Germantown, East", "Kensington, Old"), and `search_areas` matched the typed text as one piece, so
"east germantown" found nothing. Migration `20261011203608_search_areas_by_every_word_typed` splits what is typed into words and requires
every word somewhere in the label. The names stay as the source has them (the credit stays honest). LIKE wildcards in what is typed are escaped.

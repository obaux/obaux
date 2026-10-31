# D-622 — Parks & Rec places show no hours, phone or website

**Date:** 2026-10-31 · **Branch:** `claude/places-programs-parks-no-hours`

**Decided by Will, 31 October 2026 (Control Room note n-20261031-1931):** "Parks & Rec don't need phone or sites, or times open, so we can
remove those elements from those place profiles."

## The rule

A Parks & Recreation place (a `services` row with `source = 'city_import'` and `source_ref like 'pprsite:%'`, 166 today) shows **no phone,
no website and no hours**, anywhere: no Call or Website row, no hours row, no week drawer, no "Open until…" or "Closed" line, and no
"sample hours" note, on the place page, Explore, saved places, map cards, the reported-places list and the connect lists.

- **Phone and website** are cleared in the database (migration 20261031193246, the merge desk). The app already hides a row whose
  field is empty.
- **Hours.** Until now every place whose `hours` is null showed the stand-in week from `@pam/config/hours` (`USE_PLACEHOLDER_HOURS`), so
  these places said "Open until 9 PM" with a sample-hours note. The app did not know a place was Parks & Rec (the place reads carry no
  source). The smallest honest way to tell it is a value in the column every place read already returns: `services.hours = {"none": true}`
  (`NO_HOURS`, `declaresNoHours` in `@pam/config/hours`). `hoursFor()` returns nothing for it, and every screen that draws an open or
  closed state goes through `hoursFor()`, so they all stop at once. Migration 20261031200804 (live since 31 October 20:08) writes the marker on those rows (the merge
  desk applies it; until it is applied those places still show the stand-in).
- **It is not "unknown".** A place with `hours` null may still get a stand-in or, one day, real hours. A place marked `none` never does, and
  the marker is not a week, so it cannot be read as "closed every day".
- **`has_hours`** (`hours is not null`) is true for these rows. Nothing in the app reads `hasHours` to decide what to draw; do not start to.

## For a future `enrich-places` (and anyone else who writes these columns)

Do not fill **phone, website or hours** for a row whose `source_ref` starts `pprsite:`. `enrich-places` is not built yet. It must write hours only where `hours` is
null, so the marker stops that, and it must also skip `phone` and `website` for those rows. Do not replace the marker with a week, and do
not clear it to "let enrich-places try again". If Will reverses this, set `hours` back to null on those rows (the cleared phone and website
are listed in `docs/data/2026-10-31-place-contacts.csv`).

## What a later session might want to reverse

The stand-in hours for every *other* place are unchanged (Will's 16 September switch). This only exempts Parks & Rec.


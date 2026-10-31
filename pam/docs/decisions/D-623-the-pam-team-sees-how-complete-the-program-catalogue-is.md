# D-623 — The Pam team sees how complete the program catalogue is

**Date:** 2026-10-31 · **Branch:** `claude/pam-program-stats`

**What:** the super admin's Home shows a card, "Programs on Pam": how many places are listed, and how many have a phone, a
website, an address and real opening hours, each counted over the places that need that detail. Under it, one row, "Missing
information", with how many places lack something. The row opens `/places/missing/`, a nested page (D-213) listing every
place that lacks something and what it lacks. It has filters for what is missing and for the kind of place, and a search over
the name and the address; a row opens the place's own page. Nothing is edited there.

**Who:** Will, 31 October, Control Room note n-20261031-2020: "Let's add these stats on super admin user, so they have
visibility on how many programs exist total. And a list of programs missing info, clicking into it, opens a nested page with
list of missing details, filtered and searchable. Add these stats to the super admins homepage." Relayed by Mira with the
rules below.

**The rules, and why:**
- **What a place needs.** A phone, a website, an address and real hours. A Parks & Rec place (`pprsite:`) needs only an
  address, per D-622. So the phone, website and hours counts are over 588 places today, not 754, and the card says why.
- **What counts as missing.** A phone, website or address that is null or blank, or hours that are not a real week. Real hours
  are judged by `hours_are_real()`, which follows the same rule as `parseHours` in `packages/config/src/hours.ts`. The app's
  stand-in hours are made in the app and never stored, so nearly every place lacks hours. That is the true state, and the
  Hours filter shows it.
- **Which places.** Active and not removed (`is_active`, `removed_at is null`).
- **The kind of place**, from the `source_ref` prefix: `dbhids:` behavioral health, `cityfac:` library, `pprsite:` Parks &
  Rec, anything else (`oic:`, `cerc:`, typed in by hand) "added by hand".
- **One function**, `program_info_gaps(p_with_list)`, `security definer`, super admin only (checked inside, as D-593's is),
  with no anon execute. Home asks without the list; the page asks with it and filters it in the app. The list is at most
  about 600 rows, and filtering on the phone makes every chip and keystroke instant.
- **No person** is in it: these are the public catalogue's own places.
- **The filters and the search are kept for the visit** (session storage), so Back from a place finds the list as it was left.

**A later session might reverse:** keeping the kind of place in a `source_ref` prefix. If places get a real "kind" column, the
function should read that instead.

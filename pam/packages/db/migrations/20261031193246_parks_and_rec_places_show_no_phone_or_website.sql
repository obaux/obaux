-- Parks & Recreation places show no phone number or website (Will, 31 October 2026).
--
-- Will: "Parks & Rec don't need phone or sites, or times open, so we can remove
-- those elements from those place profiles."
--
-- The place page shows a Call row only when a place has a phone, and a Website
-- row only when it has a website, so clearing the two fields removes both rows
-- for every Parks & Rec place (and from saved places and lists, which read the
-- same fields). Hours are already empty on every one of these rows; the hours a
-- member sees there today are the stand-in from @pam/config/hours, which the
-- app stops showing for Parks & Rec in its own change (b79).
--
-- What this clears, as of the day it was written:
--   website  166 rows: 165 had the department's general page (set by 0050),
--            1 had its own Parks & Rec Finder page (20261031174805)
--   phone     12 rows: the rec centre numbers found on 31 October
--            (20261031174805)
-- Every cleared value is listed in docs/data/2026-10-31-place-contacts.csv, so
-- this can be undone from that file if the decision changes.
--
-- Only rows the City import wrote: anything a program lead typed in is left
-- alone (none of these rows has a lead today).

update public.services s
set phone   = null,
    website = null
where s.source = 'city_import'
  and s.source_ref like 'pprsite:%'
  and not (coalesce(s.provider_edited_fields, '{}') && array['phone', 'website']::text[])
  and (s.phone is not null or s.website is not null);

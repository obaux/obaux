-- Parks & Recreation places have no times open to show (Will, 31 October 2026: "Parks & Rec don't need phone or sites, or times open").
--
-- The app showed a stand-in week for every place whose `hours` is null (@pam/config/hours, USE_PLACEHOLDER_HOURS), so each of these
-- places said "Open until 9 PM" or "Closed" with a note that the hours were a sample. This writes, on those rows only, the value the
-- app reads as "no hours, on purpose": {"none": true} (`NO_HOURS` / `declaresNoHours` in @pam/config). It is the column the place reads
-- already return, so no function changes, and it is not a week, so nothing can mistake it for hours that are closed every day.
--
-- It also keeps `enrich-places` (not built yet; it must fill a place only while its `hours` is null) away from these rows (D-622 "Parks & Rec show no hours").
-- Expand-only: one data change, nothing dropped. Only rows the City import wrote, and only ones with no hours of their own.

update public.services s
set hours = '{"none": true}'::jsonb
where s.source = 'city_import'
  and s.source_ref like 'pprsite:%'
  and s.hours is null;

-- 0024 — Keep the libraries, drop the rest of the city facilities.
--
-- Will's call, and the right one. 205 recreation centres and 8 older adult
-- centres under "Home and family" crowded out the things a member leaving
-- prison is actually looking for — food, housing, ID, legal help — none of
-- which PAM has yet. A category that is 90% rec centres teaches somebody that
-- the category is not worth opening.
--
-- The libraries stay because they are the Education category and they earn it:
-- free, walk-in, no enrolment, and the only realistic answer PAM has today to
-- "I need a GED, a computer, or to apply for a job and I have no money".
--
-- The map table and the ingest stay exactly as they are. Re-adding a facility
-- type is one row, and the machinery around it — the allow-list, the
-- exclusions, the dedupe, the tests — is what took the work.

delete from public.city_facility_map
where facility_type not like 'Library%';

delete from public.services
where source_ref like 'cityfac:%'
  and coalesce(source_attributes ->> 'asset_subt1_desc', '') not like 'Library%';

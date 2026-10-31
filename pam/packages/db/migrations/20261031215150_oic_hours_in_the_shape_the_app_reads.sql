-- The six OIC programs' real hours, in the shape the app reads (desk, 31 October 2026).
--
-- 0025 stored OIC's published hours (from OIC's own website) as
--   {"tz": "America/New_York", "weekly": {"mon": [["08:00","16:00"]], ..., "sat": [], "sun": []}}
-- but the app reads a week as seven days from Sunday, each a list of {"open","close"} (`parseHours` in
-- packages/config/src/hours.ts, and `hours_are_real` from D-623, which follows it). So the app never showed these
-- real hours: until b78 it showed the stand-in week instead, and from b78 (D-624, no made-up hours) it would show none.
-- Found when D-623's `hours_are_real` counted 0 places with real hours where 6 were expected.
--
-- This rewrites only rows still in the 0025 shape, keeping the time zone and every period:
--   {"tz": "America/New_York", "week": [sun, mon, tue, wed, thu, fri, sat]}
-- It is the same information in the app's shape, so nothing is lost. A program lead's own edits are already written in
-- the app's shape by the program screens and are never in the 0025 shape, so they are untouched.
-- Dry run on 31 October: 6 rows (all oic:), each read back as a real week by hours_are_real.

update public.services s
set hours = jsonb_build_object(
  'tz', s.hours -> 'tz',
  'week', (
    select jsonb_agg(
             coalesce((
               select jsonb_agg(jsonb_build_object('open', p ->> 0, 'close', p ->> 1))
               from jsonb_array_elements(s.hours -> 'weekly' -> t.d) as p
             ), '[]'::jsonb)
             order by t.i)
    from unnest(array['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']) with ordinality as t(d, i)
  )
)
where jsonb_typeof(s.hours -> 'weekly') = 'object';

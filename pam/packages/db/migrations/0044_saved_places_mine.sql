-- 0044 — The places a member kept, in the shape a card already reads.
--
-- `saved_places` has existed since 0003 and nothing ever wrote to it: Save on a
-- place card changed its own label and forgot by the next screen. Reading it
-- back needs one thing the table cannot give a browser — the place's own
-- coordinates. `services.geo` is a geography column, so a PostgREST select
-- returns it as WKB, and a member's directions link would be built from an
-- address string instead of the point (which 0023 went out of its way to stop).
--
-- So this mirrors `services_near`: the same column names, the same
-- st_y/st_x extraction, minus the distance. A card is a card whether it came
-- from a search or from a saved list, and neither the component nor the screen
-- should have to know which.
--
-- `security invoker`, deliberately. There is nothing to elevate: the whole
-- point is that a member sees their own saved rows, which is exactly what the
-- `saved_places_own` policy already says, and the join to `services` is filtered
-- by the catalogue's own policies. A definer function here would be a privilege
-- nobody needs and a surface somebody has to audit.

create or replace function public.saved_places_mine()
returns table (
  id          uuid,
  name        text,
  lookup_name text,
  category    public.service_category,
  subcategory text,
  address     text,
  phone       text,
  place_id    text,
  lat         double precision,
  lon         double precision,
  saved_at    timestamptz
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    s.id,
    s.name,
    coalesce(s.lookup_name, s.name),
    s.category,
    s.subcategory,
    s.address,
    s.phone,
    s.place_id,
    extensions.st_y(s.geo::extensions.geometry),
    extensions.st_x(s.geo::extensions.geometry),
    sp.saved_at
  from public.saved_places sp
  join public.services s on s.id = sp.service_id
  where sp.member_id = auth.uid()
  order by sp.saved_at desc;
$$;

comment on function public.saved_places_mine is
  'The caller''s own saved places, in the same shape as services_near so one '
  'card component reads both. security invoker: saved_places_own already says '
  'a member sees only their own rows, and the catalogue join is filtered by the '
  'services policies.';

revoke all on function public.saved_places_mine() from public;
revoke all on function public.saved_places_mine() from anon;
grant execute on function public.saved_places_mine() to authenticated;

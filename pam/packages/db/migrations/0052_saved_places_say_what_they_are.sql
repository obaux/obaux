-- 0052 — The saved list shows the same card as the search.
--
-- 0044's `saved_places_mine` predates places having words. The card now carries
-- a description, an open/closed line and a badge saying who a place is for, and
-- a saved place that shows none of them is a different card wearing the same
-- name — which is exactly what D-102 said the saved list must not be.

drop function if exists public.saved_places_mine();

create or replace function public.saved_places_mine()
returns table (
  id                uuid,
  name              text,
  lookup_name       text,
  category          public.service_category,
  subcategory       text,
  address           text,
  phone             text,
  place_id          text,
  lat               double precision,
  lon               double precision,
  description_plain text,
  website           text,
  audience          text,
  hours             jsonb,
  saved_at          timestamptz
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
    s.description_plain,
    s.website,
    s.audience,
    s.hours,
    sp.saved_at
  from public.saved_places sp
  join public.services s on s.id = sp.service_id
  where sp.member_id = auth.uid()
  order by sp.saved_at desc;
$$;

comment on function public.saved_places_mine is
  'The places this member kept, newest first, carrying what the card needs to '
  'draw them the same way the search does (0052).';

revoke all on function public.saved_places_mine() from public, anon;
grant execute on function public.saved_places_mine() to authenticated;

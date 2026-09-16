-- 0051 — The list gives back the point it sorted by.
--
-- `services_near` sorts by distance from a point and has never returned one.
-- The screen asked for `row.lat`, got undefined, and every directions link fell
-- back to the address string — which is the field 0023 established is the one
-- the city feeds let rot. The Rosenbach imported with correct geometry and an
-- address five miles from it; that is the case this silently got wrong.
--
-- Nothing on screen said so, because a directions link built from an address
-- still opens a map with a plausible-looking pin on it.

-- Adding a column to the returned row changes the function's type, which
-- `create or replace` will not do. Both are dropped and rebuilt.
drop function if exists public.services_near(double precision, double precision, public.service_category, integer, double precision);
drop function if exists public.service_detail(uuid);

create or replace function public.services_near(
  p_lat        double precision,
  p_lon        double precision,
  p_category   public.service_category default null,
  p_limit      integer default 20,
  p_max_meters double precision default 16093.4
)
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
  meters            double precision,
  has_hours         boolean,
  description_plain text,
  website           text,
  audience          text,
  hours             jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select extensions.st_setsrid(
             extensions.st_makepoint(p_lon, p_lat), 4326
           )::extensions.geography as g
  )
  select
    s.id, s.name, coalesce(s.lookup_name, s.name), s.category, s.subcategory,
    s.address, s.phone, s.place_id,
    extensions.st_y(s.geo::extensions.geometry),
    extensions.st_x(s.geo::extensions.geometry),
    extensions.st_distance(s.geo, origin.g),
    s.hours is not null,
    s.description_plain, s.website, s.audience, s.hours
  from public.services s, origin
  where s.geo is not null
    and s.is_walk_in
    and (p_category is null or s.category = p_category)
    and extensions.st_dwithin(s.geo, origin.g, greatest(p_max_meters, 0))
  order by s.geo <-> origin.g
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

-- The detail screen builds the same link, so it needs the same point.
create or replace function public.service_detail(p_id uuid)
returns table (
  id                  uuid,
  name                text,
  lookup_name         text,
  category            public.service_category,
  subcategory         text,
  address             text,
  phone               text,
  email               text,
  website             text,
  place_id            text,
  lat                 double precision,
  lon                 double precision,
  description_plain   text,
  eligibility_plain   text,
  how_to_enroll_plain text,
  audience            text,
  hours               jsonb,
  is_walk_in          boolean,
  last_verified_at    timestamptz
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    s.id, s.name, coalesce(s.lookup_name, s.name), s.category, s.subcategory,
    s.address, s.phone, s.email, s.website, s.place_id,
    extensions.st_y(s.geo::extensions.geometry),
    extensions.st_x(s.geo::extensions.geometry),
    s.description_plain, s.eligibility_plain, s.how_to_enroll_plain,
    s.audience, s.hours, s.is_walk_in, s.last_verified_at
  from public.services s
  where s.id = p_id
    and s.is_active
    and not s.needs_review;
$$;

revoke all on function public.service_detail(uuid) from public;
grant execute on function public.service_detail(uuid) to anon, authenticated;

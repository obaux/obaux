-- 0023 — Three things the City Facilities import got wrong, and the one that
-- matters most: a directions link built from a field the source does not keep
-- accurate.
--
-- ## The Go link now uses coordinates, not the address string
--
-- `The Rosenbach Museum & Library` imported with geometry at 39.94738,-75.17500
-- — Delancey Street, which is correct — and `asset_addr` of "3001 E ALLEGHENY
-- AVE", which is five miles away. The feed keeps its geometry current and lets
-- the address text rot, and nothing in the data says which one to believe.
--
-- PAM was building the directions link from the address. So a row like that
-- sends somebody across the city, on foot, to a building that is not there.
-- That is the worst failure this product has: worse than a blank screen,
-- because the person acts on it.
--
-- Coordinates are what the map pin already uses, so building directions from
-- them means the pin and the link cannot disagree — the same rule already
-- applied to category colour. Google accepts `destination=lat,lng` and routes
-- to the point rather than to a geocode of a string. The address is still shown
-- and still used for the Google *search* link, where being wrong costs a worse
-- search result rather than a wasted journey.
--
-- ## A museum is not a service
--
-- The city files the Rosenbach under `Library Specialized`, alongside the
-- Library for the Blind and Physically Handicapped. One is a free public
-- service; the other is a rare-book museum with paid admission. Keeping the
-- facility type and excluding names containing "museum" keeps the real service
-- and drops the one that would send a member somewhere they cannot afford to
-- go.
--
-- ## The same building, twice
--
-- `Older Adult Center - West Oak Lane Building` appears as two asset rows at
-- identical coordinates. The layer is an asset register — two assets in one
-- building is correct for its purpose and wrong for a list of places. The
-- ingest now skips a row whose name and location already exist.
--
-- Names are also reordered: "Older Adult Center - Juniata Park" is a filing
-- code. "Juniata Park Older Adult Center" is what somebody would say.

create or replace function public.ingest_city_facilities(p_geojson jsonb, p_region_id uuid)
returns table (inserted integer, updated integer, skipped integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  f jsonb; props jsonb;
  v_name text; v_address text; v_type text;
  v_category public.service_category;
  v_lon double precision; v_lat double precision;
  v_geo extensions.geography;
  v_ref text;
  n_ins integer := 0; n_upd integer := 0; n_skip integer := 0;
  existed boolean;
begin
  for f in select jsonb_array_elements(p_geojson -> 'features')
  loop
    props := f -> 'properties';
    v_type := btrim(coalesce(props ->> 'asset_subt1_desc', ''));

    select m.category into v_category
    from public.city_facility_map m
    where m.facility_type = v_type;

    if v_category is null then
      n_skip := n_skip + 1;
      continue;
    end if;

    if upper(coalesce(props ->> 'not_public', 'N')) = 'Y'
       or upper(coalesce(props ->> 'status', 'A')) <> 'A' then
      n_skip := n_skip + 1;
      continue;
    end if;

    v_name := btrim(coalesce(props ->> 'asset_name', props ->> 'site_name', ''));
    v_lon := nullif(f #>> '{geometry,coordinates,0}', '')::double precision;
    v_lat := nullif(f #>> '{geometry,coordinates,1}', '')::double precision;

    if v_name = '' or v_lon is null or v_lat is null then
      n_skip := n_skip + 1;
      continue;
    end if;

    -- A museum is a day out, not a service. The city files one under
    -- `Library Specialized`; a member sent there finds an admission desk.
    if v_name ~* 'museum' then
      n_skip := n_skip + 1;
      continue;
    end if;

    -- "Library Branch - Wynnefield" and "Older Adult Center - Juniata Park" are
    -- filing codes. Say them the way a person says them.
    -- Libraries first: the branch/regional/specialized distinction is the
    -- city's filing, not something a member needs. "Santore Library", not
    -- "Santore Library Branch".
    if v_name ~ '^Library (Branch|Regional|Specialized) - ' then
      v_name := btrim(regexp_replace(v_name, '^Library (Branch|Regional|Specialized) - ', '')) || ' Library';
    elsif v_name ~ ('^' || v_type || ' - ') then
      v_name := btrim(regexp_replace(v_name, '^' || v_type || ' - ', '')) || ' ' || v_type;
    end if;

    v_address := nullif(initcap(btrim(coalesce(props ->> 'asset_addr', ''))), '');
    if v_address is not null then
      v_address := v_address || ', Philadelphia, PA';
    end if;

    v_ref := 'cityfac:' || coalesce(props ->> 'objectid', '');
    v_geo := extensions.st_setsrid(extensions.st_makepoint(v_lon, v_lat), 4326)::extensions.geography;

    -- This layer is an asset register: two assets can share one building, which
    -- is right for the city and wrong for a list of places to go.
    if exists (
      select 1 from public.services s
      where s.source = 'city_import'
        and s.source_ref is distinct from v_ref
        and s.name = v_name
        and s.geo is not null
        and extensions.st_dwithin(s.geo, v_geo, 1)
    ) then
      n_skip := n_skip + 1;
      continue;
    end if;

    select exists (
      select 1 from public.services
      where source = 'city_import' and source_ref = v_ref
    ) into existed;

    insert into public.services as s (
      name, lookup_name, category, address, geo,
      source, source_ref, needs_review, is_active, is_walk_in, source_attributes
    )
    values (
      v_name, v_name, v_category, v_address, v_geo,
      'city_import', v_ref, false, true, true, props
    )
    on conflict (source, source_ref) where source_ref is not null
    do update set
      name    = case when 'name' = any (s.provider_edited_fields)
                     then s.name else excluded.name end,
      address = case when 'address' = any (s.provider_edited_fields)
                     then s.address else excluded.address end,
      lookup_name = excluded.lookup_name,
      category = excluded.category,
      geo = excluded.geo,
      source_attributes = excluded.source_attributes,
      last_verified_at = now();

    if existed then n_upd := n_upd + 1; else n_ins := n_ins + 1; end if;
  end loop;

  return query select n_ins, n_upd, n_skip;
end;
$$;

revoke all on function public.ingest_city_facilities(jsonb, uuid) from public, anon, authenticated;

-- Retire the rows the rules above now exclude.
delete from public.services
where source_ref like 'cityfac:%' and name ~* 'museum';

delete from public.services a
where a.source_ref like 'cityfac:%'
  and exists (
    select 1 from public.services b
    where b.source_ref like 'cityfac:%'
      and b.id < a.id
      and b.name = a.name
      and extensions.st_dwithin(a.geo, b.geo, 1)
  );

-- ---------------------------------------------------------------------------
-- Hand the caller the point, so the directions link can be built from it.

-- The return type gains two columns, so the old signature has to go first;
-- `create or replace` cannot change a function's OUT parameters.
drop function if exists public.services_near(
  double precision, double precision, public.service_category, integer, double precision
);

create function public.services_near(
  p_lat        double precision,
  p_lon        double precision,
  p_category   public.service_category default null,
  p_limit      integer default 20,
  p_max_meters double precision default 16093.4
)
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
  meters      double precision,
  has_hours   boolean
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
    extensions.st_distance(s.geo, origin.g),
    s.hours is not null
  from public.services s, origin
  where s.geo is not null
    and s.is_walk_in
    and (p_category is null or s.category = p_category)
    and extensions.st_dwithin(s.geo, origin.g, greatest(p_max_meters, 0))
  order by s.geo <-> origin.g
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

comment on function public.services_near is
  'Nearest walk-in services to a point, RLS-filtered. Returns the place''s own '
  'coordinates so a directions link is built from the point rather than from an '
  'address string the source may not have kept current (0023).';

revoke all on function public.services_near(
  double precision, double precision, public.service_category, integer, double precision
) from public;
grant execute on function public.services_near(
  double precision, double precision, public.service_category, integer, double precision
) to anon, authenticated;

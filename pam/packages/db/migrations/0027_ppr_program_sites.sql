-- 0027 — Parks & Recreation program sites, for Home and family.
--
-- Will's source: the PPR locations page. Behind it sit two ArcGIS layers, and
-- which one you use decides whether this is useful or noise:
--
--   PPR_Program_Sites  168 points. Staffed sites that actually run programming:
--                      157 recreation centres, 6 older adult centres, 3
--                      environmental education centres, 2 pools.
--   PPR_Properties     507 polygons. Every parcel PPR owns, with addresses.
--
-- 0022 imported rec centres from the City Facilities asset register instead,
-- which is why 0024 threw them back out: that layer counts basketball courts
-- and playground equipment as "recreation", so 205 rows arrived and most of
-- them were not places with anyone in them. This layer is the department's own
-- list of sites with programmes, which is the thing a member can walk into.
--
-- ## The address comes from a different layer, matched by geography
--
-- Program sites carry no address. Properties do. Matching them by name gets 87
-- of 168, because the two layers punctuate differently ("Joseph F Vogt
-- Playground" against "Joseph F. Vogt Playground").
--
-- So the match is spatial, with a name check as the guard: the nearest property
-- centroid within 400m, accepted only if the names agree once punctuation is
-- stripped, or the centroid is within 60m. That takes 161 of 168.
--
-- The guard is not pedantry. Without it, "Wissinoming Park" matches the centroid
-- of Margaret Tartaglione Park 102m away and inherits its address — and an
-- address on a card is something a person acts on. The 7 sites that fail the
-- guard are imported with no address at all: directions are built from the
-- point (D-050), so they still work, and the Google lookup falls back to the
-- name, which is a worse search rather than a wrong journey.

create table if not exists public.ppr_program_type_map (
  program_type text primary key,
  category     public.service_category not null,
  note         text
);

comment on table public.ppr_program_type_map is
  'Allow-list mapping PPR_Program_Sites.program_type to PAM categories. Same '
  'posture as city_facility_map: a type absent from this table is not imported.';

insert into public.ppr_program_type_map (program_type, category, note) values
  ('PPR_REC',                        'family_services', 'Staffed recreation centre.'),
  ('OLDER_ADULT_CENTER',             'family_services', 'Staffed older adult centre.'),
  ('ENVIRONMENTAL_EDUCATION_CENTER', 'family_services', 'Staffed environmental education centre.')
on conflict (program_type) do nothing;

-- POOL is deliberately absent. Two seasonal outdoor pools are not a service
-- somebody plans around, and PAM has no way to say "closed until June".

alter table public.ppr_program_type_map enable row level security;
alter table public.ppr_program_type_map force row level security;

drop policy if exists ppr_map_select_all on public.ppr_program_type_map;
create policy ppr_map_select_all on public.ppr_program_type_map for select using (true);

drop policy if exists ppr_map_admin_write on public.ppr_program_type_map;
create policy ppr_map_admin_write on public.ppr_program_type_map
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.ppr_program_type_map to anon, authenticated;
grant insert, update, delete on public.ppr_program_type_map to authenticated;

-- ---------------------------------------------------------------------------

create or replace function public.ingest_ppr_sites(
  p_sites      jsonb,  -- PPR_Program_Sites, GeoJSON
  p_properties jsonb,  -- PPR_Properties, Esri JSON with returnCentroid=true
  p_region_id  uuid
)
returns table (inserted integer, updated integer, skipped integer, without_address integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  f jsonb; props jsonb;
  v_name text; v_type text; v_address text;
  v_category public.service_category;
  v_lon double precision; v_lat double precision;
  v_geo extensions.geography;
  v_ref text;
  n_ins integer := 0; n_upd integer := 0; n_skip integer := 0; n_noaddr integer := 0;
  existed boolean;
begin
  -- The property centroids arrive in Web Mercator, because `returnCentroid`
  -- ignores `outSR`. Transform once, into a temp table, rather than per row.
  create temporary table if not exists ppr_props_tmp (
    name text, norm text, address text, zip text, geo extensions.geography
  ) on commit drop;
  delete from ppr_props_tmp;

  insert into ppr_props_tmp (name, norm, address, zip, geo)
  select
    a ->> 'official_name',
    regexp_replace(upper(coalesce(a ->> 'official_name', '')), '[^A-Z0-9 ]', '', 'g'),
    a ->> 'address_911',
    a ->> 'zip_code',
    extensions.st_transform(
      extensions.st_setsrid(
        extensions.st_makepoint((e #>> '{centroid,x}')::double precision,
                                (e #>> '{centroid,y}')::double precision), 3857),
      4326)::extensions.geography
  from jsonb_array_elements(p_properties -> 'features') e,
       lateral (select e -> 'attributes' as a) x
  where a ->> 'address_911' is not null
    and e #>> '{centroid,x}' is not null;

  for f in select jsonb_array_elements(p_sites -> 'features')
  loop
    props := f -> 'properties';
    v_type := btrim(coalesce(props ->> 'program_type', ''));

    select m.category into v_category
    from public.ppr_program_type_map m where m.program_type = v_type;

    if v_category is null then
      n_skip := n_skip + 1;
      continue;
    end if;

    v_name := btrim(coalesce(props ->> 'park_name', ''));
    v_lon := nullif(f #>> '{geometry,coordinates,0}', '')::double precision;
    v_lat := nullif(f #>> '{geometry,coordinates,1}', '')::double precision;

    if v_name = '' or v_lon is null or v_lat is null then
      n_skip := n_skip + 1;
      continue;
    end if;

    v_geo := extensions.st_setsrid(extensions.st_makepoint(v_lon, v_lat), 4326)::extensions.geography;
    v_ref := 'pprsite:' || coalesce(props ->> 'objectid', '');

    -- The address, only when the match is safe to believe.
    select p.address into v_address
    from ppr_props_tmp p
    where extensions.st_dwithin(p.geo, v_geo, 400)
      and (p.norm = regexp_replace(upper(v_name), '[^A-Z0-9 ]', '', 'g')
           or extensions.st_distance(p.geo, v_geo) <= 60)
    order by p.geo <-> v_geo
    limit 1;

    if v_address is null then
      n_noaddr := n_noaddr + 1;
    else
      v_address := initcap(btrim(v_address)) || ', Philadelphia, PA';
    end if;

    -- Two program sites can sit in one park; one card each would be two cards
    -- with the same name at the same place.
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
      select 1 from public.services where source = 'city_import' and source_ref = v_ref
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
      name    = case when 'name' = any (s.provider_edited_fields) then s.name else excluded.name end,
      address = case when 'address' = any (s.provider_edited_fields) then s.address else excluded.address end,
      lookup_name = excluded.lookup_name,
      category = excluded.category,
      geo = excluded.geo,
      source_attributes = excluded.source_attributes,
      last_verified_at = now();

    if existed then n_upd := n_upd + 1; else n_ins := n_ins + 1; end if;
  end loop;

  return query select n_ins, n_upd, n_skip, n_noaddr;
end;
$$;

revoke all on function public.ingest_ppr_sites(jsonb, jsonb, uuid) from public, anon, authenticated;

insert into public.service_imports
  (source_name, source_url, source_format, region_id, is_active, errors)
values
  ('Philadelphia — Parks & Recreation program sites',
   'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/PPR_Program_Sites/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson',
   'arcgis',
   '0195b1c0-0000-4000-8000-000000000001',
   true,
   '[{"status":"verified","checked_at":"2026-09-12","feature_count":168,"note":"Staffed sites with programming, unlike City_Facilities_pub which counts courts and equipment. Addresses come from PPR_Properties, matched on the nearest centroid within 400m and accepted only on a normalised name match or within 60m."}]'::jsonb)
on conflict do nothing;

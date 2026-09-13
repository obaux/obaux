-- 0022 — City facilities: libraries, health centres, rec centres, older adult
-- centres. The first source that puts anything in the Education category.
--
-- `City_Facilities_pub` is the broadest place layer Philadelphia publishes:
-- 3,197 rows. Almost none of them are services. It is playgrounds, statues,
-- salt sheds, fuel pumps, police stations and — this matters — `Detention
-- Center Adult`. A source this broad cannot be imported and then filtered in
-- the UI; the filter has to be the import.
--
-- So the mapping is an allow-list, in a table rather than a CASE, for two
-- reasons: adding a facility type is then a migration an admin can read and
-- argue with, and the set of things PAM is willing to call a service is
-- reviewable in one query.
--
-- What is in it, and why:
--
--   Library Branch / Regional / Specialized  -> education
--     The best single answer PAM can give to "I need a GED, a computer, or to
--     apply for a job, and I have no money": 54 buildings, free, no enrolment,
--     open to anyone who walks in. This is the entire Education category on day
--     one.
--
--   Health Center / Heatlh SubCenter        -> family_services
--     The city's own public health centres. (The typo is the source's; it is a
--     real value in the feed and matching it is not optional.)
--
--   Recreation Center / Older Adult Center  -> family_services
--     Real staffed buildings with programmes, not the playground equipment and
--     basketball courts that make up most of this layer's "recreation" rows.
--
-- What is deliberately not in it: every carceral and law-enforcement facility,
-- every maintenance and back-office asset (`Library Operations` included — it
-- is a warehouse, not a branch), and every park amenity. A member looking for
-- help should never be shown a detention centre by a system built for people
-- leaving one.
--
-- Subcategory is null throughout, per D-045. A library plainly offers literacy
-- help and computers, but the feed does not say so, and PAM naming one is PAM
-- inventing a fact about a place.

create table if not exists public.city_facility_map (
  facility_type text primary key,
  category      public.service_category not null,
  note          text,
  created_at    timestamptz not null default now()
);

comment on table public.city_facility_map is
  'Allow-list mapping City_Facilities_pub asset_subt1_desc values to PAM '
  'categories. A facility type absent from this table is never imported. '
  'Adding a row is a deliberate act: it puts a whole class of building in '
  'front of members.';

insert into public.city_facility_map (facility_type, category, note) values
  ('Library Branch',      'education',       'Free Library branch. Free, walk-in, no enrolment.'),
  ('Library Regional',    'education',       'Free Library regional branch.'),
  ('Library Specialized', 'education',       'Free Library specialized branch.'),
  ('Health Center',       'family_services', 'City public health centre.'),
  ('Heatlh SubCenter',    'family_services', 'City health sub-centre. Source spells it this way.'),
  ('Recreation Center',   'family_services', 'Staffed rec centre with programmes.'),
  ('Older Adult Center',  'family_services', 'Staffed older adult centre.')
on conflict (facility_type) do nothing;

alter table public.city_facility_map enable row level security;
alter table public.city_facility_map force row level security;

-- Same posture as service_subcategories: readable by anyone, writable only by
-- an admin. It contains no personal data and it explains the catalogue.
drop policy if exists city_facility_map_select_all on public.city_facility_map;
create policy city_facility_map_select_all on public.city_facility_map
  for select using (true);

drop policy if exists city_facility_map_admin_write on public.city_facility_map;
create policy city_facility_map_admin_write on public.city_facility_map
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.city_facility_map to anon, authenticated;
grant insert, update, delete on public.city_facility_map to authenticated;

-- ---------------------------------------------------------------------------
-- The ingest.
--
-- Takes GeoJSON rather than fetching, like ingest_dbhids: a pure function, so
-- it can be tested offline against a fixture and reused by the Phase 1 Edge
-- Function importer.

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
  v_ref text;
  n_ins integer := 0; n_upd integer := 0; n_skip integer := 0;
  existed boolean;
begin
  for f in select jsonb_array_elements(p_geojson -> 'features')
  loop
    props := f -> 'properties';
    v_type := btrim(coalesce(props ->> 'asset_subt1_desc', ''));

    -- The allow-list is the filter. Anything not named in it is not a service.
    select m.category into v_category
    from public.city_facility_map m
    where m.facility_type = v_type;

    if v_category is null then
      n_skip := n_skip + 1;
      continue;
    end if;

    -- The city marks assets the public cannot enter, and retired ones. Both are
    -- places a member would be sent to for nothing.
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

    -- "Library Branch - Wynnefield" is a filing code, not a name anybody says.
    -- A member reads "Wynnefield Library" and knows what it is.
    if v_name ~ '^Library (Branch|Regional|Specialized) - ' then
      v_name := regexp_replace(v_name, '^Library (Branch|Regional|Specialized) - ', '') || ' Library';
    end if;

    -- Addresses arrive shouted and without a city.
    v_address := nullif(initcap(btrim(coalesce(props ->> 'asset_addr', ''))), '');
    if v_address is not null then
      v_address := v_address || ', Philadelphia, PA';
    end if;

    v_ref := 'cityfac:' || coalesce(props ->> 'objectid', '');

    select exists (
      select 1 from public.services
      where source = 'city_import' and source_ref = v_ref
    ) into existed;

    insert into public.services as s (
      name, lookup_name, category, address, geo,
      source, source_ref, needs_review, is_active, is_walk_in, source_attributes
    )
    values (
      v_name, v_name, v_category, v_address,
      extensions.st_setsrid(extensions.st_makepoint(v_lon, v_lat), 4326)::extensions.geography,
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

-- Record the source as the one that populates Education.
update public.service_imports
set errors = errors || '[{"status":"imported","checked_at":"2026-09-12","note":"Allow-listed via city_facility_map: libraries to education, health/rec/older-adult centres to family_services. Everything else in the 3,197-row layer is skipped at import."}]'::jsonb
where source_name = 'Philadelphia — City Facilities';

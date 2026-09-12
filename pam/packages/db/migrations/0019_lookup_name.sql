-- 0019 — Search Google with the provider's real name, not our tidied one.
--
-- The DBHIDS feed is entirely uppercase ("COMHAR", "J J PETERS"), and shouting
-- at a member is not plain language (§0), so the ingest runs `initcap`. That is
-- right for the card and wrong for the lookup: initcap turns the acronym "APM"
-- into "Apm" and "CATCH" into "Catch", which is a worse query for Google and
-- does not match the sign on the building.
--
-- The two names have different jobs, so they are now two columns:
--
--   name        what the member reads — tidied, plain
--   lookup_name what we hand to Google — the organisation's own spelling
--
-- The original was already being kept in `source_attributes`, but that column
-- is withheld from client roles (0016), so a browser could not use it. This
-- one is visible: it is a business name, not a condition.
--
-- All of this is superseded the day a Google Places key exists — `place_id`
-- makes the match exact and neither spelling matters. Until then the real name
-- is the better guess.

alter table public.services
  add column if not exists lookup_name text;

comment on column public.services.lookup_name is
  'The organisation''s own spelling, used to build the Google listing link. '
  'Falls back to `name` when null. Distinct from `name`, which is normalised '
  'for reading.';

update public.services
set lookup_name = source_attributes ->> 'provider_name'
where source = 'city_import'
  and source_attributes ? 'provider_name'
  and lookup_name is null;

grant select (
  id, org_id, name, lookup_name, category, subcategory,
  description_plain, eligibility_plain, how_to_enroll_plain,
  address, geo, place_id, phone, email, website, contact_name, hours,
  source, source_ref, provider_edited_fields, needs_review,
  last_verified_at, is_active, is_walk_in, name_may_disclose,
  created_at, updated_at
) on public.services to anon, authenticated;

-- Keep the ingest filling it on every future run.
create or replace function public.ingest_dbhids(p_geojson jsonb, p_region_id uuid)
returns table (inserted integer, updated integer, skipped integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  f jsonb; props jsonb;
  v_name text; v_address text; v_zip text;
  v_lon double precision; v_lat double precision;
  v_ref text; v_walk_in boolean;
  n_ins integer := 0; n_upd integer := 0; n_skip integer := 0;
  existed boolean;
begin
  for f in select jsonb_array_elements(p_geojson -> 'features')
  loop
    props := f -> 'properties';
    v_ref := 'dbhids:' || coalesce(props ->> 'objectid', '');
    v_name := btrim(coalesce(props ->> 'provider_name', ''));
    v_lon := nullif(props ->> 'program_longitude', '')::double precision;
    v_lat := nullif(props ->> 'program_latitude', '')::double precision;

    if v_name = '' or v_lon is null or v_lat is null then
      n_skip := n_skip + 1;
      continue;
    end if;

    v_address := btrim(split_part(coalesce(props ->> 'program_address', ''), ',', 1));
    v_zip := btrim(split_part(coalesce(props ->> 'program_address', ''), ',', 2));
    v_address := nullif(initcap(v_address), '');
    if v_address is not null and v_zip ~ '^\d{5}$' then
      v_address := v_address || ', PA ' || v_zip;
    end if;

    v_walk_in := coalesce(props ->> 'school_based', 'No') <> 'Yes';

    select exists (
      select 1 from public.services
      where source = 'city_import' and source_ref = v_ref
    ) into existed;

    insert into public.services as s (
      name, lookup_name, category, subcategory, address, geo,
      source, source_ref, needs_review, is_active, is_walk_in, source_attributes
    )
    values (
      initcap(v_name), v_name, 'family_services', 'health_counseling', v_address,
      extensions.st_setsrid(extensions.st_makepoint(v_lon, v_lat), 4326)::extensions.geography,
      'city_import', v_ref, true, true, v_walk_in, props
    )
    on conflict (source, source_ref) where source_ref is not null
    do update set
      name    = case when 'name' = any (s.provider_edited_fields)
                     then s.name else excluded.name end,
      address = case when 'address' = any (s.provider_edited_fields)
                     then s.address else excluded.address end,
      lookup_name = excluded.lookup_name,
      geo = excluded.geo,
      is_walk_in = excluded.is_walk_in,
      source_attributes = excluded.source_attributes,
      last_verified_at = now();

    if existed then n_upd := n_upd + 1; else n_ins := n_ins + 1; end if;
  end loop;

  return query select n_ins, n_upd, n_skip;
end;
$$;

revoke all on function public.ingest_dbhids(jsonb, uuid) from public, anon, authenticated;

-- 0016 — Ingest DBHIDS provider locations, without disclosing why anyone attends.
--
-- The source is Philadelphia's Department of Behavioral Health and Intellectual
-- disAbility Services: 525 funded programs, with coordinates and addresses.
--
-- It also carries a `service_type` on every row, and every value of it discloses
-- health status:
--
--   Mental Health (MH) · Substance Use Disorder (SUD) · Both MH and SUD ·
--   Intensive Behavioral Health Services (IBHS) · Problem Gambling Prevention ·
--   Student Assistance Program (SAP) · SUD Prevention Services
--
-- §0 forbids showing health details in the UI, and for this audience the stakes
-- are concrete: a phone left on a table showing "Substance Use Disorder" beside
-- a member's name is the kind of disclosure that costs someone their housing or
-- their job. So `service_type` is imported — it is needed for matching and for
-- admin facilitation — but into a column that is **withheld from the client
-- roles by column-level GRANT**, the same mechanism this repo already uses for
-- private contact details.
--
-- The member-facing surface gets the provider's own name, which is neutral
-- ("COMHAR", "Thomas Jefferson University"), an address, and a map pin under
-- the Family Services category. Nothing that names a condition.

alter table public.services
  add column if not exists source_attributes jsonb,
  -- School-based programs are delivered inside a school. A member cannot walk
  -- into one, so they must not appear in a list of places to go (§5.1).
  add column if not exists is_walk_in boolean not null default true;

comment on column public.services.source_attributes is
  'Raw source fields kept for matching and admin use. WITHHELD from anon and '
  'authenticated by column-level GRANT: for DBHIDS it holds service_type, whose '
  'every value discloses health status (SOP §0).';

comment on column public.services.is_walk_in is
  'False for programs delivered inside another institution (school-based, '
  'in-prison). These are real services but not places a member can go.';

-- Withhold the disclosing column. Postgres has no row-level answer for this —
-- a policy grants or denies whole rows — so the grant is per column, and it has
-- to be re-stated as an explicit column list.
revoke select on public.services from anon, authenticated;
grant select (
  id, org_id, name, category, subcategory,
  description_plain, eligibility_plain, how_to_enroll_plain,
  address, geo, place_id, phone, email, website, contact_name, hours,
  source, source_ref, provider_edited_fields, needs_review,
  last_verified_at, is_active, is_walk_in, created_at, updated_at
) on public.services to anon, authenticated;

-- Writes are unchanged: the provider and admin policies still govern them, and
-- a provider editing their own listing does not touch source_attributes.
grant insert, update, delete on public.services to authenticated;

-- ---------------------------------------------------------------------------
-- The ingest itself.
--
-- Takes GeoJSON rather than fetching, so it is a pure function: testable
-- offline against a fixture, and reusable by the Phase 1 Edge Function importer
-- which will do the fetching. §5.2 step 4 — never overwrite a provider's edits.
-- ---------------------------------------------------------------------------

create or replace function public.ingest_dbhids(p_geojson jsonb, p_region_id uuid)
returns table (inserted integer, updated integer, skipped integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  f jsonb;
  props jsonb;
  v_name text;
  v_address text;
  v_zip text;
  v_lon double precision;
  v_lat double precision;
  v_ref text;
  v_walk_in boolean;
  n_ins integer := 0;
  n_upd integer := 0;
  n_skip integer := 0;
  existed boolean;
begin
  for f in select jsonb_array_elements(p_geojson -> 'features')
  loop
    props := f -> 'properties';
    v_ref := 'dbhids:' || coalesce(props ->> 'objectid', '');
    v_name := btrim(coalesce(props ->> 'provider_name', ''));

    v_lon := nullif(props ->> 'program_longitude', '')::double precision;
    v_lat := nullif(props ->> 'program_latitude', '')::double precision;

    -- A place with no name or no location cannot be shown on a map or called,
    -- so it is not a place a member can be sent to. Skip rather than store a
    -- row that renders as an empty card.
    if v_name = '' or v_lon is null or v_lat is null then
      n_skip := n_skip + 1;
      continue;
    end if;

    -- "100 S BROAD ST PHILADELPHIA,19110" -> "100 S Broad St, Philadelphia, PA 19110"
    -- Shouting at someone is not plain language (§0); initcap is close enough
    -- for a street line and leaves the Google lookup unaffected.
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
      name, category, subcategory, address, geo,
      source, source_ref, needs_review, is_active, is_walk_in,
      source_attributes
    )
    values (
      initcap(v_name),
      'family_services',
      'health_counseling',
      v_address,
      extensions.st_setsrid(extensions.st_makepoint(v_lon, v_lat), 4326)::extensions.geography,
      'city_import',
      v_ref,
      -- §5.2 step 6: nothing reaches a member until the plain-language pass has
      -- run and a human has approved it.
      true,
      true,
      v_walk_in,
      props
    )
    on conflict (source, source_ref) where source_ref is not null
    do update set
      -- Never clobber a field a provider has edited (§5.2 step 4).
      name    = case when 'name' = any (s.provider_edited_fields)
                     then s.name else excluded.name end,
      address = case when 'address' = any (s.provider_edited_fields)
                     then s.address else excluded.address end,
      geo = excluded.geo,
      is_walk_in = excluded.is_walk_in,
      source_attributes = excluded.source_attributes,
      last_verified_at = now();

    if existed then n_upd := n_upd + 1; else n_ins := n_ins + 1; end if;
  end loop;

  return query select n_ins, n_upd, n_skip;
end;
$$;

comment on function public.ingest_dbhids is
  'Upserts DBHIDS GeoJSON into services. Pure: fetching is the caller''s job, '
  'so it can be tested offline. Never writes a disclosing field to a '
  'member-visible column.';

revoke all on function public.ingest_dbhids(jsonb, uuid) from public, anon, authenticated;

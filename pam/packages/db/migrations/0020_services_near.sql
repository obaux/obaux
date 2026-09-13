-- 0020 — Publish the imported places, and give the app one way to ask for them.
--
-- Two things stood between 525 imported providers and a member seeing any of
-- them, and only one of them was the missing query.
--
-- ## PAM was adding a condition label
--
-- The DBHIDS ingest (0016) wrote `subcategory = 'health_counseling'` on every
-- row. §0 draws the line precisely: a provider's own name is theirs and is
-- shown as it is (0017), but **PAM must never add a condition label of its own**.
-- `subcategory` is PAM's word, not the source's, and "Health and counseling" on
-- 525 rows is PAM saying out loud why someone is at a place.
--
-- The feed gives no honest basis for a subcategory anyway: `service_type` is the
-- only thing that would distinguish them, and that is the withheld column. So
-- imported rows carry no subcategory until a human or the §5.2 rewrite step has
-- a real one. `category = 'family_services'` stays — it is neutral, and it is
-- what colours the pin.
--
-- ## Nothing was left to review
--
-- `needs_review` exists for §5.2: an unmapped category, or a plain-language
-- rewrite a human has not approved, must not reach a member. Every imported row
-- was flagged, which is why the public catalogue policy hid all of them.
--
-- But these rows contain no PAM-authored prose at all — no description, no
-- eligibility, no enrolment steps. There is nothing in them awaiting approval
-- once the subcategory above is gone: a name, an address, a point on a map, and
-- a neutral category, all straight from the city. So the flag is cleared for
-- exactly those rows, and stays set the moment any PAM-written copy appears.
--
-- What a member gets is therefore thin and true: a real place, how far it is,
-- how to get there, and a link to its Google listing for hours. The description
-- arrives with the Phase 1 importer's rewrite step, and `needs_review` will be
-- doing its real job then.

-- The disclosing label, removed from the rows that already have it.
update public.services
set subcategory = null
where source = 'city_import'
  and subcategory = 'health_counseling';

-- And from every future import.
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

    -- subcategory is deliberately absent: see the header. needs_review is false
    -- because nothing PAM wrote is in the row; the trigger below re-raises it
    -- the moment any plain-language column is filled in.
    insert into public.services as s (
      name, lookup_name, category, address, geo,
      source, source_ref, needs_review, is_active, is_walk_in, source_attributes
    )
    values (
      initcap(v_name), v_name, 'family_services', v_address,
      extensions.st_setsrid(extensions.st_makepoint(v_lon, v_lat), 4326)::extensions.geography,
      'city_import', v_ref, false, true, v_walk_in, props
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

-- Unreviewed prose can never reach a member by accident. An import that starts
-- writing plain-language copy raises the flag without the caller remembering to,
-- and clearing it stays a deliberate act — an admin approving the words.
create or replace function public.flag_unapproved_rewrite()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if tg_op = 'INSERT' then
    if new.description_plain is not null
       or new.eligibility_plain is not null
       or new.how_to_enroll_plain is not null then
      new.needs_review := true;
    end if;
  elsif new.description_plain is distinct from old.description_plain
     or new.eligibility_plain is distinct from old.eligibility_plain
     or new.how_to_enroll_plain is distinct from old.how_to_enroll_plain then
    new.needs_review := true;
  end if;
  return new;
end;
$$;

create trigger services_flag_unapproved_rewrite
  before insert or update of description_plain, eligibility_plain, how_to_enroll_plain
  on public.services
  for each row execute function public.flag_unapproved_rewrite();

-- Publish the rows that have nothing left to review.
update public.services
set needs_review = false
where source = 'city_import'
  and needs_review
  and name is not null
  and geo is not null
  and description_plain is null
  and eligibility_plain is null
  and how_to_enroll_plain is null;

-- ---------------------------------------------------------------------------
-- The one query the places screen makes.
--
-- `security invoker`, so RLS decides what comes back: a signed-out member sees
-- the published catalogue and nothing else, by the same policy that was
-- penetration-tested. Nothing here can widen that.
--
-- It exists rather than a PostgREST filter because distance is the whole point
-- and `geo` is a geography column — a browser cannot sort by proximity without
-- either PostGIS or downloading the table. `p_limit` is clamped so this is not
-- a bulk export either.
create or replace function public.services_near(
  p_lat        double precision,
  p_lon        double precision,
  p_category   public.service_category default null,
  p_limit      integer default 20,
  p_max_meters double precision default 16093.4  -- 10 miles
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
    extensions.st_distance(s.geo, origin.g),
    -- The hours themselves are not returned: nothing in the app may claim a
    -- place is open (D-044). This says only whether such a claim is possible
    -- yet, so a screen can show the Google fallback without guessing.
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
  'Nearest walk-in services to a point, RLS-filtered. Returns distance in '
  'metres; the caller formats it (see distanceLabel in @pam/config).';

revoke all on function public.services_near(
  double precision, double precision, public.service_category, integer, double precision
) from public;
grant execute on function public.services_near(
  double precision, double precision, public.service_category, integer, double precision
) to anon, authenticated;

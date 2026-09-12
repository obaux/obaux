-- 0025 — OIC Philadelphia. The Work and money category, and the first opening
-- hours in the catalogue.
--
-- Will named the source: https://oicphila.org/programs/. It is not a feed —
-- it is one nonprofit's website — so this is a curated entry rather than an
-- importer, and it is marked `source = 'manual'` accordingly. Every fact below
-- was read off the organisation's own pages, including the schema.org
-- `LocalBusiness` block on /programs/, which is where the phone number and the
-- opening hours come from.
--
-- OIC Philadelphia matters to this product more than its size suggests. It is a
-- 501(c)(3) at 1231 N Broad St running free job training, and it publishes a
-- reentry support programme — which is to say it is already doing, in one
-- building, the thing PAM exists to connect people to.
--
-- ## Why one row per programme
--
-- Six rows at one address looks like duplication and is not. A member scanning
-- "Work and money" is choosing between culinary and IT, not between buildings,
-- and the card shows a name — so a single "OIC Philadelphia" row would hide
-- everything that helps somebody choose. The dedupe rule added in 0023 keys on
-- name *and* point, so these coexist with it correctly.
--
-- ## Why subcategories are set here, when 0022 refused them
--
-- D-045 forbids PAM *inventing* a label an import cannot support. This is the
-- opposite case: the organisation names its own programmes, and `job_training`
-- is what they are. Nothing here is inferred from a withheld column.
--
-- ## Hours
--
-- First real hours in the database. The shape is recorded here because nothing
-- else has set one yet:
--
--   {"tz": "America/New_York",
--    "weekly": {"mon": [["08:00","16:00"]], ..., "sat": [], "sun": []}}
--
-- A day with an empty array is closed. A list of ranges allows a lunch break
-- without a second schema. This still does NOT license an "Open now" chip
-- anywhere (D-044): evaluating it needs the member's timezone and a holiday
-- calendar, and being wrong sends somebody to a locked door. `has_hours` simply
-- becomes true, which is what a future screen will need.

do $$
declare
  v_region uuid := '0195b1c0-0000-4000-8000-000000000001';
  v_org    uuid;
  v_geo    extensions.geography :=
    extensions.st_setsrid(extensions.st_makepoint(-75.15863286125503, 39.97290649123497), 4326)::extensions.geography;
  v_addr   text := '1231 N Broad St, Philadelphia, PA 19122';
  v_phone  text := '+12152367700';
  v_hours  jsonb := jsonb_build_object(
    'tz', 'America/New_York',
    'weekly', jsonb_build_object(
      'mon', jsonb_build_array(jsonb_build_array('08:00','16:00')),
      'tue', jsonb_build_array(jsonb_build_array('08:00','16:00')),
      'wed', jsonb_build_array(jsonb_build_array('08:00','16:00')),
      'thu', jsonb_build_array(jsonb_build_array('08:00','16:00')),
      'fri', jsonb_build_array(jsonb_build_array('08:00','16:00')),
      'sat', jsonb_build_array(),
      'sun', jsonb_build_array()
    )
  );
begin
  select id into v_org from public.orgs where name = 'OIC Philadelphia';

  if v_org is null then
    insert into public.orgs (name, type, address, geo, phone, website, verified, region_id)
    values ('OIC Philadelphia', 'nonprofit', v_addr, v_geo, v_phone, 'https://oicphila.org/', false, v_region)
    returning id into v_org;
  else
    update public.orgs
    set address = v_addr, geo = v_geo, phone = v_phone,
        website = 'https://oicphila.org/', region_id = v_region
    where id = v_org;
  end if;

  -- `verified` stays false: §6.4 says an org badge is shown only once a human
  -- has verified it, and reading a website is not verification. The places
  -- still list; only the mentor badge waits.

  insert into public.services as s (
    org_id, name, lookup_name, category, subcategory,
    address, geo, phone, website, hours,
    source, source_ref, needs_review, is_active, is_walk_in
  )
  select
    v_org, p.name, 'OIC Philadelphia', 'workforce'::public.service_category, p.subcategory,
    v_addr, v_geo, v_phone, p.website, v_hours,
    'manual'::public.service_source, p.ref, false, true, true
  from (values
    ('oic:information-technology', 'OIC Information Technology Training',
     'job_training', 'https://oicphila.org/programs/information-technology/'),
    ('oic:culinary-arts', 'OIC Culinary Arts Training',
     'job_training', 'https://oicphila.org/programs/culinary-arts/'),
    ('oic:digital-media', 'OIC Digital Media and Audio Engineering Training',
     'job_training', 'https://oicphila.org/programs/digital/'),
    ('oic:insurance', 'OIC Insurance Agent Training',
     'job_training', 'https://oicphila.org/programs/insurance/'),
    ('oic:healthcare', 'OIC Healthcare Training',
     'job_training', 'https://oicphila.org/programs/'),
    ('oic:reentry', 'OIC Reentry Support Services',
     'benefits_income', 'https://oicphila.org/services/reentry/')
  ) as p(ref, name, subcategory, website)
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = case when 'name' = any (s.provider_edited_fields) then s.name else excluded.name end,
    org_id = excluded.org_id,
    category = excluded.category,
    subcategory = excluded.subcategory,
    address = excluded.address,
    geo = excluded.geo,
    phone = excluded.phone,
    website = excluded.website,
    hours = excluded.hours,
    last_verified_at = now();
end;
$$;

-- "OIC Reentry Support Services" carries the organisation's own name for its
-- programme, which the 0017 trigger flags as disclosing. That is exactly right
-- and nothing here overrides it: the name is shown, because a member has to be
-- able to ask for the right programme at the desk, and it never goes into an
-- SMS or a push notification (§9).

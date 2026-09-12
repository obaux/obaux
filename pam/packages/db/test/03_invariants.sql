-- Structural invariants that a policy set alone cannot guarantee.

\set ON_ERROR_STOP on
set client_min_messages to notice;

-- ===========================================================================
\echo ''
\echo '--- Every table has RLS enabled and forced (§4 "default deny") ---'
-- ===========================================================================
do $$
declare
  gap text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into gap
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not (c.relrowsecurity and c.relforcerowsecurity);

  if gap is not null then
    raise exception 'FAIL  these public tables lack forced RLS: %', gap;
  end if;
  raise notice 'ok    all public tables have RLS enabled and forced';
end;
$$;

-- A table with RLS on and no policy denies everything, which is safe but is
-- almost always an oversight. geocode_cache is the one intentional case: it is
-- operational data no client should ever read.
do $$
declare
  silent text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into silent
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
    and not exists (select 1 from pg_policy p where p.polrelid = c.oid);

  if silent is not null then
    raise exception 'FAIL  RLS on but no policy (unreachable table): %', silent;
  end if;
  raise notice 'ok    every table with RLS has at least one policy';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- messages has no admin policy, by design (§4.1) ---'
-- ===========================================================================
do $$
declare
  n integer;
begin
  -- If someone later adds a policy to `messages` mentioning admin_covers or
  -- is_admin, the transparency contract in packages/config is a lie. Fail loudly.
  select count(*) into n
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  where c.relname = 'messages'
    and pg_get_expr(p.polqual, p.polrelid) ilike any (array['%is_admin%', '%admin_covers%']);

  if n > 0 then
    raise exception
      'FAIL  messages gained an admin-readable policy. §4.1 promises members '
      'that admins never read message bodies — update transparency.ts and tell '
      'members before allowing this.';
  end if;
  raise notice 'ok    messages has no admin-readable policy';
end;
$$;

do $$
declare
  n integer;
begin
  select count(*) into n
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  where c.relname = 'activities'
    and pg_get_expr(p.polqual, p.polrelid) ilike any (array['%is_admin%', '%admin_covers%']);

  if n > 0 then
    raise exception 'FAIL  activities gained an admin policy; §4.1 says admins '
      'do not see buddy feed posts.';
  end if;
  raise notice 'ok    activities has no admin-readable policy';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- points_ledger and audit_log are append-only, even for service_role ---'
-- ===========================================================================
-- service_role has BYPASSRLS, so policies do not stop it. The triggers do.
-- This is the test that matters: Edge Functions run with this key.
set role service_role;

do $$
begin
  begin
    update public.points_ledger set delta = 9999
    where id = '99999999-0000-0000-0000-000000000001';
    raise exception 'FAIL  service_role was able to UPDATE points_ledger';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    service_role cannot UPDATE points_ledger (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    delete from public.points_ledger where id = '99999999-0000-0000-0000-000000000001';
    raise exception 'FAIL  service_role was able to DELETE from points_ledger';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    service_role cannot DELETE from points_ledger (%)', left(sqlerrm, 48);
  end;
end;
$$;

reset role;

insert into public.audit_log (actor_id, action, target_type, target_id)
values ('33333333-0000-0000-0000-00000000000a', 'test.write', 'profile',
        '33333333-0000-0000-0000-00000000000c');

set role service_role;
do $$
begin
  begin
    update public.audit_log set action = 'tampered' where action = 'test.write';
    raise exception 'FAIL  service_role was able to rewrite audit_log';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    service_role cannot rewrite audit_log (%)', left(sqlerrm, 48);
  end;
end;
$$;
reset role;

-- ===========================================================================
\echo ''
\echo '--- Data integrity constraints hold ---'
-- ===========================================================================
do $$
begin
  begin
    insert into public.services (name, category, subcategory)
    values ('Mismatched', 'education', 'housing');
    raise exception 'FAIL  a subcategory from another category was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    subcategory must belong to its category (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    update public.profiles set phone = '5551234'
    where id = '33333333-0000-0000-0000-00000000000c';
    raise exception 'FAIL  a non-E.164 phone number was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    phone numbers must be E.164 (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    insert into public.appointments (member_id, starts_at, status)
    values ('33333333-0000-0000-0000-00000000000c', now(), 'attended');
    raise exception 'FAIL  an attended appointment was stored with no method';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    attended appointments must record how (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    insert into public.access_controls (subject_id, feature, allowed, set_by, reason)
    values ('33333333-0000-0000-0000-00000000000c', 'chat', false,
            '33333333-0000-0000-0000-00000000000a', '   ');
    raise exception 'FAIL  an access change with a blank reason was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    access changes require a reason (%)', left(sqlerrm, 48);
  end;
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Invite codes avoid ambiguous characters (§4.1) ---'
-- ===========================================================================
do $$
declare
  code text;
  i integer;
begin
  for i in 1..200 loop
    code := public.generate_invite_code();
    if length(code) <> 8 then
      raise exception 'FAIL  invite code % is not 8 characters', code;
    end if;
    -- 0/O, 1/I/L, 2/Z, 5/S, 8/B must never appear: these codes get read aloud.
    if code ~ '[OIL0125SBZ]' then
      raise exception 'FAIL  invite code % contains an ambiguous character', code;
    end if;
  end loop;
  raise notice 'ok    200 invite codes are 8 chars with no ambiguous glyphs';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- DBHIDS ingest never discloses why someone attends (§0) ---'
-- ===========================================================================
-- A fixture shaped exactly like the live feed, including the two rows that must
-- not become member-facing places.
select public.ingest_dbhids('{
  "features": [
    {"properties": {"objectid": 1, "provider_name": "COMHAR",
      "program_address": "100 W LEHIGH AVE PHILADELPHIA,19133",
      "program_latitude": 39.99, "program_longitude": -75.13,
      "service_type": "Substance Use Disorder (SUD)", "school_based": "No"}},
    {"properties": {"objectid": 2, "provider_name": "SOME SCHOOL PROGRAM",
      "program_address": "1 SCHOOL LN PHILADELPHIA,19104",
      "program_latitude": 39.95, "program_longitude": -75.19,
      "service_type": "Student Assistance Program (SAP)", "school_based": "Yes"}},
    {"properties": {"objectid": 3, "provider_name": "",
      "program_address": "NOWHERE", "service_type": "Mental Health (MH)"}},
    {"properties": {"objectid": 4, "provider_name": "MENTAL HEALTH PARTNERSHIPS",
      "program_address": "1 MAIN ST PHILADELPHIA,19104",
      "program_latitude": 39.96, "program_longitude": -75.17,
      "service_type": "Mental Health (MH)", "school_based": "No"}}
  ]
}'::jsonb, '11111111-0000-0000-0000-000000000001');

do $$
declare
  n integer;
  v text;
begin
  select count(*) into n from public.services where source_ref like 'dbhids:%';
  if n <> 3 then
    raise exception 'FAIL  expected 3 ingested rows (the nameless one skipped), got %', n;
  end if;
  raise notice 'ok    ingest skips a row with no name or location';

  select name into v from public.services where source_ref = 'dbhids:1';
  if v <> 'Comhar' then raise exception 'FAIL  name not normalised, got %', v; end if;
  raise notice 'ok    provider name is normalised out of shouting caps';

  -- The lookup keeps the organisation's own spelling: initcap turns the
  -- acronym APM into "Apm", which is a worse query and not what is on the sign.
  select lookup_name into v from public.services where source_ref = 'dbhids:1';
  if v <> 'COMHAR' then
    raise exception 'FAIL  lookup_name lost the original spelling, got %', v;
  end if;
  raise notice 'ok    the Google lookup keeps the organisation''s own spelling';

  select address into v from public.services where source_ref = 'dbhids:1';
  if v <> '100 W Lehigh Ave Philadelphia, PA 19133' then
    raise exception 'FAIL  address not parsed, got %', v;
  end if;
  raise notice 'ok    address is parsed and given its state and zip';

  if (select is_walk_in from public.services where source_ref = 'dbhids:2') then
    raise exception 'FAIL  a school-based program was marked walk-in';
  end if;
  raise notice 'ok    a school-based program is not a place a member can go';

  -- The disclosing value must exist for matching, and must not be in any
  -- member-visible column.
  select source_attributes ->> 'service_type' into v
  from public.services where source_ref = 'dbhids:1';
  if v <> 'Substance Use Disorder (SUD)' then
    raise exception 'FAIL  service_type was not retained for matching';
  end if;
  raise notice 'ok    service_type is retained in the withheld column';

  -- PAM's OWN words must never name a condition. A provider's legal name is a
  -- different matter — see 0017: renaming "Mental Health Partnerships" would
  -- stop a member finding the door, which is worse than the disclosure.
  select count(*) into n from public.services
  where source_ref like 'dbhids:%'
    and (coalesce(description_plain,'') || coalesce(subcategory,'')
         || coalesce(eligibility_plain,'') || coalesce(how_to_enroll_plain,''))
        ~* 'substance|mental health|gambling|behavioral|addiction|disorder';
  if n > 0 then
    raise exception 'FAIL  % row(s) put a condition into a field PAM wrote', n;
  end if;
  raise notice 'ok    no field PAM writes names a condition';

  -- A disclosing provider name must be flagged, so the reminder dispatcher can
  -- keep it off a lock screen (§9).
  if not (select name_may_disclose from public.services
          where name = 'Mental Health Partnerships' limit 1) then
    raise exception 'FAIL  a disclosing provider name was not flagged';
  end if;
  if (select name_may_disclose from public.services where source_ref = 'dbhids:1') then
    raise exception 'FAIL  a neutral provider name was flagged as disclosing';
  end if;
  raise notice 'ok    disclosing provider names are flagged, neutral ones are not';

  -- An import has no honest basis for a subcategory: the only source field that
  -- would distinguish these is `service_type`, which is withheld precisely
  -- because every value of it discloses. PAM naming one anyway would be PAM
  -- adding a condition label, which §0 forbids (0020).
  select count(*) into n from public.services
  where source = 'city_import' and subcategory is not null;
  if n > 0 then
    raise exception 'FAIL  % imported row(s) carry a subcategory PAM invented', n;
  end if;
  raise notice 'ok    an import adds no condition label of its own';

  -- The review queue guards PAM's words, not the city's facts. A row with a
  -- name, an address and a point, and no PAM-authored prose in it, has nothing
  -- awaiting approval and is publishable.
  select count(*) into n from public.services
  where source_ref like 'dbhids:%'
    and needs_review
    and description_plain is null
    and eligibility_plain is null
    and how_to_enroll_plain is null;
  if n > 0 then
    raise exception 'FAIL  % imported row(s) held for review with nothing to review', n;
  end if;
  raise notice 'ok    imported places with no PAM copy in them reach members';
end;
$$;

-- Writing plain-language copy puts a row back in the queue, whoever writes it
-- and whether or not they remember to. This is what keeps an unreviewed rewrite
-- (§5.2 step 6) off a member's screen once the importer starts producing them.
do $$
declare
  v_id uuid;
  v_flag boolean;
begin
  select id into v_id from public.services where source_ref like 'dbhids:%' and not needs_review limit 1;
  if v_id is null then
    raise exception 'FAIL  no published imported row to test the review trigger against';
  end if;

  update public.services set description_plain = 'A place that can help.' where id = v_id;
  select needs_review into v_flag from public.services where id = v_id;
  if not v_flag then
    raise exception 'FAIL  a new plain-language rewrite did not return the row to review';
  end if;

  update public.services set description_plain = null, needs_review = false where id = v_id;
  raise notice 'ok    new plain-language copy returns a row to the review queue';
end;
$$;

-- The column-level grant is the actual enforcement. Assert it directly.
do $$
begin
  if has_column_privilege('anon', 'public.services', 'source_attributes', 'select') then
    raise exception 'FAIL  anon can read services.source_attributes';
  end if;
  if has_column_privilege('authenticated', 'public.services', 'source_attributes', 'select') then
    raise exception 'FAIL  authenticated can read services.source_attributes';
  end if;
  if not has_column_privilege('authenticated', 'public.services', 'name', 'select') then
    raise exception 'FAIL  authenticated lost access to services.name';
  end if;
  raise notice 'ok    source_attributes is withheld from both client roles by GRANT';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- google_place_url matches googlePlaceHref byte for byte (0018) ---'
-- ===========================================================================
-- Two implementations of one string is how they drift. The expected values
-- below were produced by Node's encodeURIComponent via the @pam/ui helper; if
-- either side changes, this fails.
do $$
declare
  got text;
begin
  got := public.google_place_url('Mental Health Partnerships', '1 Main St, PA 19104');
  if got <> 'https://www.google.com/maps/search/?api=1&query=Mental%20Health%20Partnerships%2C%201%20Main%20St%2C%20PA%2019104' then
    raise exception 'FAIL  plain name+address mismatch: %', got;
  end if;
  raise notice 'ok    name and address encode identically to the UI helper';

  got := public.google_place_url('Comhar', '1 Main St', 'ChIJabc123');
  if got !~ 'query_place_id=ChIJabc123$' then
    raise exception 'FAIL  place_id not appended: %', got;
  end if;
  raise notice 'ok    a resolved place_id anchors the lookup';

  got := public.google_place_url('Nombre Español & Co', 'Calle Ñ 1');
  -- encodeURIComponent('Nombre Español & Co, Calle Ñ 1')
  if got <> 'https://www.google.com/maps/search/?api=1&query=Nombre%20Espa%C3%B1ol%20%26%20Co%2C%20Calle%20%C3%91%201' then
    raise exception 'FAIL  multi-byte or reserved characters mismatch: %', got;
  end if;
  raise notice 'ok    accents and ampersands encode as UTF-8 bytes, like the UI';

  if public.google_place_url('') is not null or public.google_place_url('   ') is not null then
    raise exception 'FAIL  a nameless place produced a URL';
  end if;
  raise notice 'ok    a place with no name produces no link';

  got := public.google_place_url('Comhar');
  if got <> 'https://www.google.com/maps/search/?api=1&query=Comhar' then
    raise exception 'FAIL  name-only mismatch: %', got;
  end if;
  raise notice 'ok    a place with no address still links by name';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- City facilities: the allow-list is the filter (0022, 0023) ---'
-- ===========================================================================
-- The live layer is 3,197 assets and almost none are services. The fixture
-- carries one of each thing that must NOT become a place, alongside the two
-- that must.
select public.ingest_city_facilities('{
  "features": [
    {"geometry": {"coordinates": [-75.15526, 39.93710]},
     "properties": {"objectid": 101, "asset_name": "Library Branch - Santore",
       "site_name": "Library Branch - Santore", "asset_addr": "932 S 7TH ST",
       "asset_subt1_desc": "Library Branch", "not_public": "N", "status": "A"}},
    {"geometry": {"coordinates": [-75.16260, 39.94624]},
     "properties": {"objectid": 102, "asset_name": "Older Adult Center - Juniata Park",
       "site_name": "Juniata Park Older Adult Center", "asset_addr": "1231 E SEDGLEY AVE",
       "asset_subt1_desc": "Older Adult Center", "not_public": "N", "status": "A"}},
    {"geometry": {"coordinates": [-75.16260, 39.94624]},
     "properties": {"objectid": 103, "asset_name": "Older Adult Center - Juniata Park",
       "site_name": "Juniata Park Older Adult Center", "asset_addr": "1231 E SEDGLEY AVE",
       "asset_subt1_desc": "Older Adult Center", "not_public": "N", "status": "A"}},
    {"geometry": {"coordinates": [-75.17500, 39.94738]},
     "properties": {"objectid": 104, "asset_name": "The Rosenbach Museum & Library",
       "asset_addr": "3001 E ALLEGHENY AVE",
       "asset_subt1_desc": "Library Specialized", "not_public": "N", "status": "A"}},
    {"geometry": {"coordinates": [-75.13000, 39.99000]},
     "properties": {"objectid": 105, "asset_name": "Curran-Fromhold Correctional Facility",
       "asset_addr": "7901 STATE RD",
       "asset_subt1_desc": "Detention Center Adult", "not_public": "N", "status": "A"}},
    {"geometry": {"coordinates": [-75.14000, 39.95000]},
     "properties": {"objectid": 106, "asset_name": "Basketball Court",
       "asset_subt1_desc": "Basketball Court", "not_public": "N", "status": "A"}},
    {"geometry": {"coordinates": [-75.14500, 39.95500]},
     "properties": {"objectid": 107, "asset_name": "Staff Only Building",
       "asset_subt1_desc": "Health Center", "not_public": "Y", "status": "A"}},
    {"geometry": {"coordinates": [-75.14600, 39.95600]},
     "properties": {"objectid": 108, "asset_name": "Closed Health Center",
       "asset_subt1_desc": "Health Center", "not_public": "N", "status": "X"}}
  ]
}'::jsonb, '11111111-0000-0000-0000-000000000001');

do $$
declare
  n integer;
  v text;
begin
  -- A system built for people leaving prison must never send one back to one.
  if exists (select 1 from public.services where source_ref = 'cityfac:105') then
    raise exception 'FAIL  a detention centre was imported as a service';
  end if;
  raise notice 'ok    carceral facilities are never services';

  if exists (select 1 from public.services where source_ref = 'cityfac:106') then
    raise exception 'FAIL  a basketball court was imported as a service';
  end if;
  raise notice 'ok    a facility type absent from the allow-list is not imported';

  if exists (select 1 from public.services where source_ref in ('cityfac:107','cityfac:108')) then
    raise exception 'FAIL  a non-public or retired facility was imported';
  end if;
  raise notice 'ok    facilities the public cannot enter are skipped';

  -- A museum charges admission. The city files one under Library Specialized.
  if exists (select 1 from public.services where source_ref = 'cityfac:104') then
    raise exception 'FAIL  a museum was imported as a library';
  end if;
  raise notice 'ok    a museum is not a library';

  -- 0024: only libraries. Rec centres and older adult centres were crowding out
  -- food, housing and ID help in a category that has none of them yet.
  if exists (select 1 from public.services where source_ref in ('cityfac:102','cityfac:103')) then
    raise exception 'FAIL  a non-library facility was imported';
  end if;
  raise notice 'ok    only libraries come from the city facilities layer';

  select count(*) into n from public.services where source_ref like 'cityfac:%';
  if n <> 1 then
    raise exception 'FAIL  expected 1 imported facility, got %', n;
  end if;
  raise notice 'ok    the same building at the same point is imported once';

  select name into v from public.services where source_ref = 'cityfac:101';
  if v <> 'Santore Library' then
    raise exception 'FAIL  library name not said the way a person says it, got %', v;
  end if;
  select category::text into v from public.services where source_ref = 'cityfac:101';
  if v <> 'education' then
    raise exception 'FAIL  a library did not land in education, got %', v;
  end if;
  raise notice 'ok    a library is a School and training place, named plainly';


  -- D-045 again, for the second source.
  select count(*) into n from public.services
  where source_ref like 'cityfac:%' and subcategory is not null;
  if n > 0 then
    raise exception 'FAIL  % facility row(s) carry a subcategory PAM invented', n;
  end if;
  raise notice 'ok    the facilities import adds no condition label either';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- OIC Philadelphia, the Work and money category (0025) ---'
-- ===========================================================================
do $$
declare
  n integer;
  v text;
  h jsonb;
begin
  select count(*) into n from public.services where category = 'workforce';
  if n = 0 then
    raise exception 'FAIL  the Work and money category is empty';
  end if;
  raise notice 'ok    Work and money has places in it';

  -- The first real opening hours in the catalogue. The shape is a contract:
  -- a screen that reads it wrongly would claim a place is open when it is shut.
  select hours into h from public.services where source_ref = 'oic:culinary-arts';
  if h is null or h ->> 'tz' is null or h -> 'weekly' -> 'mon' is null then
    raise exception 'FAIL  hours are missing or not in the documented shape';
  end if;
  if jsonb_array_length(h -> 'weekly' -> 'sun') <> 0 then
    raise exception 'FAIL  a closed day should be an empty array';
  end if;
  raise notice 'ok    opening hours are stored in the documented shape';

  -- §9: the organisation's own programme name discloses, so it must be flagged
  -- out of SMS — and must still be shown, because a member has to be able to
  -- ask for it by name at the desk.
  if not (select name_may_disclose from public.services where source_ref = 'oic:reentry') then
    raise exception 'FAIL  a disclosing programme name was not flagged';
  end if;
  if not (select is_active from public.services where source_ref = 'oic:reentry') then
    raise exception 'FAIL  a disclosing programme name was hidden rather than flagged';
  end if;
  raise notice 'ok    a disclosing programme name is flagged, not hidden';

  -- A curated entry is not an import, and must not claim to be one.
  select source::text into v from public.services where source_ref = 'oic:reentry';
  if v <> 'manual' then
    raise exception 'FAIL  a hand-curated entry claims to be an import, got %', v;
  end if;
  raise notice 'ok    a hand-curated entry is recorded as manual';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Areas: somewhere to start from (0026) ---'
-- ===========================================================================
do $$
declare
  n integer;
begin
  select count(*) into n from public.areas where kind = 'zip';
  if n < 40 then
    raise exception 'FAIL  expected the city''s ZIP codes, got %', n;
  end if;
  raise notice 'ok    the ZIP codes a member can choose from are seeded';

  -- An empty query has to return something: somebody who does not know what to
  -- type must still be offered somewhere to start (§0, never dead-end).
  select count(*) into n from public.search_areas('', 8);
  if n = 0 then
    raise exception 'FAIL  an empty query offered nothing';
  end if;
  raise notice 'ok    an empty query still offers somewhere to start';

  select count(*) into n from public.search_areas('19104', 8);
  if n = 0 then
    raise exception 'FAIL  a real ZIP code found nothing';
  end if;
  raise notice 'ok    a ZIP code a member types resolves';

  -- The table is public reference data and must never accumulate anything
  -- about who looked at what.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'areas'
      and column_name in ('profile_id', 'member_id', 'user_id', 'searched_by')
  ) then
    raise exception 'FAIL  areas has grown a column that identifies a person';
  end if;
  raise notice 'ok    areas holds no record of who chose what';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Parks & Recreation sites, and the address they borrow (0027) ---'
-- ===========================================================================
-- Two program sites, and two properties: one whose name matches, and one that
-- is merely nearby with a different name. The second must not lend its address.
select public.ingest_ppr_sites(
  '{"features": [
    {"geometry": {"coordinates": [-75.1725, 40.0310]},
     "properties": {"objectid": 901, "park_name": "Joseph F Vogt Playground",
       "program_type": "PPR_REC"}},
    {"geometry": {"coordinates": [-75.1400, 39.9500]},
     "properties": {"objectid": 902, "park_name": "Wissinoming Park",
       "program_type": "PPR_REC"}},
    {"geometry": {"coordinates": [-75.1500, 39.9600]},
     "properties": {"objectid": 903, "park_name": "Seasonal Pool",
       "program_type": "POOL"}}
  ]}'::jsonb,
  '{"features": [
    {"attributes": {"official_name": "Joseph F. Vogt Playground",
      "address_911": "4351 UNRUH AVE", "zip_code": "19135"},
     "centroid": {"x": -8368164.4, "y": 4870448.1}},
    {"attributes": {"official_name": "Margaret Tartaglione Park",
      "address_911": "5801 FRANKFORD AVE", "zip_code": "19135"},
     "centroid": {"x": -8364413.0, "y": 4858679.1}}
  ]}'::jsonb,
  '11111111-0000-0000-0000-000000000001');

do $$
declare v text; n integer;
begin
  if exists (select 1 from public.services where source_ref = 'pprsite:903') then
    raise exception 'FAIL  a seasonal pool was imported as a service';
  end if;
  raise notice 'ok    a program type absent from the allow-list is not imported';

  -- Punctuation differs, so this only matches once names are normalised.
  select address into v from public.services where source_ref = 'pprsite:901';
  if v is null or v not like '4351 Unruh Ave%' then
    raise exception 'FAIL  a name-matched property did not lend its address, got %', v;
  end if;
  raise notice 'ok    a site takes the address of the property it shares a name with';

  -- The nearby property has a different name and is too far to trust. An
  -- address on a card is something a person acts on, so no address is correct.
  select address into v from public.services where source_ref = 'pprsite:902';
  if v is not null then
    raise exception 'FAIL  a site borrowed the address of a different park, got %', v;
  end if;
  raise notice 'ok    a site does not borrow the address of the park next door';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Words that give somebody away (0028, 0029) ---'
-- ===========================================================================
do $$
declare n integer;
begin
  -- A notification naming a domestic violence service can reach the person
  -- somebody is getting away from. This is a safety rule, not a privacy one.
  if not public.name_discloses_condition('Get help with domestic violence') then
    raise exception 'FAIL  a domestic violence service was not flagged';
  end if;
  if not public.name_discloses_condition('Support for incarcerated parents') then
    raise exception 'FAIL  an incarceration service was not flagged';
  end if;
  if not public.name_discloses_condition('Juvenile Justice Center') then
    raise exception 'FAIL  a juvenile justice site was not flagged';
  end if;
  raise notice 'ok    incarceration, juvenile and domestic violence names are flagged';

  -- Broad, but not so broad that ordinary places get caught.
  if public.name_discloses_condition('Santore Library')
     or public.name_discloses_condition('Awbury Park and Recreation Center') then
    raise exception 'FAIL  a neutral place was flagged as disclosing';
  end if;
  raise notice 'ok    ordinary places are not flagged';

  select count(*) into n from public.services where source_ref like 'cerc:%';
  if n <> 6 then
    raise exception 'FAIL  expected 6 evening resource centres, got %', n;
  end if;
  if not (select bool_and(name_may_disclose) from public.services
          where source_ref in ('cerc:northwest','cerc:central')) then
    raise exception 'FAIL  a centre hosted at a justice site was not flagged';
  end if;
  if not (select bool_and(is_active) from public.services where source_ref like 'cerc:%') then
    raise exception 'FAIL  a flagged centre was hidden rather than flagged';
  end if;
  raise notice 'ok    the evening centres are listed, and the disclosing ones are flagged';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Messages cannot be switched off for anyone (0031) ---'
-- ===========================================================================
do $$
declare
  v_admin uuid := '33333333-0000-0000-0000-00000000000a';
  v_member uuid := '33333333-0000-0000-0000-00000000000c';
  ok boolean := false;
begin
  -- Every other switch degrades an experience. This one isolates somebody from
  -- the people the product exists to connect them to, and the person holding
  -- the switch is the one with power over them.
  begin
    insert into public.access_controls (subject_id, feature, allowed, set_by, reason)
    values (v_member, 'chat', false, v_admin, 'test');
  exception when others then
    ok := true;
  end;

  if not ok then
    raise exception 'FAIL  messaging was switched off for a member';
  end if;
  raise notice 'ok    messaging cannot be switched off, not even by the service role';

  -- The rest of the switches still work, or the feature is useless.
  insert into public.access_controls (subject_id, feature, allowed, set_by, reason)
  values (v_member, 'map', false, v_admin, 'test')
  on conflict (subject_id, feature) do update set allowed = false;
  raise notice 'ok    the other switches still work';

  delete from public.access_controls where subject_id = v_member and feature = 'map';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- A flagged place disappears until somebody decides (0032, 0033) ---'
-- ===========================================================================
do $$
declare
  v_member uuid := '33333333-0000-0000-0000-00000000000c';
  v_admin  uuid := '33333333-0000-0000-0000-00000000000a';
  v_service uuid := '44444444-0000-0000-0000-000000000001';
  v_flag uuid;
  n integer;
  ok boolean := false;
begin
  -- The person who finds out a place has closed is whoever walked there, so
  -- anyone signed in can say so.
  perform set_config('request.jwt.claim.sub', v_member::text, true);
  v_flag := (public.flag_service(v_service, 'Door was locked, sign says moved')).id;

  if (select is_active from public.services where id = v_service) then
    raise exception 'FAIL  a flagged place stayed in the catalogue';
  end if;
  raise notice 'ok    a flag hides the place at once, before anybody reviews it';

  -- Hiding immediately is the whole point: a live place hidden for a week
  -- costs one wasted search; a closed place left up costs somebody a bus fare
  -- and an afternoon.
  select count(*) into n from public.service_flags where id = v_flag and status = 'pending';
  if n <> 1 then raise exception 'FAIL  the flag was not recorded as pending'; end if;

  -- A case manager is not the decider.
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  begin
    perform public.resolve_service_flag(v_flag, 'remove');
  exception when others then
    ok := true;
  end;
  if not ok then
    raise exception 'FAIL  a case manager decided the fate of a flagged place';
  end if;
  raise notice 'ok    only a super admin decides';

  -- Promote, decide to keep, and the place comes back.
  update public.profiles set role = 'super_admin' where id = v_admin;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform public.resolve_service_flag(v_flag, 'keep', 'Phoned them, still open');

  if not (select is_active from public.services where id = v_service) then
    raise exception 'FAIL  keeping a place did not put it back';
  end if;
  raise notice 'ok    keep puts the place back in the catalogue';

  -- And removing takes it out for good.
  v_flag := (public.flag_service(v_service, 'Confirmed closed')).id;
  perform public.resolve_service_flag(v_flag, 'remove', 'Confirmed with the city');

  if (select removed_at from public.services where id = v_service) is null then
    raise exception 'FAIL  removing a place did not mark it removed';
  end if;
  if (select is_active from public.services where id = v_service) then
    raise exception 'FAIL  a removed place is still in the catalogue';
  end if;
  raise notice 'ok    remove takes the place out, and says when';

  -- A super admin is still a case manager: every policy written against
  -- is_admin() must keep meaning what it meant.
  if not public.is_admin() then
    raise exception 'FAIL  a super admin lost their case manager powers';
  end if;
  raise notice 'ok    a super admin is a case manager with more, not a different role';

  update public.profiles set role = 'admin' where id = v_admin;
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- An import cannot resurrect a removed place (0032) ---'
-- ===========================================================================
-- This is why "remove" is a column and not a DELETE. A deleted row comes back
-- on the next import run and the super admin's decision is silently undone.
do $$
declare
  v_ref text;
  v_id uuid;
begin
  select source_ref, id into v_ref, v_id
  from public.services where source_ref like 'cityfac:%' limit 1;

  update public.services set is_active = false, removed_at = now() where id = v_id;

  perform public.ingest_city_facilities(
    format('{"features": [
      {"geometry": {"coordinates": [-75.15526, 39.93710]},
       "properties": {"objectid": %s, "asset_name": "Library Branch - Santore",
         "asset_addr": "932 S 7TH ST", "asset_subt1_desc": "Library Branch",
         "not_public": "N", "status": "A"}}
    ]}', replace(v_ref, 'cityfac:', ''))::jsonb,
    '11111111-0000-0000-0000-000000000001');

  if (select is_active from public.services where id = v_id) then
    raise exception 'FAIL  an import put a removed place back in the catalogue';
  end if;
  if (select removed_at from public.services where id = v_id) is null then
    raise exception 'FAIL  an import cleared the removal';
  end if;
  raise notice 'ok    an import updates a removed place without un-removing it';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Removing a place tells the people who saved it (0035) ---'
-- ===========================================================================
do $$
declare
  v_member uuid := '33333333-0000-0000-0000-00000000000c';
  v_admin  uuid := '33333333-0000-0000-0000-00000000000a';
  v_plain uuid;
  v_discloses uuid;
  v_flag uuid;
  v_template text;
  v_vars jsonb;
begin
  update public.profiles set role = 'super_admin' where id = v_admin;

  -- A place with a neutral name, saved by a member.
  select id into v_plain from public.services
  where not name_may_disclose and removed_at is null limit 1;
  insert into public.saved_places (member_id, service_id) values (v_member, v_plain)
  on conflict do nothing;

  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  v_flag := (public.flag_service(v_plain, 'Closed')).id;
  perform public.resolve_service_flag(v_flag, 'remove', 'Confirmed');

  select template_key, vars into v_template, v_vars
  from public.outbound_messages where member_id = v_member
  order by created_at desc limit 1;

  if v_template <> 'saved_place_closed' then
    raise exception 'FAIL  a neutral place did not use the named template, got %', v_template;
  end if;
  if v_vars ->> 'place' is null then
    raise exception 'FAIL  the message carries no place name to render';
  end if;
  raise notice 'ok    the people who saved a place are told it is gone';

  -- And a place whose own name gives somebody away is never named in a text.
  select id into v_discloses from public.services
  where name_may_disclose and removed_at is null limit 1;

  if v_discloses is not null then
    insert into public.saved_places (member_id, service_id) values (v_member, v_discloses)
    on conflict do nothing;

    v_flag := (public.flag_service(v_discloses, 'Closed')).id;
    perform public.resolve_service_flag(v_flag, 'remove', 'Confirmed');

    -- Ordering by time is no help: every row in one transaction shares a
    -- timestamp. Assert on the set instead, which is the stronger claim.
    if not exists (
      select 1 from public.outbound_messages
      where member_id = v_member and template_key = 'saved_place_closed_private'
    ) then
      raise exception 'FAIL  no private notice was queued for a disclosing place';
    end if;

    if exists (
      select 1 from public.outbound_messages o
      where o.member_id = v_member
        and o.vars ->> 'place' = (select name from public.services where id = v_discloses)
    ) then
      raise exception 'FAIL  a disclosing place name was queued into a message';
    end if;
    raise notice 'ok    a name that gives somebody away never reaches a lock screen';
  end if;

  -- The queue carries a template key, never a body: nothing can send words a
  -- human has not signed off.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'outbound_messages'
      and column_name in ('body', 'message', 'text')
  ) then
    raise exception 'FAIL  the outbox grew a column that could carry unreviewed words';
  end if;
  raise notice 'ok    the queue holds a template key, not a message body';

  update public.profiles set role = 'admin' where id = v_admin;
end;
$$;

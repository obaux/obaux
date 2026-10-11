-- which places have a program lead on Pam (test 52).
--
-- Claimed 2026-10-11 on `claude/places-programs-lead-added-vs-gathered` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set lead_a 'cccccccc-0000-0000-0000-000000005201'
\set lead_p 'cccccccc-0000-0000-0000-000000005202'
\set org_a  'dddddddd-0000-0000-0000-000000005201'
\set org_p  'dddddddd-0000-0000-0000-000000005202'
\set org_n  'dddddddd-0000-0000-0000-000000005203'
\set s_lead 'eeeeeeee-0000-0000-0000-000000005201'
\set s_gath 'eeeeeeee-0000-0000-0000-000000005202'
\set s_hand 'eeeeeeee-0000-0000-0000-000000005203'
\set s_paus 'eeeeeeee-0000-0000-0000-000000005204'
\set s_orph 'eeeeeeee-0000-0000-0000-000000005205'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'lead_a', '12675558521'), (:'lead_p', '12675558522');
insert into public.orgs (id, name, type, region_id) values
  (:'org_a', 'Lead Org Active', 'program', :'region_north'),
  (:'org_p', 'Lead Org Paused', 'program', :'region_north'),
  (:'org_n', 'Org With Nobody', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'lead_a', 'provider', 'Lia', :'region_north', '+12675558521', 'active', :'org_a'),
  (:'lead_p', 'provider', 'Pat', :'region_north', '+12675558522', 'suspended', :'org_p');
insert into public.services (id, org_id, name, category, address, source, source_ref, needs_review, is_active) values
  (:'s_lead', :'org_a', 'Has A Lead', 'workforce', '1 Rule St', 'manual', null, false, true),
  (:'s_gath', null, 'Gathered From A List', 'workforce', '2 Rule St', 'city_import', 'rule-2', false, true),
  (:'s_hand', null, 'Typed By Pam Staff', 'workforce', '3 Rule St', 'manual', null, false, true),
  (:'s_paus', :'org_p', 'Lead Is Paused', 'workforce', '4 Rule St', 'manual', null, false, true),
  (:'s_orph', :'org_n', 'Org Has Nobody', 'workforce', '5 Rule St', 'manual', null, false, true);

\echo ''
\echo '--- Which places have a program lead on Pam ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check('a place whose organisation has an active provider has a lead',
  (select count(*) from (select public.service_has_lead(:'s_lead'::uuid) as v) x where v), 1::bigint);
select test.check('a place gathered from a public list has none',
  (select count(*) from (select public.service_has_lead(:'s_gath'::uuid) as v) x where v), 0::bigint);
select test.check('a manual place with no organisation (typed in by Pam staff) has none: source alone is not the rule',
  (select count(*) from (select public.service_has_lead(:'s_hand'::uuid) as v) x where v), 0::bigint);
select test.check('a place whose lead is paused has none',
  (select count(*) from (select public.service_has_lead(:'s_paus'::uuid) as v) x where v), 0::bigint);
select test.check('a place whose organisation has no provider has none',
  (select count(*) from (select public.service_has_lead(:'s_orph'::uuid) as v) x where v), 0::bigint);
select test.check('asking about many gives back only the ones with a lead',
  (select count(*) from public.places_with_leads(array[:'s_lead', :'s_gath', :'s_hand', :'s_paus', :'s_orph']::uuid[])), 1::bigint);
select test.check('...and it is the right one',
  (select count(*) from public.places_with_leads(array[:'s_lead', :'s_gath']::uuid[]) where places_with_leads = :'s_lead'::uuid), 1::bigint);
select test.check('asking about nothing gives nothing', (select count(*) from public.places_with_leads('{}')), 0::bigint);
select test.check_raises_like('more than 200 at once is refused',
  $f$select * from public.places_with_leads((select array_agg(gen_random_uuid()) from generate_series(1, 201)))$f$, '%TOO_MANY_PLACES%');

reset role;
set role anon;
select test.check_raises('nobody signed out can ask one', format($f$select public.service_has_lead(%L)$f$, :'s_lead'));
select test.check_raises('nobody signed out can ask many', format($f$select * from public.places_with_leads(array[%L]::uuid[])$f$, :'s_lead'));

\echo ''
\echo 'which places have a lead: all checks passed'

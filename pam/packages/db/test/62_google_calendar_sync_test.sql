-- google calendar sync (test 62).
--
-- Claimed 2026-10-11 on `claude/places-programs-google-sync` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set mem1  'cccccccc-0000-0000-0000-000000006211'
\set mem2  'cccccccc-0000-0000-0000-000000006212'
\set org1  'dddddddd-0000-0000-0000-000000006201'
\set prog1 'eeeeeeee-0000-0000-0000-000000006201'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'mem1', '12675558621'), (:'mem2', '12675558622');
insert into public.orgs (id, name, type, region_id) values (:'org1', 'Google Org One', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'mem1', 'member', 'Gia', null, :'region_north', '+12675558621', 'active', null),
  (:'mem2', 'member', 'Gus', null, :'region_north', '+12675558622', 'active', null);
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Google Kitchen', 'workforce', '1 Goo St, Philadelphia', 'manual', false, true);
insert into public.appointments (id, member_id, service_id, starts_at, ends_at, status, note) values
  ('aaaaaaaa-0000-0000-0000-000000006201', :'mem1', :'prog1', now() + interval '2 days', now() + interval '2 days 1 hour', 'scheduled', 'private note'),
  ('aaaaaaaa-0000-0000-0000-000000006202', :'mem1', :'prog1', now() + interval '3 days', null, 'cancelled', null),
  ('aaaaaaaa-0000-0000-0000-000000006203', :'mem2', :'prog1', now() + interval '2 days', null, 'scheduled', null);

\echo ''
\echo '--- The connection ---'
set role service_role;
select public.google_connection_save(:'mem1', 'ENCRYPTED-TOKEN-1', 'cal-1');
select public.google_connection_save(:'mem2', 'ENCRYPTED-TOKEN-2', 'cal-2');
select test.check('the connection is kept, with the token as it was given (already encrypted by the function)',
  (select count(*) from public.google_connection_get(:'mem1') where refresh_token_enc = 'ENCRYPTED-TOKEN-1' and calendar_id = 'cal-1' and state = 'connected'), 1::bigint);
select test.check('both are due, the ones never synced first',
  (select count(*) from public.google_connections_due(10)), 2::bigint);
select test.check('the number asked for is the number given',
  (select count(*) from public.google_connections_due(1)), 1::bigint);
reset role;

\echo ''
\echo '--- What goes to Google: the same as the link, and the same setting ---'
set role service_role;
select test.check('discreet by default: a visit with no name and no address, the cancelled one left out',
  (select jsonb_array_length(public.google_sync_visits(:'mem1') -> 'visits')), 1);
select test.check('...no name or address, and no note, and not the other member''s',
  (select count(*) from (select public.google_sync_visits(:'mem1')::text as t) x where t like '%Google Kitchen%' or t like '%Goo St%' or t like '%private note%' or t like '%6203%'), 0::bigint);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
select public.calendar_link_set_details(true);
reset role;
set role service_role;
select test.check('with the member''s switch on (the one setting for link and sync), the name and address are there',
  (select count(*) from (select public.google_sync_visits(:'mem1')::text as t) x where t like '%Google Kitchen%' and t like '%Goo St%'), 1::bigint);
select test.check('...and the note still is not',
  (select count(*) from (select public.google_sync_visits(:'mem1')::text as t) x where t like '%private note%'), 0::bigint);
reset role;

\echo ''
\echo '--- Which Google event is which visit ---'
set role service_role;
select public.google_event_set(:'mem1', 'aaaaaaaa-0000-0000-0000-000000006201', 'ev-1', 'hash-a');
select public.google_event_set(:'mem1', 'aaaaaaaa-0000-0000-0000-000000006201', 'ev-1', 'hash-b');
select test.check('one event per visit, and the hash follows what was written',
  (select count(*) from public.google_events_for(:'mem1') where event_id = 'ev-1' and content_hash = 'hash-b'), 1::bigint);
select test.check('...another member has none',
  (select count(*) from public.google_events_for(:'mem2')), 0::bigint);
select public.google_event_forget(:'mem1', 'aaaaaaaa-0000-0000-0000-000000006201');
select test.check('forgetting one removes it',
  (select count(*) from public.google_events_for(:'mem1')), 0::bigint);
reset role;

\echo ''
\echo '--- Failure handling: never retry forever ---'
set role service_role;
select test.check('a good run keeps it connected', (select public.google_connection_mark(:'mem1', true) = 'connected')::int, 1);
select public.google_connection_mark(:'mem1', false);
select public.google_connection_mark(:'mem1', false);
select public.google_connection_mark(:'mem1', false);
select test.check('four failures in a row are not yet broken',
  (select public.google_connection_mark(:'mem1', false) = 'connected')::int, 1);
select test.check('the fifth breaks it', (select public.google_connection_mark(:'mem1', false) = 'broken')::int, 1);
select test.check('a broken connection is no longer due',
  (select count(*) from public.google_connections_due(10) where member_id = :'mem1'), 0::bigint);
select test.check('a refused token breaks it at once',
  (select public.google_connection_mark(:'mem2', false, true) = 'broken')::int, 1);
select public.google_connection_save(:'mem1', 'ENCRYPTED-TOKEN-1B', 'cal-1b');
select test.check('connecting again makes it good, with a fresh count and none of the old events',
  (select count(*) from public.google_connection_get(:'mem1') where state = 'connected') + (select count(*) from public.google_events_for(:'mem1')), 1::bigint);
reset role;

\echo ''
\echo '--- Disconnect ---'
set role service_role;
select public.google_event_set(:'mem1', 'aaaaaaaa-0000-0000-0000-000000006201', 'ev-1', 'h');
select public.google_connection_delete(:'mem1');
select test.check('the row and its events go together',
  (select count(*) from public.google_connection_get(:'mem1')) + (select count(*) from public.google_events_for(:'mem1')), 0::bigint);
reset role;

\echo ''
\echo '--- The clock does nothing when no one is connected ---'
set role service_role;
select public.google_connection_delete(:'mem2');
reset role;
select test.check('nobody connected: nothing to call, and no error',
  (select count(*) from (select public.google_sync_kick()) x), 1::bigint);

\echo ''
\echo '--- Who can ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
select test.check_raises('a member cannot read the connections', $f$select * from public.google_connections$f$);
select test.check_raises('...nor the events', $f$select * from public.google_events$f$);
select test.check_raises('...nor call the functions', $f$select * from public.google_connection_get('cccccccc-0000-0000-0000-000000006211')$f$);
select test.check_raises('...nor save a connection', $f$select public.google_connection_save('cccccccc-0000-0000-0000-000000006211', 'x', 'y')$f$);
select test.check_raises('...nor run the clock', $f$select public.google_sync_kick()$f$);
select test.check_raises('...nor read the settings table', $f$select * from public.calendar_prefs$f$);
reset role;
set role anon;
select test.check_raises('nobody signed out can call one', $f$select * from public.google_sync_visits('cccccccc-0000-0000-0000-000000006211')$f$);
reset role;

\echo ''
\echo 'google sync: all checks passed'

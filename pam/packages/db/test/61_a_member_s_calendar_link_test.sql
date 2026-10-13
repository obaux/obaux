-- a member's calendar link (test 61).
--
-- Claimed 2026-10-11 on `claude/places-programs-calendar-link` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set mem1  'cccccccc-0000-0000-0000-000000006111'
\set mem2  'cccccccc-0000-0000-0000-000000006112'
\set memx  'cccccccc-0000-0000-0000-000000006113'
\set lead1 'cccccccc-0000-0000-0000-000000006114'
\set org1  'dddddddd-0000-0000-0000-000000006101'
\set prog1 'eeeeeeee-0000-0000-0000-000000006101'

create or replace function test.check_raises_like(label text, stmt text, pattern text)
returns void
language plpgsql
as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlerrm like pattern then
      raise notice 'ok    % (%)', label, left(sqlerrm, 40);
      return;
    end if;
    raise exception E'FAIL  %\n        raised "%", expected like "%"', label, sqlerrm, pattern;
  end;
  raise exception 'FAIL  % — the statement was allowed and should not have been', label;
end;
$$;
grant execute on function test.check_raises_like(text, text, text) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'mem1', '12675558611'), (:'mem2', '12675558612'), (:'memx', '12675558613'), (:'lead1', '12675558614');
insert into public.orgs (id, name, type, region_id) values (:'org1', 'Calendar Org One', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'mem1', 'member', 'Cal', null, :'region_north', '+12675558611', 'active', null),
  (:'mem2', 'member', 'Cam', null, :'region_north', '+12675558612', 'active', null),
  (:'memx', 'member', 'Cax', null, :'region_north', '+12675558613', 'limited', null),
  (:'lead1', 'provider', 'Lou', null, :'region_north', '+12675558614', 'active', :'org1');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Calendar Kitchen', 'workforce', '1 Cal St, Philadelphia', 'manual', false, true);
-- mem1: 3 days ago, 3 days ahead, 8 days ago (out), 7 months ahead (out), cancelled (out), with a private note.
insert into public.appointments (id, member_id, service_id, starts_at, ends_at, status, note) values
  ('aaaaaaaa-0000-0000-0000-000000006101', :'mem1', :'prog1', now() - interval '3 days', now() - interval '3 days' + interval '1 hour', 'scheduled', 'my secret note'),
  ('aaaaaaaa-0000-0000-0000-000000006102', :'mem1', :'prog1', now() + interval '3 days', null, 'scheduled', null),
  ('aaaaaaaa-0000-0000-0000-000000006103', :'mem1', :'prog1', now() - interval '8 days', null, 'scheduled', null),
  ('aaaaaaaa-0000-0000-0000-000000006104', :'mem1', :'prog1', now() + interval '7 months', null, 'scheduled', null),
  ('aaaaaaaa-0000-0000-0000-000000006105', :'mem1', :'prog1', now() + interval '4 days', null, 'cancelled', null),
  ('aaaaaaaa-0000-0000-0000-000000006106', :'mem2', :'prog1', now() + interval '2 days', null, 'scheduled', null);
create temp table link (tok text, hash text);
grant all on table link to authenticated, anon, service_role;

\echo ''
\echo '--- A member makes the address ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
insert into link select t, encode(extensions.digest(t, 'sha256'), 'hex') from (select public.calendar_link_make() as t) x;
select test.check('the address is long enough to be a secret (43 characters of base64url)',
  (select length(tok) from link), 43);
select test.check('the status says it is on, and discreet',
  (select count(*) from public.calendar_link_status() where is_on and not show_details), 1::bigint);
reset role;
select test.check('only its hash is stored: the token itself is nowhere in the table',
  (select count(*) from public.calendar_feeds where token_hash = (select tok from link)), 0::bigint);
select test.check('...the hash is',
  (select count(*) from public.calendar_feeds where token_hash = (select hash from link) and member_id = :'mem1'), 1::bigint);
select test.check('no read time is kept: the table has no such column',
  (select count(*) from information_schema.columns where table_name = 'calendar_feeds' and column_name like '%read%'), 0::bigint);

\echo ''
\echo '--- What the feed holds ---'
set role service_role;
select test.check('the window: 3 days ago and 3 days ahead, not 8 days ago, not 7 months ahead, not the cancelled one',
  (select jsonb_array_length(public.calendar_feed_read((select hash from link)) -> 'visits')), 2);
select test.check('discreet by default: no name and no address in any visit',
  (select count(*) from jsonb_array_elements(public.calendar_feed_read((select hash from link)) -> 'visits') v where v ->> 'name' is not null or v ->> 'address' is not null), 0::bigint);
select test.check('...and the note is nowhere in the answer',
  (select count(*) from (select public.calendar_feed_read((select hash from link))::text as t) x where t like '%secret note%'), 0::bigint);
select test.check('...nor the member''s first name, nor another member''s visit',
  (select count(*) from (select public.calendar_feed_read((select hash from link))::text as t) x where t like '%Cal"%' or t like '%000000006106%'), 0::bigint);
select test.check('an address nobody holds answers null',
  (select (public.calendar_feed_read(repeat('0', 64)) is null)::int), 1);
reset role;

\echo ''
\echo '--- The member shows the place, and takes it back, without a new address ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
select test.check('turning details on', (select public.calendar_link_set_details(true))::int, 1);
reset role;
set role service_role;
select test.check('...the place''s name and address are in both visits',
  (select count(*) from jsonb_array_elements(public.calendar_feed_read((select hash from link)) -> 'visits') v where v ->> 'name' = 'Calendar Kitchen' and v ->> 'address' = '1 Cal St, Philadelphia'), 2::bigint);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
select test.check('turning it off again', (select public.calendar_link_set_details(false))::int, 0);
reset role;
set role service_role;
select test.check('...the same address now shows no names',
  (select count(*) from jsonb_array_elements(public.calendar_feed_read((select hash from link)) -> 'visits') v where v ->> 'name' is not null), 0::bigint);
reset role;

\echo ''
\echo '--- A new address stops the old one ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
select public.calendar_link_set_details(true);
create temp table link2 (tok text, hash text);
grant all on table link2 to authenticated, service_role;
insert into link2 select t, encode(extensions.digest(t, 'sha256'), 'hex') from (select public.calendar_link_make() as t) x;
reset role;
set role service_role;
select test.check('the old address answers null',
  (select (public.calendar_feed_read((select hash from link)) is null)::int), 1);
select test.check('the new one answers, with the member''s choice about details kept',
  (select (public.calendar_feed_read((select hash from link2)) ->> 'show_details')::boolean::int), 1);
reset role;

\echo ''
\echo '--- Turning it off ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
select public.calendar_link_off();
select test.check('the status says off', (select count(*) from public.calendar_link_status() where not is_on), 1::bigint);
reset role;
select test.check('...the row is gone', (select count(*) from public.calendar_feeds where member_id = :'mem1'), 0::bigint);
set role service_role;
select test.check('...and the address answers null',
  (select (public.calendar_feed_read((select hash from link2)) is null)::int), 1);
reset role;

\echo ''
\echo '--- Who can ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem2', false);
insert into link select t, encode(extensions.digest(t, 'sha256'), 'hex') from (select public.calendar_link_make() as t) x;
select set_config('request.jwt.claim.sub', :'mem1', false);
select test.check_raises_like('a member with no address of their own cannot change anyone else''s (NO_CALENDAR_LINK)',
  $f$select public.calendar_link_set_details(true)$f$, '%NO_CALENDAR_LINK%');
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check_raises_like('a program lead cannot make one', $f$select public.calendar_link_make()$f$, '%NOT_A_MEMBER%');
select set_config('request.jwt.claim.sub', :'memx', false);
select test.check_raises_like('a limited account cannot make one', $f$select public.calendar_link_make()$f$, '%ACCOUNT_NOT_ACTIVE%');
select set_config('request.jwt.claim.sub', :'mem1', false);
select test.check_raises('a signed-in person cannot read a feed', $f$select public.calendar_feed_read(repeat('0', 64))$f$);
select test.check_raises('...nor read the table', $f$select * from public.calendar_feeds$f$);
reset role;
set role anon;
select test.check_raises('nobody signed out can make one', $f$select public.calendar_link_make()$f$);
select test.check_raises('...or read a feed', $f$select public.calendar_feed_read(repeat('0', 64))$f$);
reset role;

\echo ''
\echo 'calendar link: all checks passed'

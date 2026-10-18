-- a member's calendar link is a version and a key (test 78; D-604, a98 plan C).
--
-- Claimed 2026-10-18 on `claude/places-programs-calendar-plan-c` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.
--
-- The address is the member's id and an HMAC of it and the link's version under a key in the vault; Pam stores the version, the calendar the
-- member chose and the day, and nothing that makes the address. These attack that: the address can be shown again and is the same each time;
-- a new link stops the old one; a wrong or tampered or another member's address finds nothing; the row holds exactly four columns; only a
-- member reaches a link, and only their own; disconnecting deletes the row; and a legacy hash-only link keeps answering as it did.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set ana   'cccccccc-0000-0000-0000-000000007811'
\set ben   'cccccccc-0000-0000-0000-000000007812'
\set lee   'cccccccc-0000-0000-0000-000000007813'
\set org1  'dddddddd-0000-0000-0000-000000007801'
\set prog1 'eeeeeeee-0000-0000-0000-000000007801'

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
insert into auth.users (id, phone) values (:'ana', '12675557811'), (:'ben', '12675557812'), (:'lee', '12675557813');
insert into public.orgs (id, name, type, region_id) values (:'org1', 'Plan C Org', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'ana', 'member', 'Ana', null, :'region_north', '+12675557811', 'active', null),
  (:'ben', 'member', 'Ben', null, :'region_north', '+12675557812', 'active', null),
  (:'lee', 'provider', 'Lee', null, :'region_north', '+12675557813', 'active', :'org1');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Plan C Kitchen', 'workforce', '7 Plan St, Philadelphia', 'manual', false, true);
-- Ana: one ahead, one 8 days ago (out), one cancelled (out), with a private note. Ben: one ahead.
insert into public.appointments (id, member_id, service_id, starts_at, ends_at, status, note) values
  ('aaaaaaaa-0000-0000-0000-000000007801', :'ana', :'prog1', now() + interval '3 days', now() + interval '3 days 1 hour', 'scheduled', 'ana''s private note'),
  ('aaaaaaaa-0000-0000-0000-000000007802', :'ana', :'prog1', now() - interval '8 days', null, 'scheduled', null),
  ('aaaaaaaa-0000-0000-0000-000000007803', :'ana', :'prog1', now() + interval '4 days', null, 'cancelled', null),
  ('aaaaaaaa-0000-0000-0000-000000007804', :'ben', :'prog1', now() + interval '2 days', null, 'scheduled', null);
create temp table tok (who text, n int, t text);
grant all on table tok to authenticated, anon, service_role;

\echo ''
\echo '--- The key is made in the database and nobody can read it ---'
select test.check('one key exists in the vault', (select count(*) from vault.secrets where name = 'calendar_link_key'), 1::bigint);
select test.check('...it is 64 hex characters, made from random bytes', (select length(secret) from vault.secrets where name = 'calendar_link_key'), 64);
set role authenticated;
select test.check_raises_like('a client cannot call for the key', $$select public.calendar_link_key()$$, '%permission denied%');
select test.check_raises_like('...nor for a token', format($$select public.calendar_link_token(%L, 1)$$, :'ana'), '%permission denied%');
reset role;
set role service_role;
select test.check_raises_like('the service role cannot call for the key either', $$select public.calendar_link_key()$$, '%permission denied%');
reset role;

\echo ''
\echo '--- Who can make a link ---'
set role anon;
select test.check_raises('nobody signed in can', $$select public.calendar_link_issue('apple')$$);
set role authenticated;
select set_config('request.jwt.claim.sub', :'lee', false);
select test.check_raises_like('a program lead cannot', $$select public.calendar_link_issue('apple')$$, '%NOT_A_MEMBER%');
select set_config('request.jwt.claim.sub', :'ana', false);
select test.check_raises_like('a calendar that is none of the four is refused', $$select public.calendar_link_issue('yahoo')$$, '%CALENDAR_UNKNOWN%');
select test.check_raises_like('a first link must say which calendar', $$select public.calendar_link_issue()$$, '%CALENDAR_REQUIRED%');
reset role;

\echo ''
\echo '--- A member makes a link, and sees it again ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
insert into tok select 'ana', 1, public.calendar_link_issue('google', 'America/Los_Angeles');
select test.check('the address is 65 characters of base64url: the member, then the HMAC',
  (select (t ~ '^[A-Za-z0-9_-]{65}$')::int from tok where who = 'ana' and n = 1), 1);
select test.check('the state says it is on, not legacy, Google, and gives the same address again',
  (select count(*) from public.calendar_link_state() s where s.is_on and not s.is_legacy and s.calendar = 'google' and s.token = (select t from tok where who = 'ana' and n = 1)), 1::bigint);
select test.check('...and the same again the next time (it is worked out, not remade)',
  (select count(*) from public.calendar_link_state() s where s.token = (select t from tok where who = 'ana' and n = 1)), 1::bigint);
reset role;
select test.check('the row holds exactly four columns: the member, the version, the calendar and the day',
  ((select string_agg(column_name, ',' order by column_name) from information_schema.columns where table_schema = 'public' and table_name = 'calendar_links') = 'calendar,linked_on,member_id,version')::int, 1);
select test.check('...the calendar is google and the day is the member''s own',
  (select count(*) from public.calendar_links where member_id = :'ana' and version >= 1 and calendar = 'google' and linked_on = (now() at time zone 'America/Los_Angeles')::date), 1::bigint);
select test.check('the address is stored nowhere: not in the table, in any column',
  (select count(*) from public.calendar_links l where l::text like '%' || (select t from tok where who = 'ana' and n = 1) || '%'), 0::bigint);
select test.check('...nor the first half, the part that is the member''s id, nor the HMAC half',
  (select count(*) from public.calendar_links l where l::text like '%' || left((select t from tok where who = 'ana' and n = 1), 22) || '%' or l::text like '%' || right((select t from tok where who = 'ana' and n = 1), 43) || '%'), 0::bigint);
select test.check('the old legacy table has nothing for her', (select count(*) from public.calendar_feeds where member_id = :'ana'), 0::bigint);

\echo ''
\echo '--- What the feed holds: every event names the place and address, and nothing else ---'
set role service_role;
select test.check('the window: the one ahead, not 8 days ago, not the cancelled one',
  (select jsonb_array_length(public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 1)) -> 'visits')), 1);
select test.check('the visit has the place''s name and address',
  (select count(*) from jsonb_array_elements(public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 1)) -> 'visits') v
    where v ->> 'name' = 'Plan C Kitchen' and v ->> 'address' = '7 Plan St, Philadelphia'), 1::bigint);
select test.check('...and its keys are exactly id, starts_at, ends_at, name and address',
  ((select string_agg(k, ',' order by k) from (select jsonb_object_keys(v) k from jsonb_array_elements(public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 1)) -> 'visits') v) x) = 'address,ends_at,id,name,starts_at')::int, 1);
select test.check('the answer says it is a versioned link and has nothing but its visits',
  ((select string_agg(k, ',' order by k) from jsonb_object_keys(public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 1))) k) = 'kind,visits')::int, 1);
select test.check('the note, the first name and another member''s visit are nowhere in it',
  (select count(*) from (select public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 1))::text as t) x
    where t like '%private note%' or t like '%Ana%' or t like '%000000007804%'), 0::bigint);
reset role;

\echo ''
\echo '--- A wrong, a tampered or another member''s address finds nothing ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'ben', false);
insert into tok select 'ben', 1, public.calendar_link_issue('apple');
reset role;
set role service_role;
select test.check('an address nobody holds answers null', (select (public.calendar_feed_read_link(repeat('A', 65)) is null)::int), 1);
select test.check('...so does the wrong length', (select (public.calendar_feed_read_link('abc') is null)::int), 1);
select test.check('...and a legacy-length (43) one', (select (public.calendar_feed_read_link(repeat('A', 43)) is null)::int), 1);
select test.check('a changed last character of Ana''s address finds nothing',
  (select (public.calendar_feed_read_link(left(t, 64) || case when right(t, 1) = 'A' then 'B' else 'A' end) is null)::int from tok where who = 'ana' and n = 1), 1);
select test.check('Ana''s id with Ben''s HMAC finds nothing',
  (select (public.calendar_feed_read_link(left(a.t, 22) || right(b.t, 43)) is null)::int from tok a, tok b where a.who = 'ana' and b.who = 'ben'), 1);
select test.check('Ben''s own address finds Ben''s visit, and not Ana''s',
  (select count(*) from jsonb_array_elements(public.calendar_feed_read_link((select t from tok where who = 'ben')) -> 'visits') v where v ->> 'id' = 'aaaaaaaa-0000-0000-0000-000000007804'), 1::bigint);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
select test.check_raises_like('a member cannot ask the feed''s own function', format($$select public.calendar_feed_read_link(%L)$$, (select t from tok where who = 'ana')), '%permission denied%');
select test.check('Ana''s screen shows Ana''s link, not Ben''s',
  (select count(*) from public.calendar_link_state() s where s.token = (select t from tok where who = 'ben')), 0::bigint);
select test.check_raises_like('a member cannot read the table directly', $$select * from public.calendar_links$$, '%permission denied%');
reset role;

\echo ''
\echo '--- A new link stops the old one ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
insert into tok select 'ana', 2, public.calendar_link_issue();
select test.check('a new link with no calendar named keeps the one chosen', (select count(*) from public.calendar_link_state() s where s.calendar = 'google'), 1::bigint);
reset role;
select test.check('the version is a new number (it goes up and is never used twice)',
  ((select version from public.calendar_links where member_id = :'ana') > (select version from public.calendar_links where member_id = :'ben'))::int, 1);
select test.check('the new address is different', (select (a.t <> b.t)::int from tok a, tok b where a.who = 'ana' and a.n = 1 and b.who = 'ana' and b.n = 2), 1);
select test.check('...and has the same first half: it is still her',
  (select (left(a.t, 22) = left(b.t, 22))::int from tok a, tok b where a.who = 'ana' and a.n = 1 and b.who = 'ana' and b.n = 2), 1);
set role service_role;
select test.check('the old address finds nothing now', (select (public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 1)) is null)::int), 1);
select test.check('the new one finds her visit', (select jsonb_array_length(public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 2)) -> 'visits')), 1);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
insert into tok select 'ana', 3, public.calendar_link_issue('outlook');
reset role;
select test.check('naming another calendar on a new link changes the choice', ((select calendar from public.calendar_links where member_id = :'ana') = 'outlook')::int, 1);

\echo ''
\echo '--- Disconnect deletes the row ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
select public.calendar_link_off();
select test.check('the state says off', (select count(*) from public.calendar_link_state() s where not s.is_on and s.calendar is null and s.token is null), 1::bigint);
reset role;
select test.check('the row is gone, and the calendar and the day with it', (select count(*) from public.calendar_links where member_id = :'ana'), 0::bigint);
set role service_role;
select test.check('her last address finds nothing', (select (public.calendar_feed_read_link((select t from tok where who = 'ana' and n = 3)) is null)::int), 1);
reset role;
select test.check('Ben''s link is untouched', (select count(*) from public.calendar_links where member_id = :'ben'), 1::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
insert into tok select 'ana', 4, public.calendar_link_issue('apple');
reset role;
select test.check('making one again after disconnecting does not bring an old address back: it is not her first, her second or her third',
  (select count(*) from tok a, tok b where a.who = 'ana' and a.n = 4 and b.who = 'ana' and b.n in (1, 2, 3) and a.t = b.t), 0::bigint);
set role service_role;
select test.check('...and an address she disconnected still finds nothing now that she has linked again',
  (select (public.calendar_feed_read_link(t) is null)::int from tok where who = 'ana' and n = 3), 1);
reset role;

\echo ''
\echo '--- A legacy hash-only link keeps answering as it did, until its owner makes a new one ---'
reset role;
insert into public.calendar_feeds (member_id, token_hash) values (:'lee', repeat('a', 64));
update public.profiles set role = 'member' where id = :'lee';
set role service_role;
select test.check('the legacy feed answers as before: its own shape, details off',
  ((public.calendar_feed_read(repeat('a', 64)) ->> 'show_details') = 'false')::int, 1);
select test.check('...and the new function does not answer for it', (select (public.calendar_feed_read_link(repeat('a', 65)) is null)::int), 1);
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'lee', false);
select test.check('her state says on, and legacy, with no address',
  (select count(*) from public.calendar_link_state() s where s.is_on and s.is_legacy and s.token is null and s.calendar is null), 1::bigint);
select test.check('the old status still says on, with details off', (select count(*) from public.calendar_link_status() s where s.is_on and not s.show_details), 1::bigint);
insert into tok select 'lee', 1, public.calendar_link_issue('other');
reset role;
select test.check('a new link replaces the legacy row', (select count(*) from public.calendar_feeds where member_id = :'lee'), 0::bigint);
select test.check('...with a versioned one', (select count(*) from public.calendar_links where member_id = :'lee' and version >= 1 and calendar = 'other'), 1::bigint);
set role service_role;
select test.check('the legacy address no longer answers', (select (public.calendar_feed_read(repeat('a', 64)) is null)::int), 1);
reset role;


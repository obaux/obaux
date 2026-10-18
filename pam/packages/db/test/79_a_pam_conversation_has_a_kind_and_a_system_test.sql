-- A Pam conversation is a kind of conversation, and a system message has no author (test 79; D-605, D-606).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim test`. Migrations 20261018071550 to 20261018071643:
-- the 'support' kind, a nullable `messages.sender_id`, `system_key` / `system_vars` with their rule, and the two settings.
-- The files run in name order on one database; the ids and numbers below are used by no other file.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

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

create or replace function test.check_text(label text, actual text, expected text)
returns void
language plpgsql
as $$
begin
  if actual is not distinct from expected then
    raise notice 'ok    %', label;
  else
    raise exception E'FAIL  %\n        got "%", expected "%"', label, actual, expected;
  end if;
end;
$$;
grant execute on function test.check_text(text, text, text) to authenticated, anon, service_role;

\set asker   'cccccccc-0000-0000-0000-000000007901'
\set other   'cccccccc-0000-0000-0000-000000007902'
\set convo   'ffffffff-0000-0000-0000-000000007901'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'asker', '12675550791'), (:'other', '12675550792');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'asker', 'member', 'Ari', :'region_north', '+12675550791', 'active'),
  (:'other', 'member', 'Obi', :'region_north', '+12675550792', 'active');

\echo ''
\echo '--- The kind, the switch and the hours ---'
select test.check('a conversation can be of kind support',
  (select count(*) from unnest(enum_range(null::public.conversation_kind)) k where k::text = 'support'), 1);
select test.check_text('the switch is seeded off',
  (select value from public.app_settings where key = 'pam_messaging_live'), 'off');
select test.check_text('the hours are Monday to Friday, 9 to 5, Eastern, until Will says otherwise',
  (select (value::jsonb - 'tz')::text || (value::jsonb ->> 'tz') from public.app_settings where key = 'pam_hours'),
  '{"days": [1, 2, 3, 4, 5], "open": "09:00", "close": "17:00"}America/New_York');
set role anon;
select test.check('both settings are readable by a visitor (the app treats a missing row as off)',
  (select count(*) from public.app_settings where key in ('pam_messaging_live', 'pam_hours')), 2);
reset role;

\echo ''
\echo '--- A message has an author or a key, never both and never neither ---'
insert into public.conversations (id, kind) values (:'convo', 'support');
insert into public.conversation_members (conversation_id, profile_id) values (:'convo', :'asker');

select test.check_text('sender_id may be null',
  (select is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'sender_id'), 'YES');

insert into public.messages (conversation_id, sender_id, body) values (:'convo', :'asker', 'Hello Pam');
select test.check('a message from a person, with no key, is as it always was',
  (select count(*) from public.messages where conversation_id = :'convo' and sender_id = :'asker' and system_key is null), 1);

insert into public.messages (conversation_id, sender_id, body, system_key, system_vars)
  values (:'convo', null, '', 'pam.welcome', null);
select test.check('a system message with a key and no author is allowed',
  (select count(*) from public.messages where conversation_id = :'convo' and sender_id is null and system_key = 'pam.welcome'), 1);

select test.check_raises_like('a message with no author and no key is refused',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, null, 'who wrote this') $$, :'convo'),
  '%messages_author_or_key%');
select test.check_raises_like('a message with an author AND a key (looking like it came from Pam) is refused',
  format($$ insert into public.messages (conversation_id, sender_id, body, system_key) values (%L, %L, '', 'pam.welcome') $$, :'convo', :'asker'),
  '%messages_author_or_key%');

\echo ''
\echo '--- No client can write a system message ---'
set role authenticated;
select test.as_user(:'asker');
select test.check_raises_like('a signed-in person cannot insert a message with no author',
  format($$ insert into public.messages (conversation_id, sender_id, body, system_key) values (%L, null, '', 'pam.welcome') $$, :'convo'),
  '%permission denied%');
select test.check_raises_like('...nor one with their own id and a key',
  format($$ insert into public.messages (conversation_id, sender_id, body, system_key) values (%L, %L, '', 'pam.welcome') $$, :'convo', :'asker'),
  '%permission denied%');
select test.check_raises_like('...nor a message with no author and no key',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, null, 'x') $$, :'convo'),
  '%row-level security%');
-- (The new columns are outside the columns a signed-in person may insert: `permission denied`, before any policy is asked.)
insert into public.messages (conversation_id, sender_id, body) values (:'convo', :'asker', 'Are you there?');
select test.check('...but still write an ordinary message in a conversation they are in',
  (select count(*) from public.messages where conversation_id = :'convo' and body = 'Are you there?'), 1);
reset role;
select set_config('request.jwt.claim.sub', '', false);

\echo ''
\echo '--- Nothing else moved ---'
select test.check('every message that existed before still has an author',
  (select count(*) from public.messages where sender_id is null and system_key is null), 0);

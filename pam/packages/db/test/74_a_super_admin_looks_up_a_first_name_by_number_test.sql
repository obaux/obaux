-- a super admin looks up a first name by number (test 74).
--
-- Claimed 2026-10-15 on `claude/messages-answer-by-text-context` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set member 'cccccccc-0000-0000-0000-000000007401'
\set lead   'cccccccc-0000-0000-0000-000000007402'
\set sa     'cccccccc-0000-0000-0000-000000007403'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'member', '12675557401'), (:'lead', '12675557402'), (:'sa', '12675557403');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'member', 'member', 'Mara', :'region_north', '+12675557401', 'active'),
  (:'lead', 'provider', 'Lex', :'region_north', '+12675557402', 'active'),
  (:'sa', 'super_admin', 'Sy', :'region_north', '+12675557403', 'active');

\echo ''
\echo '--- A super admin looks up a first name by number ---'
set role authenticated;
select test.as_user(:'sa');
select test.check('the super admin gets a first name for a number Pam knows',
  (select count(*) from (select public.profile_first_name_for_phone('+12675557401') as n) x where n = 'Mara'), 1::bigint);
select test.check('...a program lead''s too: the same Everyone list shows it',
  (select count(*) from (select public.profile_first_name_for_phone('+12675557402') as n) x where n = 'Lex'), 1::bigint);
select test.check('a number Pam does not know gives nothing',
  (select count(*) from (select public.profile_first_name_for_phone('+12675550000') as n) x where n is null), 1::bigint);
select test.check('a value that is not a phone number gives nothing, not an error',
  (select count(*) from (select public.profile_first_name_for_phone('Mara') as n) x where n is null), 1::bigint);
select test.check('...nor does a pattern (no wildcard search)',
  (select count(*) from (select public.profile_first_name_for_phone('+1267555%') as n) x where n is null), 1::bigint);
select test.check('...nor nothing at all',
  (select count(*) from (select public.profile_first_name_for_phone(null) as n) x where n is null), 1::bigint);
select test.check('it returns a first name and nothing else: one text value',
  (select count(*) from pg_proc where proname = 'profile_first_name_for_phone' and prorettype = 'text'::regtype), 1::bigint);
select test.check('it sets its search_path',
  (select count(*) from pg_proc where proname = 'profile_first_name_for_phone' and proconfig::text like '%search_path=public, extensions%'), 1::bigint);

select test.as_user(:'member');
select test.check_raises('a member cannot look up a number',
  $f$select public.profile_first_name_for_phone('+12675557402')$f$);
select test.as_user(:'lead');
select test.check_raises('a program lead cannot either',
  $f$select public.profile_first_name_for_phone('+12675557401')$f$);

reset role;
set role anon;
select test.check_raises('someone signed out cannot',
  $f$select public.profile_first_name_for_phone('+12675557401')$f$);
reset role;

select test.check('looking a number up wrote nothing to the audit log',
  (select count(*) from public.audit_log where action like '%phone%lookup%' or action like '%first_name%'), 0::bigint);

\echo ''
\echo 'a super admin looks up a first name by number: all checks passed'

-- A deleted member's points history is deleted with them (D-445). Will, 10 October
-- 2026: "Deleting a member should delete their points history."
--
-- The points ledger is append-only for everybody, the service key included, so that
-- nobody can rewrite what a member has earned. It used to refuse the cascade from
-- deleting the member too, so a member with points could not be deleted at all.
-- These attack the narrow exception: the history of a member who is *gone* goes with
-- them; the history of a member who is *there* cannot be touched by anyone.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set pia           '55555555-0000-0000-0000-000000000701'
\set quill         '55555555-0000-0000-0000-000000000702'
\set region_north  '11111111-0000-0000-0000-000000000001'

reset role;
insert into auth.users (id, phone) values (:'pia', '12675559701'), (:'quill', '12675559702');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'pia',   'member', 'Pia',   :'region_north', '+12675559701', 'active'),
  (:'quill', 'member', 'Quill', :'region_north', '+12675559702', 'active');
insert into public.points_ledger (member_id, delta, reason) values
  (:'pia',   10, 'test.save'),
  (:'pia',    5, 'test.visit'),
  (:'quill',  7, 'test.save');

-- ===========================================================================
\echo ''
\echo '--- A member who is there: the ledger cannot be touched ---'
-- ===========================================================================
select test.check_raises_like('the database owner cannot delete a living member''s points',
  $$ delete from public.points_ledger where member_id = '55555555-0000-0000-0000-000000000701' $$, '%append-only%');
select test.check_raises_like('...or change them',
  $$ update public.points_ledger set delta = 9999 where member_id = '55555555-0000-0000-0000-000000000701' $$, '%append-only%');

set role service_role;
select test.check_raises_like('the service key cannot delete a living member''s points',
  $$ delete from public.points_ledger where member_id = '55555555-0000-0000-0000-000000000701' $$, '%append-only%');
reset role;
select test.check('...so Pia still has her two rows',
  (select count(*) from public.points_ledger where member_id = :'pia'), 2);

-- ===========================================================================
\echo ''
\echo '--- Deleting the member deletes their points ---'
-- ===========================================================================
delete from auth.users where id = :'pia';
select test.check('Pia, who had points, is deleted (it was refused before)',
  (select count(*) from public.profiles where id = :'pia'), 0);
select test.check('...and her points history went with her',
  (select count(*) from public.points_ledger where member_id = :'pia'), 0);
select test.check('Quill''s points are untouched',
  (select count(*) from public.points_ledger where member_id = :'quill'), 1);
select test.check('the seeded member''s points are untouched',
  (select count(*) from public.points_ledger where id = '99999999-0000-0000-0000-000000000001'), 1);

-- ===========================================================================
\echo ''
\echo '--- The guard is otherwise exactly as it was ---'
-- ===========================================================================
select test.check_raises_like('an update is still refused',
  $$ update public.points_ledger set delta = 1 where member_id = '55555555-0000-0000-0000-000000000702' $$, '%append-only%');
select test.check_raises_like('so is a delete of a living member''s row',
  $$ delete from public.points_ledger where member_id = '55555555-0000-0000-0000-000000000702' $$, '%append-only%');
select test.check_raises_like('the audit log still refuses a delete from the owner',
  $$ delete from public.audit_log where action = 'account.delete' $$, '%append-only%');
select test.check('the guard pins its search path',
  (select count(*) from pg_proc p where p.oid = 'public.reject_mutation()'::regprocedure
     and p.proconfig::text like '%search_path%'), 1);

-- `profiles` forces row-level security, so the guard asks whether an account exists
-- through a function that reads it as the table's owner, and no client role can ask.
select test.check('the existence check is the owner''s, not the caller''s',
  (select count(*) from pg_proc p where p.oid = 'public.profile_still_exists(uuid)'::regprocedure
     and p.prosecdef and p.proconfig::text like '%search_path%'), 1);
set role authenticated;
select test.check_raises_like('a signed-in person cannot ask it',
  $$ select public.profile_still_exists('55555555-0000-0000-0000-000000000702') $$, '%permission denied%');
reset role;
set role anon;
select test.check_raises_like('nor a visitor',
  $$ select public.profile_still_exists('55555555-0000-0000-0000-000000000702') $$, '%permission denied%');
reset role;

-- Deleting Quill tidies up after this file.
delete from auth.users where id = :'quill';
select test.check('Quill is deleted and her points with her',
  (select count(*) from public.points_ledger where member_id = :'quill'), 0);

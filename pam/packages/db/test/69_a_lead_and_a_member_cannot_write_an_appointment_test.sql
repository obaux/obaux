-- Nobody writes an appointment row directly: not a program lead, not the member (test 69; D-543, a63).
--
-- A visit is written only through the trip functions (20261010074241 replaced 0007's `appointments_provider`, which was
-- `for all ... with check (true)`, with a select-only policy and revoked insert, update and delete from `anon` and
-- `authenticated`). That is what lets the Privacy page say a program sees four things of a visit and no more: a lead who
-- could write a row could also set `attendance_method`, `checked_in_at` or `status`, and a lead who could read whole rows
-- could read the member's own note. Piper narrows the read in 20261011060000 (test 65); this file pins the WRITE, which
-- 65 does not attack, so a later migration cannot hand a lead or a member a write grant without a test going red.
--
-- Two kinds of check on purpose: the privileges themselves (so a re-grant is caught even if no row is touched) and the
-- statements as each person would run them (so a policy that allows a write under a grant is caught too).
--
-- The files run in name order on one database; ids use the prefix 69696969 and only their own rows are counted.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set alice   '33333333-0000-0000-0000-00000000000f'
\set bob     '33333333-0000-0000-0000-000000000010'
\set marcus  '33333333-0000-0000-0000-00000000000c'
\set ged     '44444444-0000-0000-0000-000000000001'
\set visit   '69696969-0000-0000-0000-0000000000a1'

-- ===========================================================================
\echo ''
\echo '--- Fixture: a planned visit for Marcus at Alice''s program ---'
-- ===========================================================================
reset role;
insert into public.appointments (id, member_id, service_id, starts_at, status)
values (:'visit', :'marcus', :'ged', now() + interval '3 days', 'scheduled')
on conflict do nothing;

select test.check('the visit exists',
  (select count(*) from public.appointments where id = :'visit'), 1);

-- ===========================================================================
\echo ''
\echo '--- The privileges: reading, and nothing that writes ---'
-- ===========================================================================
select test.check('authenticated cannot insert into appointments',
  (select count(*) from (select 1 where has_table_privilege('authenticated', 'public.appointments', 'insert')) x), 0);
select test.check('...update', (select count(*) from (select 1 where has_table_privilege('authenticated', 'public.appointments', 'update')) x), 0);
select test.check('...delete', (select count(*) from (select 1 where has_table_privilege('authenticated', 'public.appointments', 'delete')) x), 0);
select test.check('...truncate', (select count(*) from (select 1 where has_table_privilege('authenticated', 'public.appointments', 'truncate')) x), 0);
select test.check('anon cannot write appointments',
  (select count(*) from (select 1 where has_table_privilege('anon', 'public.appointments', 'insert')
                                      or has_table_privilege('anon', 'public.appointments', 'update')
                                      or has_table_privilege('anon', 'public.appointments', 'delete')) x), 0);
select test.check('authenticated can still read it (the policies decide which rows)',
  (select count(*) from (select 1 where has_table_privilege('authenticated', 'public.appointments', 'select')) x), 1);
-- The columns that carry how a visit was marked and what the member wrote: no column-level write grant either.
select test.check('no role but the owner can update the columns that say how a visit was marked or what the member wrote',
  (select count(*) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'appointments' and privilege_type in ('INSERT', 'UPDATE')
     and grantee in ('authenticated', 'anon', 'PUBLIC')
     and column_name in ('note', 'attendance_method', 'checked_in_at', 'status', 'check_in_code')), 0);

set role anon;
select test.check('...and reads no row of it', (select count(*) from public.appointments), 0);
reset role;

-- ===========================================================================
\echo ''
\echo '--- A program lead, as themselves: no write ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'alice');
select test.check_raises('a lead cannot insert a visit for a member',
  format($s$insert into public.appointments (member_id, service_id, starts_at) values (%L, %L, now() + interval '5 days')$s$, :'marcus', :'ged'));
select test.check_raises('...nor mark a member as there',
  format($s$update public.appointments set checked_in_at = now(), status = 'attended', attendance_method = 'staff' where id = %L$s$, :'visit'));
select test.check_raises('...nor write over the member''s note',
  format($s$update public.appointments set note = 'x' where id = %L$s$, :'visit'));
select test.check_raises('...nor delete a visit',
  format($s$delete from public.appointments where id = %L$s$, :'visit'));

-- ===========================================================================
\echo ''
\echo '--- A member, as themselves: no direct write either (the trip functions are the way) ---'
-- ===========================================================================
select test.as_user(:'marcus');
select test.check_raises('a member cannot insert a visit directly',
  format($s$insert into public.appointments (member_id, service_id, starts_at) values (%L, %L, now() + interval '6 days')$s$, :'marcus', :'ged'));
select test.check_raises('...nor mark their own visit by writing the row',
  format($s$update public.appointments set checked_in_at = now(), status = 'attended', attendance_method = 'self' where id = %L$s$, :'visit'));
select test.check_raises('...nor delete one directly',
  format($s$delete from public.appointments where id = %L$s$, :'visit'));

-- ===========================================================================
\echo ''
\echo '--- A lead of another program: the same ---'
-- ===========================================================================
select test.as_user(:'bob');
select test.check_raises('another program''s lead cannot write a visit either',
  format($s$update public.appointments set status = 'cancelled' where id = %L$s$, :'visit'));

-- ===========================================================================
\echo ''
\echo '--- And nothing above changed it ---'
-- ===========================================================================
reset role;
select test.check('the visit is untouched: still scheduled, never marked, no method',
  (select count(*) from public.appointments
   where id = :'visit' and status = 'scheduled' and checked_in_at is null and attendance_method is null and note is null), 1);

-- Migration 20261010074241: appointments are written only through the trip
-- functions (D-454), as ONE file for the Supabase SQL editor.
--
-- WHY A FILE AND NOT THE CONNECTOR: it replaces two policies, so it drops them
-- first, and the live connector hangs on a `drop` (D-387). This is the same SQL as
-- packages/db/migrations/20261010074241_appointments_are_written_only_through_the_trip_functions.sql,
-- in one transaction: either all of it happens or none of it does.
--
-- WHAT IT CLOSES: today any signed-in person can write an appointment for any
-- member, and a member can mark their own visit attended (which is what earns
-- points). After it, appointments are written only by book_trip, move_trip and
-- cancel_trip, which check who is asking. Nothing in the app writes the table
-- directly, so nothing anybody does in the app changes.
--
-- HOW (about one minute)
--   1. Supabase dashboard -> the "pam" project -> SQL Editor -> New query.
--   2. Paste this whole file. Press Run. If it asks "Run this query?", say yes.
--   3. It should say "Success". Anything else: nothing was changed; send Claude
--      the message.
--   4. Tell Claude "applied". Claude reads the database back and checks it.
--
-- SAFE TO RUN TWICE: a second run stops at "policy ... already exists" and
-- changes nothing. It refuses to run on a database that does not have the trip
-- functions yet (20261010074045), and it checks its own work before it commits.
--
-- A test (packages/config/test/manual-sql.test.ts) fails if this drifts from
-- the migration.

begin;

do $$
begin
  if to_regprocedure('public.book_trip(uuid,timestamptz,text,text)') is null
     or to_regprocedure('public.move_trip(uuid,timestamptz)') is null
     or to_regprocedure('public.cancel_trip(uuid)') is null then
    raise exception 'STOP: the trip functions (20261010074045) are not here yet, so appointments would have no way to be written; apply that first';
  end if;
end;
$$;

-- Appointments are written only through the trip functions (D-454).
--
-- CONTRACT step of 20261010074045: tightens what the app may do to
-- `appointments`, so it goes in its own migration, after that one is live.
-- contract: nothing in the app writes appointments directly (none did at all before D-454); the only writers are book_trip, move_trip and cancel_trip.
--
-- What was wrong, found by the trip tests the day trips became real:
--
--   * `appointments_own` was `for all`, so any member could insert an
--     appointment for ANOTHER member, or update their own to `attended` — which
--     is what the points award reads (0004: "an attended appointment must say
--     how we know; this is what keeps the §8 points award honest"), and the
--     only check was a `attendance_method` they could also set.
--   * `appointments_provider` was `for all ... with check (true)`: the check on
--     an INSERT is the only one that runs, and `true` lets any signed-in person
--     insert any appointment for anyone.
--   * With trips saved for real, that is not only bad data: a queued
--     day-before text follows an appointment, so writing one for somebody else
--     would text them.
--
-- The members and programs keep READING what they could (their own, their
-- program's; the admin policy is untouched). Every write now goes through a
-- function that checks who is asking: `book_trip`, `move_trip`, `cancel_trip`,
-- and the definer functions that already record a check-in or an attendance.

drop policy if exists appointments_own on public.appointments;
create policy appointments_own_select on public.appointments
  for select using (member_id = auth.uid());

drop policy if exists appointments_provider on public.appointments;
create policy appointments_provider_select on public.appointments
  for select using (
    provider_id = auth.uid()
    or exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );

-- Belt and braces: no policy could allow a write now, and the privilege is not
-- there either, so a policy added by mistake later does not reopen it.
revoke insert, update, delete on public.appointments from anon, authenticated;

-- ===========================================================================
-- Check the work before keeping it
-- ===========================================================================
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'appointments'
      and policyname in ('appointments_own', 'appointments_provider')
  ) then
    raise exception 'ROLLED BACK: an old write policy is still there';
  end if;
  if (select count(*) from pg_policies
      where schemaname = 'public' and tablename = 'appointments'
        and policyname in ('appointments_own_select', 'appointments_provider_select')
        and cmd = 'SELECT') <> 2 then
    raise exception 'ROLLED BACK: a read policy is missing';
  end if;
  if has_table_privilege('authenticated', 'public.appointments', 'INSERT')
     or has_table_privilege('authenticated', 'public.appointments', 'UPDATE')
     or has_table_privilege('authenticated', 'public.appointments', 'DELETE')
     or has_table_privilege('anon', 'public.appointments', 'INSERT')
     or has_table_privilege('anon', 'public.appointments', 'UPDATE')
     or has_table_privilege('anon', 'public.appointments', 'DELETE') then
    raise exception 'ROLLED BACK: the app can still write appointments directly';
  end if;
end;
$$;

insert into supabase_migrations.schema_migrations (version, name)
select '20261010074241', 'appointments_are_written_only_through_the_trip_functions'
where not exists (
  select 1 from supabase_migrations.schema_migrations
  where name = 'appointments_are_written_only_through_the_trip_functions'
);

commit;

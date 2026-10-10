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

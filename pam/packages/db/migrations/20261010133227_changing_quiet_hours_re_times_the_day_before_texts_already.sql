-- Changing quiet hours re-times the day-before texts already queued (the
-- CTO, 10 October 2026; test 36's KNOWN GAP 1b).
--
-- `queue_trip_reminder` (20261010130831) places a reminder outside the
-- member's quiet hours, but it only ran when a trip changed or texts were turned
-- on. A member who changed their quiet window after planning kept a text queued
-- for a moment chosen under the old one — at 21:30 the evening before, inside a
-- new 21:00 start.
--
-- Now changing `quiet_hours_start` or `quiet_hours_end` runs the same function
-- for every future scheduled trip: the queued text is re-timed (or queued, if the
-- new window makes a moment possible; or cancelled, if none remains), and nothing
-- is queued for a member who has not agreed to texts (`queue_trip_reminder`
-- checks consent itself).
--
-- EXPAND ONLY: one function, one trigger beside the turn-on one.

create or replace function public.retime_reminders_when_quiet_hours_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  trip public.appointments;
begin
  for trip in
    select * from public.appointments a
    where a.member_id = new.member_id and a.status = 'scheduled' and a.starts_at > now()
  loop
    perform public.queue_trip_reminder(trip);
  end loop;
  return new;
end;
$$;

revoke all on function public.retime_reminders_when_quiet_hours_change() from public, anon, authenticated;

create or replace trigger notification_preferences_retime_reminders
  after update of quiet_hours_start, quiet_hours_end on public.notification_preferences
  for each row
  when (old.quiet_hours_start is distinct from new.quiet_hours_start
        or old.quiet_hours_end is distinct from new.quiet_hours_end)
  execute function public.retime_reminders_when_quiet_hours_change();

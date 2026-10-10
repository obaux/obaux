-- Calling a place earns 10 points, once per place (docs/points-awarding.md
-- rule 3; the CTO under Will's delegation, 10 October 2026).
--
-- The place page's Call row is a plain `tel:` link, so Pam cannot know that
-- the call connected: this is the honour system, and it pays accordingly (10).
-- The app fires `log_call` as the row is tapped and does not wait for it; the
-- phone's dialler opens at once either way.
--
-- EXPAND ONLY: one new function. Nothing existing changes.
--
-- ## The rule
--
--   * 10 points, reason `call_service`, `subject_id` = the place's id.
--   * Once per PLACE, ever (the unique index of 0045): calling the same number
--     again pays nothing, so there is nothing to farm.
--   * At most FIVE new places a day, in the time zone passed (as `book_trip`
--     does). Not in the spec's table: added because a script could otherwise
--     call `log_call` on every place in the catalogue in one go. Config's
--     `dailyCap` now says 5. A sixth call is not refused, it just pays nothing.
--   * Members only. A staff account's tap is ignored, without an error: the
--     app does not need to know who is paid.
--   * The place must be one a member can see (active, reviewed, not removed).
--
-- Returns whether points were paid. The app ignores it.

create or replace function public.log_call(
  p_service_id uuid,
  p_timezone   text default 'America/New_York'
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller     uuid := auth.uid();
  zone       text := p_timezone;
  day_start  timestamptz;
  paid_today integer;
  added      integer;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  -- Points are a member mechanic (§8): anyone else's tap is not an error.
  if public.my_role() is distinct from 'member' or not public.is_active_account() then
    return false;
  end if;
  if zone is null or not exists (select 1 from pg_timezone_names where name = zone) then
    zone := 'America/New_York';
  end if;

  if not exists (
    select 1 from public.services s
    where s.id = p_service_id and s.is_active and not s.needs_review and s.removed_at is null
  ) then
    raise exception 'PLACE_NOT_FOUND';
  end if;

  day_start := date_trunc('day', now() at time zone zone) at time zone zone;
  select count(*) into paid_today
  from public.points_ledger l
  where l.member_id = caller and l.reason = 'call_service' and l.created_at >= day_start;
  if paid_today >= 5 then
    return false;
  end if;

  insert into public.points_ledger (member_id, delta, reason, subject_id)
  values (caller, 10, 'call_service', p_service_id)
  on conflict (member_id, reason, subject_id) where subject_id is not null
  do nothing;
  get diagnostics added = row_count;
  return added > 0;
end;
$$;

revoke all on function public.log_call(uuid, text) from public, anon;
grant execute on function public.log_call(uuid, text) to authenticated;

comment on function public.log_call is
  'A member tapped Call on a place: 10 points the first time for that place, '
  'five places a day (POINTS_RULES.call_service). Honour system: Pam cannot '
  'know the call connected. Staff taps are ignored.';

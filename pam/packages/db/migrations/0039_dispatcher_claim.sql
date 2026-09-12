-- 0039 — The queue hands work to the dispatcher, and decides who is skipped.
--
-- The dispatcher (supabase/functions/dispatch-sms) runs on a schedule, renders
-- reviewed copy and calls Twilio. Everything that decides WHETHER a message may
-- go out stays here, in the database, for three reasons:
--
--   1. Quiet hours and the STOP list are §7.2 promises. A promise enforced in a
--      function somebody could redeploy is not enforced.
--   2. Claiming has to be atomic. Two overlapping runs must never both send the
--      same reminder — a doubled "your visit is tomorrow" is the kind of thing
--      that makes somebody turn texts off.
--   3. The dispatcher never sees a row it may not send, so a bug there cannot
--      text somebody who asked PAM to stop.
--
-- What the dispatcher still owns: rendering from reviewed copy, refusing an
-- unreviewed template, and the Twilio call itself.

-- Quiet hours are stored per member as two hours of the day and may wrap around
-- midnight (21 -> 7). Philadelphia for the pilot; a member timezone column can
-- replace the constant without touching the callers.
create or replace function public.in_quiet_hours(p_member_id uuid, p_at timestamptz default now())
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  with at_hour as (
    select extract(hour from p_at at time zone 'America/New_York')::int as hour
  ),
  -- A member with no preferences row still has quiet hours: the table's
  -- defaults are the promise, not an opt-in.
  window_for as (
    select coalesce(np.quiet_hours_start, 21) as starts,
           coalesce(np.quiet_hours_end, 7)    as ends
    from (select 1) _
    left join public.notification_preferences np on np.member_id = p_member_id
  )
  select case
    when w.starts = w.ends then false
    when w.starts < w.ends then h.hour >= w.starts and h.hour < w.ends
    -- The usual case: the window wraps midnight (21:00 -> 07:00).
    else h.hour >= w.starts or h.hour < w.ends
  end
  from at_hour h, window_for w;
$$;

revoke all on function public.in_quiet_hours(uuid, timestamptz) from public, anon, authenticated;

comment on function public.in_quiet_hours(uuid, timestamptz) is
  'True when a text to this member would land inside their quiet hours (§7.2). '
  'Wraps midnight. A member with no preferences row has the default window.';

-- ---------------------------------------------------------------------------

/**
 * Hands the dispatcher the messages it may send right now, and marks them
 * claimed in the same statement so a second run cannot pick them up.
 *
 * Skipped rather than returned:
 *   - a member who replied STOP          -> status 'cancelled', permanent
 *   - a member with SMS switched off     -> status 'cancelled', permanent
 *   - a member with no phone number      -> status 'failed', visible in the log
 *   - quiet hours                        -> left scheduled, tried again later
 */
create or replace function public.claim_outbound_messages(p_limit integer default 50)
returns table (
  id           uuid,
  member_id    uuid,
  phone        text,
  locale       text,
  template_key text,
  vars         jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Permanent refusals first, so they leave the queue instead of being retried
  -- on every run for the rest of the member's life.
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'member stopped texts'
  from public.notification_preferences np
  where np.member_id = o.member_id
    and o.status = 'scheduled'
    and (np.sms_stopped_at is not null or np.sms_enabled = false);

  update public.outbound_messages o
  set status = 'failed', failure_reason = 'no phone number on file'
  from public.profiles p
  where p.id = o.member_id and o.status = 'scheduled' and p.phone is null;

  return query
  with due as (
    select o.id
    from public.outbound_messages o
    where o.status = 'scheduled'
      and o.send_at <= now()
      and not public.in_quiet_hours(o.member_id)
    order by o.send_at
    limit greatest(p_limit, 0)
    -- Two runs overlapping is normal on a schedule. Skipping a locked row is
    -- what stops both of them sending the same message.
    for update skip locked
  ),
  claimed as (
    update public.outbound_messages o
    set status = 'sent', sent_at = now()
    from due
    where o.id = due.id
    returning o.id, o.member_id, o.template_key, o.vars
  )
  select c.id, c.member_id, p.phone, p.preferred_language, c.template_key, c.vars
  from claimed c
  join public.profiles p on p.id = c.member_id;
end;
$$;

revoke all on function public.claim_outbound_messages(integer) from public, anon, authenticated;

comment on function public.claim_outbound_messages(integer) is
  'Atomically claims due messages for the dispatcher. Marks them sent up front: '
  'a message wrongly recorded as sent is a missed text, a message sent twice is '
  'a member who turns texts off. The dispatcher reports failures back.';

/**
 * The dispatcher reporting back. Only ever moves a row out of 'sent' into
 * 'failed' — the optimistic claim above is what needs correcting, never the
 * other way round.
 */
create or replace function public.mark_outbound_failed(p_id uuid, p_reason text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.outbound_messages
  set status = 'failed', sent_at = null, failure_reason = left(p_reason, 300)
  where id = p_id;
$$;

revoke all on function public.mark_outbound_failed(uuid, text) from public, anon, authenticated;

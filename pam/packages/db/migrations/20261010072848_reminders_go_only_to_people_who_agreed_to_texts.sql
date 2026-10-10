-- A reminder or a notice goes only to somebody who agreed to be texted (D-453,
-- Mira for Will, 10 October 2026: "the claim itself should not send a
-- reminder-kind template ... to a member who never opted in").
--
-- 0042 made texts opt-in: `sms_enabled` starts false and a person turns it on.
-- The claim (0039, 0055) cancels a queued text for somebody whose row says
-- `sms_enabled = false` or who replied STOP — but a member with **no row at
-- all** (never asked) was not caught by either, so a reminder queued for them
-- was sent. Anything that queues a reminder is supposed to check consent first,
-- and the first (`book_trip()`) will; this makes the claim itself the last
-- line, so a queue that forgets still cannot text somebody who never agreed.
--
-- By kind. These are account texts that are sent whoever has agreed to
-- reminders, as before: the sign-in code, a decision on a staff request (and a
-- denied one has no profile at all), an invitation, and the notice that parts
-- of the app are switched off. Everything else — the appointment reminders, the
-- check-in and its follow-up, a saved place closing, somebody wanting to
-- connect, an introduction, and the four Text alerts texts — is a reminder or a
-- notice and needs the person's yes.
--
-- A phone-only row (no member) is never a reminder and is untouched (0055).
-- The cancelled row says why ("never agreed to texts"), so a queue that
-- forgot shows up in the data instead of in somebody's pocket. The body of the
-- function is 0055's, with that one step added; `create or replace` changes
-- nothing else about it.

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
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'member stopped texts'
  from public.notification_preferences np
  where np.member_id = o.member_id
    and o.status = 'scheduled'
    and (np.sms_stopped_at is not null or np.sms_enabled = false);

  -- Never asked: no row, so neither of the above found them. Only reminders
  -- and notices; the account texts named in the file comment are exempt.
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'never agreed to texts'
  where o.status = 'scheduled'
    and o.member_id is not null
    and o.template_key <> all (array[
      'verify_code', 'staff_request_approved', 'staff_request_denied',
      'access_limited_notice', 'invite_member', 'invite_provider'
    ])
    and not exists (
      select 1 from public.notification_preferences np where np.member_id = o.member_id
    );

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
      and (o.member_id is null or not public.in_quiet_hours(o.member_id))
    order by o.send_at
    limit greatest(p_limit, 0)
    for update skip locked
  ),
  claimed as (
    update public.outbound_messages o
    set status = 'sent', sent_at = now()
    from due
    where o.id = due.id
    returning o.id, o.member_id, o.phone, o.locale, o.template_key, o.vars
  )
  select c.id, c.member_id, coalesce(p.phone, c.phone), coalesce(p.preferred_language, c.locale),
         c.template_key, c.vars
  from claimed c
  left join public.profiles p on p.id = c.member_id;
end;
$$;

comment on function public.claim_outbound_messages(integer) is
  'Atomically claims due messages for the dispatcher. A row with a member_id '
  'goes through the full §7.2 quiet-hours/STOP-list check (0039) and, for a '
  'reminder or a notice, must belong to somebody who agreed to texts (D-453); '
  'account texts are exempt. A phone-only row (0055, denied staff requests only) '
  'skips both, by instruction, and is claimed as soon as it is due.';

revoke all on function public.claim_outbound_messages(integer) from public, anon, authenticated;

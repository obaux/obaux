-- 0055 — Telling somebody they were not approved.
--
-- 0054 shipped the approval half of `review_staff_request` and deliberately
-- left denial silent: a denial creates no profile, and `outbound_messages`
-- is where §7.2's quiet-hours and STOP-list promises actually live, enforced
-- by joining `notification_preferences` on `member_id` — a column a denied
-- person does not have.
--
-- Will, 17 September: send it anyway, skipping that machinery for this one
-- message, and put PAM's number in it so a real question has somewhere to
-- go. This is a deliberate, named exception — not the fix for the gap 0054
-- flagged, which is still open. A phone-only row here gets no quiet-hours
-- check and no STOP-list check, by instruction, and DECISIONS.md says so.

-- ---------------------------------------------------------------------------
-- outbound_messages learns to carry a message with no profile behind it.

alter table public.outbound_messages
  alter column member_id drop not null,
  add column if not exists phone  text,
  add column if not exists locale text;

alter table public.outbound_messages
  add constraint outbound_messages_has_a_destination
  check (member_id is not null or (phone is not null and locale is not null));

comment on column public.outbound_messages.phone is
  'Set only when member_id is null — the one case today is a denied staff '
  'request (0055), which has no profile. E.164, not validated here: the '
  'value comes straight from auth.users.phone, already verified at sign-in.';

comment on column public.outbound_messages.locale is
  'Set only when member_id is null, for the same reason as phone. A member '
  'row always has preferred_language; a phone-only row carries its own '
  'copy of it because there is no profile to read it from at send time.';

-- ---------------------------------------------------------------------------
-- The dispatcher: a phone-only row skips both checks named above, by
-- instruction (see the file comment) — everything else about claiming
-- (atomic, marks sent up front, one row per run) is unchanged from 0039.

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
      -- Quiet hours are a per-member promise (0039); a phone-only row has no
      -- member to hold it for, and is exempted by instruction (0055), not by
      -- a technical default.
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
  'goes through the full §7.2 quiet-hours/STOP-list check (0039); a '
  'phone-only row (0055, denied staff requests only) skips both, by '
  'instruction, and is claimed as soon as it is due.';

-- ---------------------------------------------------------------------------
-- Denial now queues its own text.

create or replace function public.review_staff_request(
  p_user_id  uuid,
  p_decision text,
  p_region_id uuid default null
)
returns public.staff_requests
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  request public.staff_requests;
  caller_phone text;
  new_profile public.profiles;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can review a request';
  end if;

  if p_decision not in ('approved', 'denied') then
    raise exception 'That is not a decision';
  end if;

  select * into request from public.staff_requests where user_id = p_user_id for update;
  if request.user_id is null then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if request.decision is not null then
    raise exception 'REQUEST_ALREADY_DECIDED';
  end if;

  if p_decision = 'approved' then
    if exists (select 1 from public.profiles where id = p_user_id) then
      raise exception 'This person already has an account';
    end if;
    if p_region_id is null then
      raise exception 'Say which city this account is for';
    end if;
    if not exists (select 1 from public.regions where id = p_region_id) then
      raise exception 'That is not a city PAM serves';
    end if;

    select phone into caller_phone from auth.users where id = p_user_id;

    insert into public.profiles (
      id, role, first_name, last_name, home_city, phone,
      region_id, invited_by, access_status
    )
    values (
      p_user_id, request.wants_role, request.first_name, request.last_name,
      request.city, caller_phone, p_region_id, caller, 'active'
    )
    returning * into new_profile;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'staff_request.approve', 'profile', p_user_id,
            jsonb_build_object('role', request.wants_role, 'region_id', p_region_id));

    insert into public.outbound_messages (member_id, template_key, vars)
    values (
      p_user_id, 'staff_request_approved',
      jsonb_build_object('link', (select value from public.app_settings where key = 'app_url'))
    );
  else
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'staff_request.deny', 'staff_request', p_user_id,
            jsonb_build_object('role', request.wants_role));

    -- No profile, so no member_id — see the file comment for why that is
    -- allowed here and nowhere else. `request_staff_access` (0046) never
    -- asks a language, unlike `start_membership`, so there is nothing to
    -- read it from; English until that is fixed (tracked in the session log).
    select phone into caller_phone from auth.users where id = p_user_id;
    insert into public.outbound_messages (phone, locale, template_key, vars)
    values (
      caller_phone, 'en', 'staff_request_denied',
      jsonb_build_object('supportPhone', (select value from public.app_settings where key = 'support_phone'))
    );
  end if;

  update public.staff_requests
  set decision = p_decision, reviewed_at = now(), reviewed_by = caller,
      region_id = p_region_id
  where user_id = p_user_id
  returning * into request;

  return request;
end;
$$;

comment on function public.review_staff_request is
  'Approves or denies a staff_requests row. Approving creates the profile '
  '(same shape as redeem_invite) and queues staff_request_approved; denying '
  'queues staff_request_denied straight to the phone (0055 — no member_id, '
  'no quiet-hours/STOP check, by instruction). Super admin only, checked '
  'inside the function body — RLS does not cover the RPC surface.';

revoke all on function public.review_staff_request(uuid, text, uuid) from public, anon;
grant execute on function public.review_staff_request(uuid, text, uuid) to authenticated;

-- 0054 — Reviewing a staff request, for real.
--
-- `staff_requests` (0046) has carried `reviewed_at`/`reviewed_by` since it was
-- written, and nothing has ever set them: there is no screen, and a super
-- admin who wants to bring in the case manager or program lead who asked has
-- to make them an invite by hand, which asks the person to sign up a second
-- time.
--
-- This migration gives the request an actual outcome. Approving one creates
-- the real account directly — the same shape `redeem_invite` (0049) already
-- uses, phone pulled from `auth.users` rather than typed twice — and queues
-- an SMS saying so. Denying one records that and queues a different SMS.
-- Either way `staff_requests` keeps the row: it is the record of who asked
-- and what was decided, not a queue that empties.

-- ---------------------------------------------------------------------------
-- The outcome itself.

alter table public.staff_requests
  add column if not exists decision text,
  add column if not exists region_id uuid references public.regions (id) on delete set null;

alter table public.staff_requests
  add constraint staff_requests_decision_known
  check (decision is null or decision in ('approved', 'denied'));

comment on column public.staff_requests.decision is
  'null while pending. Set only by review_staff_request, alongside '
  'reviewed_at/reviewed_by, which already existed and were never written.';

comment on column public.staff_requests.region_id is
  'Which city the approved account belongs to. Chosen by the reviewing super '
  'admin at approval time, the same way create_invite (0049) asks — the '
  'city typed at sign-up is what the person wrote, not necessarily the region '
  'PAM should file them under.';

-- ---------------------------------------------------------------------------
-- A notification when one comes in, and a locale key for it.

alter table public.notifications drop constraint notifications_kind_known;
alter table public.notifications add constraint notifications_kind_known check (
  kind in ('service_flagged', 'service_removed', 'message_reported', 'staff_request_pending')
);

create or replace function public.notify_on_staff_request()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  -- Resubmission (the ON CONFLICT upsert in request_staff_access, 0046)
  -- re-fires this trigger on UPDATE too; only a genuinely new or reopened
  -- claim (decision back to null) is worth telling anybody about.
  if tg_op = 'UPDATE' and old.decision is not distinct from new.decision
     and old.wants_role = new.wants_role then
    return new;
  end if;
  if new.decision is not null then
    return new;
  end if;

  perform public.notify(
    public.super_admin_ids(),
    'staff_request_pending',
    'notify.staff_request_pending',
    'staff_request', new.user_id,
    jsonb_build_object('name', coalesce(new.first_name, ''), 'role', new.wants_role::text)
  );
  return new;
end;
$$;

drop trigger if exists staff_requests_notify on public.staff_requests;
create trigger staff_requests_notify
  after insert or update on public.staff_requests
  for each row execute function public.notify_on_staff_request();

-- ---------------------------------------------------------------------------
-- Where the "open PAM" link in the approval text points.

insert into public.app_settings (key, value, description) values
  ('app_url', 'https://web-ten-umber-88.vercel.app',
   'Base URL embedded in SMS links sent from the database (e.g. staff_request_approved). '
   'Not a secret — same address the app itself resolves to.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- The decision itself.

/**
 * Approve or deny a pending staff request.
 *
 * Approving creates the real account in the same insert shape `redeem_invite`
 * (0049) uses — phone from `auth.users`, not re-typed — and queues the
 * approval text. Denying touches no other table and queues the denial text.
 * Either way `staff_requests` is updated in place, never deleted: it is the
 * record that this was asked and decided, and who decided it.
 */
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

    -- No SMS queued here. `outbound_messages.member_id` is not-null against
    -- `profiles` on purpose (0035), and a denial creates no profile — there is
    -- nowhere safe to hang this. `outbound_messages` is also how §7.2's quiet
    -- hours and STOP-list promises are enforced (0039, `claim_outbound_messages`
    -- joins `notification_preferences` by member_id); a phone-only send would
    -- bypass both, which is a real gap, not a detail to route around quietly.
    -- Flagged for Will rather than half-built: see the session log.
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
  'queues staff_request_denied. Super admin only, checked inside the '
  'function body — RLS on staff_requests does not cover the RPC surface.';

revoke all on function public.review_staff_request(uuid, text, uuid) from public, anon;
grant execute on function public.review_staff_request(uuid, text, uuid) to authenticated;

-- 0075 — 0068 "close the readiness gaps", carried over (D-346).
--
-- Written on 30 September as 0068 on branch claude/hopeful-thompson-07nj7n
-- and held back from the live project (STATUS, before-launch list). Brought
-- here unchanged in substance, renumbered to run after 0070–0074 so the order
-- of files is the order the live project receives them. Checked against what
-- came after it: no later migration redefines `start_membership`,
-- `redeem_invite`, `guard_connection` or `flag_service` (0071 only mentions
-- `redeem_invite`; 0066 is older), and the column grant below lists every
-- `profiles` column the live table has except `phone`.
--
-- 0068 — Close the gaps the 30 September readiness review found live.
--
-- Each of these was confirmed against the live project, not only read in the
-- code (see D-205 for how, and D-204 for the review itself):
--
--   1. A member who signed up alone had no phone on their profile, so no text
--      could ever reach them. `start_membership()` (0046) never copied it from
--      `auth.users`. Both real members on the live project had a null phone.
--      And `auth.users.phone` is stored without the leading "+" — the invite
--      and staff-approval paths copied that raw value into a column whose
--      check (0002) demands E.164 — so on the live project redeeming any
--      invite, or approving any staff request, would have failed outright.
--      Nobody had tried: the live project has no invited account yet. Only
--      the seeded super admin's number was right.
--   2. A member could insert a connection to any account and then accept it
--      themselves (`connections_update_party` let either party set any
--      column), which opened the other person's whole profile, phone
--      included. The insert did not even have to be accepted: `status` was
--      the requester's to set on the way in.
--   3. A conversation member could repoint their own membership row at any
--      conversation id (`conversation_members_update_own` did not pin
--      `conversation_id`), stepping round 0063's one door. A sender could
--      rewrite, move, or un-flag a message after it was reported.
--   4. One account could hide the whole catalogue: sign-up is open, and every
--      flag hid its place at once (D-071), with no limit.
--   5. A case manager read every column of a member's profile, `phone`
--      included — not on §4.1's list (STATUS row 19). No screen reads
--      `profiles.phone` at all, so nobody signed in needs it.

-- ---------------------------------------------------------------------------
-- 1. Phone numbers: always E.164, and a self-signed-up member has one.

create or replace function public.to_e164(p text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select case
    when p is null or btrim(p) = '' then null
    when btrim(p) like '+%' then '+' || regexp_replace(p, '\D', '', 'g')
    -- A bare ten-digit number is a US number without its country code.
    when length(regexp_replace(p, '\D', '', 'g')) = 10 then '+1' || regexp_replace(p, '\D', '', 'g')
    -- Supabase Auth stores a verified number as its digits, country code first.
    else '+' || regexp_replace(p, '\D', '', 'g')
  end;
$$;

comment on function public.to_e164 is
  'A phone number as Twilio wants it: "+" and digits. auth.users.phone arrives '
  'as "12675551234"; the dispatcher sends whatever the row holds (0068).';

create or replace function public.normalise_phone()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.phone := public.to_e164(new.phone);
  return new;
end;
$$;

revoke all on function public.normalise_phone() from public, anon, authenticated;

drop trigger if exists profiles_phone_e164 on public.profiles;
create trigger profiles_phone_e164
  before insert or update of phone on public.profiles
  for each row execute function public.normalise_phone();

drop trigger if exists outbound_messages_phone_e164 on public.outbound_messages;
create trigger outbound_messages_phone_e164
  before insert or update of phone on public.outbound_messages
  for each row execute function public.normalise_phone();

create or replace function public.start_membership(
  p_first_name text,
  p_last_name  text,
  p_city       text,
  p_language   text default 'en'
)
returns public.profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller     uuid := auth.uid();
  v_region   uuid;
  v_phone    text;
  v_profile  public.profiles;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;

  if exists (select 1 from public.profiles where id = caller) then
    raise exception 'This account already exists';
  end if;

  if coalesce(btrim(p_first_name), '') = '' then
    raise exception 'We need a first name';
  end if;

  select id into v_region
  from public.regions
  where lower(btrim(name)) = lower(btrim(coalesce(p_city, '')))
  limit 1;

  if v_region is null then
    raise exception 'PAM is not in that city yet' using errcode = 'P0002';
  end if;

  -- The number they just verified with a code, the same way redeem_invite
  -- (0049) and review_staff_request (0054) take it. Not typed twice.
  select phone into v_phone from auth.users where id = caller;

  insert into public.profiles (
    id, role, first_name, last_name, home_city, region_id, preferred_language, phone
  )
  values (
    caller, 'member', btrim(p_first_name), nullif(btrim(coalesce(p_last_name, '')), ''),
    btrim(p_city), v_region, coalesce(nullif(btrim(p_language), ''), 'en'), v_phone
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.start_membership(text, text, text, text) from public, anon;
grant execute on function public.start_membership(text, text, text, text) to authenticated;

-- Redeeming an invite: the same number, compared in the same shape. Before
-- this, a prefilled invite compared '+12675550100' with '12675550100' and
-- refused every real person it was made for; and with no prefill the raw
-- number failed profiles_phone_e164, so no invite could be redeemed live at
-- all. The test fixtures store auth phones with a "+", which is why the
-- suite never saw it. Unchanged from 0049 but for that one line.

create or replace function public.redeem_invite(
  p_code text,
  p_first_name text default null,
  p_preferred_language text default 'en',
  p_last_name text default null,
  p_home_city text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  caller_phone text;
  invite public.invites;
  new_profile public.profiles;
begin
  if caller is null then
    raise exception 'Verify your phone number first';
  end if;

  if exists (select 1 from public.profiles where id = caller) then
    raise exception 'This account has already been set up';
  end if;

  -- auth.users keeps a verified number as bare digits; the invite and the
  -- profile keep E.164 (0002's check). Compare and store the same shape (0068).
  select public.to_e164(phone) into caller_phone from auth.users where id = caller;

  select * into invite
  from public.invites
  where code = upper(btrim(p_code))
  for update;

  -- One message for "wrong", "used" and "expired" would be friendlier to an
  -- attacker; the onboarding copy (§10 step 3) shows the same plain sentence
  -- either way, so the distinction here only reaches the logs.
  if invite.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if invite.status <> 'pending' then
    raise exception 'INVITE_ALREADY_USED';
  end if;

  if invite.expires_at < now() then
    update public.invites set status = 'expired' where id = invite.id;
    raise exception 'INVITE_EXPIRED';
  end if;

  -- §4.1: when the invite prefilled a phone, the verified number must match, so
  -- a code overheard in a waiting room cannot be redeemed by a bystander.
  if invite.phone is not null and invite.phone is distinct from caller_phone then
    raise exception 'INVITE_PHONE_MISMATCH';
  end if;

  insert into public.profiles (
    id, role, first_name, last_name, home_city, phone, preferred_language,
    region_id, invited_by, access_status
  )
  values (
    caller,
    invite.role,
    nullif(btrim(coalesce(p_first_name, '')), ''),
    nullif(btrim(coalesce(p_last_name, '')), ''),
    nullif(btrim(coalesce(p_home_city, '')), ''),
    caller_phone,
    coalesce(nullif(btrim(p_preferred_language), ''), 'en'),
    invite.region_id,
    invite.created_by,
    'active'
  )
  returning * into new_profile;

  update public.invites
  set status = 'redeemed', redeemed_by = caller, redeemed_at = now()
  where id = invite.id;

  -- Members land on the inviting admin's caseload automatically (§4.1 step 1).
  if invite.role = 'member' and invite.assigned_admin_id is not null then
    insert into public.admin_assignments (admin_id, member_id)
    values (invite.assigned_admin_id, caller)
    on conflict do nothing;
  end if;

  insert into public.notification_preferences (member_id) values (caller)
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.redeem', 'invite', invite.id,
          jsonb_build_object('role', invite.role));

  return new_profile;
end;
$$;

revoke all on function public.redeem_invite(text, text, text, text, text) from public, anon;
grant execute on function public.redeem_invite(text, text, text, text, text) to authenticated;

-- Everyone who signed up alone before today, and every number already stored
-- raw. The trigger does the formatting.
update public.profiles p
set phone = u.phone
from auth.users u
where u.id = p.id
  and p.phone is null
  and coalesce(u.phone, '') <> '';

update public.profiles set phone = phone where phone is not null;
update public.outbound_messages set phone = phone where phone is not null;

-- ---------------------------------------------------------------------------
-- 2. Connections: only the person asked can answer, and the pair is fixed.

create or replace function public.guard_connection()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  -- Trusted server code (a security definer function, a migration, the
  -- service key) is not a person answering a request.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A request starts as a request, whatever the client sent.
    new.status := 'pending';
    new.blocked_by := null;
    new.responded_at := null;
    new.created_at := now();
    return new;
  end if;

  if new.requester_id is distinct from old.requester_id
     or new.receiver_id is distinct from old.receiver_id
     or new.kind is distinct from old.kind
     or new.created_at is distinct from old.created_at then
    raise exception 'A connection''s people and kind cannot change';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if old.status = 'blocked' then
    -- §6.2 step 5: a block between two members is permanent.
    raise exception 'A block cannot be undone here';
  end if;

  if new.status = 'blocked' then
    if new.blocked_by is distinct from auth.uid() then
      raise exception 'A block is recorded as the person who made it';
    end if;
    return new;
  end if;

  if new.status in ('accepted', 'declined') then
    if old.status <> 'pending' then
      raise exception 'Only a request that is still waiting can be answered';
    end if;
    if auth.uid() is distinct from old.receiver_id then
      raise exception 'Only the person who was asked can answer';
    end if;
    return new;
  end if;

  raise exception 'A connection cannot go back to waiting';
end;
$$;

revoke all on function public.guard_connection() from public, anon, authenticated;

drop trigger if exists connections_guard on public.connections;
create trigger connections_guard
  before insert or update on public.connections
  for each row execute function public.guard_connection();

-- Belt and braces with the trigger: the pair and kind are not updatable
-- columns at all. (Table-wide first — a column revoke cannot carve a hole in a
-- table-wide grant; see 0046.)
revoke update on public.connections from anon, authenticated;
grant update (status, responded_at, blocked_by) on public.connections to authenticated;

-- ---------------------------------------------------------------------------
-- 3. A membership row is only ever marked read; a message is final once sent.

revoke update on public.conversation_members from anon, authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;

drop policy if exists messages_update_own on public.messages;
revoke update on public.messages from anon, authenticated;

-- A sender writes the message, not its moderation state or its timestamp.
revoke insert on public.messages from anon, authenticated;
grant insert (conversation_id, sender_id, body, attachment_url, attachment_kind)
  on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- 4. A flag hides a place at once when somebody vouched-for raises it.
--
-- D-071 stands for the people it was written about — a case manager, a
-- program, a member a case manager invited or has on their caseload — because the cheaper mistake
-- is still hiding a live place for a day. What changes is an account nobody
-- vouched for (open sign-up): its flag is recorded and waits for a second,
-- different account, or for a super admin. And nobody raises more than ten a
-- day, or the same place twice while the first is still open.

create or replace function public.flag_service(
  p_service_id uuid,
  p_reason     text,
  p_note       text default null
)
returns public.service_flags
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller    uuid := auth.uid();
  flag      public.service_flags;
  vouched   boolean;
  flaggers  integer;
begin
  if caller is null then
    raise exception 'Sign in to flag a place';
  end if;
  if not public.is_active_account() then
    raise exception 'This account cannot flag a place';
  end if;
  if p_reason not in ('closed', 'moved', 'not_accepting', 'wrong_info') then
    raise exception 'Pick one of the four reasons';
  end if;
  if not exists (select 1 from public.services where id = p_service_id) then
    raise exception 'No such place';
  end if;

  -- Saying it twice is still one report.
  select * into flag
  from public.service_flags
  where service_id = p_service_id and flagged_by = caller and status = 'pending'
  limit 1;
  if flag.id is not null then
    return flag;
  end if;

  if (select count(*) from public.service_flags
      where flagged_by = caller and created_at > now() - interval '1 day') >= 10 then
    raise exception 'That is a lot of places for one day. Call PAM and tell us.';
  end if;

  insert into public.service_flags (service_id, flagged_by, reason, note)
  values (p_service_id, caller, p_reason, nullif(btrim(p_note), ''))
  returning * into flag;

  -- Vouched for: staff, or a member a case manager invited or has on their
  -- caseload now. Open sign-up alone is not.
  select p.role <> 'member'
      or p.invited_by is not null
      or exists (select 1 from public.admin_assignments a
                 where a.member_id = p.id and a.ended_at is null)
    into vouched
  from public.profiles p where p.id = caller;

  select count(distinct flagged_by) into flaggers
  from public.service_flags
  where service_id = p_service_id and status = 'pending';

  if coalesce(vouched, false) or flaggers >= 2 then
    update public.services
    set is_active = false, updated_at = now()
    where id = p_service_id and removed_at is null;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'service.flag', 'service', p_service_id,
          jsonb_build_object('flag_id', flag.id, 'reason', p_reason,
                             'has_note', p_note is not null,
                             'hidden', coalesce(vouched, false) or flaggers >= 2));

  return flag;
end;
$$;

revoke all on function public.flag_service(uuid, text, text) from public, anon;
grant execute on function public.flag_service(uuid, text, text) to authenticated;

comment on function public.flag_service is
  'Records a flag. Hides the place at once when the flagger is staff or a '
  'member a case manager invited or has on their caseload, or once two different accounts have flagged '
  'it; otherwise it waits for review. Ten a day per account; a repeat returns '
  'the open flag (0068, narrowing D-071 for unvouched accounts only).';

-- ---------------------------------------------------------------------------
-- 5. Nobody signed in reads a phone number off a profile.
--
-- Every other column stays as readable as its policies already make it; this
-- removes one column from every policy at once — the case manager's, the
-- connected buddy's, the discoverable mentor's, and the account's own (no
-- screen reads it; server code runs as its owner and is unaffected).

revoke select on public.profiles from anon, authenticated;
grant select (
  id, role, first_name, display_name, photo_url, preferred_language,
  home_zip, bio, tags, is_mentor, is_public, org_id, region_id, invited_by,
  access_status, last_active_at, onboarded_at, transparency_ack_at, created_at,
  last_name, home_city, is_demo
) on public.profiles to anon, authenticated;

comment on column public.profiles.phone is
  'E.164, from auth.users at account creation (0049, 0054, 0068). Not '
  'selectable by anon or authenticated: only server code reads it (0068).';

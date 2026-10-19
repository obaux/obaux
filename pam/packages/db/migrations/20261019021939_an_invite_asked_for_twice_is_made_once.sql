-- An invite asked for twice is made once (Iris's D-618 table; Mira, 19 October 02:14).
--
-- When the answer to "make this invite" is lost (the phone drops, the 15 s wait runs out, D-616), the person taps Create link
-- again and Pam makes a second invite, and for a case manager or a program lead queues a second email (staff_invite_emails).
-- Only the database knows whether the first one was made, so the app now sends a request id with each attempt, and the database
-- makes the invite once for that id.
--
--   1. `invites.request_id`: a random value the app makes, nothing personal in it. It lives exactly as long as the invite row:
--      redeemed, expired or deleted with the account, it goes with it. Unique per inviter, only where it is set (a partial
--      index), so every invite made before this, or through the old doors, is untouched.
--   2. `invite_create_once`: if this inviter already made an invite with this id, it hands that invite back, after checking it
--      was asked for with the same details (role, name, number, city, and for staff the email). The same id with different
--      details is refused, INVITE_REQUEST_REUSED, rather than handing back an invite for somebody else; the app makes a new id
--      whenever anything in the form changes, so this only happens to a client that is doing something wrong. Otherwise it
--      makes the invite through `invite_create` (0086), so every rule about who may invite whom stays in one place, and stamps
--      the id on it. Two attempts with the same id at the same moment (the lost answer and the retry crossing) wait for each
--      other on a transaction lock, so the second sees the first's invite.
--   3. Two new doors, `create_invite_once` (members) and `create_staff_invite_once` (staff), taking the id first. They are new
--      names, not new arguments on `create_invite` and `create_staff_invite`: a second overload would make a live call with the
--      old arguments ambiguous ("function is not unique") until the old one was dropped, and a drop is Will's to run. The old
--      two are left exactly as they are; the app moves to the new ones, and they are retired in a later migration with Will.
--
-- EXPAND ONLY. Nothing the live app calls changes; there is no `drop` in this file.

-- ---------------------------------------------------------------------------
-- 1. The request id.

alter table public.invites add column if not exists request_id uuid;

comment on column public.invites.request_id is
  'A random id the app sends with one attempt to make this invite (20261019021939), so a retry after a lost answer gets the '
  'same invite back. Nothing personal; lives and goes with the row.';

create unique index if not exists invites_request_once
  on public.invites (created_by, request_id)
  where request_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Made once.

create or replace function public.invite_create_once(
  p_request_id uuid,
  p_role public.user_role,
  p_phone text,
  p_region_id uuid,
  p_first_name text,
  p_email text
)
returns public.invites
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller     uuid := auth.uid();
  existing   public.invites;
  kept_email text;
  v_email    text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  made       public.invites;
begin
  if p_request_id is null then
    raise exception 'INVITE_NEEDS_REQUEST_ID';
  end if;

  -- The lost answer and its retry can arrive together: the second waits here until the first has committed or failed.
  perform pg_advisory_xact_lock(hashtextextended(coalesce(caller::text, '') || ':' || p_request_id::text, 0));

  select * into existing from public.invites where created_by = caller and request_id = p_request_id;

  if existing.id is not null then
    -- The same attempt again: hand it back, but only if it was asked for with the same details.
    select email into kept_email from public.invite_contact_emails where invite_id = existing.id;
    if existing.role is distinct from p_role
       or existing.phone is distinct from public.to_e164(p_phone)
       or existing.first_name is distinct from nullif(btrim(coalesce(p_first_name, '')), '')
       or (p_region_id is not null and existing.region_id is distinct from p_region_id)
       -- The email is held until the invite is redeemed (0086); after that there is nothing left to compare.
       or (kept_email is not null and kept_email is distinct from v_email) then
      raise exception 'INVITE_REQUEST_REUSED';
    end if;
    return existing;
  end if;

  made := public.invite_create(p_role, p_phone, p_region_id, p_first_name, p_email);

  update public.invites set request_id = p_request_id where id = made.id
  returning * into made;

  return made;
end;
$$;

comment on function public.invite_create_once is
  'Makes an invite once per request id (20261019021939): a repeat with the same details gets the same invite back, a repeat '
  'with different details is refused (INVITE_REQUEST_REUSED). Not callable by a client role: create_invite_once and '
  'create_staff_invite_once call it.';

revoke all on function public.invite_create_once(uuid, public.user_role, text, uuid, text, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. The two doors, with the id.

-- Members: name and phone, never an email. A staff role through this door is refused with the reason (INVITE_NEEDS_EMAIL),
-- as create_invite does.
create or replace function public.create_invite_once(
  p_request_id uuid,
  p_role public.user_role,
  p_phone text default null,
  p_region_id uuid default null,
  p_first_name text default null
)
returns public.invites
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return public.invite_create_once(p_request_id, p_role, p_phone, p_region_id, p_first_name, null);
end;
$$;

comment on function public.create_invite_once is
  'create_invite (0077, 0086) with a request id, so a retry after a lost answer gets the same invite back '
  '(20261019021939). Replaces create_invite in the app; the old door stays until it is retired with Will.';

revoke all on function public.create_invite_once(uuid, public.user_role, text, uuid, text) from public, anon;
grant execute on function public.create_invite_once(uuid, public.user_role, text, uuid, text) to authenticated;

-- Staff: a case manager or a program lead, with the email Pam will write to. One invite, so one email queued.
create or replace function public.create_staff_invite_once(
  p_request_id uuid,
  p_role public.user_role,
  p_email text,
  p_phone text default null,
  p_region_id uuid default null,
  p_first_name text default null
)
returns public.invites
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_role not in ('provider', 'admin') then
    raise exception 'INVITE_NOT_STAFF';
  end if;
  return public.invite_create_once(p_request_id, p_role, p_phone, p_region_id, p_first_name, p_email);
end;
$$;

comment on function public.create_staff_invite_once is
  'create_staff_invite (0086) with a request id, so a retry after a lost answer gets the same invite back and no second '
  'email is queued (20261019021939). Replaces create_staff_invite in the app; the old door stays until it is retired with Will.';

revoke all on function public.create_staff_invite_once(uuid, public.user_role, text, text, uuid, text) from public, anon;
grant execute on function public.create_staff_invite_once(uuid, public.user_role, text, text, uuid, text) to authenticated;

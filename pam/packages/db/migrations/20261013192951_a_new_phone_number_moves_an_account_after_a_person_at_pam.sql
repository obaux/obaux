-- a_new_phone_number_moves_an_account_after_a_person_at_pam — somebody with a new phone asks to move
-- their account to it, and a person at Pam checks it is really them before anything moves (D-567; card
-- a73, plan read by the merge desk 13 October 19:21; Will's defaults on card a84).
--
-- Claimed 2026-10-13 19:29:51 UTC on `claude/pam-new-number` with `pnpm claim migration`.
--
-- EXPAND. One new table and new functions; nothing existing is changed or removed. The live app does
-- not call any of it until the screens that do are live.
--
-- The shape:
--   1. The new number proves itself with the normal sign-in code. That makes a sign-in with no
--      profile (the "temporary sign-in"); nothing here ever makes a profile for it.
--   2. That sign-in sends the old number, a name, a city and who at Pam knows them
--      (`submit_number_change`). The reply is the same whatever was typed: whether the old number
--      belongs to an account is known only to the server and the person who decides.
--   3. The super admin decides every request (merge desk, 13 October 19:48: showing the account's
--      case manager the typed details and the new number would widen what a case manager can see,
--      which transparency.ts forbids without Will's signature and members being told first). The
--      `routed_to` / `case_manager_id` columns stay, always 'super_admin' / null, so a case manager
--      step can be added if Will signs that line. A super admin's account can never be moved this
--      way: the request stays "still checking" for the person, and the super admin sees it marked,
--      with Deny and no Approve.
--   4. Every Approve needs the tick "I spoke to this person and I'm sure it's them"
--      (`super_admin_must_speak`); the tick is kept on the request and in the audit row. A Deny
--      deletes the temporary sign-in at once (it has no profile).
--   5. On yes, the `move-number` Edge Function (deployed by the merge desk) removes the temporary
--      sign-in and moves the account's sign-in to the new number, then calls `number_change_moved`.
--   6. Every request is deleted `keep_days` after it is decided, or after it was made if nobody
--      decided it, and takes any temporary sign-in it still has with it (nightly, where the project
--      has pg_cron).
--
-- Deleting a temporary sign-in is `delete from auth.users` for a sign-in with no profile, from a
-- security definer function owned by postgres. Auth's own rows for it (identities, sessions) go with
-- it by their foreign keys. The merge desk confirms on the live project that postgres may delete
-- from auth.users before applying.
--
-- Nothing here sends a text or calls anything outside the database (texts_live stays off; the text
-- to the old number is a later job). The audit rows carry no name and no phone (D-443).

-- ---------------------------------------------------------------------------
-- 0. Will's answers on card a84, in one place, so a different answer is a one-line change.

create or replace function public.number_change_rules()
returns jsonb
language sql
immutable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    -- The super admin speaks to the person before saying yes (every request, for now).
    'super_admin_must_speak', true,
    -- A request is deleted this long after it is decided (or made, if nobody decided it).
    'keep_days', 90,
    -- Limits: requests per new number per day, per old number per week.
    'per_new_number_per_day', 3,
    'per_old_number_per_week', 3
  );
$$;

comment on function public.number_change_rules() is
  'Will''s answers for moving an account to a new number (card a84, D-567). Change a value here, nowhere else.';

-- ---------------------------------------------------------------------------
-- 1. The requests.

create table public.number_change_requests (
  id              uuid primary key default gen_random_uuid(),
  -- The temporary sign-in that proved the new number. Set to null when the move removes it.
  requester_id    uuid references auth.users (id) on delete set null,
  -- E.164, from that sign-in, never typed.
  new_phone       text not null,
  -- E.164, as typed.
  old_phone       text not null,
  first_name      text not null,
  last_name       text not null,
  city            text not null,
  who_knows       text not null default '',
  -- The account the old number belongs to, if any. Server-side only; goes with the account.
  profile_id      uuid references public.profiles (id) on delete cascade,
  -- Who decides first: the account's case manager, or the super admin.
  routed_to       text not null,
  case_manager_id uuid references public.profiles (id) on delete set null,
  -- A super admin's account: never moved by this.
  is_protected    boolean not null default false,
  status          text not null default 'waiting',
  decided_by      uuid references public.profiles (id) on delete set null,
  decided_at      timestamptz,
  spoke_to_them   boolean,
  moved_at        timestamptz,
  created_at      timestamptz not null default now(),

  constraint number_change_routed check (routed_to in ('case_manager', 'super_admin')),
  constraint number_change_status check (status in ('waiting', 'approved', 'denied')),
  constraint number_change_new_e164 check (new_phone ~ '^\+[1-9]\d{7,14}$'),
  constraint number_change_old_e164 check (old_phone ~ '^\+[1-9]\d{7,14}$'),
  constraint number_change_names_short check (
    char_length(first_name) between 1 and 80 and char_length(last_name) between 1 and 80
    and char_length(city) between 1 and 80 and char_length(who_knows) <= 120
  ),
  constraint number_change_case_manager_routed check (routed_to <> 'case_manager' or case_manager_id is not null),
  constraint number_change_protected_never_approved check (not (is_protected and status = 'approved'))
);

create index number_change_requests_waiting on public.number_change_requests (created_at) where status = 'waiting';
create index number_change_requests_new_phone on public.number_change_requests (new_phone, created_at);
create index number_change_requests_old_phone on public.number_change_requests (old_phone, created_at);
create index number_change_requests_requester on public.number_change_requests (requester_id);

comment on table public.number_change_requests is
  'Asking to move an account to a new phone number (D-567). No client policy: read and written only through '
  'the functions below. Deleted keep_days after the decision (number_change_rules).';

alter table public.number_change_requests enable row level security;
alter table public.number_change_requests force row level security;
revoke all on public.number_change_requests from public, anon, authenticated;
-- Said out loud: no client reads a row; only the functions below do.
create policy number_change_requests_no_client on public.number_change_requests for select using (false);

-- ---------------------------------------------------------------------------
-- 2. Asking. Called by the temporary sign-in, after the code on the new number.

create or replace function public.submit_number_change(
  p_old_phone  text,
  p_first_name text,
  p_last_name  text,
  p_city       text,
  p_who_knows  text default ''
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller      uuid := auth.uid();
  rules       jsonb := public.number_change_rules();
  v_new       text;
  v_old       text := public.to_e164(p_old_phone);
  v_first     text := btrim(coalesce(p_first_name, ''));
  v_last      text := btrim(coalesce(p_last_name, ''));
  v_city      text := btrim(coalesce(p_city, ''));
  v_who       text := btrim(coalesce(p_who_knows, ''));
  v_profile   public.profiles;
  v_protected boolean := false;
  v_route     text := 'super_admin';
  v_manager   uuid := null;
begin
  if caller is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  -- A number that already has an account signs in to it; there is nothing to move.
  if exists (select 1 from public.profiles where id = caller) then
    raise exception 'HAS_ACCOUNT';
  end if;

  select public.to_e164(phone) into v_new from auth.users where id = caller;
  if v_new is null or v_new !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'NOT_SIGNED_IN';
  end if;

  if v_old is null or v_old !~ '^\+[1-9]\d{7,14}$' or v_old = v_new
     or v_first = '' or v_last = '' or v_city = ''
     or char_length(v_first) > 80 or char_length(v_last) > 80 or char_length(v_city) > 80
     or char_length(v_who) > 120 then
    raise exception 'INVALID';
  end if;

  -- Two taps at once count once.
  perform pg_advisory_xact_lock(hashtext('number_change:' || v_new));

  if exists (select 1 from public.number_change_requests where new_phone = v_new and status = 'waiting') then
    raise exception 'ALREADY_WAITING';
  end if;

  if (select count(*) from public.number_change_requests
        where new_phone = v_new and created_at > now() - interval '1 day')
       >= (rules ->> 'per_new_number_per_day')::int
     or (select count(*) from public.number_change_requests
        where old_phone = v_old and created_at > now() - interval '7 days')
       >= (rules ->> 'per_old_number_per_week')::int then
    raise exception 'TOO_MANY';
  end if;

  select * into v_profile from public.profiles where phone = v_old;

  -- The super admin decides every request (v_route stays 'super_admin'); a super admin's own account
  -- is protected and never moves.
  if v_profile.id is not null and (v_profile.role = 'super_admin' or public.has_role(v_profile.id, 'super_admin')) then
    v_protected := true;
  end if;

  insert into public.number_change_requests
    (requester_id, new_phone, old_phone, first_name, last_name, city, who_knows,
     profile_id, routed_to, case_manager_id, is_protected)
  values
    (caller, v_new, v_old, v_first, v_last, v_city, v_who,
     v_profile.id, v_route, v_manager, v_protected);

  -- The same answer whatever was typed (D-567: nobody can find out whether a number has an account).
  return 'received';
end;
$$;

revoke all on function public.submit_number_change(text, text, text, text, text) from public, anon;
grant execute on function public.submit_number_change(text, text, text, text, text) to authenticated;

-- What the person who asked sees: waiting, approved or denied, and nothing about the account.
create or replace function public.my_number_change()
returns table (status text, created_at timestamptz)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.status, r.created_at
  from public.number_change_requests r
  where r.requester_id = auth.uid()
  order by r.created_at desc
  limit 1;
$$;

revoke all on function public.my_number_change() from public, anon;
grant execute on function public.my_number_change() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Who may decide a request, and the list each of them sees.

create or replace function public.number_change_decider(r public.number_change_requests, p_caller uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  -- The super admin, for now. A case manager arm (r.routed_to = 'case_manager' and their active
  -- assignment) waits on Will's signature to widen what a case manager can see.
  select (select public.is_super_admin()) and r.id is not null and p_caller is not null;
$$;

revoke all on function public.number_change_decider(public.number_change_requests, uuid) from public, anon, authenticated;

create or replace function public.number_changes_to_decide()
returns table (
  id           uuid,
  first_name   text,
  last_name    text,
  city         text,
  created_at   timestamptz,
  is_protected boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.id, r.first_name, r.last_name, r.city, r.created_at, r.is_protected
  from public.number_change_requests r
  where r.status = 'waiting'
    and public.number_change_decider(r, auth.uid())
  order by r.created_at;
$$;

revoke all on function public.number_changes_to_decide() from public, anon;
grant execute on function public.number_changes_to_decide() to authenticated;

-- One request, with the account beside it, for the person deciding.
create or replace function public.number_change_detail(p_id uuid)
returns table (
  id               uuid,
  status           text,
  created_at       timestamptz,
  first_name       text,
  last_name        text,
  city             text,
  who_knows        text,
  new_phone        text,
  old_phone_last4  text,
  has_account      boolean,
  is_protected     boolean,
  is_staff         boolean,
  account_first    text,
  account_last     text,
  account_city     text,
  invited_by_name  text,
  last_active_at   timestamptz,
  must_speak       boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  r      public.number_change_requests;
  p      public.profiles;
begin
  select * into r from public.number_change_requests x where x.id = p_id;
  if r.id is null or not public.number_change_decider(r, caller) then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  select * into p from public.profiles x where x.id = r.profile_id;

  return query select
    r.id, r.status, r.created_at, r.first_name, r.last_name, r.city, r.who_knows,
    r.new_phone, right(r.old_phone, 4),
    p.id is not null,
    r.is_protected,
    p.id is not null and (p.role in ('admin', 'provider', 'super_admin')
                          or public.has_role(p.id, 'admin') or public.has_role(p.id, 'provider')),
    p.first_name, p.last_name, p.home_city,
    (select i.first_name from public.profiles i where i.id = p.invited_by),
    p.last_active_at,
    (public.number_change_rules() ->> 'super_admin_must_speak')::boolean;
end;
$$;

revoke all on function public.number_change_detail(uuid) from public, anon;
grant execute on function public.number_change_detail(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Deciding.

-- A sign-in that only ever proved a new number: removed, never one that has an account.
create or replace function public.remove_temporary_signin(p_user uuid)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from auth.users u
   where u.id = p_user
     and not exists (select 1 from public.profiles p where p.id = u.id);
$$;

revoke all on function public.remove_temporary_signin(uuid) from public, anon, authenticated;

create or replace function public.decide_number_change(
  p_id       uuid,
  p_decision text,
  p_spoke    boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  r      public.number_change_requests;
  v_spoke boolean;
begin
  if p_decision not in ('approved', 'denied') then
    raise exception 'INVALID';
  end if;

  select * into r from public.number_change_requests where id = p_id for update;
  if r.id is null or not public.number_change_decider(r, caller) then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if r.status <> 'waiting' then
    raise exception 'REQUEST_ALREADY_DECIDED';
  end if;

  if p_decision = 'approved' then
    if r.is_protected then
      raise exception 'CANNOT_MOVE';
    end if;
    if r.profile_id is null then
      raise exception 'NO_ACCOUNT';
    end if;
    if (public.number_change_rules() ->> 'super_admin_must_speak')::boolean and not coalesce(p_spoke, false) then
      raise exception 'MUST_SPEAK';
    end if;
    v_spoke := coalesce(p_spoke, false);
    -- The new number must not have become somebody's account in the meantime.
    if exists (select 1 from public.profiles where phone = r.new_phone) then
      raise exception 'NEW_NUMBER_IN_USE';
    end if;
  end if;

  update public.number_change_requests
     set status = p_decision, decided_by = caller, decided_at = now(), spoke_to_them = v_spoke
   where id = r.id;

  -- A no: the temporary sign-in goes at once (it never had a profile; Lena's Privacy line p14).
  if p_decision = 'denied' then
    perform public.remove_temporary_signin(r.requester_id);
  end if;

  -- No name and no phone in the audit log (D-443).
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller,
          case p_decision when 'approved' then 'number_change.approve' else 'number_change.deny' end,
          'profile', r.profile_id,
          jsonb_build_object('request_id', r.id, 'spoke_to_them', v_spoke));

  return p_decision;
end;
$$;

revoke all on function public.decide_number_change(uuid, text, boolean) from public, anon;
grant execute on function public.decide_number_change(uuid, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Moving, for the `move-number` Edge Function only (service role).

-- What to move, if this caller approved this request and it has not moved yet.
create or replace function public.number_change_to_move(p_id uuid, p_caller uuid)
returns table (requester_id uuid, profile_id uuid, new_phone text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.requester_id, r.profile_id, r.new_phone
  from public.number_change_requests r
  where r.id = p_id
    and r.status = 'approved'
    and r.moved_at is null
    and r.decided_by = p_caller
    and r.profile_id is not null
    and not r.is_protected;
$$;

revoke all on function public.number_change_to_move(uuid, uuid) from public, anon, authenticated;
grant execute on function public.number_change_to_move(uuid, uuid) to service_role;

-- After the sign-in has moved: the account's own record follows, and the request says so.
create or replace function public.number_change_moved(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r public.number_change_requests;
begin
  select * into r from public.number_change_requests where id = p_id for update;
  if r.id is null or r.status <> 'approved' or r.profile_id is null or r.is_protected then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if r.moved_at is not null then
    return;
  end if;

  update public.profiles set phone = r.new_phone where id = r.profile_id;
  update public.number_change_requests set moved_at = now(), requester_id = null where id = r.id;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (r.decided_by, 'number_change.moved', 'profile', r.profile_id, jsonb_build_object('request_id', r.id));
end;
$$;

revoke all on function public.number_change_moved(uuid) from public, anon, authenticated;
grant execute on function public.number_change_moved(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Forgetting: keep_days after the decision, or after the request if nobody decided it (with its
--    temporary sign-in).

create or replace function public.purge_number_change_requests()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  n integer;
  days int := (public.number_change_rules() ->> 'keep_days')::int;
begin
  -- Every request purged takes its temporary sign-in with it, whatever its status: a waiting one, and
  -- an approved one whose move never ran (the sign-in still carries the new number; Lena, 20:32). The
  -- helper never removes a sign-in that has a profile. Sign-ins first, then the rows (set null).
  perform public.remove_temporary_signin(r.requester_id)
     from public.number_change_requests r
    where coalesce(r.decided_at, r.created_at) < now() - make_interval(days => days)
      and r.requester_id is not null;

  delete from public.number_change_requests
   where coalesce(decided_at, created_at) < now() - make_interval(days => days);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_number_change_requests() from public, anon, authenticated;

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'purge-number-change-requests';
    perform cron.schedule(
      'purge-number-change-requests',
      '50 3 * * *',
      'select public.purge_number_change_requests()'
    );
  else
    raise notice 'pg_cron is not installed here; skipping the number change purge schedule';
  end if;
end;
$do$;

-- a_case_manager_asks_from_the_website_and_old_requests_are — a case manager asks to join from the
-- website, on a page of its own, and a request that was refused or that nobody answered is deleted
-- with the sign-in that made it (D-568; plan read by the merge desk 13 October 19:21, firm rules
-- 19:27, 19:48 and 19:51; Will's defaults on card a84).
--
-- Claimed 2026-10-13 20:37:25 UTC on `claude/pam-case-manager-request` with `pnpm claim migration`.
--
-- EXPAND. Two new nullable columns on `staff_requests`, new functions, one new trigger and a nightly
-- job. `request_staff_access`, `review_staff_request` and the policies are not touched; the live app
-- keeps working, and calls none of this until the page that does is live.
--
-- The shape:
--   1. The person proves their phone with the normal sign-in code first (the code is the rate
--      limit), so nothing is stored for a phone nobody proved and there is no public form for bots.
--   2. `request_case_manager_access` writes the request: name, city (one Pam serves),
--      organization and work email (staff need one, D-441). Somebody with an account cannot use it
--      (D-491: a signed-in member asks on their own account, and approving a case manager on an
--      account that exists is refused anyway). A request already waiting is not sent twice, one
--      that was approved is not reopened, one that was refused can be asked again (D-525).
--   3. The super admin decides it the way every staff request is decided (`review_staff_request`):
--      the existing bell, Requests, and the existing approved and denied texts. On approval the work
--      email moves onto the account (`profile_emails`, the D-441 table only a super admin reads) and
--      leaves the request row, so it is kept in one place.
--   4. Forgetting (`staff_request_rules`): a refused request is deleted `refused_keep_days` after
--      the decision, one nobody answered `unanswered_keep_days` after it was made. Each takes the
--      sign-in that made it when that sign-in has no profile, and never one that has an account.
--      The bell rows that carried the name, and a "no" text still addressed to the phone, go with
--      it. Approved requests are never purged: they stay with the account (useProgramRequest reads
--      them, D-525) and go when the account does (user_id cascades). This covers every staff
--      request, the program-lead ones too, and any refused row that exists when this ships.
--
-- The audit rows already written (`staff_request.deny`: the role, no name) stay; nothing here adds a
-- name, a phone or an email to the audit log (D-443).
--
-- Deleting a sign-in is `delete from auth.users` for a sign-in with no profile, through
-- `remove_temporary_signin`, defined exactly as D-567's migration defines it (whichever is applied
-- first creates it; the second replaces it with the same body). The merge desk confirms on the live
-- project that postgres may delete from auth.users before applying either.

-- ---------------------------------------------------------------------------
-- 0. Will's answers on card a84, in one place, so a different answer is a one-line change.

create or replace function public.staff_request_rules()
returns jsonb
language sql
immutable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    -- A refused request is deleted this long after the decision.
    'refused_keep_days', 30,
    -- A request nobody answered is deleted this long after it was made.
    'unanswered_keep_days', 90,
    -- A case manager gives a work email when they ask (D-441 needs one for staff).
    'work_email_required', true
  );
$$;

comment on function public.staff_request_rules() is
  'Card a84 settings for staff requests (D-568): how long refused and unanswered requests are kept, and whether a work email is required.';

-- ---------------------------------------------------------------------------
-- 1. What a case manager tells us about where they work.

alter table public.staff_requests
  add column if not exists organization text,
  add column if not exists work_email text;

alter table public.staff_requests
  add constraint staff_requests_organization_is_short
    check (organization is null or char_length(organization) between 1 and 120),
  add constraint staff_requests_work_email_looks_right
    check (
      work_email is null
      or (
        char_length(work_email) between 3 and 254
        and work_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
        and work_email = lower(work_email)
      )
    );

comment on column public.staff_requests.organization is
  'Where a case manager who asked from the website works (D-568). Shown to the super admin.';
comment on column public.staff_requests.work_email is
  'A case manager''s work email while the request waits (D-568). Moves to profile_emails on approval.';

-- ---------------------------------------------------------------------------
-- 2. Asking.

create or replace function public.request_case_manager_access(
  p_first_name   text,
  p_last_name    text,
  p_city         text,
  p_organization text,
  p_work_email   text,
  p_language     text default 'en'
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  existing public.staff_requests;
  v_first text := nullif(btrim(coalesce(p_first_name, '')), '');
  v_last  text := nullif(btrim(coalesce(p_last_name, '')), '');
  v_city  text;
  v_org   text := nullif(btrim(coalesce(p_organization, '')), '');
  v_email text := nullif(lower(btrim(coalesce(p_work_email, ''))), '');
begin
  if caller is null then
    raise exception 'NOT_SIGNED_IN';
  end if;
  -- Somebody with an account asks on it, not here (D-491).
  if exists (select 1 from public.profiles where id = caller) then
    raise exception 'HAS_ACCOUNT';
  end if;

  -- A city Pam serves, spelled the way Pam spells it.
  select r.name into v_city
    from public.regions r
   where lower(r.name) = lower(btrim(coalesce(p_city, '')))
   limit 1;

  if v_first is null or v_last is null or v_city is null or v_org is null
     or char_length(v_first) > 80 or char_length(v_last) > 80 or char_length(v_org) > 120
     or (v_email is null and (public.staff_request_rules() ->> 'work_email_required')::boolean)
     or (v_email is not null and (
           char_length(v_email) not between 3 and 254
           or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
         )) then
    raise exception 'INVALID';
  end if;

  -- Asking again (D-525): a request still waiting is not sent twice, one that was approved is not
  -- reopened, and one that was turned down can be asked again.
  select * into existing from public.staff_requests where user_id = caller for update;
  if existing.user_id is not null then
    if existing.decision is null then
      raise exception 'REQUEST_ALREADY_WAITING';
    end if;
    if existing.decision = 'approved' then
      raise exception 'REQUEST_ALREADY_APPROVED';
    end if;
  end if;

  insert into public.staff_requests (
    user_id, wants_role, first_name, last_name, city, organization, work_email, preferred_language
  )
  values (
    caller, 'admin', v_first, v_last, v_city, v_org, v_email,
    public.supported_language(btrim(coalesce(p_language, '')))
  )
  on conflict (user_id) do update
    set wants_role = excluded.wants_role,
        first_name = excluded.first_name,
        last_name  = excluded.last_name,
        city       = excluded.city,
        organization = excluded.organization,
        work_email   = excluded.work_email,
        program_name        = null,
        program_category    = null,
        program_subcategory = null,
        program_description = null,
        program_address     = null,
        program_phone       = null,
        program_website     = null,
        preferred_language  = excluded.preferred_language,
        created_at = now(),
        decision = null,
        reviewed_at = null,
        reviewed_by = null,
        region_id = null;

  return 'received';
end;
$$;

revoke all on function public.request_case_manager_access(text, text, text, text, text, text) from public, anon;
grant execute on function public.request_case_manager_access(text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. On approval the work email moves onto the account (D-441's table), and off the request.

create or replace function public.staff_request_email_to_account()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.decision = 'approved' and old.decision is null and new.work_email is not null then
    -- review_staff_request has made (or found) the profile before it marks the request approved.
    if exists (select 1 from public.profiles where id = new.user_id) then
      insert into public.profile_emails (profile_id, email)
      values (new.user_id, new.work_email)
      on conflict (profile_id) do nothing;   -- an account keeps the first email it was given
    end if;
    new.work_email := null;
  end if;
  return new;
end;
$$;

revoke all on function public.staff_request_email_to_account() from public, anon, authenticated;

create or replace trigger staff_requests_email_to_account
  before update of decision on public.staff_requests
  for each row execute function public.staff_request_email_to_account();

-- ---------------------------------------------------------------------------
-- 4. Forgetting.

-- A sign-in that only ever proved a phone: removed, never one that has an account. (The same body
-- as D-567's migration; whichever runs second replaces it with itself.)
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

create or replace function public.purge_staff_requests()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  refused_days    int := (public.staff_request_rules() ->> 'refused_keep_days')::int;
  unanswered_days int := (public.staff_request_rules() ->> 'unanswered_keep_days')::int;
  r record;
  n integer := 0;
begin
  for r in
    select s.user_id, u.phone
      from public.staff_requests s
      left join auth.users u on u.id = s.user_id
     where (s.decision = 'denied' and s.reviewed_at < now() - make_interval(days => refused_days))
        or (s.decision is null and s.created_at < now() - make_interval(days => unanswered_days))
       for update of s
  loop
    -- The bell rows that named them.
    delete from public.notifications
     where subject_type = 'staff_request' and subject_id = r.user_id;

    -- A "no" text still addressed to the phone (sent with no member, so it carries the number).
    if r.phone is not null then
      delete from public.outbound_messages o
       where o.member_id is null
         and o.template_key = 'staff_request_denied'
         and regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(r.phone, '\D', '', 'g');
    end if;

    delete from public.staff_requests where user_id = r.user_id;
    -- The sign-in that asked, when it has no account (an account keeps its sign-in).
    perform public.remove_temporary_signin(r.user_id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public.purge_staff_requests() from public, anon, authenticated;

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'purge-staff-requests';
    perform cron.schedule(
      'purge-staff-requests',
      '55 3 * * *',
      'select public.purge_staff_requests()'
    );
  else
    raise notice 'pg_cron is not installed here; skipping the staff request purge schedule';
  end if;
end;
$do$;

-- 0085 — A text or an email goes out in the language the person reads Pam in,
-- including when there is no profile yet to read it from (Will, 9 October 2026:
-- "We want SMS and emails to show up on their desired language"). D-424.
--
-- Most texts are queued against a member and rendered at send time in that
-- member's `preferred_language` (0039), so a member who switches language gets
-- their next text in it with nothing more to do. Two things are sent to people
-- who have no profile, and for those the language had nowhere to live:
--
--   * a staff request that is DENIED creates no profile, and its text was
--     queued with `locale = 'en'` written in (0055);
--   * a fresh invite link, mailed to whoever held an expired one, goes to an
--     address with nothing known about its owner (0071, 0077).
--
-- And one more, quieter: an APPROVED request creates its profile without a
-- language, so somebody who asked in Russian became an English-language
-- account the moment they were let in, and their approval text with it.
--
-- So the language is asked for where the person already is, in the language
-- they are reading, and carried:
--
--   * `staff_requests.preferred_language` — set when they ask; copied onto the
--     profile when approved, and onto the denial text's `locale` when denied.
--   * `invite_emails.locale` — set when the expired-link page asks for the
--     fresh one, read by whatever sends the email.
--
-- A value outside the languages the app offers (0083) is stored as English,
-- not refused: a person asking for access must not be turned away over a
-- language code. What reads it falls back to English for a language it has no
-- signed-off wording in, as texts already do.
--
-- ## Applying it — this one is by hand
--
-- Two functions change shape (a trailing `p_language text default 'en'`), and
-- the old signature has to be dropped first or a call would satisfy both and
-- Postgres would refuse it as ambiguous (the same call 0049 and 0056 made).
-- The live connector stops at a `drop`, so this goes in the SQL editor with
-- 0079–0081 and before the branch that calls it is merged:
--
--   * Migration first, app second: the old app calls `request_staff_access`
--     with eleven arguments and `request_invite_link` with two, and both still
--     resolve to the new functions through the default.
--   * App first, migration second would fail those two calls until it caught
--     up, because the app names `p_language`.
--
-- Run twice it changes nothing the second time. test/20_language_without_a_
-- profile_test.sql attacks it.

-- ---------------------------------------------------------------------------
-- 1. Somewhere to keep it

alter table public.staff_requests
  add column if not exists preferred_language text not null default 'en';

alter table public.invite_emails
  add column if not exists locale text not null default 'en';

-- Added only if it is not there (no `drop constraint` guard for the connector
-- to stop at). The same seven codes as profiles_language_supported (0083).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.staff_requests'::regclass
      and conname = 'staff_requests_language_supported'
  ) then
    alter table public.staff_requests
      add constraint staff_requests_language_supported
      check (preferred_language in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.invite_emails'::regclass
      and conname = 'invite_emails_locale_supported'
  ) then
    alter table public.invite_emails
      add constraint invite_emails_locale_supported
      check (locale in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'));
  end if;
end;
$$;

comment on column public.staff_requests.preferred_language is
  'The language the person was reading Pam in when they asked (0085). Copied '
  'onto the profile if approved, and onto the denial text''s locale if not.';
comment on column public.invite_emails.locale is
  'The language the person was reading Pam in when they asked for a fresh '
  'link (0085). The sender renders the email in it, in English if it has no '
  'signed-off wording in that language.';

-- A language the app offers, or English. Not exposed: only the definer
-- functions below call it.
create or replace function public.supported_language(p_language text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select case
    when p_language in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar') then p_language
    else 'en'
  end;
$$;

revoke all on function public.supported_language(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Asking for staff access says which language it was asked in

drop function if exists public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text
);

create or replace function public.request_staff_access(
  p_wants_role  text,
  p_first_name  text,
  p_last_name   text,
  p_city        text,
  p_program_name        text default null,
  p_program_category    text default null,
  p_program_subcategory text default null,
  p_program_description text default null,
  p_program_address     text default null,
  p_program_phone       text default null,
  p_program_website     text default null,
  p_language            text default 'en'
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if p_wants_role not in ('provider', 'admin') then
    raise exception 'That is not a role somebody can ask for';
  end if;

  insert into public.staff_requests (
    user_id, wants_role, first_name, last_name, city,
    program_name, program_category, program_subcategory, program_description,
    program_address, program_phone, program_website, preferred_language
  )
  values (
    caller, p_wants_role::public.user_role,
    nullif(btrim(coalesce(p_first_name, '')), ''),
    nullif(btrim(coalesce(p_last_name, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    nullif(btrim(coalesce(p_program_name, '')), ''),
    nullif(btrim(coalesce(p_program_category, '')), '')::public.service_category,
    nullif(btrim(coalesce(p_program_subcategory, '')), ''),
    nullif(btrim(coalesce(p_program_description, '')), ''),
    nullif(btrim(coalesce(p_program_address, '')), ''),
    nullif(btrim(coalesce(p_program_phone, '')), ''),
    nullif(btrim(coalesce(p_program_website, '')), ''),
    public.supported_language(btrim(coalesce(p_language, '')))
  )
  on conflict (user_id) do update
    set wants_role = excluded.wants_role,
        first_name = excluded.first_name,
        last_name  = excluded.last_name,
        city       = excluded.city,
        program_name        = excluded.program_name,
        program_category    = excluded.program_category,
        program_subcategory = excluded.program_subcategory,
        program_description = excluded.program_description,
        program_address     = excluded.program_address,
        program_phone       = excluded.program_phone,
        program_website     = excluded.program_website,
        preferred_language  = excluded.preferred_language,
        created_at = now();
end;
$$;

comment on function public.request_staff_access is
  'Records a claim to a staff role, and a program''s own details when the '
  'claim is to run one (0056), and the language it was asked in (0085). '
  'Creates no profile and grants nothing.';

revoke all on function public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Deciding it keeps the language

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

    -- The language they asked in becomes the language of the account (0085):
    -- without it an approved account opened in English whatever it was asked in,
    -- and so did the text that told them they were in.
    insert into public.profiles (
      id, role, first_name, last_name, home_city, phone,
      region_id, invited_by, access_status, preferred_language
    )
    values (
      p_user_id, request.wants_role, request.first_name, request.last_name,
      request.city, caller_phone, p_region_id, caller, 'active', request.preferred_language
    )
    returning * into new_profile;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'staff_request.approve', 'profile', p_user_id,
            jsonb_build_object('role', request.wants_role, 'region_id', p_region_id));

    -- A program lead who left their program's details gets it added directly
    -- rather than asked for again — same fields `services` (0003) always
    -- took, `needs_review` set true by its own existing trigger the moment a
    -- *_plain column is written, same as any other manual entry.
    if request.wants_role = 'provider' and request.program_name is not null then
      insert into public.services (
        name, category, subcategory, description_plain, address, phone, website,
        source, is_active
      )
      values (
        request.program_name, request.program_category, request.program_subcategory,
        request.program_description, request.program_address, request.program_phone,
        request.program_website, 'manual', true
      );

      insert into public.audit_log (actor_id, action, target_type, target_id, meta)
      values (caller, 'staff_request.program_added', 'service', p_user_id,
              jsonb_build_object('name', request.program_name));
    end if;

    insert into public.outbound_messages (member_id, template_key, vars)
    values (
      p_user_id, 'staff_request_approved',
      jsonb_build_object('link', (select value from public.app_settings where key = 'app_url'))
    );
  else
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'staff_request.deny', 'staff_request', p_user_id,
            jsonb_build_object('role', request.wants_role));

    select phone into caller_phone from auth.users where id = p_user_id;
    -- Sent with no member (there is no profile), so the language travels on the
    -- row. It was written as 'en' here until 0085.
    insert into public.outbound_messages (phone, locale, template_key, vars)
    values (
      caller_phone, request.preferred_language, 'staff_request_denied',
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
  'Approves or denies a staff_requests row. Approving a provider request '
  'with program details also adds the program to services (0056). The '
  'language the person asked in becomes their account''s, or the language of '
  'the text that says no (0085). Super admin only, checked inside the body.';

revoke all on function public.review_staff_request(uuid, text, uuid) from public, anon;
grant execute on function public.review_staff_request(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. A fresh invite link is mailed in the language it was asked for in

drop function if exists public.request_invite_link(text, text);

create or replace function public.request_invite_link(
  p_code     text,
  p_email    text,
  p_language text default 'en'
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  inv     public.invites;
  fresh   public.invites;
  address text := lower(trim(coalesce(p_email, '')));
begin
  if address !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(address) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;

  select * into inv from public.invites where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if inv.status in ('redeemed', 'revoked') then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if inv.expires_at >= now() and inv.status = 'pending' then
    raise exception 'INVITE_STILL_VALID';
  end if;

  -- Asked already: the same answer, and no second email.
  if exists (select 1 from public.invite_emails where expired_invite = inv.id) then
    return true;
  end if;

  update public.invites set status = 'expired' where id = inv.id and status = 'pending';

  insert into public.invites (code, created_by, role, region_id, assigned_admin_id, phone, first_name)
  values (public.generate_invite_code(), inv.created_by, inv.role, inv.region_id,
          inv.assigned_admin_id, inv.phone, inv.first_name)
  returning * into fresh;

  insert into public.invite_emails (expired_invite, new_invite, email, locale)
  values (inv.id, fresh.id, address, public.supported_language(btrim(coalesce(p_language, ''))));

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (null, 'invite.reissue', 'invite', fresh.id,
          jsonb_build_object('expired_invite', inv.id));

  return true;
end;
$$;

revoke all on function public.request_invite_link(text, text, text) from public;
grant execute on function public.request_invite_link(text, text, text) to anon, authenticated;

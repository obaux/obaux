-- 0056 — What a program lead already knows about their own program.
--
-- Will, 17 September: when somebody picks "Program" at sign-up, collect the
-- program's own details there — manual entry only for now, prepared so a
-- "pull from a Google Maps link" option can plug in later without reworking
-- the form or this table. The fields mirror `services` (0003) exactly, so
-- approving a request with program details can hand them straight to the
-- catalogue rather than asking the same person to type them twice.
--
-- Kept on `staff_requests` rather than a new table: this is still a claim,
-- the same as the role itself, until a super admin approves it (0054).

alter table public.staff_requests
  add column if not exists program_name        text,
  add column if not exists program_category     public.service_category,
  add column if not exists program_subcategory  text,
  add column if not exists program_description  text,
  add column if not exists program_address      text,
  add column if not exists program_phone        text,
  add column if not exists program_website      text;

alter table public.staff_requests
  add constraint staff_requests_program_description_is_short
  check (program_description is null or char_length(program_description) <= 200);

alter table public.staff_requests
  add constraint staff_requests_program_phone_e164
  check (program_phone is null or program_phone ~ '^\+[1-9]\d{7,14}$');

comment on column public.staff_requests.program_name is
  'Set only for a "provider" (program lead) request. Manual entry only —
   the Google Maps auto-fill option this form leaves room for is not built
   (0056). Carried straight into services.name when the request is approved.';

-- ---------------------------------------------------------------------------
-- Accepting the program fields at the point of claim.
--
-- Dropped before the new shape is created, not after: with both signatures
-- present at once, an unqualified `comment on function` right below is
-- ambiguous, and the drop has to happen first either way (0049 made the same
-- call for `redeem_invite` — PostgREST resolves an RPC call by the arguments
-- it is given, and a four-argument call would satisfy both signatures).
drop function if exists public.request_staff_access(text, text, text, text);

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
  p_program_website     text default null
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
    program_address, program_phone, program_website
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
    nullif(btrim(coalesce(p_program_website, '')), '')
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
        created_at = now();
end;
$$;

comment on function public.request_staff_access is
  'Records a claim to a staff role, and a program''s own details when the '
  'claim is to run one (0056). Creates no profile and grants nothing.';

revoke all on function public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Approving a program lead who left program details hands them straight to
-- the catalogue, the same information a super admin would otherwise have to
-- type in by hand from a phone call.

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
  'Approves or denies a staff_requests row. Approving a provider request '
  'with program details also adds the program to services (0056). Super '
  'admin only, checked inside the function body.';

revoke all on function public.review_staff_request(uuid, text, uuid) from public, anon;
grant execute on function public.review_staff_request(uuid, text, uuid) to authenticated;

-- An approved program lead gets an organisation (D-447; before-launch, Programs).
--
-- `review_staff_request` approved a program lead and added their program to
-- `services`, but with no `org_id` on the listing and none on the lead's
-- profile. `services_write_provider` (0007) and `services_select_own_org` both
-- need `org_id = my_org()`, so the lead could neither read nor edit the
-- program they had just been approved for. This gives them an org, makes it
-- theirs, and puts the listing in it.
--
-- ## Applies on top of 0085 — 0085 FIRST
--
-- This is 0085's `review_staff_request` with that one change, so it carries
-- 0085's language handling (the profile takes `staff_requests.preferred_
-- language`). 0085 is applied by hand (it drops two signatures, which the live
-- connector refuses, D-387). It must be live before this: the guard below
-- refuses to run on a database without 0085's column, rather than replace a
-- function whose body would then name a column that is not there.
--
-- Not an expand/contract problem: the function keeps its signature and what it
-- returns; an approved lead just ends up with an org. Existing approved leads
-- are not repaired by this (their listings have no org); the first time such a
-- lead uses "Add a program", `submit_program` (20261010042108) gives them one.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'staff_requests'
      and column_name = 'preferred_language'
  ) then
    raise exception 'APPLY_0085_FIRST: staff_requests.preferred_language is missing; apply 0085 (packages/db/manual/2026-10-09-language-where-there-is-no-profile.sql) before this migration';
  end if;
end;
$$;

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
  new_org uuid;
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
    -- rather than asked for again — and, new in this migration, with an
    -- organisation of its own that the lead belongs to. Until now the listing
    -- was written with no `org_id` and the profile with none either, so the
    -- lead could neither read nor edit the program they had just been
    -- approved for (`services_write_provider` needs `org_id = my_org()`).
    if request.wants_role = 'provider' and request.program_name is not null then
      insert into public.orgs (name, type, address, phone, website, region_id)
      values (
        request.program_name, 'program', request.program_address,
        request.program_phone, request.program_website, p_region_id
      )
      returning id into new_org;

      update public.profiles set org_id = new_org where id = p_user_id;

      insert into public.services (
        org_id, name, category, subcategory, description_plain, address, phone,
        website, source, is_active
      )
      values (
        new_org, request.program_name, request.program_category,
        request.program_subcategory, request.program_description,
        request.program_address, request.program_phone, request.program_website,
        'manual', true
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
  'with program details also gives the lead an organisation and adds the '
  'program to it (0056, this migration). The language the person asked in '
  'becomes their account''s, or the language of the text that says no (0085). '
  'Super admin only, checked inside the body.';

revoke all on function public.review_staff_request(uuid, text, uuid) from public, anon;
grant execute on function public.review_staff_request(uuid, text, uuid) to authenticated;

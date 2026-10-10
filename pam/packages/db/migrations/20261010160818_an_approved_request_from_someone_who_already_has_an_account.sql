-- Approving a staff request from someone who already has an account (D-491).
--
-- A person asked to lead a program on 16 September. 46 seconds later the same
-- phone became a member. `review_staff_request` inserted a new profile and
-- raised "This person already has an account", so the request could never be
-- approved: a super admin's Approve answered 400, and the screen could say only
-- "We could not save that".
--
-- Now, for an existing account:
--   * a member (or someone who already leads a program) asked to be a program
--     lead is given the provider role on the account they have, the way
--     add_role_from_invite does (0078) — a profile_roles row granted by the
--     super admin, the acting role set to provider, and, if the request carries
--     program details, the org and listing the no-profile path makes — and the
--     request is decided. Their own city stays theirs: a different p_region_id
--     is refused (ACCOUNT_IN_OTHER_CITY);
--   * any other pair (a member asking to be a case manager, a case manager
--     asking anything) raises ROLE_PAIR_NOT_ALLOWED, which the screen explains.
-- The path for someone with no profile, and denying, are unchanged.
--
-- EXPAND ONLY: same signature, same return; create or replace, no DROP.

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
  existing public.profiles;
  final_region uuid := p_region_id;
  holds_other boolean;
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
    select * into existing from public.profiles where id = p_user_id;
    if existing.id is not null then
      -- They became a member (or something else) while the request waited. A
      -- member who is asked to lead a program gets that role on the account they
      -- have, the way add_role_from_invite does (0078); nothing else can be added.
      select exists (
        select 1 from public.profile_roles r
        where r.profile_id = p_user_id and r.role not in ('member', 'provider')
      ) into holds_other;
      if request.wants_role <> 'provider' or holds_other then
        raise exception 'ROLE_PAIR_NOT_ALLOWED';
      end if;
      -- Their own city stays theirs.
      if p_region_id is not null and p_region_id is distinct from existing.region_id then
        raise exception 'ACCOUNT_IN_OTHER_CITY';
      end if;
      final_region := existing.region_id;

      insert into public.profile_roles (profile_id, role, granted_by)
      values (p_user_id, 'provider', caller)
      on conflict do nothing;

      -- Start in the new role, as on the invite path: they asked for it.
      update public.profiles set role = 'provider' where id = p_user_id;

      insert into public.audit_log (actor_id, action, target_type, target_id, meta)
      values (caller, 'staff_request.approve', 'profile', p_user_id,
              jsonb_build_object('role', request.wants_role, 'region_id', final_region, 'added_to_existing', true));

      if request.program_name is not null and existing.org_id is null then
        insert into public.orgs (name, type, address, phone, website, region_id)
        values (
          request.program_name, 'program', request.program_address,
          request.program_phone, request.program_website, final_region
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
    end if;
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
      region_id = final_region
  where user_id = p_user_id
  returning * into request;

  return request;
end;
$$;

comment on function public.review_staff_request is
  'Approves or denies a staff_requests row. Approving a provider request '
  'with program details also gives the lead an organisation and adds the '
  'program to it (0056, 0085, D-447). The language the person asked in '
  'becomes their account''s, or the language of the text that says no (0085). '
  'Someone who already has an account is given the provider role on it (D-491). '
  'Super admin only, checked inside the body.';

revoke all on function public.review_staff_request(uuid, text, uuid) from public, anon;
grant execute on function public.review_staff_request(uuid, text, uuid) to authenticated;

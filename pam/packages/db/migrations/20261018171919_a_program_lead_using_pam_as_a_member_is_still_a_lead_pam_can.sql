-- A program lead who is using Pam as a member is still the program's lead, and Pam can write to them (Piper, Ava's question about
-- "Message this program"; Mira, 18 October).
--
-- `pam_program_has_lead` and `pam_start_program_conversation` looked for `profiles.role = 'provider'`, which since 0078 is the role
-- the account is ACTING AS right now. `service_has_lead` and `message_program` read `profile_roles`, the roles the account holds. So
-- a lead using Pam as a member was skipped by Pam's two functions, though a member's message to that program would reach them.
-- Both now read `profile_roles`, as the other two do. Same arguments, same results for everyone else; only the lead found changes.
--
-- Only functions are restated (create or replace); their grants stay as they were.

create or replace function public.pam_start_program_conversation(p_service uuid, p_body text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_org uuid;
  v_lead uuid;
  v_n integer := 0;
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;

  select s.org_id into v_org from public.services s where s.id = p_service;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  for v_lead in
    select p.id from public.profiles p
    join public.profile_roles r on r.profile_id = p.id and r.role = 'provider'
    where p.access_status = 'active' and v_org is not null and p.org_id = v_org
    order by p.created_at
  loop
    perform public.pam_start_conversation(v_lead, p_body);
    v_n := v_n + 1;
  end loop;

  if v_n = 0 then
    raise exception 'PAM_NO_ACTIVE_LEAD';
  end if;
  return v_n;
end;
$$;

create or replace function public.pam_program_has_lead(p_service uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;
  return exists (
    select 1
    from public.services s
    join public.profiles p on p.org_id = s.org_id
    join public.profile_roles r on r.profile_id = p.id and r.role = 'provider'
    where s.id = p_service and s.org_id is not null and p.access_status = 'active'
  );
end;
$$;

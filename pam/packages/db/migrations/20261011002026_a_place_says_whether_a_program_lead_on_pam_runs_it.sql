-- Whether a place has a program lead on Pam (D-498).
--
-- Places get into Pam two ways: gathered from public lists (the city's list of
-- providers, a library's own page) and added by a program lead on Pam. Only the
-- second has anyone on Pam to be told about a visit — and nothing tells even
-- them today. Will, 10 October 2026: "if I have public library links and the
-- user goes ahead and books a visit, we need to let them know that this is for
-- their organizational purposes only and we don't notify the library for
-- programs that are not built by program leads."
--
-- ## The rule
--
-- A place HAS A PROGRAM LEAD ON PAM when its listing belongs to an organisation
-- (`services.org_id`) that has an active account holding the provider role
-- (`profiles.org_id`, `profile_roles`). It is NOT `services.source` alone:
-- `manual` also covers places Pam staff typed in by hand with no lead, and a
-- lead can claim a listing that was imported. Everything else is a place
-- gathered from public information.
--
-- The app asks, and says so to a member planning a visit (and shows a program
-- lead their program's tools only when they have one). The answer is yes or no
-- for a listing the member can already read: nothing about who the lead is.
--
-- EXPAND ONLY: two new functions.

create or replace function public.service_has_lead(p_service_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  return exists (
    select 1
    from public.services s
    join public.profiles p on p.org_id = s.org_id
    join public.profile_roles r on r.profile_id = p.id and r.role = 'provider'
    where s.id = p_service_id
      and s.org_id is not null
      and p.access_status = 'active'
  );
end;
$$;

-- Several at once: the ids, out of those asked about, that have a lead.
create or replace function public.places_with_leads(p_ids uuid[])
returns setof uuid
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if coalesce(array_length(p_ids, 1), 0) > 200 then
    raise exception 'TOO_MANY_PLACES';
  end if;
  return query
  select distinct s.id
  from public.services s
  join public.profiles p on p.org_id = s.org_id
  join public.profile_roles r on r.profile_id = p.id and r.role = 'provider'
  where s.id = any (coalesce(p_ids, '{}'))
    and s.org_id is not null
    and p.access_status = 'active';
end;
$$;

revoke all on function public.service_has_lead(uuid) from public, anon;
revoke all on function public.places_with_leads(uuid[]) from public, anon;
grant execute on function public.service_has_lead(uuid) to authenticated;
grant execute on function public.places_with_leads(uuid[]) to authenticated;

comment on function public.service_has_lead is
  'Whether a place has a program lead on Pam: its organisation has an active '
  'provider account (D-498). Not services.source alone.';
comment on function public.places_with_leads is
  'The places, out of up to 200 asked about, that have a program lead on Pam (D-498).';

-- The super admin can see whose number it is when answering by text (D-583).
--
-- Answer by text (D-524) opens with a bare number. Iris's W3: it does not say who wrote. If Pam knows
-- the number, the screen now says the person's first name. That is all this adds: no new column, no new
-- table, nothing stored. The question and when it was sent come from the link, not the database (the
-- help form's message is stored nowhere, D-521).
--
-- What the super admin may see: every person's first name, role and region is already theirs in
-- Everyone (`directory_people`). What they could not do is go from a number to a name, so this does
-- that for one number at a time, to a super admin only, returning a first name and nothing else
-- (no last name, role, region, id or status), and null for a number Pam does not know or a value
-- that is not a phone number.

create or replace function public.profile_first_name_for_phone(p_phone text)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  found text;
begin
  if not public.is_super_admin() then
    raise exception 'Only the person running PAM looks up a number';
  end if;
  if p_phone is null or p_phone !~ '^\+[1-9]\d{7,14}$' then
    return null;
  end if;
  select p.first_name into found
  from public.profiles p
  where p.phone = p_phone
  limit 1;
  return found;
end;
$$;

revoke all on function public.profile_first_name_for_phone(text) from public, anon;
grant execute on function public.profile_first_name_for_phone(text) to authenticated;

comment on function public.profile_first_name_for_phone is
  'The first name of the account with this phone number, for the super admin answering a help request by text '
  '(D-583). Super admin only, one number at a time, a first name and nothing else; null if Pam does not know the number.';

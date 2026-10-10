-- A program reads who signed its policies, by first name and date (D-261,
-- D-485; Will's card a25, point 1: "A program sees the member's first name and
-- the date they signed"). Part 3 of 4.
--
-- `policy_signatures` is readable only by the member who signed (part 2). A
-- program reads the record through this one function, which returns a first
-- name and a date for each signature on its own program's policies — never the
-- picture, never a phone number, never a last name. It is what the policy's
-- Signed tab lists, and what the small verified tick beside a person reads:
-- they signed every current policy.
--
-- Only the program's own lead (and an admin or super admin) may ask, and only
-- for their own program; any other program reads as not found.
--
-- EXPAND ONLY: one function.

create or replace function public.program_policy_signers(p_service_id uuid)
returns table (
  policy_id  uuid,
  member_id  uuid,
  first_name text,
  signed_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  if not public.is_admin() and not exists (
    select 1 from public.services s
    where s.id = p_service_id and s.org_id is not null and s.org_id = public.my_org()
      and public.my_role() = 'provider'
  ) then
    raise exception 'PROGRAM_NOT_FOUND';
  end if;

  return query
  select sig.policy_id, sig.member_id, pr.first_name, sig.signed_at
  from public.policy_signatures sig
  join public.program_policies pol on pol.id = sig.policy_id
  join public.profiles pr on pr.id = sig.member_id
  where pol.service_id = p_service_id
  order by sig.signed_at desc;
end;
$$;

revoke all on function public.program_policy_signers(uuid) from public, anon;
grant execute on function public.program_policy_signers(uuid) to authenticated;

comment on function public.program_policy_signers is
  'Who signed a program''s policies: first name and date, never the picture '
  '(D-485, a25). The program''s own lead, or an admin.';

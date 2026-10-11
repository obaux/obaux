-- Asking again to run a program (D-525).
--
-- A member can now ask to add a program from Profile ("anyone should be able to
-- create a program", Will, 11 October 2026; Pam's team checks it once by hand).
-- `request_staff_access` is the door, and it already works for anybody signed in
-- (D-491 made Approve work for somebody who already has an account). What it did
-- not do was say what happens to a second ask:
--
--   * a request still WAITING is not sent twice (REQUEST_ALREADY_WAITING);
--   * one that was APPROVED is not reopened (REQUEST_ALREADY_APPROVED);
--   * one that was turned down can be asked again: the new ask is a waiting
--     request, with the answer cleared, so Approve works on it. Before, the
--     upsert kept the old decision and Approve then said "already decided".
--
-- Same signature, same return; create or replace, no DROP. EXPAND ONLY.

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
  existing public.staff_requests;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if p_wants_role not in ('provider', 'admin') then
    raise exception 'That is not a role somebody can ask for';
  end if;

  -- Asking again (D-525): a request still waiting is not sent twice, one that was
  -- approved is not reopened, and one that was turned down can be asked again,
  -- which makes it a waiting request once more.
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
        created_at = now(),
        decision = null,
        reviewed_at = null,
        reviewed_by = null,
        region_id = null;
end;
$$;

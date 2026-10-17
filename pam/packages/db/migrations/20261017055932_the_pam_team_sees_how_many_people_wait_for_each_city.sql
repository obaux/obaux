-- The Pam team sees how many people wait for each city (D-593; card a96, Will 17 October: "let's save the city and how
-- many requests there are for that city … We'll want that number as a reference to decide which cities to prioritize
-- next"). Expand only: one new function, nothing changed or removed.
--
-- `waiting_cities` (0046) holds one row per person who signed up from a city Pam is not in, the city as they typed it.
-- Nothing read it. This adds the one reader, for the super admin's Home:
--
--   * Counts only. It returns a place and a number, never a person, a phone, a name, an id or a date.
--   * Only a super admin can run it (`is_super_admin()`), checked inside, as `programs_to_check()` does. Anyone else,
--     signed in or not, gets an error and no rows. `security definer`, because `waiting_cities` lets a person read only
--     their own row.
--   * How a typed city is grouped (D-593): spaces trimmed and squeezed, case ignored. A state after a comma is kept
--     apart, upper-cased: "Camden", " camden " and "CAMDEN" are one place; "Camden, NJ" and "camden, nj" are another;
--     "Camden, New Jersey" is a third (no state names are matched to their letters). The place is shown as most people
--     typed it; on a tie, the spelling in ordinary case ("Camden" over "CAMDEN" or "camden").
--   * Biggest first, then by name.
--
-- Covered by Privacy what-we-keep.p16, signed by Will: the cities are kept "so we know where to open next. Only the Pam
-- team can see them."

create or replace function public.waiting_city_counts()
returns table (place text, people integer)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_super_admin() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;

  return query
  with typed as (
    select
      regexp_replace(btrim(split_part(w.city, ',', 1)), '\s+', ' ', 'g') as city_part,
      nullif(upper(regexp_replace(btrim(substr(w.city, length(split_part(w.city, ',', 1)) + 2)), '\s+', ' ', 'g')), '') as state_part
    from public.waiting_cities w
    where btrim(w.city) <> ''
  ),
  spellings as (
    -- Each way a place was typed, and how often.
    select lower(t.city_part) as city_key, t.state_part, t.city_part, count(*) as times
    from typed t
    where t.city_part <> ''
    group by lower(t.city_part), t.state_part, t.city_part
  ),
  grouped as (
    select
      s.city_key,
      s.state_part,
      sum(s.times)::integer as n,
      -- Shown as most people typed it; on a tie, a spelling in ordinary case ("Camden") over all capitals or none.
      (array_agg(s.city_part order by s.times desc,
                 (s.city_part <> upper(s.city_part) and s.city_part <> lower(s.city_part)) desc,
                 s.city_part))[1] as shown
    from spellings s
    group by s.city_key, s.state_part
  )
  select g.shown || coalesce(', ' || g.state_part, ''), g.n
  from grouped g
  order by g.n desc, lower(g.shown), g.state_part nulls first;
end;
$$;

revoke all on function public.waiting_city_counts() from public, anon;
grant execute on function public.waiting_city_counts() to authenticated;

comment on function public.waiting_city_counts is
  'How many people wait for each city Pam is not in (D-593): a place and a count, biggest first. Super admin only, '
  'checked inside. Never a person, a phone, a name, an id or a date.';

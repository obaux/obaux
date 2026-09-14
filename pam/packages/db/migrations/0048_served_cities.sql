-- 0048 — The list of cities PAM is actually in.
--
-- Sign-up asks somebody which city they live in, and has to answer two
-- questions from that: is PAM here, and if not, where is it? The second one is
-- the difference between "no" and "not yet, and here is where we are" — and
-- somebody who has just typed their name into a form deserves the second.
--
-- `regions` cannot answer it from the browser. Its read policy is
-- `id = my_region() or my_role() in ('provider','member')` (0007), and a person
-- signing up has no profile, so no role and no region: they read nothing. That
-- is the right policy — which city an account belongs to is not public — but
-- the NAMES of the cities PAM serves are on the website.
--
-- So: a function that returns names and nothing else. No ids (an id is what
-- ties a person to a region), no counts, no addresses. Callable by anon as well
-- as authenticated, because the screen that needs it is the one before anybody
-- has signed in.

create or replace function public.served_cities()
returns table (city text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.name from public.regions r order by r.name;
$$;

comment on function public.served_cities is
  'The names of the cities PAM serves, for the sign-up screen. Names only: an '
  'id would tie an account to a region, and this is readable by anybody.';

revoke all on function public.served_cities() from public;
grant execute on function public.served_cities() to anon, authenticated;

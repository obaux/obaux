-- A person's city is read by their own session and the database, not by their partners, STEP 1 of 2 (Lena's privacy guard; Mira, 19 October).
--
-- This step ONLY ADDS `my_region_info()`, the one way a person reads their own city once `profiles.region_id` is closed to the client roles
-- (step 2, 20261019031757, the revoke, applied only after the app that calls this has been live long enough for open copies to reload).
-- Nothing the live app does changes with this file: it adds a function.
--
-- WHY TWO STEPS. The app live before this change selects `region_id` and embeds `regions(name)` in its own profile read. After the revoke that
-- read is denied for the whole row, so every open copy of the old app would fail its sign-in read (it shows the session error screen, not a signed-out
-- one: `useSession` treats any profile error as an error state). So: (1) this function, (2) the app reads the function, (3) the revoke.
--
-- `my_region_info()` answers the signed-in person's own city (id and name), nothing about anyone else. Add only; no drop.

create or replace function public.my_region_info()
returns table (region_id uuid, name text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.region_id, r.name
  from public.profiles p
  left join public.regions r on r.id = p.region_id
  where p.id = auth.uid();
$$;
revoke all on function public.my_region_info() from public, anon;
grant execute on function public.my_region_info() to authenticated;

comment on function public.my_region_info() is
  'The signed-in person''s own city, id and name (20261019025010). The way a client role reads its own profiles.region_id once the column is closed '
  '(20261019031757).';

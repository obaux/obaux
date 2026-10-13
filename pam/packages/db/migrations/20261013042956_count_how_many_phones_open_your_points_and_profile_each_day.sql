-- How many phones open Your points and Profile, each day (a69, signed as a76; D-555).
--
-- Will, 12 October: "set up a way to analyze how many members tap on rewards screen so we can
-- learn the demand for it." Iris's plan (docs/research/2026-10-12-rewards-interest-plan.md):
-- one number per screen per day, for everyone together.
--
-- What the table holds: a day, a screen and a count. Nothing else, so nothing a person could be
-- found from: no profile id, no account, no device, no time of day, no place, no language. The
-- phone counts itself at most once a day through a note it keeps on the phone and never sends,
-- so the number is roughly "phones that opened it today".
--
-- The call is made while signed in, so the ordinary request log sees who asked, as it does for
-- every request; that log is deleted within a week. This table never has it and nothing joins
-- the two: the function reads `auth.uid()` only to refuse a signed-out caller and stores
-- nothing from it.
--
-- Only 'points' and 'profile'. Counting any other screen needs a new line in Privacy first.

create table if not exists public.screen_open_counts (
  day    date not null,
  screen text not null check (screen in ('points', 'profile')),
  count  integer not null default 0 check (count >= 0),
  primary key (day, screen)
);

alter table public.screen_open_counts enable row level security;
alter table public.screen_open_counts force row level security;
revoke all on public.screen_open_counts from public, anon, authenticated;
-- Nobody through the API, on purpose; the policy says so (test 03 wants every RLS table to carry one).
create policy screen_open_counts_no_client on public.screen_open_counts for select using (false);

comment on table public.screen_open_counts is
  'Phones that opened Your points or Profile, per day (a76, D-555). One row per (day, screen). '
  'No person, device, time or place is stored. Read only through screen_opens_weekly().';

-- The day is Philadelphia's, so a week is Monday to Sunday there.
create or replace function public.count_screen_open(p_screen text)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  today date := (now() at time zone 'America/New_York')::date;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if p_screen is null or p_screen not in ('points', 'profile') then
    raise exception 'SCREEN_NOT_COUNTED';
  end if;

  insert into public.screen_open_counts as c (day, screen, count)
  values (today, p_screen, 1)
  on conflict (day, screen) do update set count = c.count + 1;
end;
$$;

revoke all on function public.count_screen_open(text) from public, anon;
grant execute on function public.count_screen_open(text) to authenticated;

comment on function public.count_screen_open is
  'Adds one to today''s count for Your points or Profile. Takes only the screen name, stores '
  'nothing about the caller, returns nothing, and refuses any other screen (a76, D-555).';

-- The weekly read, for the merge desk and Will on Iris's behalf. Service role only. A week is
-- Monday to Sunday, Philadelphia time. A total under 5 is shown as "under 5": the table itself
-- keeps the exact number, and that is why the Privacy line says "shows only as under 5 in our
-- reports" and not "hidden".
create or replace function public.screen_opens_weekly()
returns table (week_start date, screen text, shown text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    date_trunc('week', c.day)::date as week_start,
    c.screen,
    case when sum(c.count) < 5 then 'under 5' else sum(c.count)::text end as shown
  from public.screen_open_counts c
  group by 1, 2
  order by 1 desc, 2;
$$;

revoke all on function public.screen_opens_weekly() from public, anon, authenticated;
grant execute on function public.screen_opens_weekly() to service_role;

comment on function public.screen_opens_weekly is
  'Weekly totals per screen, Monday to Sunday (Philadelphia), with any total under 5 shown as '
  '"under 5". Service role only (a76, D-555).';

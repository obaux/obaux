-- A member makes a secret calendar address for their Pam visits (D-538).
--
-- A calendar app can follow an address and show what is at it. A member makes one, pastes
-- it into Apple, Google or Outlook, and their Pam visits appear there and move or go when
-- the visit does. Read-only: nothing in the calendar changes Pam.
--
-- ## The address is a secret
--
-- 32 random bytes. ONLY ITS HASH is stored (`token_hash`), so a copy of the database holds
-- no one's address. `calendar_link_make()` returns the token once; "make a new one" is how
-- a member sees an address again, and the old one stops at once. `calendar_link_off()`
-- deletes the row. Nothing is recorded about WHEN a calendar app asked (no last-read time);
-- the address itself is the key, 256 bits, so there is nothing to rate-limit.
--
-- ## Discreet by default
--
-- A calendar is often seen by others. `show_details` (default false) says whether the
-- places' name and address are in the feed; off, the function does not even return them to
-- the edge function. The member changes it without making a new address.
--
-- ## The feed
--
-- `calendar_feed_read(hash)` is for the service role only (the `calendar-feed` edge
-- function, public, which hashes the token it was given). It answers null for an unknown
-- hash and otherwise a window of the member's visits: 7 days back to 6 months ahead, not
-- cancelled. Never in it: the note, the member's name, the service a program sees, a
-- phone, whether anything was attended, points.
--
-- EXPAND ONLY: one table, five functions.

create table if not exists public.calendar_feeds (
  member_id    uuid primary key references public.profiles (id) on delete cascade,
  token_hash   text not null unique,
  show_details boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.calendar_feeds enable row level security;
alter table public.calendar_feeds force row level security;
revoke all on table public.calendar_feeds from public, anon, authenticated;
-- Nobody reads it through the API: the functions below are the only doors.
create policy calendar_feeds_no_client on public.calendar_feeds for select using (false);

create or replace function public.calendar_link_make()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  token  text;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;
  if public.my_role() is distinct from 'member' then
    raise exception 'NOT_A_MEMBER';
  end if;
  token := translate(rtrim(encode(extensions.gen_random_bytes(32), 'base64'), '='), '+/', '-_');
  insert into public.calendar_feeds (member_id, token_hash)
  values (caller, encode(extensions.digest(token, 'sha256'), 'hex'))
  on conflict (member_id) do update
    set token_hash = excluded.token_hash, created_at = now();
  return token;
end;
$$;

create or replace function public.calendar_link_status()
returns table (is_on boolean, show_details boolean, made_at timestamptz)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  return query
  select true, f.show_details, f.created_at from public.calendar_feeds f where f.member_id = auth.uid();
  if not found then
    return query select false, false, null::timestamptz;
  end if;
end;
$$;

create or replace function public.calendar_link_set_details(p_show boolean)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  update public.calendar_feeds set show_details = coalesce(p_show, false) where member_id = auth.uid();
  if not found then
    raise exception 'NO_CALENDAR_LINK';
  end if;
  return coalesce(p_show, false);
end;
$$;

create or replace function public.calendar_link_off()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  delete from public.calendar_feeds where member_id = auth.uid();
end;
$$;

-- For the calendar-feed edge function only (the service role): null for an address nobody holds.
create or replace function public.calendar_feed_read(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  feed public.calendar_feeds;
  visits jsonb;
begin
  select f.* into feed from public.calendar_feeds f where f.token_hash = p_token_hash;
  if feed.member_id is null then
    return null;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id,
           'starts_at', a.starts_at,
           'ends_at', a.ends_at,
           'place_id', a.service_id,
           'name', case when feed.show_details then s.name end,
           'address', case when feed.show_details then coalesce(a.location_text, s.address) end
         ) order by a.starts_at), '[]'::jsonb)
  into visits
  from public.appointments a
  left join public.services s on s.id = a.service_id
  where a.member_id = feed.member_id
    and a.status <> 'cancelled'
    and a.starts_at >= now() - interval '7 days'
    and a.starts_at < now() + interval '6 months';
  return jsonb_build_object('show_details', feed.show_details, 'visits', visits);
end;
$$;

revoke all on function public.calendar_link_make() from public, anon;
revoke all on function public.calendar_link_status() from public, anon;
revoke all on function public.calendar_link_set_details(boolean) from public, anon;
revoke all on function public.calendar_link_off() from public, anon;
revoke all on function public.calendar_feed_read(text) from public, anon, authenticated;
grant execute on function public.calendar_link_make() to authenticated;
grant execute on function public.calendar_link_status() to authenticated;
grant execute on function public.calendar_link_set_details(boolean) to authenticated;
grant execute on function public.calendar_link_off() to authenticated;
grant execute on function public.calendar_feed_read(text) to service_role;

comment on table public.calendar_feeds is
  'A member''s secret calendar address, as a hash. No read time is kept (D-538).';

-- A member connects Google Calendar and Pam keeps one calendar of their visits there (D-539).
--
-- The member signs in to Google once. Pam makes ONE secondary calendar, "Pam visits", in their
-- account, and keeps it in step with their visits: planned, moved or cancelled in Pam, added,
-- changed or removed there within 15 minutes. Pam asks Google for one scope only,
-- `calendar.app.created`: see, create, change and delete secondary calendars that Pam itself
-- made, and their events. It cannot read the member's own calendars.
--
-- ## What the database holds
--
-- `google_connections`: the member, their Google REFRESH TOKEN ENCRYPTED by the edge function
-- (AES-GCM, the key a function secret that is never in the database), the id of the calendar Pam
-- made, whether the connection is good or `broken`. The short-lived access token is never stored.
-- `google_events`: which Google event is which visit, and a hash of what was written, so a run
-- changes only what changed. Both: RLS forced, a deny-all policy, nothing granted to anyone but
-- the service role through the functions below.
--
-- ## The setting that is shared with the link
--
-- Whether the place's name and address are shown ("show_details", off by default) was a column of
-- the link (`calendar_feeds`). It is now one setting for both, in `calendar_prefs`, so the sync
-- works without a link. `calendar_feeds.show_details` stays as an unused column (expand only; a later
-- migration marked `-- contract:` removes it). The link's functions read the new place.
--
-- ## The clock
--
-- `google_sync_kick()` runs every 15 minutes. With no one connected it does NOTHING (not even a
-- call to the edge function). Otherwise it calls `google-sync`, which does nothing at all unless
-- GOOGLE_SYNC_LIVE is on.
--
-- EXPAND ONLY.

create table if not exists public.calendar_prefs (
  member_id    uuid primary key references public.profiles (id) on delete cascade,
  show_details boolean not null default false
);
alter table public.calendar_prefs enable row level security;
alter table public.calendar_prefs force row level security;
revoke all on table public.calendar_prefs from public, anon, authenticated;
create policy calendar_prefs_no_client on public.calendar_prefs for select using (false);

-- Whoever chose to show details on the link keeps that choice.
insert into public.calendar_prefs (member_id, show_details)
select f.member_id, f.show_details from public.calendar_feeds f where f.show_details
on conflict (member_id) do nothing;

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
  insert into public.calendar_prefs (member_id, show_details)
  values (auth.uid(), coalesce(p_show, false))
  on conflict (member_id) do update set show_details = excluded.show_details;
  return coalesce(p_show, false);
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
  select (f.member_id is not null),
         coalesce((select p.show_details from public.calendar_prefs p where p.member_id = auth.uid()), false),
         f.created_at
  from (select 1) one
  left join public.calendar_feeds f on f.member_id = auth.uid();
end;
$$;

create or replace function public.calendar_feed_read(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  feed public.calendar_feeds;
  show boolean;
  visits jsonb;
begin
  select f.* into feed from public.calendar_feeds f where f.token_hash = p_token_hash;
  if feed.member_id is null then
    return null;
  end if;
  select coalesce((select p.show_details from public.calendar_prefs p where p.member_id = feed.member_id), false) into show;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id,
           'starts_at', a.starts_at,
           'ends_at', a.ends_at,
           'place_id', a.service_id,
           'name', case when show then s.name end,
           'address', case when show then coalesce(a.location_text, s.address) end
         ) order by a.starts_at), '[]'::jsonb)
  into visits
  from public.appointments a
  left join public.services s on s.id = a.service_id
  where a.member_id = feed.member_id
    and a.status <> 'cancelled'
    and a.starts_at >= now() - interval '7 days'
    and a.starts_at < now() + interval '6 months';
  return jsonb_build_object('show_details', show, 'visits', visits);
end;
$$;

-- ---------------------------------------------------------------------------
-- The connection and what was written to Google.

create table if not exists public.google_connections (
  member_id         uuid primary key references public.profiles (id) on delete cascade,
  refresh_token_enc text not null,
  calendar_id       text not null,
  state             text not null default 'connected' check (state in ('connected', 'broken')),
  failures          integer not null default 0,
  connected_at      timestamptz not null default now(),
  synced_at         timestamptz
);
alter table public.google_connections enable row level security;
alter table public.google_connections force row level security;
revoke all on table public.google_connections from public, anon, authenticated;
create policy google_connections_no_client on public.google_connections for select using (false);

create table if not exists public.google_events (
  member_id      uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid not null,
  event_id       text not null,
  content_hash   text not null,
  primary key (member_id, appointment_id)
);
alter table public.google_events enable row level security;
alter table public.google_events force row level security;
revoke all on table public.google_events from public, anon, authenticated;
create policy google_events_no_client on public.google_events for select using (false);

-- Service role only, below. The edge functions have no other door.

create or replace function public.google_connection_save(p_member uuid, p_token_enc text, p_calendar_id text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into public.google_connections (member_id, refresh_token_enc, calendar_id, state, failures, connected_at, synced_at)
  values (p_member, p_token_enc, p_calendar_id, 'connected', 0, now(), null)
  on conflict (member_id) do update
    set refresh_token_enc = excluded.refresh_token_enc, calendar_id = excluded.calendar_id,
        state = 'connected', failures = 0, connected_at = now(), synced_at = null;
  -- A fresh calendar has none of the old events.
  delete from public.google_events where member_id = p_member;
$$;

create or replace function public.google_connection_get(p_member uuid)
returns table (refresh_token_enc text, calendar_id text, state text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select c.refresh_token_enc, c.calendar_id, c.state from public.google_connections c where c.member_id = p_member;
$$;

create or replace function public.google_connections_due(p_limit integer)
returns table (member_id uuid, refresh_token_enc text, calendar_id text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select c.member_id, c.refresh_token_enc, c.calendar_id
  from public.google_connections c
  where c.state = 'connected'
  order by c.synced_at nulls first, c.connected_at
  limit greatest(least(coalesce(p_limit, 50), 200), 1);
$$;

-- The member's visits for the calendar: the same window and the same fields as the link, and the same setting.
create or replace function public.google_sync_visits(p_member uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  show boolean;
begin
  select coalesce((select p.show_details from public.calendar_prefs p where p.member_id = p_member), false) into show;
  return jsonb_build_object('show_details', show, 'visits', coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', a.id,
             'starts_at', a.starts_at,
             'ends_at', a.ends_at,
             'place_id', a.service_id,
             'name', case when show then s.name end,
             'address', case when show then coalesce(a.location_text, s.address) end
           ) order by a.starts_at)
    from public.appointments a
    left join public.services s on s.id = a.service_id
    where a.member_id = p_member
      and a.status <> 'cancelled'
      and a.starts_at >= now() - interval '7 days'
      and a.starts_at < now() + interval '6 months'
  ), '[]'::jsonb));
end;
$$;

create or replace function public.google_events_for(p_member uuid)
returns table (appointment_id uuid, event_id text, content_hash text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select e.appointment_id, e.event_id, e.content_hash from public.google_events e where e.member_id = p_member;
$$;

create or replace function public.google_event_set(p_member uuid, p_appointment uuid, p_event text, p_hash text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into public.google_events (member_id, appointment_id, event_id, content_hash)
  values (p_member, p_appointment, p_event, p_hash)
  on conflict (member_id, appointment_id) do update set event_id = excluded.event_id, content_hash = excluded.content_hash;
$$;

create or replace function public.google_event_forget(p_member uuid, p_appointment uuid)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.google_events where member_id = p_member and appointment_id = p_appointment;
$$;

-- After a run for one member: fine (clears the count), a failure (counts it; five in a row, or a refused token, breaks it).
create or replace function public.google_connection_mark(p_member uuid, p_ok boolean, p_refused boolean default false)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  result text;
begin
  update public.google_connections c
  set synced_at = now(),
      failures = case when p_ok then 0 else c.failures + 1 end,
      state = case when p_refused or (not p_ok and c.failures + 1 >= 5) then 'broken' else c.state end
  where c.member_id = p_member
  returning c.state into result;
  return result;
end;
$$;

create or replace function public.google_connection_delete(p_member uuid)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.google_events where member_id = p_member;
  delete from public.google_connections where member_id = p_member;
$$;

-- The clock: nothing at all when no one is connected.
create or replace function public.google_sync_kick()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from public.google_connections where state = 'connected') then
    return;
  end if;
  if to_regnamespace('net') is null or to_regnamespace('vault') is null then
    return;
  end if;
  execute $call$
    select net.http_post(
      url := 'https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/google-calendar/sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_-Wl4FRkeoRtyQ6OeKnT9Xw_V0vzicKJ',
        'x-dispatch-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_secret')),
      body := '{}'::jsonb,
      timeout_milliseconds := 55000)
  $call$;
end;
$$;

revoke all on function public.google_connection_save(uuid, text, text) from public, anon, authenticated;
revoke all on function public.google_connection_get(uuid) from public, anon, authenticated;
revoke all on function public.google_connections_due(integer) from public, anon, authenticated;
revoke all on function public.google_sync_visits(uuid) from public, anon, authenticated;
revoke all on function public.google_events_for(uuid) from public, anon, authenticated;
revoke all on function public.google_event_set(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.google_event_forget(uuid, uuid) from public, anon, authenticated;
revoke all on function public.google_connection_mark(uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function public.google_connection_delete(uuid) from public, anon, authenticated;
revoke all on function public.google_sync_kick() from public, anon, authenticated;
grant execute on function public.google_connection_save(uuid, text, text) to service_role;
grant execute on function public.google_connection_get(uuid) to service_role;
grant execute on function public.google_connections_due(integer) to service_role;
grant execute on function public.google_sync_visits(uuid) to service_role;
grant execute on function public.google_events_for(uuid) to service_role;
grant execute on function public.google_event_set(uuid, uuid, text, text) to service_role;
grant execute on function public.google_event_forget(uuid, uuid) to service_role;
grant execute on function public.google_connection_mark(uuid, boolean, boolean) to service_role;
grant execute on function public.google_connection_delete(uuid) to service_role;

comment on table public.google_connections is
  'A member''s Google connection: the refresh token encrypted by the edge function, the calendar Pam made (D-539).';

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'google-sync';
    perform cron.schedule('google-sync', '*/15 * * * *', 'select public.google_sync_kick()');
  else
    raise notice 'pg_cron is not installed here; skipping the Google sync clock';
  end if;
end;
$do$;

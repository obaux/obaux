-- A member's calendar link is a version and a key, and it can be shown again (D-604, a98 plan C).
--
-- Until now a link was 32 random bytes shown ONCE; Pam kept only their SHA-256 (D-538), so a member who came back could not see the
-- address again and the Calendar screen had to say "make a new link". Will, 18 October: show it again, put the place's name and address in
-- every event ("it's obviously a yes"), and say which calendar the member chose.
--
-- THE LINK. Its token is the member's id (22 characters of base64url) and then the HMAC-SHA256 of "member id:version" under one key held in
-- Supabase Vault (`calendar_link_key`, 43 characters): 65 in all. Pam stores only the version number, so there is no hash and no copy of the
-- link on any row: Pam works the address out again when the member opens the screen, with a key nobody reads. "Get a new link" adds one to
-- the version and the old address stops at once; disconnecting deletes the row. The version comes from a sequence, so a number is never used twice:
-- an address that was ever disconnected or replaced does not come back to life when the member links again. The key is made here, in the database, from random bytes
-- (the same way as `dispatch_secret`, 20261010144844): its value never appears in this repository, a log or any session.
--
-- WHAT THE ROW HOLDS. `calendar_links(member_id, version, calendar, linked_on)` and nothing else: which calendar the member said they use
-- (apple, google, outlook or other, their own choice: Pam cannot know that a calendar asked for the feed) and the day they linked it, in
-- their own time zone. No time of any request, no show_details, no hash.
--
-- A NEW TABLE, NOT NEW COLUMNS. `calendar_feeds` (D-538) has `token_hash text not null`; a versioned row has no hash, and relaxing that
-- column is a DROP, which we do not run. The old table, its functions and its rows stay exactly as they are: a legacy link keeps answering as
-- it does today ("Pam visit" and the time, or the place when its switch is on) until its owner makes a new link, which deletes the legacy
-- row and makes a versioned one. `calendar_link_set_details` stays defined and no screen calls it; it can be removed once no legacy row is left.
--
-- WHO CAN DO WHAT. Nobody reads either table through the API. A member reaches only their own link, through the functions below, which
-- decide by `auth.uid()`; the feed function (the service role) reaches a link only by presenting the whole token.
--
-- EXPAND ONLY: one table, one key, and new functions; `calendar_link_off` is replaced with the same signature (it now deletes both kinds of
-- link). `calendar_link_make` and `calendar_link_status` are left exactly as they are: no screen calls them any more, and a client that has not
-- been updated keeps working on hash-only links.

-- Never reset and never reused: every link, new or first, takes the next number.
create sequence if not exists public.calendar_link_versions;
revoke all on sequence public.calendar_link_versions from public, anon, authenticated;

create table if not exists public.calendar_links (
  member_id uuid primary key references public.profiles (id) on delete cascade,
  version   bigint not null default nextval('public.calendar_link_versions') check (version >= 1),
  calendar  text not null check (calendar in ('apple', 'google', 'outlook', 'other')),
  linked_on date not null default current_date
);

alter table public.calendar_links enable row level security;
alter table public.calendar_links force row level security;
revoke all on table public.calendar_links from public, anon, authenticated;
-- Nobody reads it through the API: the functions below are the only doors.
create policy calendar_links_no_client on public.calendar_links for select using (false);

-- The key. Made once, here; an existing one is kept. (The throwaway test database has a stand-in vault.)
do $do$
begin
  if to_regclass('vault.secrets') is null then
    raise notice 'no vault here; the calendar link key is not made';
    return;
  end if;
  if not exists (select 1 from vault.secrets where name = 'calendar_link_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'calendar_link_key',
      'The key a member''s calendar link is worked out with (HMAC of the member and the link''s version). Made in the database; nobody copies it.'
    );
  end if;
end;
$do$;

-- The key's value, for the functions below only: not callable by any client role, the service role included.
create or replace function public.calendar_link_key()
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  k text;
begin
  select s.decrypted_secret into k from vault.decrypted_secrets s where s.name = 'calendar_link_key' limit 1;
  if k is null then
    raise exception 'NO_CALENDAR_KEY';
  end if;
  return k;
end;
$$;

-- The token for a member's link at a version: their id, then the HMAC. Internal.
create or replace function public.calendar_link_token(p_member uuid, p_version bigint)
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select translate(rtrim(encode(decode(replace(p_member::text, '-', ''), 'hex'), 'base64'), '='), '+/', '-_')
      || translate(rtrim(encode(extensions.hmac(p_member::text || ':' || p_version::text, public.calendar_link_key(), 'sha256'), 'base64'), '='), '+/', '-_');
$$;

-- The member a token names (not yet proved), or null for anything that is not shaped like one. Internal.
create or replace function public.calendar_link_member_of(p_token text)
returns uuid
language plpgsql
immutable
set search_path = public, extensions
as $$
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{65}$' then
    return null;
  end if;
  return encode(decode(translate(left(p_token, 22), '-_', '+/') || '==', 'base64'), 'hex')::uuid;
exception when others then
  return null;
end;
$$;

-- Makes a member's link, or a new one (the old address stops at once). `p_calendar` is the member's own choice of calendar; leave it out on a
-- new link to keep the one already chosen. Returns the address's token.
create or replace function public.calendar_link_issue(p_calendar text default null, p_timezone text default 'America/New_York')
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  zone   text := p_timezone;
  cal    text;
  v      bigint;
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
  if zone is null or not exists (select 1 from pg_timezone_names where name = zone) then
    zone := 'America/New_York';
  end if;
  select l.calendar into cal from public.calendar_links l where l.member_id = caller;
  cal := coalesce(p_calendar, cal);
  if cal is null then
    raise exception 'CALENDAR_REQUIRED';
  end if;
  if cal not in ('apple', 'google', 'outlook', 'other') then
    raise exception 'CALENDAR_UNKNOWN';
  end if;
  -- A legacy hash-only link is replaced by this one.
  delete from public.calendar_feeds where member_id = caller;
  insert into public.calendar_links (member_id, version, calendar, linked_on)
  values (caller, nextval('public.calendar_link_versions'), cal, (now() at time zone zone)::date)
  on conflict (member_id) do update
    set version = excluded.version, calendar = excluded.calendar, linked_on = excluded.linked_on
  returning version into v;
  return public.calendar_link_token(caller, v);
end;
$$;

-- What the Calendar screen shows: whether a link is on, which calendar and since when, and the address (worked out here, for this member only).
-- A legacy link says so and carries no address (Pam does not have it).
create or replace function public.calendar_link_state()
returns table (is_on boolean, is_legacy boolean, calendar text, linked_on date, token text)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  me uuid := auth.uid();
  link public.calendar_links;
  legacy public.calendar_feeds;
begin
  if me is null then
    raise exception 'Sign in first';
  end if;
  select l.* into link from public.calendar_links l where l.member_id = me;
  if link.member_id is not null then
    return query select true, false, link.calendar, link.linked_on, public.calendar_link_token(me, link.version);
    return;
  end if;
  select f.* into legacy from public.calendar_feeds f where f.member_id = me;
  if legacy.member_id is not null then
    return query select true, true, null::text, legacy.created_at::date, null::text;
    return;
  end if;
  return query select false, false, null::text, null::date, null::text;
end;
$$;

-- Disconnect: the row goes, so the calendar chosen and the day go with it (both kinds of link).
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
  delete from public.calendar_links where member_id = auth.uid();
end;
$$;

-- For the calendar-feed edge function only (the service role): the visits of the member the whole token proves, or null for an address nobody
-- holds (wrong, stale after a new link, or disconnected: all the same). Every event carries the place's name and address and the time.
create or replace function public.calendar_feed_read_link(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  member uuid := public.calendar_link_member_of(p_token);
  link   public.calendar_links;
  visits jsonb;
begin
  if member is null then
    return null;
  end if;
  select l.* into link from public.calendar_links l where l.member_id = member;
  if link.member_id is null or p_token <> public.calendar_link_token(member, link.version) then
    return null;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id,
           'starts_at', a.starts_at,
           'ends_at', a.ends_at,
           'name', s.name,
           'address', coalesce(a.location_text, s.address)
         ) order by a.starts_at), '[]'::jsonb)
  into visits
  from public.appointments a
  left join public.services s on s.id = a.service_id
  where a.member_id = member
    and a.status <> 'cancelled'
    and a.starts_at >= now() - interval '7 days'
    and a.starts_at < now() + interval '6 months';
  return jsonb_build_object('kind', 'link', 'visits', visits);
end;
$$;

-- Who can call what. The key and the token are internal: no client role. The member's own doors are for signed-in members.
revoke all on function public.calendar_link_key() from public, anon, authenticated, service_role;
revoke all on function public.calendar_link_token(uuid, bigint) from public, anon, authenticated, service_role;
revoke all on function public.calendar_link_member_of(text) from public, anon, authenticated;
revoke all on function public.calendar_link_issue(text, text) from public, anon;
revoke all on function public.calendar_link_state() from public, anon;
revoke all on function public.calendar_link_off() from public, anon;
revoke all on function public.calendar_feed_read_link(text) from public, anon, authenticated;
grant execute on function public.calendar_link_issue(text, text) to authenticated;
grant execute on function public.calendar_link_state() to authenticated;
grant execute on function public.calendar_feed_read_link(text) to service_role;

comment on table public.calendar_links is
  'A member''s calendar link (D-604): the version of the address, which calendar the member said they use and the day they linked it. No hash and no copy of the address: it is worked out from the version and a key in Vault. Disconnecting deletes the row.';
comment on function public.calendar_link_issue(text, text) is
  'Makes a member''s calendar link, or a new one (the old address stops). Returns the address''s token. The member''s own choice of calendar is kept with the version and the day.';

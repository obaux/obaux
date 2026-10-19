-- contract: the notification kinds the old check lists are all still allowed; the list only grows by 'app_error' (the same shape as 20261017062631).
-- EDITED IN PLACE (Iris D1, 19 October): never applied live, so the closed lists of actions and routes were added here, not in a second migration.
--
-- App errors: a log of what broke, without who (D-616; Will, 18 October 2026, 21:14: "if something breaks, please create an error log so
-- the team can be notified and fix the issue").
--
-- WHAT IT HOLDS. One row per failure the app reports: when, the screen's route (`area`, one of the app's screens, never an id or a query), a stable key for what was being done (`action`, e.g. alerts.switch.closed), the code it failed with (an HTTP status, a
-- Postgres SQLSTATE, or offline / timeout / unknown), the app build, the platform, the role the person was acting as (read here from
-- their sign-in, not taken from the app), and the language. NO free text at all (Lena's Privacy read, Mira 21:23): an error's own
-- message carries the value that broke it ("Key (phone)=(...) already exists"), so there is no detail column and the function takes none.
-- NO account id, no phone, no message text, no place name: there is no column to put one in, and the route, key and code are held to
-- a narrow shape by the table itself.
--
-- WHO MAY WRITE AND READ. Only `report_app_error()`, a security definer function callable signed in or signed out (a failure to sign in
-- is a failure too), and by Edge Functions through the service role, never by a table write. Only a super admin reads, and only through
-- `app_errors_grouped()` (rows grouped by route, action and code, with a count and first and last seen), which refuses everyone else. The
-- table itself has RLS on and forced, a deny-all policy, and no grants.
--
-- WHAT KEEPS IT SMALL AND HARMLESS.
--   * A switch, `app_errors_live`, starts 'off': with it off the function writes nothing (Lena reads it for Privacy first, and if
--     Privacy needs a line Will signs it before the switch is turned on).
--   * A rate limit: 10 reports a minute per signed-in account (counter kept five minutes at most), 30 a minute shared by
--     everyone signed out (no key per person or network address at all), and 200 a minute overall, so a loop in a screen or a person with a script cannot flood it.
--   * The values are checked on the way in. The code must be an HTTP status, a SQLSTATE or offline/timeout/unknown, else it is stored
--     as 'unknown'; the route loses its query and any id; the action must have the shape of a stable key (lowercase words and dots), and a
--     report whose action does not is REFUSED and writes nothing. The closed list of actions is in the app's code (packages/config).
--   * Thirty days, then a nightly sweep removes the row. The number is held in one function, `app_errors_keep_days()`.
--
-- TELLING THE TEAM. The first time an action fails in an hour, every super admin gets one bell notification for that action
-- (`app_error`, body_key notify.app_error, {action, count: 1}); each further failure of the same action in that hour raises its
-- count, and does not make another notification. It holds nothing the log row does not. The bell is in the app, for super admins only:
-- no email, chat or outside service (that would be a new host and a new Privacy sentence).

alter table public.notifications drop constraint if exists notifications_kind_known;
alter table public.notifications add constraint notifications_kind_known check (
  kind in (
    'service_flagged', 'service_removed', 'message_reported',
    'staff_request_pending', 'message_received', 'visit_booked_for_you',
    'app_error'
  )
);

create table public.app_errors (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- A route PATTERN such as /alerts/ or /person/[id]/, never an address with an id or a query.
  area       text not null check (area ~ '^/[A-Za-z0-9/_\[\]-]{0,98}$'),
  -- A stable key for what was being done: alerts.switch.closed, messages.send (a closed list in the app's code).
  action     text not null check (action ~ '^[a-z][a-z0-9-]{0,29}(\.[a-z0-9][a-z0-9-]{0,29}){1,3}$' and char_length(action) <= 60),
  -- An HTTP status, a Postgres SQLSTATE, or offline / timeout / unknown.
  code       text not null check (code ~ '^[0-9]{3}$' or code ~ '^[0-9A-Z]{5}$' or code in ('offline', 'timeout', 'unknown')),
  build      text check (build ~ '^[A-Za-z0-9._+-]{1,40}$'),
  platform   text not null default 'unknown' check (platform in ('web', 'ios', 'android', 'server', 'unknown')),
  role       text not null check (role in ('member', 'admin', 'provider', 'super_admin', 'signed-out', 'service')),
  locale     text check (locale in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'))
);

create index app_errors_created_idx on public.app_errors (created_at);
create index app_errors_action_idx on public.app_errors (action, created_at desc);

alter table public.app_errors enable row level security;
alter table public.app_errors force row level security;
revoke all on public.app_errors from anon, authenticated;
-- Nobody reads the table directly (a table with RLS and no policy is flagged as an oversight, test 03; this one is on purpose): a super admin reads it
-- through `app_errors_grouped()`, which refuses everyone else; nobody writes it but `report_app_error()`.
create policy app_errors_nobody on public.app_errors for all to anon, authenticated using (false) with check (false);

comment on table public.app_errors is
  'What broke in the app, without who (D-616): a route pattern, a key for the action, a code, build, platform, role, language. '
  'No free text, no account, phone, message text or place. Written only by report_app_error(); read only by a super admin; kept 30 days.';

-- Counts per caller per minute, so the limit holds. The caller is the account; everyone signed out shares one count, and the
-- service has its own. No network address is read, not even a hash of one.
create table public.app_error_limits (
  bucket text not null,
  minute timestamptz not null,
  n      integer not null default 0,
  primary key (bucket, minute)
);
alter table public.app_error_limits enable row level security;
alter table public.app_error_limits force row level security;
revoke all on public.app_error_limits from anon, authenticated;
create policy app_error_limits_nobody on public.app_error_limits for all to anon, authenticated using (false) with check (false);

-- The two closed lists (Iris D1): an action must be one the app has, and a route must be a screen the app has, else the report is refused / filed
-- as /unknown. A shape check alone let "aaliyah.smith" and "/aaliyah-smith/" through, and both are a name. The lists are the app's own
-- (`APP_ERROR_ACTIONS`, `APP_ERROR_ROUTES` in @pam/config; a test holds each to the lines below). A new action or screen is a new migration.
create table public.app_error_actions (action text primary key);
create table public.app_error_routes (route text primary key);
alter table public.app_error_actions enable row level security;
alter table public.app_error_actions force row level security;
revoke all on public.app_error_actions from anon, authenticated;
create policy app_error_actions_nobody on public.app_error_actions for all to anon, authenticated using (false) with check (false);
alter table public.app_error_routes enable row level security;
alter table public.app_error_routes force row level security;
revoke all on public.app_error_routes from anon, authenticated;
create policy app_error_routes_nobody on public.app_error_routes for all to anon, authenticated using (false) with check (false);

-- app_error_actions: begin
insert into public.app_error_actions (action) values
  ('messages.send'),
  ('messages.photo'),
  ('messages.retry'),
  ('messages.load'),
  ('messages.pam.open'),
  ('messages.block'),
  ('messages.unblock'),
  ('messages.report'),
  ('alerts.switch.closed'),
  ('alerts.switch.message'),
  ('alerts.switch.booked'),
  ('alerts.switch.changed'),
  ('alerts.switch.trip'),
  ('alerts.switch.visit'),
  ('alerts.agree'),
  ('reminders.agree'),
  ('reminders.decline'),
  ('function.dispatch-sms'),
  ('pam.hours.save'),
  ('pam.thread.status'),
  ('directory.demo-view'),
  ('requests.review'),
  ('invite.create'),
  ('places.save'),
  ('places.unsave'),
  ('checkin.here'),
  ('checkin.went'),
  ('trips.cancel'),
  ('schedule.checkin'),
  ('schedule.undo')
on conflict do nothing;
-- app_error_actions: end

-- app_error_routes: begin
insert into public.app_error_routes (route) values
  ('/'),
  ('/about/'),
  ('/account/'),
  ('/admin/'),
  ('/alerts/'),
  ('/calendar/'),
  ('/cities/waiting/'),
  ('/connections/'),
  ('/directory/'),
  ('/flag/'),
  ('/gallery/'),
  ('/help/'),
  ('/help/report-place/'),
  ('/help/safety/'),
  ('/help/topics/'),
  ('/home/calendar/'),
  ('/interested/'),
  ('/invite/'),
  ('/invite/add/'),
  ('/invite/expired/'),
  ('/invite/in-use/'),
  ('/invite/new/'),
  ('/invites/'),
  ('/join/'),
  ('/language/'),
  ('/legal/'),
  ('/legal/privacy/'),
  ('/legal/privacy/copy/'),
  ('/legal/privacy/delete/'),
  ('/messages/'),
  ('/messages/pam/'),
  ('/messages/thread/'),
  ('/messages/thread/files/'),
  ('/messages/thread/options/'),
  ('/messages/thread/report/'),
  ('/notifications/'),
  ('/pam/hours/'),
  ('/pam/messages/'),
  ('/pam/start/'),
  ('/pam/thread/options/'),
  ('/person/'),
  ('/person/connect/'),
  ('/person/past/'),
  ('/person/policies/'),
  ('/place/'),
  ('/place/policies/'),
  ('/place/policies/view/'),
  ('/places/'),
  ('/places/reported/'),
  ('/points/'),
  ('/privacy/'),
  ('/problems/'),
  ('/profile/'),
  ('/profile/add-program/'),
  ('/program/'),
  ('/program/book/'),
  ('/program/book/new/'),
  ('/program/policies/'),
  ('/program/policies/view/'),
  ('/program/sent/'),
  ('/program/service/'),
  ('/program/switch/'),
  ('/programs/'),
  ('/programs/new/'),
  ('/programs/review/'),
  ('/programs/review/item/'),
  ('/reminders/'),
  ('/reply/'),
  ('/requests/'),
  ('/requests/program/'),
  ('/requests/review/'),
  ('/saved/'),
  ('/signin/'),
  ('/terms/'),
  ('/trips/'),
  ('/trips/new/'),
  ('/use-as/')
on conflict do nothing;
-- app_error_routes: end

insert into public.app_settings (key, value, description) values
  ('app_errors_live', 'off',
   'Whether the app reports a failed action to the error log (D-616). Off: report_app_error writes nothing. Turned on by the merge desk once Lena has '
   'read it for Privacy (and, if Privacy needs a line, Will has signed it).')
on conflict (key) do nothing;

create or replace function public.report_app_error(
  p_area     text,
  p_action   text,
  p_code     text,
  p_build    text default null,
  p_platform text default null,
  p_locale   text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid     uuid := auth.uid();
  v_role    text;
  v_bucket  text;
  v_n       integer;
  v_cap     integer;
  v_area    text;
  v_action  text;
  v_code    text;
  v_build   text;
  v_platform text;
  v_locale  text;
  v_subject uuid;
  v_hour_ago timestamptz := now() - interval '1 hour';
  v_admin   uuid;
begin
  -- Off: nothing is written, not even a count.
  if coalesce((select value from public.app_settings where key = 'app_errors_live'), 'off') <> 'on' then
    return false;
  end if;

  -- Who is asking, as a role only. The app does not say: a screen cannot claim to be a super admin.
  if v_uid is null then
    v_role := case when current_setting('request.jwt.claim.role', true) = 'service_role' then 'service' else 'signed-out' end;
  else
    select pr.role::text into v_role from public.profiles pr where pr.id = v_uid;
    v_role := coalesce(v_role, 'member');
  end if;

  -- The counters only matter for the minute they count: anything older than five minutes is dropped on each report (and by a job every five minutes).
  delete from public.app_error_limits where minute < now() - interval '5 minutes';
  -- The rate limit: ten a minute for one signed-in account, thirty a minute shared by everyone signed out (no key per person or per
  -- network address: an address is personal data, and a hash of one can be reversed), sixty for the service, two hundred overall.
  v_bucket := case
    when v_uid is not null then 'u:' || v_uid::text
    when v_role = 'service' then 's:service'
    else 's:signed-out'
  end;
  insert into public.app_error_limits (bucket, minute, n) values (v_bucket, date_trunc('minute', now()), 1)
  on conflict (bucket, minute) do update set n = public.app_error_limits.n + 1
  returning n into v_n;
  v_cap := (case when v_role = 'service' then 60 when v_role = 'signed-out' then 30 else 10 end);
  if v_n > v_cap then
    return false;
  end if;
  if (select count(*) from public.app_errors where created_at > now() - interval '1 minute') >= 200 then
    return false;
  end if;

  -- Checked on the way in. A report must not break the screen that sent it, so nothing here raises: a bad route or code is made harmless, and
  -- a report whose action is not a stable key is simply not taken (the closed list of keys is in the app's code).
  v_action := coalesce(p_action, '');
  if v_action !~ '^[a-z][a-z0-9-]{0,29}(\.[a-z0-9][a-z0-9-]{0,29}){1,3}$' or char_length(v_action) > 60
     or not exists (select 1 from public.app_error_actions a where a.action = v_action) then
    return false;
  end if;
  -- The route: no query, no fragment, a closing slash, and it must be a screen the app has (Iris D1). Anything else, a name typed into an
  -- address for one, is filed as /unknown.
  v_area := split_part(split_part(coalesce(p_area, ''), '?', 1), '#', 1);
  if char_length(v_area) > 1 and right(v_area, 1) <> '/' then v_area := v_area || '/'; end if;
  if not exists (select 1 from public.app_error_routes r where r.route = v_area) then v_area := '/unknown'; end if;
  -- The code from a closed shape; anything else (an error's own words, for one) is just "unknown".
  v_code := coalesce(p_code, '');
  if not (v_code ~ '^[0-9]{3}$' or v_code ~ '^[0-9A-Z]{5}$' or v_code in ('offline', 'timeout', 'unknown')) then
    v_code := 'unknown';
  end if;
  v_build := case when p_build ~ '^[A-Za-z0-9._+-]{1,40}$' then p_build else null end;
  v_platform := case when p_platform in ('web', 'ios', 'android', 'server') then p_platform else 'unknown' end;
  v_locale := case when p_locale in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar') then p_locale else null end;

  insert into public.app_errors (area, action, code, build, platform, role, locale)
  values (v_area, v_action, v_code, v_build, v_platform, v_role, v_locale);

  -- Tell the team: one bell row per action per hour, with its count going up.
  v_subject := md5('app_error:' || v_action)::uuid;
  if exists (
    select 1 from public.notifications n
    where n.kind = 'app_error' and n.subject_id = v_subject and n.created_at > v_hour_ago
  ) then
    update public.notifications n
    set body_vars = jsonb_set(n.body_vars, '{count}', to_jsonb(coalesce((n.body_vars ->> 'count')::integer, 1) + 1))
    where n.kind = 'app_error' and n.subject_id = v_subject and n.created_at > v_hour_ago;
  else
    for v_admin in select pr.id from public.profiles pr where pr.role = 'super_admin' loop
      insert into public.notifications (recipient_id, kind, subject_type, subject_id, body_key, body_vars)
      values (v_admin, 'app_error', 'app_error', v_subject, 'notify.app_error', jsonb_build_object('action', v_action, 'count', 1));
    end loop;
  end if;

  return true;
end;
$$;

revoke all on function public.report_app_error(text, text, text, text, text, text) from public;
grant execute on function public.report_app_error(text, text, text, text, text, text) to anon, authenticated, service_role;

-- How long a row is kept: the one place the number lives (Privacy says it; the sweep and the test read it here).
create or replace function public.app_errors_keep_days()
returns integer
language sql
immutable
set search_path = public, extensions
as $$ select 30 $$;

-- The only way to read the log: grouped, super admins only. No row ever leaves the table one by one.
create or replace function public.app_errors_grouped(p_days integer default 7)
returns table (area text, action text, code text, n bigint, first_seen timestamptz, last_seen timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_super_admin() then
    raise exception 'ONLY_A_SUPER_ADMIN' using errcode = 'P0001';
  end if;
  return query
    select e.area, e.action, e.code, count(*)::bigint, min(e.created_at), max(e.created_at)
    from public.app_errors e
    where e.created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 7), public.app_errors_keep_days())))
    group by e.area, e.action, e.code
    order by max(e.created_at) desc;
end $$;
revoke all on function public.app_errors_grouped(integer) from public, anon;
grant execute on function public.app_errors_grouped(integer) to authenticated, service_role;

-- The per-minute counters: gone after five minutes, by a job every five minutes (and by the next report), so they never wait for the nightly sweep.
create or replace function public.sweep_app_error_counters()
returns void
language sql
security definer
set search_path = public, extensions
as $$ delete from public.app_error_limits where minute < now() - interval '5 minutes' $$;

revoke all on function public.sweep_app_error_counters() from public, anon, authenticated;
grant execute on function public.sweep_app_error_counters() to service_role;

-- Thirty days, then gone.
create or replace function public.sweep_app_errors()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  n integer;
begin
  delete from public.app_errors where created_at < now() - make_interval(days => public.app_errors_keep_days());
  get diagnostics n = row_count;
  perform public.sweep_app_error_counters();
  delete from public.notifications where kind = 'app_error' and created_at < now() - make_interval(days => public.app_errors_keep_days());
  return n;
end;
$$;

revoke all on function public.sweep_app_errors() from public, anon, authenticated;
grant execute on function public.sweep_app_errors() to service_role;

do $do$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron is not installed here; skipping the app errors sweep schedule';
    return;
  end if;
  perform cron.unschedule(jobid) from cron.job where jobname = 'sweep-app-errors';
  perform cron.schedule('sweep-app-errors', '20 4 * * *', 'select public.sweep_app_errors()');
  perform cron.unschedule(jobid) from cron.job where jobname = 'sweep-app-error-counters';
  perform cron.schedule('sweep-app-error-counters', '*/5 * * * *', 'select public.sweep_app_error_counters()');
end;
$do$;

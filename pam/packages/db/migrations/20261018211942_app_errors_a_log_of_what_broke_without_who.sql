-- contract: the notification kinds the old check lists are all still allowed; the list only grows by 'app_error' (the same shape as 20261017062631).
--
-- App errors: a log of what broke, without who (D-616; Will, 18 October 2026, 21:14: "if something breaks, please create an error log so
-- the team can be notified and fix the issue").
--
-- WHAT IT HOLDS. One row per failure the app reports: when, the screen's route (`area`), a stable key for what was being done
-- (`action`, e.g. alerts.switch.closed), the code it failed with (an HTTP status, a Postgres code, or 'offline'), a short `detail`
-- (200 characters at most, never what a person typed), the app build, the platform, the role the person was acting as (read here from
-- their sign-in, not taken from the app), and the language. NO account id, no phone, no message text, no place name: there is no column
-- to put one in, and the route, key and code are held to a narrow alphabet by the table itself.
--
-- WHO MAY WRITE. Only `report_app_error()`, a security definer function callable signed in or signed out (a failure to sign in is a
-- failure too), by Edge Functions through the service role, never by a table write. Nobody but the database reads the table:
-- RLS is on and forced, with no policies and no grants for anon or authenticated.
--
-- WHAT KEEPS IT SMALL AND HARMLESS.
--   * A switch, `app_errors_live`, starts 'off': with it off the function writes nothing (Lena reads it for Privacy first, and if
--     Privacy needs a line Will signs it before the switch is turned on).
--   * A rate limit: 10 reports a minute per caller (the account, else a one-way hash of the network address, kept an hour at most),
--     and 200 a minute overall, so a loop in a screen or a person with a script cannot flood it.
--   * The values are cleaned on the way in: the route loses its query, the key and code are cut to their alphabet, and the detail loses
--     long digit runs and anything that looks like an email address.
--   * Thirty days, then a nightly sweep removes the row.
--
-- TELLING THE TEAM. The first time an action fails in an hour, every super admin gets one bell notification for that action
-- (`app_error`, body_key notify.app_error, {action, count: 1}); each further failure of the same action in that hour raises its
-- count, and does not make another notification.

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
  -- A route such as /alerts/ or /messages/thread/, never an address with an id or a query.
  area       text not null check (area ~ '^/[A-Za-z0-9/_\[\]-]{0,98}$'),
  -- A stable key for what was being done: alerts.switch.closed, messages.send.
  action     text not null check (action ~ '^[a-z0-9][a-z0-9._-]{0,79}$'),
  -- An HTTP status, a Postgres code, or 'offline'.
  code       text not null check (code ~ '^[A-Za-z0-9_.-]{1,30}$'),
  detail     text check (char_length(detail) <= 200),
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
-- A table with RLS and no policy is flagged as an oversight (test 03); this one is on purpose: nobody reads it or writes it but the function.
create policy app_errors_nobody on public.app_errors for all to anon, authenticated using (false) with check (false);

comment on table public.app_errors is
  'What broke in the app, without who (D-616): a route, a key for the action, a code, a short detail, build, platform, role, language. '
  'No account, phone, message text or place. Written only by report_app_error(); kept 30 days.';

-- Counts per caller per minute, so the limit holds. The caller is the account, or a one-way hash of the network address.
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

insert into public.app_settings (key, value, description) values
  ('app_errors_live', 'off',
   'Whether the app reports a failed action to the error log (D-616). Off: report_app_error writes nothing. Turned on by the merge desk once Lena has '
   'read it for Privacy (and, if Privacy needs a line, Will has signed it).')
on conflict (key) do nothing;

create or replace function public.report_app_error(
  p_area     text,
  p_action   text,
  p_code     text,
  p_detail   text default null,
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
  v_detail  text;
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

  -- The rate limit: ten a minute for one caller, two hundred overall.
  v_bucket := case
    when v_uid is not null then 'u:' || v_uid::text
    when v_role = 'service' then 's:service'
    else 'n:' || md5('pam-app-errors' || coalesce(nullif((nullif(current_setting('request.headers', true), '')::json) ->> 'x-forwarded-for', ''), 'unknown'))
  end;
  insert into public.app_error_limits (bucket, minute, n) values (v_bucket, date_trunc('minute', now()), 1)
  on conflict (bucket, minute) do update set n = public.app_error_limits.n + 1
  returning n into v_n;
  v_cap := (case when v_role = 'service' then 60 else 10 end);
  if v_n > v_cap then
    return false;
  end if;
  if (select count(*) from public.app_errors where created_at > now() - interval '1 minute') >= 200 then
    return false;
  end if;

  -- Cleaned on the way in; a bad value is made harmless, never an error (a report must not break the screen that sent it).
  v_area := split_part(split_part(coalesce(p_area, ''), '?', 1), '#', 1);
  if v_area !~ '^/[A-Za-z0-9/_\[\]-]{0,98}$' then v_area := '/unknown'; end if;
  v_action := lower(regexp_replace(coalesce(p_action, ''), '[^A-Za-z0-9._-]', '', 'g'));
  v_action := left(v_action, 80);
  if v_action !~ '^[a-z0-9][a-z0-9._-]{0,79}$' then v_action := 'unknown'; end if;
  v_code := left(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9_.-]', '', 'g'), 30);
  if v_code = '' then v_code := 'unknown'; end if;
  v_detail := nullif(btrim(coalesce(p_detail, '')), '');
  if v_detail is not null then
    v_detail := regexp_replace(v_detail, '[^[:space:]]+@[^[:space:]]+', '[email]', 'g');
    v_detail := regexp_replace(v_detail, '[0-9]{6,}', '#', 'g');
    v_detail := left(v_detail, 200);
  end if;
  v_build := case when p_build ~ '^[A-Za-z0-9._+-]{1,40}$' then p_build else null end;
  v_platform := case when p_platform in ('web', 'ios', 'android', 'server') then p_platform else 'unknown' end;
  v_locale := case when p_locale in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar') then p_locale else null end;

  insert into public.app_errors (area, action, code, detail, build, platform, role, locale)
  values (v_area, v_action, v_code, v_detail, v_build, v_platform, v_role, v_locale);

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

revoke all on function public.report_app_error(text, text, text, text, text, text, text) from public;
grant execute on function public.report_app_error(text, text, text, text, text, text, text) to anon, authenticated, service_role;

-- Thirty days, then gone; the per-minute counters an hour.
create or replace function public.sweep_app_errors()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  n integer;
begin
  delete from public.app_errors where created_at < now() - interval '30 days';
  get diagnostics n = row_count;
  delete from public.app_error_limits where minute < now() - interval '1 hour';
  delete from public.notifications where kind = 'app_error' and created_at < now() - interval '30 days';
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
end;
$do$;

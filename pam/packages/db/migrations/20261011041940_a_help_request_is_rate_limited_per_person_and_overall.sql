-- a_help_request_is_rate_limited_per_person_and_overall: the help-request function asks here whether one more request may go to hello@joinpam.org (D-521). Expand only.
--
-- Claimed 2026-10-11 04:19:40 UTC on `claude/messages-help-request-forward` with `pnpm claim migration`.
--
-- The help desk's "Still stuck?" form posts to an edge function that emails Will. Anyone on the internet can
-- post to it, so it needs a limit that holds across the function's separate runs: this table and one function.
-- It keeps a salted hash of the caller's address (the function hashes it; the raw address never reaches the
-- database) and a time, nothing else, and forgets rows older than a day. Service role only: RLS on, no
-- policies, no grants.

create table if not exists public.help_request_attempts (
  id uuid primary key default gen_random_uuid(),
  who text not null,
  at timestamptz not null default now()
);
create index if not exists help_request_attempts_who_at on public.help_request_attempts (who, at);
create index if not exists help_request_attempts_at on public.help_request_attempts (at);
alter table public.help_request_attempts enable row level security;
alter table public.help_request_attempts force row level security;
revoke all on public.help_request_attempts from public, anon, authenticated;
-- No client may read it. The explicit policy says so (a table with RLS and no policy at all is read as an oversight).
create policy help_request_attempts_no_client on public.help_request_attempts for select using (false);

comment on table public.help_request_attempts is
  'One row per help request let through (D-521): a salted hash of the caller and a time. Forgotten after a day. Service role only.';

-- True and records the attempt when this caller has had fewer than p_per_who requests in the last hour and
-- everyone together fewer than p_overall; false, recording nothing, otherwise.
create or replace function public.help_request_allowed(
  p_who text,
  p_per_who integer default 3,
  p_overall integer default 30
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if coalesce(length(p_who), 0) = 0 then
    return false;
  end if;

  -- One at a time, so two requests at once cannot both take the last place.
  perform pg_advisory_xact_lock(hashtext('help_request_allowed'));

  delete from public.help_request_attempts where at < now() - interval '1 day';

  if (select count(*) from public.help_request_attempts where who = p_who and at > now() - interval '1 hour') >= p_per_who then
    return false;
  end if;
  if (select count(*) from public.help_request_attempts where at > now() - interval '1 hour') >= p_overall then
    return false;
  end if;

  insert into public.help_request_attempts (who) values (p_who);
  return true;
end;
$$;

revoke all on function public.help_request_allowed(text, integer, integer) from public, anon, authenticated;
grant execute on function public.help_request_allowed(text, integer, integer) to service_role;

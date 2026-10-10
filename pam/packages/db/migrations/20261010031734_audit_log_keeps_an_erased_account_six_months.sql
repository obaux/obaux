-- audit_log_keeps_an_erased_account_six_months — when an account is deleted, what
-- it did stays in the audit log for six months, then goes (D-443).
--
-- Claimed 2026-10-10 03:17:34 UTC on `claude/affectionate-goldberg-tvu4sz` with
-- `pnpm claim migration`. The file name is the order: migrations run oldest first.
--
-- EXPAND OR CONTRACT? Expand. It adds a trigger, two functions and a schedule, and
-- changes the append-only guard so one function can lift it. The app that is live
-- does not call any of it. The next migration (the actor is no longer a foreign
-- key) is the contract half: apply this one first.
--
-- What was true before. Pam deletes an account when somebody calls and asks
-- ("Delete my account" says "Call Pam"). A plain delete was refused for anyone who
-- had ever acted, because `audit_log.actor_id` is `on delete set null`, setting it
-- null is an UPDATE, and the audit log refuses every UPDATE (0007, "append-only:
-- even the service key"). 0086 found it and left it as a decision for Will.
--
-- Will, 10 October 2026: "When account is deleted the account should sit in audit
-- log for 6 months before it disappears."
--
-- So:
--   1. Deleting a profile writes one audit row, `account.delete`, about it
--      (`target_id` = the profile's id; its role and region in `meta`; no name,
--      phone or email: the audit log never holds those). That row is the clock.
--   2. The account's own audit rows (as the actor, or as the person acted on) keep
--      pointing at its id. The next migration lets them: today the foreign key
--      would null them, which is the account vanishing at once.
--   3. Six months after the `account.delete` row, `purge_erased_audit()` deletes
--      every audit row that names that id, and the `account.delete` row itself.
--      It runs every night from pg_cron where the project has it.
--   4. The audit log is still append-only for everybody else. The one exception is
--      a DELETE made by that function: the guard checks a flag that only the
--      function sets, for its own transaction, AND that the session is running as
--      the role that owns the function. A service-role connection that sets the
--      flag itself is still refused (22_audit_erasure_test.sql).
--
-- What it does not do: delete a member who has points (points_ledger is
-- append-only in the same way and its rows cascade from the profile: a separate
-- decision, on docs/before-launch.md), or anything the privacy copy has not been
-- told (privacy.s.how-long.p3 says it, in seven languages).

-- ---------------------------------------------------------------------------
-- 1. The clock: a deleted profile leaves one audit row.

create or replace function public.record_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (
    null,
    'account.delete',
    'profile',
    old.id,
    jsonb_build_object(
      'role', old.role,
      'region_id', old.region_id,
      'by', coalesce(auth.uid()::text, current_user)
    )
  );
  return old;
end;
$$;

comment on function public.record_account_deletion is
  'Before a profile is deleted: writes the audit row that starts its six months '
  '(D-443). No name, phone or email in it. Not callable by a client role.';

revoke all on function public.record_account_deletion() from public, anon, authenticated;

create trigger profiles_record_deletion
  before delete on public.profiles
  for each row execute function public.record_account_deletion();

-- ---------------------------------------------------------------------------
-- 2. Six months later: the purge.

create or replace function public.purge_erased_audit()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  gone integer;
begin
  -- The guard (below) lets a DELETE through only while this flag is on and the
  -- session is running as this function's owner. `true` = local to this
  -- transaction, so it cannot outlive the call.
  perform set_config('pam.purging_audit_log', 'on', true);

  with erased as (
    select target_id as profile_id
    from public.audit_log
    where action = 'account.delete'
      and target_type = 'profile'
      and created_at < now() - interval '6 months'
  )
  delete from public.audit_log a
  using erased e
  where a.actor_id = e.profile_id
     or a.target_id = e.profile_id;

  get diagnostics gone = row_count;
  perform set_config('pam.purging_audit_log', 'off', true);
  return gone;
end;
$$;

comment on function public.purge_erased_audit is
  'Deletes every audit row that names an account whose deletion is more than six '
  'months old, and the account.delete row itself (D-443). Returns how many. Run '
  'nightly by pg_cron; not callable by a client role.';

revoke all on function public.purge_erased_audit() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. The guard learns the one exception. (This function is shared with
-- points_ledger, which gets no exception.)

create or replace function public.reject_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE'
     and tg_table_name = 'audit_log'
     and current_setting('pam.purging_audit_log', true) = 'on'
     and current_user = (
       select pg_get_userbyid(p.proowner)
       from pg_proc p
       where p.oid = 'public.purge_erased_audit()'::regprocedure
     )
  then
    return old;
  end if;

  raise exception '% is append-only; % is not permitted', tg_table_name, tg_op
    using hint = 'Insert a compensating row instead of changing history.';
end;
$$;

comment on table public.audit_log is
  'Append-only. No UPDATE or DELETE policy is granted to any role, including admins, '
  'and a trigger refuses both for the service key too. The one exception: '
  'purge_erased_audit() deletes the rows of an account that was deleted more than '
  'six months ago (D-443).';

-- ---------------------------------------------------------------------------
-- 4. Every night, where the project has a scheduler (the test database does not).

do $do$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron is not installed here; skipping the audit purge schedule';
    return;
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname = 'purge-erased-audit';

  perform cron.schedule(
    'purge-erased-audit',
    '30 3 * * *',
    'select public.purge_erased_audit()'
  );
end;
$do$;

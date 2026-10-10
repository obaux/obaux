-- points_history_is_deleted_with_the_member — deleting a member deletes their
-- points history (D-445).
--
-- Claimed 2026-10-10 03:39:17 UTC with `pnpm claim migration`. Runs after
-- pin_the_append_only_guard_search_path.
--
-- EXPAND. It adds one way through the guard; nothing the live app does changes.
--
-- Will, 10 October 2026: "Yes. Deleting a member should delete their points
-- history." (He had been told that a member with points could not be deleted at
-- all.)
--
-- What was wrong. `points_ledger.member_id` references `profiles` `on delete
-- cascade`, and the ledger is append-only: its trigger refuses every DELETE, so the
-- cascade was refused and so was deleting the member. Found 10 October while
-- probing the audit-log change (D-443): of the ten seeded accounts, the one member
-- with points could not be deleted.
--
-- What it does. The shared guard, `reject_mutation()`, lets a DELETE on
-- `points_ledger` through when the member's profile is already gone — which is the
-- state inside the cascade from deleting the profile (the referential action runs
-- after the parent row is deleted). Nobody can use that to rewrite a living
-- member's history: while the profile exists, the guard refuses, for the owner and
-- for the service key alike. An UPDATE is still always refused. The audit-log
-- exception from D-443 is unchanged, and this function keeps the pinned search
-- path that the previous migration put back.

-- Whether an account still exists, asked of the table's owner rather than the
-- caller: `profiles` forces row-level security, so a caller whose policies hide the
-- row would otherwise be told "gone" and could delete a living member's history.
create or replace function public.profile_still_exists(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (select 1 from public.profiles where id = p_id);
$$;

comment on function public.profile_still_exists is
  'True while an account exists. Used only by the append-only guard (D-445); asked '
  'of the owner so row-level security cannot hide the row. Not callable by a client role.';

revoke all on function public.profile_still_exists(uuid) from public, anon, authenticated;
-- The guard runs as whoever tries the delete; the service key must be able to ask,
-- or its (refused) attempt would fail with "permission denied" instead of the reason.
grant execute on function public.profile_still_exists(uuid) to service_role;

create or replace function public.reject_mutation()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  -- audit_log: only purge_erased_audit() may delete (D-443).
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

  -- points_ledger: a member's history goes with the member, and only then (D-445).
  -- (Nested, because `old.member_id` does not exist on the audit log's rows and
  -- plpgsql does not promise to stop reading an `and` at the first false.)
  if tg_op = 'DELETE' and tg_table_name = 'points_ledger' then
    if not public.profile_still_exists(old.member_id) then
      return old;
    end if;
  end if;

  raise exception '% is append-only; % is not permitted', tg_table_name, tg_op
    using hint = 'Insert a compensating row instead of changing history.';
end;
$$;

comment on table public.points_ledger is
  'Append-only: a trigger refuses UPDATE and DELETE for every role, the service key '
  'included. The one exception: when the member''s account is deleted their rows '
  'go with it (D-445).';

-- the_audit_purge_also_removes_rows_that_name_an_erased_person — an erased account's
-- six months now also cover audit rows that name it only inside `meta` (D-599).
--
-- Claimed 2026-10-17 07:54:51 UTC on `claude/messages-audit-meta-purge` with
-- `pnpm claim migration`. The file name is the order: migrations run oldest first.
--
-- EXPAND OR CONTRACT? Expand. It replaces the body of one function that only the
-- nightly schedule calls. Nothing the live app calls changes.
--
-- What was wrong. `purge_erased_audit()` (D-443) deleted an erased account's audit
-- rows when the account was the `actor_id` or the `target_id`. A row that names the
-- person only in `meta` stayed past the six months that privacy.s.how-long.p3
-- promises. Found by Lena's sweep. Three writers do it:
--   * `open_direct_conversation` writes `conversation.open` with the other person
--     in meta `with` (D-541, 20261011203917);
--   * `message_program` the same, with the program lead (same migration);
--   * `record_account_deletion` puts the deleting admin in meta `by` (D-443), so
--     an admin who is erased later is named on rows about other people.
-- Rows like these are already in the live audit_log, so changing the writers would
-- not be enough; they are left as they are.
--
-- The change: a row also goes when any TOP-LEVEL value of its `meta` is the erased
-- profile's id (a string equal to it). Values nested deeper than the top level are
-- not looked at; no writer puts an id there. The function keeps what it had: security
-- definer, `search_path = public, extensions`, the transaction-local flag, and no
-- grant to a client role. The append-only guard is unchanged: its one exception is a
-- DELETE made by this function, and these deletes are made by it.
--
-- The clock is unchanged: six months after the `account.delete` row.

create or replace function public.purge_erased_audit()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  gone integer;
begin
  -- The guard lets a DELETE through only while this flag is on and the session is
  -- running as this function's owner. `true` = local to this transaction, so it
  -- cannot outlive the call.
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
     or a.target_id = e.profile_id
     or (
       jsonb_typeof(a.meta) = 'object'
       and exists (
         select 1
         from jsonb_each_text(a.meta) m
         where m.value = e.profile_id::text
       )
     );

  get diagnostics gone = row_count;
  perform set_config('pam.purging_audit_log', 'off', true);
  return gone;
end;
$$;

comment on function public.purge_erased_audit is
  'Deletes every audit row that names an account whose deletion is more than six '
  'months old, as actor, as target, or as a top-level value in meta, and the '
  'account.delete row itself (D-443, D-599). Returns how many. Run nightly by '
  'pg_cron; not callable by a client role.';

revoke all on function public.purge_erased_audit() from public, anon, authenticated;

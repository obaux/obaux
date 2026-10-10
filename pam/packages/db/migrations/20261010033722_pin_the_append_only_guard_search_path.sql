-- pin_the_append_only_guard_search_path — put back the pinned search_path that
-- replacing reject_mutation() dropped (D-443).
--
-- Claimed 2026-10-10 03:37:22 UTC with `pnpm claim migration`. Runs after
-- audit_log_actor_is_not_a_foreign_key.
--
-- EXPAND. It changes a setting on a function; nothing that calls it notices.
--
-- Found by `get_advisors` right after the audit-log migrations were applied live
-- (function_search_path_mutable on public.reject_mutation): 0021 had pinned the
-- search path of every public function, and `create or replace function` without a
-- `set` clause (the previous migration) resets it. The function only uses pg_catalog
-- names and the fully-qualified public.purge_erased_audit(), so pinning changes no
-- behaviour. The test suite did not catch it because its invariant covers
-- SECURITY DEFINER functions; this one is a plain trigger function.

alter function public.reject_mutation() set search_path = public, extensions;

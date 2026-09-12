-- 0012 — Restore the helper grants that 0011 took too far, and state the
-- actual security boundary.
--
-- 0011 revoked EXECUTE on every parameterised RLS helper from `anon`. That
-- broke reads which must work: a policy declared `for all` is evaluated on
-- SELECT as well as on writes, so a signed-out read of `services` evaluated
-- `services_write_provider` (feature_allowed) and a read of `profiles`
-- evaluated `profiles_select_provider_linked` (provider_linked_to). Both
-- failed with "permission denied for function" instead of returning rows.
--
-- That is the §0 failure this project cannot ship: someone not signed in could
-- not see the list of places that can help.
--
-- The correction is to be honest about where the boundary actually is. After
-- the guards added in 0010, every helper below is information-free for a
-- signed-out caller, because each one is anchored to auth.uid(), which is null:
--
--   admin_covers(target)          is_admin() is false          -> false
--   provider_linked_to(target)    my_org() and auth.uid() null -> false
--   in_conversation(conversation) auth.uid() null              -> false
--   are_buddies(a, b)             caller is not a or b         -> false
--   is_blocked_between(a, b)      caller is not a or b         -> false
--   feature_allowed(subject, f)   not self, not covered        -> true (default)
--
-- So the grant is not what protects these — the guard inside each function is.
-- Revoking EXECUTE only broke legitimate reads while leaving the disclosure
-- surface exactly as it was before 0010.
--
-- What stays revoked from anon is the set with no legitimate signed-out use:
--   member_points()  — no policy calls it; clients call it signed in
--   create_invite, admin_set_feature_access, admin_set_access_status
--   redeem_invite    — the caller has verified their phone by then
--   generate_invite_code — internal to create_invite, callable by nobody
--
-- The structural improvement — not using `for all` for write policies, so a
-- read never evaluates a write rule — is Phase 1 work. See DECISIONS.md D-026.

grant execute on function public.admin_covers(uuid) to anon;
grant execute on function public.provider_linked_to(uuid) to anon;
grant execute on function public.in_conversation(uuid) to anon;
grant execute on function public.are_buddies(uuid, uuid) to anon;
grant execute on function public.is_blocked_between(uuid, uuid) to anon;
grant execute on function public.feature_allowed(uuid, public.controllable_feature) to anon;

-- 0011 — Take the internal RLS helpers off the signed-out REST surface.
--
-- 0010 revoked EXECUTE from `anon` and the advisors still flagged the same
-- functions. The reason is that Postgres grants EXECUTE on every new function
-- to PUBLIC, and `anon` inherits it: revoking from the role alone leaves the
-- PUBLIC grant in place. The revoke has to name PUBLIC.
--
-- Two groups, treated differently:
--
--   * Parameterised helpers — they answer questions about a supplied id, so a
--     signed-out caller has no business invoking them at all. Revoked from
--     PUBLIC, granted back to `authenticated` only, because the RLS policies
--     that call them are evaluated with the querying role's privileges.
--
--   * Self-scoped helpers (my_role, my_region, my_org, is_admin,
--     my_access_status, is_active_account, my_feature_allowed) — these read
--     auth.uid() and nothing else, so for a signed-out caller they return null
--     or false and disclose nothing. They keep the PUBLIC grant so that an
--     anon SELECT on a table whose policy calls one returns an empty result
--     rather than a permission error.
--
-- No policy on a table `anon` can read (app_settings, services, orgs, badges,
-- service_subcategories) references anything in the first group.

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.admin_covers(uuid)',
    'public.are_buddies(uuid, uuid)',
    'public.is_blocked_between(uuid, uuid)',
    'public.feature_allowed(uuid, public.controllable_feature)',
    'public.in_conversation(uuid)',
    'public.provider_linked_to(uuid)',
    'public.member_points(uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

-- Write RPCs. Each already fails closed on its own checks, but they do not
-- belong on the anonymous surface.
revoke execute on function public.create_invite(public.user_role, text, uuid) from public, anon;
revoke execute on function public.admin_set_feature_access(uuid, public.controllable_feature, boolean, text, text) from public, anon;
revoke execute on function public.admin_set_access_status(uuid, public.access_status, text) from public, anon;
grant execute on function public.create_invite(public.user_role, text, uuid) to authenticated;
grant execute on function public.admin_set_feature_access(uuid, public.controllable_feature, boolean, text, text) to authenticated;
grant execute on function public.admin_set_access_status(uuid, public.access_status, text) to authenticated;

-- Redemption happens AFTER phone verification (§10 step 4), so the caller is
-- always authenticated by the time they have a session. anon never needs it.
revoke execute on function public.redeem_invite(text, text, text) from public, anon;
grant execute on function public.redeem_invite(text, text, text) to authenticated;

-- Nobody calls this directly: create_invite generates codes internally, and it
-- runs as definer so it does not need the caller to hold EXECUTE.
revoke execute on function public.generate_invite_code() from public, anon, authenticated;

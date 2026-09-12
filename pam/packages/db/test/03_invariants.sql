-- Structural invariants that a policy set alone cannot guarantee.

\set ON_ERROR_STOP on
set client_min_messages to notice;

-- ===========================================================================
\echo ''
\echo '--- Every table has RLS enabled and forced (§4 "default deny") ---'
-- ===========================================================================
do $$
declare
  gap text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into gap
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not (c.relrowsecurity and c.relforcerowsecurity);

  if gap is not null then
    raise exception 'FAIL  these public tables lack forced RLS: %', gap;
  end if;
  raise notice 'ok    all public tables have RLS enabled and forced';
end;
$$;

-- A table with RLS on and no policy denies everything, which is safe but is
-- almost always an oversight. geocode_cache is the one intentional case: it is
-- operational data no client should ever read.
do $$
declare
  silent text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into silent
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
    and not exists (select 1 from pg_policy p where p.polrelid = c.oid);

  if silent is not null then
    raise exception 'FAIL  RLS on but no policy (unreachable table): %', silent;
  end if;
  raise notice 'ok    every table with RLS has at least one policy';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- messages has no admin policy, by design (§4.1) ---'
-- ===========================================================================
do $$
declare
  n integer;
begin
  -- If someone later adds a policy to `messages` mentioning admin_covers or
  -- is_admin, the transparency contract in packages/config is a lie. Fail loudly.
  select count(*) into n
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  where c.relname = 'messages'
    and pg_get_expr(p.polqual, p.polrelid) ilike any (array['%is_admin%', '%admin_covers%']);

  if n > 0 then
    raise exception
      'FAIL  messages gained an admin-readable policy. §4.1 promises members '
      'that admins never read message bodies — update transparency.ts and tell '
      'members before allowing this.';
  end if;
  raise notice 'ok    messages has no admin-readable policy';
end;
$$;

do $$
declare
  n integer;
begin
  select count(*) into n
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  where c.relname = 'activities'
    and pg_get_expr(p.polqual, p.polrelid) ilike any (array['%is_admin%', '%admin_covers%']);

  if n > 0 then
    raise exception 'FAIL  activities gained an admin policy; §4.1 says admins '
      'do not see buddy feed posts.';
  end if;
  raise notice 'ok    activities has no admin-readable policy';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- points_ledger and audit_log are append-only, even for service_role ---'
-- ===========================================================================
-- service_role has BYPASSRLS, so policies do not stop it. The triggers do.
-- This is the test that matters: Edge Functions run with this key.
set role service_role;

do $$
begin
  begin
    update public.points_ledger set delta = 9999
    where id = '99999999-0000-0000-0000-000000000001';
    raise exception 'FAIL  service_role was able to UPDATE points_ledger';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    service_role cannot UPDATE points_ledger (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    delete from public.points_ledger where id = '99999999-0000-0000-0000-000000000001';
    raise exception 'FAIL  service_role was able to DELETE from points_ledger';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    service_role cannot DELETE from points_ledger (%)', left(sqlerrm, 48);
  end;
end;
$$;

reset role;

insert into public.audit_log (actor_id, action, target_type, target_id)
values ('33333333-0000-0000-0000-00000000000a', 'test.write', 'profile',
        '33333333-0000-0000-0000-00000000000c');

set role service_role;
do $$
begin
  begin
    update public.audit_log set action = 'tampered' where action = 'test.write';
    raise exception 'FAIL  service_role was able to rewrite audit_log';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    service_role cannot rewrite audit_log (%)', left(sqlerrm, 48);
  end;
end;
$$;
reset role;

-- ===========================================================================
\echo ''
\echo '--- Data integrity constraints hold ---'
-- ===========================================================================
do $$
begin
  begin
    insert into public.services (name, category, subcategory)
    values ('Mismatched', 'education', 'housing');
    raise exception 'FAIL  a subcategory from another category was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    subcategory must belong to its category (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    update public.profiles set phone = '5551234'
    where id = '33333333-0000-0000-0000-00000000000c';
    raise exception 'FAIL  a non-E.164 phone number was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    phone numbers must be E.164 (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    insert into public.appointments (member_id, starts_at, status)
    values ('33333333-0000-0000-0000-00000000000c', now(), 'attended');
    raise exception 'FAIL  an attended appointment was stored with no method';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    attended appointments must record how (%)', left(sqlerrm, 48);
  end;
end;
$$;

do $$
begin
  begin
    insert into public.access_controls (subject_id, feature, allowed, set_by, reason)
    values ('33333333-0000-0000-0000-00000000000c', 'chat', false,
            '33333333-0000-0000-0000-00000000000a', '   ');
    raise exception 'FAIL  an access change with a blank reason was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    access changes require a reason (%)', left(sqlerrm, 48);
  end;
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Invite codes avoid ambiguous characters (§4.1) ---'
-- ===========================================================================
do $$
declare
  code text;
  i integer;
begin
  for i in 1..200 loop
    code := public.generate_invite_code();
    if length(code) <> 8 then
      raise exception 'FAIL  invite code % is not 8 characters', code;
    end if;
    -- 0/O, 1/I/L, 2/Z, 5/S, 8/B must never appear: these codes get read aloud.
    if code ~ '[OIL0125SBZ]' then
      raise exception 'FAIL  invite code % contains an ambiguous character', code;
    end if;
  end loop;
  raise notice 'ok    200 invite codes are 8 chars with no ambiguous glyphs';
end;
$$;

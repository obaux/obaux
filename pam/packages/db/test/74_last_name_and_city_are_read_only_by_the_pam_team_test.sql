-- A person's last name and city are read only by the Pam team (test 74; Lena's privacy guard, D-587).
--
-- Before 20261016145411 the 0007 policies let a regional case manager, an accepted buddy and anyone reading a public
-- mentor select `last_name` and `home_city` off a profile. Now nobody signed in selects either column, their own
-- included, while the rows stay as visible as before (the first name still reads). The person still writes both
-- (updateMyDetails), and the definer functions still read them.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana   '33333333-0000-0000-0000-00000000000a'
\set marcus '33333333-0000-0000-0000-00000000000c'
\set nia    '33333333-0000-0000-0000-000000000011'

create or replace function test.check_raises_like(label text, stmt text, pattern text)
returns void
language plpgsql
as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlerrm like pattern then
      raise notice 'ok    % (%)', label, left(sqlerrm, 40);
      return;
    end if;
    raise exception E'FAIL  %\n        raised "%", expected like "%"', label, sqlerrm, pattern;
  end;
  raise exception 'FAIL  % — the statement was allowed and should not have been', label;
end;
$$;
grant execute on function test.check_raises_like(text, text, text) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
update public.profiles set last_name = 'Reyes', home_city = 'Philadelphia' where id = :'marcus';
update public.profiles set last_name = 'Okafor', home_city = 'Camden' where id = :'nia';

\echo ''
\echo '--- Nobody signed in selects a last name or a city off a profile ---'
set role authenticated;

-- Dana is Marcus's case manager, in his region (0007's admin policy).
select set_config('request.jwt.claim.sub', :'dana', false);
select test.check('a case manager still sees the member on her caseload (the row, by first name)',
  (select count(*) from public.profiles where id = :'marcus' and first_name = 'Marcus'), 1::bigint);
select test.check_raises_like('...but not his last name',
  format('select last_name from public.profiles where id = %L', :'marcus'), 'permission denied%');
select test.check_raises_like('...nor his city',
  format('select home_city from public.profiles where id = %L', :'marcus'), 'permission denied%');
select test.check_raises_like('...nor either through select *',
  format('select * from public.profiles where id = %L', :'marcus'), 'permission denied%');

-- Nia and Marcus are accepted buddies; Nia is also a public mentor, so Marcus reads her as one.
select set_config('request.jwt.claim.sub', :'nia', false);
select test.check('an accepted buddy still sees the other (the row)',
  (select count(*) from public.profiles where id = :'marcus'), 1::bigint);
select test.check_raises_like('...but not their last name',
  format('select last_name from public.profiles where id = %L', :'marcus'), 'permission denied%');
select test.check_raises_like('...nor their city',
  format('select home_city from public.profiles where id = %L', :'marcus'), 'permission denied%');

select set_config('request.jwt.claim.sub', :'marcus', false);
select test.check('a public mentor is seen (the row)',
  (select count(*) from public.profiles where id = :'nia' and is_mentor and is_public), 1::bigint);
select test.check_raises_like('...but not the mentor''s last name',
  format('select last_name from public.profiles where id = %L', :'nia'), 'permission denied%');
select test.check_raises_like('...nor the mentor''s city',
  format('select home_city from public.profiles where id = %L', :'nia'), 'permission denied%');
select test.check_raises_like('a filter on the city cannot be used to find people in one either',
  $f$select count(*) from public.profiles where home_city = 'Camden'$f$, 'permission denied%');
select test.check_raises_like('a person does not select their own either (no screen reads them back)',
  format('select last_name, home_city from public.profiles where id = %L', :'marcus'), 'permission denied%');

reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select test.check_raises_like('nobody signed out selects them',
  'select last_name from public.profiles limit 1', 'permission denied%');

\echo ''
\echo '--- The person still writes them (updateMyDetails) ---'
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'marcus', false);
update public.profiles set first_name = 'Marcus', last_name = 'Rivera', home_city = 'Philadelphia' where id = :'marcus';
reset role;
select test.check('Marcus''s own update of his name and city is saved',
  (select count(*) from public.profiles where id = :'marcus' and last_name = 'Rivera' and home_city = 'Philadelphia'), 1::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'nia', false);
update public.profiles set last_name = 'Changed' where id = :'marcus';
reset role;
select test.check('...and nobody else can change them (the update policy is still his own row)',
  (select count(*) from public.profiles where id = :'marcus' and last_name = 'Rivera'), 1::bigint);

\echo ''
\echo '--- Only the service role and definer functions read them ---'
select test.check('authenticated has no select on either column',
  (select count(*) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles' and grantee in ('authenticated', 'anon')
     and privilege_type = 'SELECT' and column_name in ('last_name', 'home_city')), 0::bigint);
select test.check('...nor on the phone (0075 still holds)',
  (select count(*) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles' and grantee in ('authenticated', 'anon')
     and privilege_type = 'SELECT' and column_name = 'phone'), 0::bigint);
select test.check('...and still has select on the first name',
  (select count(*) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated'
     and privilege_type = 'SELECT' and column_name = 'first_name'), 1::bigint);
select test.check('every function in public that reads either column runs as its owner (security definer)',
  (select count(*) from pg_proc
   where pronamespace = 'public'::regnamespace and not prosecdef
     and (prosrc ~ '\mlast_name\M' or prosrc ~ '\mhome_city\M')), 0::bigint);

reset role;
update public.profiles set last_name = null, home_city = null where id in (:'marcus', :'nia');
select set_config('request.jwt.claim.sub', '', false);

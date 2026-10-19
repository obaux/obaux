-- A person's city (profiles.region_id) is read by their own session and the database, not by their partners (Mira, 19 October; the same
-- guard 20261016145411 put on last_name and home_city).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set marcus '33333333-0000-0000-0000-00000000000c'
\set dana   '33333333-0000-0000-0000-00000000000a'
\set alice  '33333333-0000-0000-0000-00000000000f'

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
select test.check('control: the member is in a city (read as the server)',
  (select count(*) from public.profiles where id = :'marcus' and region_id is not null), 1::bigint);

\echo ''
\echo '--- Nobody signed in reads the column, whoever they are and whoever's row it is ---'
set role authenticated;
select test.as_user(:'dana');
select test.check_raises_like('a case manager cannot read a member''s city', $$select region_id from public.profiles where id = '33333333-0000-0000-0000-00000000000c'$$, '%permission denied%');
select test.check_raises_like('...nor filter by it', $$select id from public.profiles where region_id is not null$$, '%permission denied%');
select test.check_raises_like('...nor read every column of a row', $$select * from public.profiles where id = '33333333-0000-0000-0000-00000000000c'$$, '%permission denied%');
select test.check_raises_like('...nor their own city by reading their own row', $$select region_id from public.profiles where id = auth.uid()$$, '%permission denied%');
select test.as_user(:'alice');
select test.check_raises_like('a program lead cannot read it either', $$select region_id from public.profiles where id = '33333333-0000-0000-0000-00000000000c'$$, '%permission denied%');
select test.as_user(:'marcus');
select test.check_raises_like('a member cannot read it, their own row included', $$select region_id from public.profiles where id = auth.uid()$$, '%permission denied%');
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select test.check_raises_like('a signed-out visitor cannot', $$select region_id from public.profiles$$, '%permission denied%');

\echo ''
\echo '--- A person reads their own city through my_region_info() and nobody else''s ---'
set role authenticated;
select test.as_user(:'marcus');
select test.check('a member gets their own city: its id and name',
  (select count(*) from public.my_region_info() where region_id is not null and name is not null), 1::bigint);
select test.as_user(:'dana');
select test.check('a case manager gets their own city',
  (select count(*) from public.my_region_info() where region_id is not null), 1::bigint);
select test.check('...and only one row: nobody else''s',
  (select count(*) from public.my_region_info()), 1::bigint);
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select test.check_raises_like('a signed-out visitor cannot call it', $$select * from public.my_region_info()$$, '%permission denied%');

\echo ''
\echo '--- What needs the city still works, because it runs as the database ---'
set role authenticated;
select test.as_user(:'dana');
select test.check('my_region() (the 0007 policies call it) still answers',
  (select count(*) from (select public.my_region() r) x where r is not null), 1::bigint);
select test.check('a case manager still sees their own region''s row through the policy',
  (select count(*) from public.regions), 1::bigint);
reset role;

-- An erased account stays in the audit log for six months, then goes (D-443).
-- Will, 10 October 2026: "When account is deleted the account should sit in audit
-- log for 6 months before it disappears."
--
-- Before the two audit migrations, a profile that had ever acted could not be
-- deleted at all (the audit log refuses the UPDATE that `on delete set null`
-- needs). These attack the new promises: an account that has acted can be
-- deleted; what it did stays, under its id, with nothing personal on the
-- deletion row; nothing goes before six months; six months after the deletion
-- every row that names that account goes, and only those; and the audit log is
-- still append-only for everybody else — including a service-role connection
-- that tries to lift the guard itself.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set quin          '55555555-0000-0000-0000-000000000601'
\set reed          '55555555-0000-0000-0000-000000000602'
\set sol           '55555555-0000-0000-0000-000000000603'
\set tess          '55555555-0000-0000-0000-000000000604'
\set region_north  '11111111-0000-0000-0000-000000000001'

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
insert into auth.users (id, phone) values
  (:'quin', '12675559601'), (:'reed', '12675559602'), (:'sol', '12675559603'), (:'tess', '12675559604');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'quin', 'member', 'Quin', :'region_north', '+12675559601', 'active'),
  (:'reed', 'admin',  'Reed', :'region_north', '+12675559602', 'active'),
  (:'sol',  'member', 'Sol',  :'region_north', '+12675559603', 'active'),
  (:'tess', 'member', 'Tess', :'region_north', '+12675559604', 'active');

-- Quin has acted; Reed acted on Quin; Reed and Sol have rows that have nothing to
-- do with Quin.
insert into public.audit_log (actor_id, action, target_type, target_id) values
  (:'quin', 'test.quin_acts',        'profile', :'sol'),
  (:'reed', 'test.reed_acts_on_quin', 'profile', :'quin'),
  (:'reed', 'test.reed_acts_on_sol',  'profile', :'sol'),
  (:'sol',  'test.sol_acts',          'profile', :'sol');

-- ===========================================================================
\echo ''
\echo '--- An account that has acted can be deleted, and stays in the log ---'
-- ===========================================================================
delete from auth.users where id = :'quin';
select test.check('Quin''s account is gone (it was refused before)',
  (select count(*) from public.profiles where id = :'quin'), 0);
select test.check('what Quin did is still in the log, under Quin''s id',
  (select count(*) from public.audit_log where actor_id = :'quin' and action = 'test.quin_acts'), 1);
select test.check('what was done to Quin is still in the log',
  (select count(*) from public.audit_log where target_id = :'quin' and action = 'test.reed_acts_on_quin'), 1);
select test.check('one account.delete row marks the day',
  (select count(*) from public.audit_log where action = 'account.delete' and target_id = :'quin'), 1);
select test.check('...it says the role, as a fact about the account',
  (select count(*) from public.audit_log
    where action = 'account.delete' and target_id = :'quin' and meta->>'role' = 'member'), 1);
select test.check('...with no name, phone or email in it',
  (select count(*) from public.audit_log
    where action = 'account.delete' and target_id = :'quin'
      and (meta::text ilike '%quin%' or meta::text like '%2675559601%' or meta::text like '%@%')), 0);

-- Somebody who never acted is marked too, and just as easily deleted.
delete from auth.users where id = :'tess';
select test.check('Tess, who never acted, is deleted and marked',
  (select count(*) from public.audit_log where action = 'account.delete' and target_id = :'tess'), 1);

-- ===========================================================================
\echo ''
\echo '--- Nothing goes before six months ---'
-- ===========================================================================
select test.check('the purge removes nothing on the first day', public.purge_erased_audit(), 0);
select test.check('...Quin''s rows are all still there',
  (select count(*) from public.audit_log
    where actor_id = :'quin' or target_id = :'quin'), 3);

-- Five months and 29 days is still not six months.
alter table public.audit_log disable trigger audit_log_append_only;
update public.audit_log set created_at = now() - interval '5 months 29 days'
  where action = 'account.delete' and target_id = :'quin';
alter table public.audit_log enable trigger audit_log_append_only;
select test.check('one day short of six months, the purge still removes nothing', public.purge_erased_audit(), 0);

-- ===========================================================================
\echo ''
\echo '--- Six months after the deletion, every row that names the account goes ---'
-- ===========================================================================
alter table public.audit_log disable trigger audit_log_append_only;
update public.audit_log set created_at = now() - interval '6 months 1 day'
  where action = 'account.delete' and target_id = :'quin';
alter table public.audit_log enable trigger audit_log_append_only;

select test.check('the purge removes what Quin did, what was done to Quin, and the deletion row',
  public.purge_erased_audit(), 3);
select test.check('nothing names Quin any more',
  (select count(*) from public.audit_log where actor_id = :'quin' or target_id = :'quin'), 0);
select test.check('Reed''s other rows are untouched',
  (select count(*) from public.audit_log where action = 'test.reed_acts_on_sol'), 1);
select test.check('Sol''s own row is untouched',
  (select count(*) from public.audit_log where action = 'test.sol_acts'), 1);
select test.check('Tess, deleted just now, is still marked',
  (select count(*) from public.audit_log where action = 'account.delete' and target_id = :'tess'), 1);
select test.check('running it again removes nothing', public.purge_erased_audit(), 0);

-- ===========================================================================
\echo ''
\echo '--- The audit log is still append-only for everybody else ---'
-- ===========================================================================
select test.check_raises_like('even the database owner cannot delete a row',
  $$ delete from public.audit_log where action = 'test.sol_acts' $$, '%append-only%');
select test.check_raises_like('...or change one',
  $$ update public.audit_log set action = 'tampered' where action = 'test.sol_acts' $$, '%append-only%');
select test.check_raises_like('the points ledger gets no exception',
  $$ delete from public.points_ledger where id = '99999999-0000-0000-0000-000000000001' $$, '%append-only%');
select test.check('the guard is back on after the purge',
  (select count(*) from pg_trigger where tgname = 'audit_log_append_only' and tgenabled = 'O'), 1);
select test.check('...and the purge flag is off',
  (select case when coalesce(current_setting('pam.purging_audit_log', true), 'off') = 'on' then 1 else 0 end), 0);

-- A service-role connection that sets the flag itself is still refused: the
-- guard also wants the session to be running as the purge function's owner.
set role service_role;
do $$
begin
  perform set_config('pam.purging_audit_log', 'on', true);
  begin
    delete from public.audit_log where action = 'test.sol_acts';
    raise exception 'FAIL  service_role lifted the audit guard by setting the flag itself';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    service_role cannot lift the guard by setting the flag (%)', left(sqlerrm, 40);
  end;
end;
$$;
reset role;

select test.check('...and the row it tried to delete is still there',
  (select count(*) from public.audit_log where action = 'test.sol_acts'), 1);

-- ===========================================================================
\echo ''
\echo '--- Nobody but the schedule can run the purge ---'
-- ===========================================================================
set role authenticated;
select test.check_raises_like('a signed-in person cannot call the purge',
  $$ select public.purge_erased_audit() $$, '%permission denied%');
reset role;
set role anon;
select test.check_raises_like('nor a visitor',
  $$ select public.purge_erased_audit() $$, '%permission denied%');
reset role;
set role authenticated;
select test.check_raises_like('nor can anyone write the deletion row by hand',
  $$ select public.record_account_deletion() $$, '%permission denied%');
reset role;

-- ===========================================================================
\echo ''
\echo '--- What the rule rests on ---'
-- ===========================================================================
select test.check('the audit log no longer has a foreign key to profiles',
  (select count(*) from pg_constraint
    where conrelid = 'public.audit_log'::regclass and confrelid = 'public.profiles'::regclass), 0);
select test.check('a deletion row is written by a trigger on profiles',
  (select count(*) from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_record_deletion'), 1);

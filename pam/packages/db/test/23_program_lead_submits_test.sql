-- A program lead submits their own program (20261010042108, D-447).
--
-- The belief this test replaces: "the rules already let a lead write a
-- listing". They did not, for a lead with no org. And the rules that did
-- exist let a lead with an org approve their own listing. These attack both:
-- a lead with no org can send a program and ends up with one; what they send
-- is hidden from members; only a lead can send; a blank name is refused; one
-- program waits for review at a time; and a lead cannot approve it, add one
-- already approved, move it to another org, or touch another program's.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set alice         '33333333-0000-0000-0000-00000000000f'
\set bob           '33333333-0000-0000-0000-000000000010'
\set tanya         '33333333-0000-0000-0000-00000000000d'
\set dana          '33333333-0000-0000-0000-00000000000a'
\set region_north  '11111111-0000-0000-0000-000000000001'
\set newlead       '77777777-0000-0000-0000-000000000601'

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
insert into auth.users (id, phone) values (:'newlead', '12675559601');
-- A program lead whose account Pam approved: a provider, with no org yet.
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'newlead', 'provider', 'Nell', :'region_north', '+12675559601', 'active');

-- ===========================================================================
\echo ''
\echo '--- Sending a program ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'newlead');

do $$
declare
  s public.services;
  o uuid;
begin
  s := public.submit_program('Fresh Start Kitchen', 'workforce', 'job_training',
                             'Cooking classes.', '12 Main St', '+12675550101', 'https://example.org');
  if s.org_id is null then
    raise exception 'FAIL  the listing has no org';
  end if;
  if not s.needs_review then
    raise exception 'FAIL  a sent program is not waiting for review';
  end if;
  select org_id into o from public.profiles where id = '77777777-0000-0000-0000-000000000601';
  if o is distinct from s.org_id then
    raise exception 'FAIL  the lead''s profile does not point at the new org';
  end if;
  if s.source <> 'manual' or s.name <> 'Fresh Start Kitchen' or s.description_plain <> 'Cooking classes.' then
    raise exception 'FAIL  the listing does not carry what was sent';
  end if;
  raise notice 'ok    a lead with no org sends a program, gets an org, and it waits for review';
end;
$$;

select test.check('the lead can read their own waiting program',
  (select count(*) from public.services where name = 'Fresh Start Kitchen'), 1);

select test.check_raises_like('a second program cannot be sent while one waits',
  $$select public.submit_program('Another One', 'education')$$, '%PROGRAM_ALREADY_IN_REVIEW%');

select test.as_user(:'tanya');
select test.check('a member cannot see a program waiting for review',
  (select count(*) from public.services where name = 'Fresh Start Kitchen'), 0);
select test.check_raises_like('a member cannot send a program',
  $$select public.submit_program('Mine', 'education')$$, '%NOT_A_PROGRAM_LEAD%');

select test.as_user(:'dana');
select test.check_raises_like('a case manager sending a program is not this door',
  $$select public.submit_program('Mine', 'education')$$, '%NOT_A_PROGRAM_LEAD%');

reset role;
set role anon;
select test.check_raises('a signed-out visitor cannot send a program',
  $$select public.submit_program('Mine', 'education')$$);

reset role;
update public.profiles set org_id = null where id = :'newlead';
delete from public.services where name = 'Fresh Start Kitchen';
set role authenticated;
select test.as_user(:'newlead');
select test.check_raises_like('a blank name is refused',
  $$select public.submit_program('   ', 'education')$$, '%NAME_REQUIRED%');

-- ===========================================================================
\echo ''
\echo '--- A lead cannot approve their own listing ---'
-- ===========================================================================
select test.as_user(:'alice');
select test.check_raises_like('a lead cannot mark their own listing approved',
  $$update public.services set needs_review = false
    where org_id = '22222222-0000-0000-0000-000000000001'$$, '%REVIEW_IS_NOT_YOURS%');
-- (the fixture has a listing for Riverside; if there is none the update
-- changes no rows and nothing is raised, which the next two cover)
reset role;
insert into public.services (id, org_id, name, category, source, needs_review)
values ('88888888-0000-0000-0000-000000000601', '22222222-0000-0000-0000-000000000001',
        'Riverside Test Program', 'education', 'manual', true);
set role authenticated;
select test.as_user(:'alice');
select test.check_raises_like('...even when the row exists',
  $$update public.services set needs_review = false where id = '88888888-0000-0000-0000-000000000601'$$,
  '%REVIEW_IS_NOT_YOURS%');
-- D-447: a live program's name, address and category are not edited in place.
reset role;
-- Nobody signed in while the fixture is written, or the guard treats the
-- owner's insert as the last user's and holds it for review.
select set_config('request.jwt.claim.sub', '', false);
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active)
values ('88888888-0000-0000-0000-000000000602', '22222222-0000-0000-0000-000000000001',
        'Riverside Live Program', 'education', '1 Water St', 'manual', false, true);
set role authenticated;
select test.as_user(:'alice');
select test.check_raises_like('a lead cannot rename a live program in place',
  $$update public.services set name = 'Other Name' where id = '88888888-0000-0000-0000-000000000602'$$,
  '%LIVE_LISTING_NEEDS_REVIEW%');
select test.check_raises_like('...nor change its address',
  $$update public.services set address = '2 Water St' where id = '88888888-0000-0000-0000-000000000602'$$,
  '%LIVE_LISTING_NEEDS_REVIEW%');
select test.check_raises_like('...nor its category',
  $$update public.services set category = 'workforce' where id = '88888888-0000-0000-0000-000000000602'$$,
  '%LIVE_LISTING_NEEDS_REVIEW%');
do $$
declare n integer;
begin
  update public.services set phone = '+12675550104', website = 'https://example.org/live',
    description_plain = 'New words.'
  where id = '88888888-0000-0000-0000-000000000602';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'FAIL  a lead could not change a live program''s phone, website and description';
  end if;
  raise notice 'ok    a lead changes a live program''s phone, website and description at once';
end;
$$;
select test.check('...and it stays live for members',
  (select count(*) from public.services
   where id = '88888888-0000-0000-0000-000000000602' and not needs_review and is_active), 1);

select test.check_raises_like('a lead cannot move their listing to another org',
  $$update public.services set org_id = '22222222-0000-0000-0000-000000000002'
    where id = '88888888-0000-0000-0000-000000000601'$$, '%REVIEW_IS_NOT_YOURS%');
do $$
declare n integer;
begin
  update public.services set phone = '+12675550102'
  where id = '88888888-0000-0000-0000-000000000601';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'FAIL  a lead could not edit their own listing''s plain details';
  end if;
  raise notice 'ok    a lead can still edit their own listing''s plain details';
end;
$$;

do $$
declare
  held boolean;
begin
  insert into public.services (org_id, name, category, source, needs_review)
  values ('22222222-0000-0000-0000-000000000001', 'Sneaky', 'education', 'manual', false);
  select needs_review into held from public.services where name = 'Sneaky';
  if not held then
    raise exception 'FAIL  a lead inserted a listing already approved';
  end if;
  raise notice 'ok    a listing a lead inserts is waiting for review whatever they asked';
end;
$$;

select test.as_user(:'bob');
do $$
declare n integer;
begin
  update public.services set phone = '+12675550103'
  where id = '88888888-0000-0000-0000-000000000601';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL  a lead changed another program''s listing';
  end if;
  raise notice 'ok    a lead cannot change another program''s listing';
end;
$$;

reset role;
select test.as_user(:'dana');
-- An admin is not held to the lead's rule.
update public.services set needs_review = false where id = '88888888-0000-0000-0000-000000000601';
do $$ begin raise notice 'ok    an admin can approve a listing'; end $$;

-- An approved program lead gets an organisation (20261010062347, D-447).
--
-- Before it, approving a program lead added their program to the catalogue
-- with no org on the listing or on their profile, so the lead could neither
-- read nor edit the program they had just been approved for. These check that
-- the approval now leaves a lead who can read their own program, that it is
-- theirs alone, and that a request without program details still creates none.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north  '11111111-0000-0000-0000-000000000001'
\set boss          '77777777-0000-0000-0000-000000000701'
\set lead          '77777777-0000-0000-0000-000000000702'
\set bare          '77777777-0000-0000-0000-000000000703'
\set bob           '33333333-0000-0000-0000-000000000010'

reset role;
insert into auth.users (id, phone) values
  (:'boss', '12675559701'), (:'lead', '12675559702'), (:'bare', '12675559703');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675559701', 'active');
insert into public.staff_requests (
  user_id, wants_role, first_name, last_name, city,
  program_name, program_category, program_description, program_address, program_phone
) values
  (:'lead', 'provider', 'Lee', 'Ward', 'North', 'Lee''s Learning Lab', 'education',
   'Evening classes.', '9 Elm St', '+12675550199'),
  (:'bare', 'provider', 'Bo', 'Hart', 'North', null, null, null, null, null);

set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'lead', 'approved', :'region_north');
select public.review_staff_request(:'bare', 'approved', :'region_north');

-- Read back as the owner: what a super admin may see of a profile is a
-- different promise (the transparency contract), tested elsewhere.
reset role;

do $$
declare
  o uuid;
  n integer;
begin
  select org_id into o from public.profiles where id = '77777777-0000-0000-0000-000000000702';
  if o is null then
    raise exception 'FAIL  an approved lead has no org';
  end if;
  select count(*) into n from public.services where org_id = o and name = 'Lee''s Learning Lab';
  if n <> 1 then
    raise exception 'FAIL  the approved program is not in the lead''s org (% found)', n;
  end if;
  select count(*) into n from public.orgs where id = o and name = 'Lee''s Learning Lab'
    and region_id = '11111111-0000-0000-0000-000000000001';
  if n <> 1 then
    raise exception 'FAIL  the new org does not carry the program''s name and the approved city';
  end if;
  raise notice 'ok    an approved program lead gets an org, and their program is in it';
end;
$$;

do $$
declare o uuid;
begin
  select org_id into o from public.profiles where id = '77777777-0000-0000-0000-000000000703';
  if o is not null then
    raise exception 'FAIL  a lead who left no program details was given an org';
  end if;
  raise notice 'ok    a lead who left no program details gets none (submit_program makes it later)';
end;
$$;

-- The lead can now read their own program, and another program's lead cannot.
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select test.check('the approved lead reads their own program',
  (select count(*) from public.services where name = 'Lee''s Learning Lab'), 1);
select set_config('request.jwt.claim.sub', :'bob', false);
select test.check('another program''s lead does not read it through their org',
  (select count(*) from public.services
   where name = 'Lee''s Learning Lab' and org_id = public.my_org()), 0);

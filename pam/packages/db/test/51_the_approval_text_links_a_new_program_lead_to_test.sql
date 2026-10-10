-- the approval text links a new program lead to Add your program (test 51).
--
-- Claimed 2026-10-10 on `claude/places-programs-add-program-link` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set boss    'cccccccc-0000-0000-0000-000000005101'
\set n_bare  'cccccccc-0000-0000-0000-000000005102'
\set n_prog  'cccccccc-0000-0000-0000-000000005103'
\set n_case  'cccccccc-0000-0000-0000-000000005104'
\set m_bare  'cccccccc-0000-0000-0000-000000005105'
\set m_prog  'cccccccc-0000-0000-0000-000000005106'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'boss', '12675558511'), (:'n_bare', '12675558512'), (:'n_prog', '12675558513'),
  (:'n_case', '12675558514'), (:'m_bare', '12675558515'), (:'m_prog', '12675558516');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558511', 'active'),
  (:'m_bare', 'member', 'Mia', :'region_north', '+12675558515', 'active'),
  (:'m_prog', 'member', 'Moe', :'region_north', '+12675558516', 'active');
insert into public.staff_requests (
  user_id, wants_role, first_name, last_name, city,
  program_name, program_category, program_description, program_address, program_phone
) values
  (:'n_bare', 'provider', 'Nan', 'Aldo', 'North', null, null, null, null, null),
  (:'n_prog', 'provider', 'Ned', 'Bell', 'North', 'Ned''s Nook', 'education', 'Quiet study.', '5 Pine St', '+12675550166'),
  (:'n_case', 'admin', 'Nell', 'Cole', 'North', null, null, null, null, null),
  (:'m_bare', 'provider', 'Mia', 'Dunn', 'North', null, null, null, null, null),
  (:'m_prog', 'provider', 'Moe', 'Eads', 'North', 'Moe''s Mill', 'workforce', 'Open bench.', '6 Oak St', '+12675550155');

-- A known address, so what the text carries can be read exactly (put back at the end).
create temp table kept_url as select value from public.app_settings where key = 'app_url';
update public.app_settings set value = 'https://app.example.test' where key = 'app_url';

\echo ''
\echo '--- Who is sent to Add your program ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'n_bare', 'approved', :'region_north');
select public.review_staff_request(:'n_prog', 'approved', :'region_north');
select public.review_staff_request(:'n_case', 'approved', :'region_north');
select public.review_staff_request(:'m_bare', 'approved', :'region_north');
select public.review_staff_request(:'m_prog', 'approved', :'region_north');
reset role;

select test.check('a new program lead with no program gets the Add your program link',
  (select count(*) from public.outbound_messages where member_id = :'n_bare'::uuid and template_key = 'staff_request_approved' and vars->>'link' = 'https://app.example.test/programs/new/'), 1::bigint);
select test.check('...and so does a member who asked to lead a program, with none given',
  (select count(*) from public.outbound_messages where member_id = :'m_bare'::uuid and template_key = 'staff_request_approved' and vars->>'link' = 'https://app.example.test/programs/new/'), 1::bigint);
select test.check('a lead whose program was added by the approval keeps the bare link',
  (select count(*) from public.outbound_messages where member_id = :'n_prog'::uuid and template_key = 'staff_request_approved' and vars->>'link' = 'https://app.example.test'), 1::bigint);
select test.check('...for an existing member too',
  (select count(*) from public.outbound_messages where member_id = :'m_prog'::uuid and template_key = 'staff_request_approved' and vars->>'link' = 'https://app.example.test'), 1::bigint);
select test.check('a case manager keeps the bare link',
  (select count(*) from public.outbound_messages where member_id = :'n_case'::uuid and template_key = 'staff_request_approved' and vars->>'link' = 'https://app.example.test'), 1::bigint);

-- An address saved with a slash on the end does not double it.
update public.staff_requests set decision = null, reviewed_at = null, reviewed_by = null where user_id = :'n_bare'::uuid;
delete from public.outbound_messages where member_id = :'n_bare'::uuid and template_key = 'staff_request_approved';
update public.app_settings set value = 'https://app.example.test/' where key = 'app_url';
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'n_bare', 'approved', :'region_north');
reset role;
select test.check('a trailing slash on the app address is not doubled',
  (select count(*) from public.outbound_messages where member_id = :'n_bare'::uuid and template_key = 'staff_request_approved' and vars->>'link' = 'https://app.example.test/programs/new/'), 1::bigint);

update public.app_settings set value = (select value from kept_url) where key = 'app_url';
drop table kept_url;

\echo ''
\echo 'approval text link: all checks passed'

-- An invite knows who it is for (0077, D-373): name and phone are required,
-- and after sign-in Pam finds the invite waiting for the number just
-- verified — only ever the caller's own, never anybody else's, and without
-- telling the inviter whether that number already has an account.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set admin_north   '33333333-0000-0000-0000-00000000000a'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set nia           '33333333-0000-0000-0000-0000000000d1'
\set omar          '33333333-0000-0000-0000-0000000000d2'
\set stranger      '33333333-0000-0000-0000-0000000000d3'

-- Auth keeps numbers as bare digits (0075); Marcus is a member whose number
-- a program will later try to invite as staff.
reset role;
insert into auth.users (id, phone) values
  (:'nia', '12675550301'),
  (:'omar', '12675550302'),
  (:'stranger', '12675550303');
update auth.users set phone = '12675550304' where id = :'marcus';

set role authenticated;
select test.as_user(:'alice');
select (public.create_staff_invite('provider', 'nia@example.org', '267-555-0301', null, 'Nia')).code as nia_code \gset
select (public.create_staff_invite('provider', 'marcus@example.org', '(267) 555-0304', null, 'Marcus')).code as marcus_code \gset

reset role;
select test.check('the invite keeps the name and the number, as E.164',
  (select count(*) from public.invites where code = :'nia_code' and first_name = 'Nia' and phone = '+12675550301'), 1);

-- ===========================================================================
\echo ''
\echo '--- The invite waiting for the number just verified ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'nia');
select test.check('Nia, with no account yet, is shown the invite made for her number',
  (select count(*) from public.pending_invite_for_me()
    where code = :'nia_code' and invited_role = 'provider' and first_name = 'Nia'
      and inviter_first_name = 'Alice' and not has_account), 1);

select test.as_user(:'stranger');
select test.check('a number nobody invited finds nothing',
  (select count(*) from public.pending_invite_for_me()), 0);

select test.as_user(:'omar');
select test.check('...and cannot see anybody else''s invite',
  (select count(*) from public.pending_invite_for_me() where code = :'nia_code'), 0);

set role anon;
select test.check_raises('signed out, nobody can ask', 'select * from public.pending_invite_for_me()');

-- A member's number invited as staff: the member is told, the inviter is not.
set role authenticated;
select test.as_user(:'marcus');
select test.check('a member whose number has a staff invite is told it needs another number',
  (select count(*) from public.pending_invite_for_me() where code = :'marcus_code' and has_account), 1);

-- The invite still only redeems for its own number.
select test.as_user(:'omar');
select test.check_raises('another number cannot redeem Nia''s invite',
  format($$select public.redeem_invite(%L, 'Omar')$$, :'nia_code'));

select test.as_user(:'nia');
select (public.redeem_invite(:'nia_code', 'Nia')).id as nia_profile \gset
select test.check('once redeemed, it is no longer waiting',
  (select count(*) from public.pending_invite_for_me()), 0);

-- ===========================================================================
\echo ''
\echo '--- A renewed link keeps who it is for (0071) ---'
-- ===========================================================================
reset role;
insert into public.invites (code, created_by, role, region_id, phone, first_name, expires_at)
values ('OLDLINK1', :'admin_north', 'member', '11111111-0000-0000-0000-000000000001',
        '+12675550302', 'Omar', now() - interval '1 day');

set role anon;
select public.request_invite_link('OLDLINK1', 'omar@example.org') as renewed \gset

reset role;
select test.check('the fresh invite is for the same name and number',
  (select count(*) from public.invites i join public.invite_emails e on e.new_invite = i.id
    where e.expired_invite = (select id from public.invites where code = 'OLDLINK1')
      and i.first_name = 'Omar' and i.phone = '+12675550302'), 1);

set role authenticated;
select test.as_user(:'omar');
select test.check('...so Omar is shown it when he signs in',
  (select count(*) from public.pending_invite_for_me() where first_name = 'Omar'), 1);

reset role;

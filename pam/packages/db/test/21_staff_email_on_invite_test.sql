-- A staff invite carries the person's email, and their account keeps it (0086,
-- D-441). Will, 9 October 2026: emails are collected when a guide or a program
-- invites someone, not when somebody creates their account; the phone they
-- sign in with maps to the email they were invited with; members are not asked;
-- and for staff it is not optional.
--
-- These attack the promises the design makes: a staff invite cannot be made
-- without an email, a member invite cannot carry one; the email waits where
-- nobody (not even the person who typed it) can read it; it lands on the account
-- only for the number the invite named; nobody but its owner reads it from the
-- account; nobody writes it from the app; a renewed invite keeps it; an invite
-- made before 0086 redeems as it always did; the audit log never holds it.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana          '33333333-0000-0000-0000-00000000000a'
\set ray           '33333333-0000-0000-0000-00000000000b'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set ivy           '55555555-0000-0000-0000-000000000501'
\set pat           '55555555-0000-0000-0000-000000000502'
\set mia           '55555555-0000-0000-0000-000000000503'
\set hal           '55555555-0000-0000-0000-000000000504'
\set kay           '55555555-0000-0000-0000-000000000505'
\set lou           '55555555-0000-0000-0000-000000000506'
\set olly          '55555555-0000-0000-0000-000000000507'
\set stranger      '55555555-0000-0000-0000-000000000508'
\set sup           '55555555-0000-0000-0000-000000000509'
\set region_north  '11111111-0000-0000-0000-000000000001'

-- A check that the statement fails *with this reason*, not just that it fails.
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

-- People who will sign in with the number they were invited by. Auth keeps a
-- verified number as bare digits (0075).
reset role;
insert into auth.users (id, phone) values
  (:'ivy',      '12675559501'),
  (:'pat',      '12675559502'),
  (:'mia',      '12675559503'),
  (:'hal',      '12675559504'),
  (:'kay',      '12675559505'),
  (:'lou',      '12675559506'),
  (:'olly',     '12675559507'),
  (:'stranger', '12675559508'),
  (:'sup',      '12675559509');
-- Hal and Kay are members already, who will also work at a program (0078).
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'hal', 'member', 'Hal', :'region_north', '+12675559504', 'active'),
  (:'kay', 'member', 'Kay', :'region_north', '+12675559505', 'active'),
  (:'sup', 'super_admin', 'Sue', :'region_north', '+12675559509', 'active');
-- Kay already has an email on her account.
insert into public.profile_emails (profile_id, email) values (:'kay', 'kay@old.example');

-- ===========================================================================
\echo ''
\echo '--- A staff invite needs an email; a member invite never has one ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'dana');
select test.check_raises_like('a case manager cannot invite a case manager without an email',
  $$select public.create_staff_invite('admin', null, '267-555-9501', null, 'Ivy')$$, '%INVITE_NEEDS_EMAIL%');
select test.check_raises_like('a blank email is the same as none',
  $$select public.create_staff_invite('admin', '   ', '267-555-9501', null, 'Ivy')$$, '%INVITE_NEEDS_EMAIL%');
select test.check_raises_like('an email has to look like one',
  $$select public.create_staff_invite('admin', 'not an email', '267-555-9501', null, 'Ivy')$$, '%INVITE_EMAIL_INVALID%');
select test.check_raises_like('the old four-argument door refuses a staff role',
  $$select public.create_invite('admin', '267-555-9501', null, 'Ivy')$$, '%INVITE_NEEDS_EMAIL%');
select test.check_raises_like('...and a program role',
  $$select public.create_invite('provider', '267-555-9502', null, 'Pat')$$, '%INVITE_NEEDS_EMAIL%');
select test.check_raises_like('the staff door refuses a member',
  $$select public.create_staff_invite('member', 'mia@example.org', '267-555-9503', null, 'Mia')$$, '%INVITE_NOT_STAFF%');
select test.check_raises_like('nobody is invited to be a super admin, with or without an email',
  $$select public.create_staff_invite('super_admin', 'x@example.org', '267-555-9503', null, 'Mia')$$, '%INVITE_NOT_STAFF%');
select test.check_raises('the shared function behind both is not callable from the app',
  $$select public.invite_create('member', '267-555-9503', null, 'Mia', 'mia@example.org')$$);
select test.check_raises('...nor the one that moves the email onto an account',
  format($$select public.keep_invite_email(gen_random_uuid(), %L)$$, :'dana'));

select (public.create_staff_invite('admin', ' Ivy@Example.org ', '267-555-9501', null, 'Ivy')).code as ivy_code \gset
select (public.create_invite('member', '267-555-9503', null, 'Mia')).code as mia_code \gset
select test.check_raises_like('a program invite needs an email too',
  $$select public.create_staff_invite('provider', null, '267-555-0599', null, 'X')$$, '%INVITE_NEEDS_EMAIL%');

select test.as_user(:'alice');
select test.check_raises_like('a program still cannot invite a case manager, email or not',
  $$select public.create_staff_invite('admin', 'cy@example.org', '267-555-0598', null, 'Cy')$$, '%cannot invite a case manager%');
select (public.create_staff_invite('provider', 'pat@example.org', '267-555-9502', null, 'Pat')).code as pat_code \gset
select (public.create_staff_invite('provider', 'hal@example.org', '267-555-9504', null, 'Hal')).code as hal_code \gset
select (public.create_staff_invite('provider', 'kay-new@example.org', '267-555-9505', null, 'Kay')).code as kay_code \gset
select (public.create_staff_invite('provider', 'lou-work@example.org', '267-555-9506', null, 'Lou')).code as lou_code \gset

reset role;
select test.check('the address is trimmed and kept in lower case, held for the invite',
  (select count(*) from public.invite_contact_emails c join public.invites i on i.id = c.invite_id
    where i.code = :'ivy_code' and c.email = 'ivy@example.org'), 1);
select test.check('a member invite holds no email',
  (select count(*) from public.invite_contact_emails c join public.invites i on i.id = c.invite_id
    where i.code = :'mia_code'), 0);
select test.check('the invite row itself has no email column',
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'invites' and column_name like '%email%'), 0);
select test.check('the audit log never holds an address',
  (select count(*) from public.audit_log
    where action like 'invite.%' and meta::text like '%@%'), 0);

-- ===========================================================================
\echo ''
\echo '--- Nobody can read it before the person signs in ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'dana');
select test.check_raises('the case manager who typed it cannot read it back',
  $$select count(*) from public.invite_contact_emails$$);
select test.as_user(:'alice');
select test.check_raises('the program that typed theirs cannot either',
  $$select count(*) from public.invite_contact_emails$$);
select test.as_user(:'ray');
select test.check_raises('another case manager cannot',
  $$select count(*) from public.invite_contact_emails$$);
select test.as_user(:'marcus');
select test.check_raises('a member cannot',
  $$select count(*) from public.invite_contact_emails$$);
select test.as_user(:'sup');
select test.check_raises('not even the super admin, through the app',
  $$select count(*) from public.invite_contact_emails$$);
select test.check_raises('and nobody writes to it',
  $$insert into public.invite_contact_emails (invite_id, email) select id, 'x@example.org' from public.invites limit 1$$);
set role anon;
select test.check_raises('a signed-out visitor cannot',
  $$select count(*) from public.invite_contact_emails$$);

-- ===========================================================================
\echo ''
\echo '--- Signing in with the invited number puts the email on the account ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'ivy');
select (public.redeem_invite(:'ivy_code', 'Ivy')).id as ivy_profile \gset
select test.as_user(:'pat');
select (public.redeem_invite(:'pat_code', 'Pat')).id as pat_profile \gset
select test.as_user(:'mia');
select (public.redeem_invite(:'mia_code', 'Mia')).id as mia_profile \gset

reset role;
select test.check('Ivy''s account holds the email her invite carried',
  (select count(*) from public.profile_emails where profile_id = :'ivy' and email = 'ivy@example.org'), 1);
select test.check('...tied to the invite that named her number and her email',
  (select count(*) from public.profile_emails e join public.invites i on i.id = e.from_invite
    where e.profile_id = :'ivy' and i.code = :'ivy_code' and i.phone = '+12675559501'), 1);
select test.check('Pat''s account holds hers',
  (select count(*) from public.profile_emails where profile_id = :'pat' and email = 'pat@example.org'), 1);
select test.check('Mia, a member, has none: nobody asked',
  (select count(*) from public.profile_emails where profile_id = :'mia'), 0);
select test.check('the invite no longer holds it once the account does',
  (select count(*) from public.invite_contact_emails c join public.invites i on i.id = c.invite_id
    where i.code in (:'ivy_code', :'pat_code')), 0);

-- ===========================================================================
\echo ''
\echo '--- ...and only its owner can read it ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'ivy');
select test.check('Ivy reads her own', (select count(*) from public.profile_emails), 1);
select test.as_user(:'dana');
select test.check('the case manager who invited her reads nothing', (select count(*) from public.profile_emails where profile_id = :'ivy'), 0);
select test.as_user(:'ray');
select test.check('another case manager reads nothing', (select count(*) from public.profile_emails where profile_id = :'ivy'), 0);
select test.as_user(:'alice');
select test.check('a program reads nothing', (select count(*) from public.profile_emails where profile_id = :'ivy'), 0);
select test.as_user(:'marcus');
select test.check('a member reads nothing', (select count(*) from public.profile_emails where profile_id = :'ivy'), 0);
select test.as_user(:'sup');
select test.check('the super admin reads nothing through the app', (select count(*) from public.profile_emails where profile_id = :'ivy'), 0);
select test.as_user(:'ivy');
select test.check_raises('nobody writes an email from the app: insert',
  format($$insert into public.profile_emails (profile_id, email) values (%L, 'x@example.org')$$, :'marcus'));
select test.check_raises('...update',
  $$update public.profile_emails set email = 'x@example.org'$$);
select test.check_raises('...or delete',
  $$delete from public.profile_emails$$);
set role anon;
select test.check_raises('a signed-out visitor reads none', $$select count(*) from public.profile_emails$$);

-- ===========================================================================
\echo ''
\echo '--- Only the number the invite named gets it ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'stranger');
select test.check_raises_like('another number cannot redeem Hal''s invite',
  format($$select public.redeem_invite(%L, 'Sneak')$$, :'hal_code'), '%INVITE_PHONE_MISMATCH%');
reset role;
select test.check('...so nobody got the email', (select count(*) from public.profile_emails where profile_id = :'stranger'), 0);
select test.check('...and it still waits on the invite',
  (select count(*) from public.invite_contact_emails c join public.invites i on i.id = c.invite_id
    where i.code = :'hal_code' and c.email = 'hal@example.org'), 1);

-- ===========================================================================
\echo ''
\echo '--- A member who also works at a program: the account keeps its first email ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'hal');
select public.add_role_from_invite(:'hal_code');
select test.check('Hal had none, so the program invite''s email lands on the account',
  (select count(*) from public.profile_emails where profile_id = :'hal' and email = 'hal@example.org'), 1);
select test.as_user(:'kay');
select public.add_role_from_invite(:'kay_code');
select test.check('Kay had one already: the first stays',
  (select count(*) from public.profile_emails where profile_id = :'kay' and email = 'kay@old.example'), 1);
select test.check('...and the new one is not kept beside it',
  (select count(*) from public.profile_emails where profile_id = :'kay'), 1);
reset role;
select test.check('both program invites let go of their email',
  (select count(*) from public.invite_contact_emails c join public.invites i on i.id = c.invite_id
    where i.code in (:'hal_code', :'kay_code')), 0);

-- ===========================================================================
\echo ''
\echo '--- A renewed invite still delivers the email it was made with ---'
-- ===========================================================================
update public.invites set expires_at = now() - interval '1 day' where code = :'lou_code';
set role anon;
select public.request_invite_link(:'lou_code', 'lou@personal.example');
reset role;
select i.code as lou_new_code from public.invites i
  where i.phone = '+12675559506' and i.status = 'pending' \gset
select test.check('the fresh invite holds no email of its own: the first one still does',
  (select count(*) from public.invite_contact_emails c join public.invites i on i.id = c.invite_id
    where i.code in (:'lou_code', :'lou_new_code')), 1);
set role authenticated;
select test.as_user(:'lou');
select public.redeem_invite(:'lou_new_code', 'Lou');
reset role;
select test.check('Lou''s account holds the email the first invite was made with, not the one typed on the expired-link page',
  (select count(*) from public.profile_emails where profile_id = :'lou' and email = 'lou-work@example.org'), 1);
select test.check('...and no invite in the chain still holds it',
  (select count(*) from public.invite_contact_emails c join public.invites i on i.id = c.invite_id
    where i.phone = '+12675559506'), 0);

-- ===========================================================================
\echo ''
\echo '--- An invite made before 0086 redeems as it always did ---'
-- ===========================================================================
insert into public.invites (code, created_by, role, region_id, phone, first_name)
values (public.generate_invite_code(), :'alice', 'provider', :'region_north', '+12675559507', 'Olly')
returning code as old_code \gset
set role authenticated;
select test.as_user(:'olly');
select (public.redeem_invite(:'old_code', 'Olly')).id as olly_profile \gset
reset role;
select test.check('Olly has an account', (select count(*) from public.profiles where id = :'olly'), 1);
select test.check('...and no email, because none was asked then',
  (select count(*) from public.profile_emails where profile_id = :'olly'), 0);
select test.check('the audit log still never holds an address',
  (select count(*) from public.audit_log where action like 'invite.%' and meta::text like '%@%'), 0);

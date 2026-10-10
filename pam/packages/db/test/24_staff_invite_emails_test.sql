-- The queue a staff invite's email waits in (D-450). Attacks what the design
-- promises: a staff invite queues exactly one email and a member's none; the
-- queue holds no address; nobody but the sender (the service role) can read it
-- or call what claims it; the sender is handed the address only for an invite
-- that is still open; a claim is not given out twice, a failure is tried again
-- up to five times, a sent one is never sent again; the language is the
-- inviter's; and the queue goes with the invite.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana          '33333333-0000-0000-0000-00000000000a'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set sup           '66666666-0000-0000-0000-000000000901'
\set region_north  '11111111-0000-0000-0000-000000000001'

reset role;
insert into auth.users (id, phone) values (:'sup', '12675559901');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'sup', 'super_admin', 'Sue', :'region_north', '+12675559901', 'active');

-- Dana invites two case managers (one will be left open, one will expire), a
-- member, and Alice (a program) a program lead.
set role authenticated;
select test.as_user(:'dana');
select (public.create_staff_invite('admin', 'one@example.org', '267-555-9911', null, 'One')).id as one_id \gset
select (public.create_staff_invite('admin', 'two@example.org', '267-555-9912', null, 'Two')).id as two_id \gset
select (public.create_invite('member', '267-555-9913', null, 'Mem')).id as mem_id \gset
select test.as_user(:'alice');
select (public.create_staff_invite('provider', 'three@example.org', '267-555-9914', null, 'Three')).id as three_id \gset

reset role;
select test.check('a staff invite queues one email each',
  (select count(*) from public.staff_invite_emails where invite_id in (:'one_id', :'two_id', :'three_id')), 3);
select test.check('a member invite queues none',
  (select count(*) from public.staff_invite_emails where invite_id = :'mem_id'), 0);
select test.check('the queue holds no address column',
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'staff_invite_emails' and column_name like '%mail%'), 0);
select test.check('the language is the inviter''s (English here)',
  (select count(*) from public.staff_invite_emails where invite_id = :'one_id' and locale = 'en'), 1);

-- A Spanish-reading inviter queues Spanish.
update public.profiles set preferred_language = 'es' where id = :'dana';
set role authenticated;
select test.as_user(:'dana');
select (public.create_staff_invite('admin', 'four@example.org', '267-555-9915', null, 'Four')).id as four_id \gset
reset role;
select test.check('...and a Spanish-reading inviter queues Spanish',
  (select count(*) from public.staff_invite_emails where invite_id = :'four_id' and locale = 'es'), 1);
update public.profiles set preferred_language = 'en' where id = :'dana';

-- ===========================================================================
\echo ''
\echo '--- Nobody but the sender reaches the queue ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'dana');
select test.check_raises('the case manager who invited cannot read the queue',
  $$select count(*) from public.staff_invite_emails$$);
select test.as_user(:'sup');
select test.check_raises('a super admin cannot either: the app has no door to it',
  $$select count(*) from public.staff_invite_emails$$);
select test.check_raises('nobody signed in can claim a batch',
  $$select * from public.claim_staff_invite_emails(10)$$);
select test.check_raises('...or mark one sent',
  format($$select public.mark_staff_invite_email_sent(%L)$$, :'one_id'));
select test.check_raises('...or failed',
  format($$select public.mark_staff_invite_email_failed(%L, 'x')$$, :'one_id'));
set role anon;
select test.check_raises('a signed-out visitor cannot claim',
  $$select * from public.claim_staff_invite_emails(10)$$);

-- ===========================================================================
\echo ''
\echo '--- The sender claims what is still worth sending ---'
-- ===========================================================================
reset role;
-- Two is expired (a link that no longer works is never emailed).
update public.invites set expires_at = now() - interval '1 day' where id = :'two_id';

set role service_role;
create temp table claimed as select * from public.claim_staff_invite_emails(10);
grant all on claimed to public;
select test.check('the sender gets the open invites: one, three and four',
  (select count(*) from claimed where id in (:'one_id', :'three_id', :'four_id')), 3);
select test.check('...not the expired one',
  (select count(*) from claimed where id = :'two_id'), 0);
select test.check('...and nothing for a member',
  (select count(*) from claimed where id = :'mem_id'), 0);
select test.check('it carries the address the invite was made with, in lower case',
  (select count(*) from claimed where id = :'one_id' and email = 'one@example.org'), 1);
select test.check('...the role, the code and the inviter''s first name',
  (select count(*) from claimed where id = :'three_id' and role = 'provider' and inviter_first_name = 'Alice' and length(code) > 0), 1);
select test.check('...and Spanish for the Spanish-reading inviter''s',
  (select count(*) from claimed where id = :'four_id' and locale = 'es'), 1);

select test.check('a claimed email is not handed out again straight away',
  (select count(*) from public.claim_staff_invite_emails(10)), 0);

-- A failure releases it for another try, with the reason and a count.
select public.mark_staff_invite_email_failed(:'one_id', 'the provider answered 503');
select test.check('a failed one is claimed again on the next run',
  (select count(*) from public.claim_staff_invite_emails(10) where id = :'one_id'), 1);
select test.check('...counting its tries and keeping why it failed',
  (select count(*) from public.staff_invite_emails where invite_id = :'one_id' and attempts = 2 and failure_reason like '%503%'), 1);

-- A sent one is never sent again.
select public.mark_staff_invite_email_sent(:'three_id');
reset role;
update public.staff_invite_emails set claimed_at = now() - interval '1 hour' where invite_id = :'three_id';
set role service_role;
select test.check('a sent email is not claimed again, even after the claim goes stale',
  (select count(*) from public.claim_staff_invite_emails(10) where id = :'three_id'), 0);
select test.check('...and records when it went',
  (select count(*) from public.staff_invite_emails where invite_id = :'three_id' and sent_at is not null), 1);

-- A claim whose sender died comes back after fifteen minutes.
reset role;
update public.staff_invite_emails set claimed_at = now() - interval '16 minutes' where invite_id = :'four_id';
set role service_role;
select test.check('a claim older than fifteen minutes is taken again',
  (select count(*) from public.claim_staff_invite_emails(10) where id = :'four_id'), 1);

-- Five tries and then it is left for a person.
reset role;
update public.staff_invite_emails set attempts = 5, claimed_at = null where invite_id = :'four_id';
set role service_role;
select test.check('after five tries it is not tried again',
  (select count(*) from public.claim_staff_invite_emails(10) where id = :'four_id'), 0);

-- A limit is a limit.
reset role;
update public.staff_invite_emails set attempts = 0, claimed_at = null, sent_at = null
  where invite_id in (:'one_id', :'three_id', :'four_id');
set role service_role;
select test.check('a batch is no bigger than asked for',
  (select count(*) from public.claim_staff_invite_emails(2)), 2);

-- ===========================================================================
\echo ''
\echo '--- The queue goes with the invite, and the address with the account ---'
-- ===========================================================================
reset role;
select test.check('the queue cascades from the invite',
  (select count(*) from pg_constraint where conrelid = 'public.staff_invite_emails'::regclass
     and confrelid = 'public.invites'::regclass and contype = 'f' and confdeltype = 'c'), 1);

-- Once the invite is redeemed the address moves to the account (0086) and the
-- sender has nothing left to read.
update public.staff_invite_emails set attempts = 0, claimed_at = null, sent_at = null where invite_id = :'one_id';
delete from public.invite_contact_emails where invite_id = :'one_id';
set role service_role;
select test.check('an invite whose address has gone to the account is not claimed',
  (select count(*) from public.claim_staff_invite_emails(10) where id = :'one_id'), 0);
reset role;
update public.invites set status = 'revoked' where id = :'four_id';
update public.staff_invite_emails set attempts = 0, claimed_at = null where invite_id = :'four_id';
set role service_role;
select test.check('a revoked invite is not claimed',
  (select count(*) from public.claim_staff_invite_emails(10) where id = :'four_id'), 0);
reset role;

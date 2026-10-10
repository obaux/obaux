-- The expired-link email's queue (20261010133313, D-476). Someone whose invite
-- ran out asks for a fresh link by email; the sender is handed the ones still
-- worth sending. Attacks what the design promises: nobody but the sender
-- reaches the address or the claim; it carries the fresh link's code (never the
-- expired one's), the role, the language it was asked for in and the inviter's
-- first name; it is not handed out twice, a failure is tried again up to five
-- times, a sent one never again; and an old request, a fresh link that has itself
-- expired, or one used already, is not sent.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana '33333333-0000-0000-0000-00000000000a'
\set alice '33333333-0000-0000-0000-00000000000f'

create or replace function test.check_text(label text, actual text, expected text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception E'FAIL  %\n        got %, expected %', label, coalesce(actual, '(nothing)'), expected;
  end if;
  raise notice 'ok    %', label;
end;
$$;
grant execute on function test.check_text(text, text, text) to authenticated, anon, service_role;

-- Dana (a case manager) invites a case manager and a member; Alice (a program) invites a program lead.
reset role;
set role authenticated;
select test.as_user(:'dana');
select (public.create_staff_invite('admin', 'one@example.org', '267-555-9921', null, 'One')).id as one_id \gset
select (public.create_invite('member', '267-555-9922', null, 'Mem')).id as mem_id \gset
select test.as_user(:'alice');
select (public.create_staff_invite('provider', 'three@example.org', '267-555-9923', null, 'Three')).id as three_id \gset
reset role;

-- All three links run out; the same people ask for a fresh one (the page is open to anyone holding the link).
update public.invites set expires_at = now() - interval '1 day' where id in (:'one_id', :'mem_id', :'three_id');
select code as one_code from public.invites where id = :'one_id' \gset
select code as mem_code from public.invites where id = :'mem_id' \gset
select code as three_code from public.invites where id = :'three_id' \gset

set role anon;
select public.request_invite_link(:'one_code', 'Ivy@Example.org', 'es');
select public.request_invite_link(:'mem_code', 'mem@example.org', 'en');
select public.request_invite_link(:'three_code', 'lead@example.org', 'xx');
reset role;

select id as any_email_id from public.invite_emails limit 1 \gset
select test.check('three requests, three queued emails',
  (select count(*) from public.invite_emails where expired_invite in (:'one_id', :'mem_id', :'three_id')), 3);

-- ===========================================================================
\echo ''
\echo '--- Nobody but the sender reaches the queue ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'dana');
select test.check_raises('a case manager cannot read the queue', $$select count(*) from public.invite_emails$$);
select test.check_raises('nor claim a batch', $$select * from public.claim_invite_link_emails(10)$$);
select test.check_raises('nor mark one sent',
  format($$select public.mark_invite_link_email_sent(%L)$$, :'any_email_id'));
select test.check_raises('nor failed',
  format($$select public.mark_invite_link_email_failed(%L, 'x')$$, :'any_email_id'));
set role anon;
select test.check_raises('a signed-out visitor cannot claim', $$select * from public.claim_invite_link_emails(10)$$);

-- ===========================================================================
\echo ''
\echo '--- The sender claims what is still worth sending ---'
-- ===========================================================================
set role service_role;
create temp table claimed as select * from public.claim_invite_link_emails(10);
grant all on claimed to public;
select test.check('the sender gets all three',
  (select count(*) from claimed), 3::bigint);
select test.check('it carries the address, in lower case',
  (select count(*) from claimed where email = 'ivy@example.org'), 1::bigint);
select test.check('...the language it was asked for in, English where it was not one of Pam''s',
  (select count(*) from claimed where (email = 'ivy@example.org' and locale = 'es')
     or (email = 'mem@example.org' and locale = 'en') or (email = 'lead@example.org' and locale = 'en')), 3::bigint);
select test.check('...the role of the invite',
  (select count(*) from claimed where (email = 'ivy@example.org' and role = 'admin')
     or (email = 'mem@example.org' and role = 'member') or (email = 'lead@example.org' and role = 'provider')), 3::bigint);
select test.check('...and the inviter''s first name',
  (select count(*) from claimed where (email = 'ivy@example.org' and inviter_first_name = 'Dana')
     or (email = 'lead@example.org' and inviter_first_name = 'Alice')), 2::bigint);
select test.check('the code is the fresh link''s, never the one that expired',
  (select count(*) from claimed where code in (:'one_code', :'mem_code', :'three_code')), 0::bigint);
select test.check('...and it opens: the fresh invite is pending and not expired',
  (select count(*) from claimed c join public.invites i on i.code = c.code
    where i.status = 'pending' and i.expires_at > now()), 3::bigint);

select test.check('a claimed email is not handed out again straight away',
  (select count(*) from public.claim_invite_link_emails(10)), 0::bigint);

-- A failure releases it for another try, with the reason and a count.
select public.mark_invite_link_email_failed((select id from claimed where email = 'ivy@example.org'), 'the provider answered 503');
select test.check('a failed one is claimed again on the next run',
  (select count(*) from public.claim_invite_link_emails(10) where email = 'ivy@example.org'), 1::bigint);
reset role;
select test.check('...counting its tries and keeping why it failed',
  (select count(*) from public.invite_emails where email = 'ivy@example.org' and attempts = 2 and failure_reason like '%503%'), 1::bigint);

-- A sent one is never sent again.
set role service_role;
select public.mark_invite_link_email_sent((select id from claimed where email = 'mem@example.org'));
reset role;
update public.invite_emails set claimed_at = now() - interval '1 hour' where email = 'mem@example.org';
set role service_role;
select test.check('a sent email is not claimed again, even after its claim goes stale',
  (select count(*) from public.claim_invite_link_emails(10) where email = 'mem@example.org'), 0::bigint);
reset role;
select test.check('...and records when it went',
  (select count(*) from public.invite_emails where email = 'mem@example.org' and sent_at is not null and failure_reason is null), 1::bigint);

-- A claim whose sender died comes back after fifteen minutes.
update public.invite_emails set claimed_at = now() - interval '16 minutes' where email = 'lead@example.org';
set role service_role;
select test.check('a claim older than fifteen minutes is taken again',
  (select count(*) from public.claim_invite_link_emails(10) where email = 'lead@example.org'), 1::bigint);

-- Five tries and then it is left for a person.
reset role;
update public.invite_emails set attempts = 5, claimed_at = null where email = 'lead@example.org';
set role service_role;
select test.check('after five tries it is not tried again',
  (select count(*) from public.claim_invite_link_emails(10) where email = 'lead@example.org'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- What is not worth sending is not sent ---'
-- ===========================================================================
reset role;
update public.invite_emails set attempts = 0, claimed_at = null, sent_at = null;

-- An old request: nobody should get "here is your new link" a week and a day later.
update public.invite_emails set requested_at = now() - interval '8 days' where email = 'ivy@example.org';
set role service_role;
select test.check('a request more than seven days old is not sent',
  (select count(*) from public.claim_invite_link_emails(10) where email = 'ivy@example.org'), 0::bigint);
reset role;
update public.invite_emails set requested_at = now() - interval '6 days', claimed_at = null where email = 'ivy@example.org';
set role service_role;
select test.check('...but one made six days ago still is',
  (select count(*) from public.claim_invite_link_emails(10) where email = 'ivy@example.org'), 1::bigint);

-- The fresh link has itself run out, or been used.
reset role;
update public.invite_emails set claimed_at = null where true;
update public.invites set status = 'revoked' where id = (select new_invite from public.invite_emails where email = 'mem@example.org');
update public.invites set expires_at = now() - interval '1 minute' where id = (select new_invite from public.invite_emails where email = 'lead@example.org');
set role service_role;
select test.check('a fresh link withdrawn, or already expired, is not worth emailing',
  (select count(*) from public.claim_invite_link_emails(10) where email in ('mem@example.org', 'lead@example.org')), 0::bigint);

-- A limit is a limit.
reset role;
update public.invites set status = 'pending', expires_at = now() + interval '30 days'
  where id in (select new_invite from public.invite_emails);
update public.invite_emails set attempts = 0, claimed_at = null, sent_at = null, requested_at = now();
set role service_role;
select test.check('a batch is no bigger than asked for',
  (select count(*) from public.claim_invite_link_emails(2)), 2::bigint);

-- ===========================================================================
\echo ''
\echo '--- The queue goes with the invite ---'
-- ===========================================================================
reset role;
select test.check('the fresh invite''s rows cascade from it',
  (select count(*) from pg_constraint where conrelid = 'public.invite_emails'::regclass
     and confrelid = 'public.invites'::regclass and contype = 'f' and confdeltype = 'c'), 2::bigint);
select 'done' as done;

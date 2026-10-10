-- The address typed on the expired-link page is deleted once it has done its job
-- (20261010151208, D-487). Sent: it goes. Too old, out of tries, or the fresh link used or
-- run out: it goes. Still waiting and worth sending: it stays. The row keeps that a link was
-- asked for and sent. The invites log copes; the claim never hands out a removed address;
-- and a staff member's own address (kept at redeem) is untouched.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana  '33333333-0000-0000-0000-00000000000a'
\set alice '33333333-0000-0000-0000-00000000000f'
\set sup   '66666666-0000-0000-0000-0000000a7801'
\set region_north '11111111-0000-0000-0000-000000000001'

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

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'sup', '12675559501');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'sup', 'super_admin', 'Sue', :'region_north', '+12675559501', 'active');
update public.invite_emails set email = 'removed@removed.invalid', address_removed_at = now() where address_removed_at is null;

-- Dana invites a member and a case manager (who gets a real address on file); both links run out; both ask again.
set role authenticated;
select test.as_user(:'dana');
select (public.create_invite('member', '267-555-9531', null, 'Mem')).id as mem_id \gset
select (public.create_staff_invite('admin', 'staff.real@example.org', '267-555-9532', null, 'Staffer')).id as staff_id \gset
select (public.create_invite('member', '267-555-9533', null, 'Old')).id as old_id \gset
select (public.create_invite('member', '267-555-9534', null, 'Tries')).id as tries_id \gset
select (public.create_invite('member', '267-555-9535', null, 'Used')).id as used_id \gset
select (public.create_invite('member', '267-555-9536', null, 'Wait')).id as wait_id \gset
reset role;
update public.invites set expires_at = now() - interval '1 day' where id in (:'mem_id', :'staff_id', :'old_id', :'tries_id', :'used_id', :'wait_id');
select code as mem_code from public.invites where id = :'mem_id' \gset
select code as staff_code from public.invites where id = :'staff_id' \gset
select code as old_code from public.invites where id = :'old_id' \gset
select code as tries_code from public.invites where id = :'tries_id' \gset
select code as used_code from public.invites where id = :'used_id' \gset
select code as wait_code from public.invites where id = :'wait_id' \gset
set role anon;
select public.request_invite_link(:'mem_code',   'mem.person@example.org', 'es');
select public.request_invite_link(:'staff_code', 'staff.typed@example.org', 'en');
select public.request_invite_link(:'old_code',   'old.person@example.org', 'en');
select public.request_invite_link(:'tries_code', 'tries.person@example.org', 'en');
select public.request_invite_link(:'used_code',  'used.person@example.org', 'en');
select public.request_invite_link(:'wait_code',  'wait.person@example.org', 'en');
reset role;

select test.check('six addresses were typed and are held while they wait',
  (select count(*) from public.invite_emails where address_removed_at is null and (email like '%.person@example.org' or email = 'staff.typed@example.org')), 6::bigint);

-- ===========================================================================
\echo ''
\echo '--- Sent: the address goes at once, the row stays ---'
-- ===========================================================================
set role service_role;
create temp table claimed as select * from public.claim_invite_link_emails(100);
grant all on claimed to public;
select test.check('the sender is handed the address to send to',
  (select count(*) from claimed where email = 'mem.person@example.org'), 1::bigint);
select public.mark_invite_link_email_sent((select id from claimed where email = 'mem.person@example.org'));
reset role;
select test.check_text('after it is sent the address is gone',
  (select email from public.invite_emails where expired_invite = :'mem_id'), 'removed@removed.invalid');
select test.check('...the row says when it went and that the address was removed',
  (select count(*) from public.invite_emails where expired_invite = :'mem_id' and sent_at is not null and address_removed_at is not null), 1::bigint);
select test.check('...and still knows which link was renewed into which, and in what language',
  (select count(*) from public.invite_emails where expired_invite = :'mem_id' and new_invite is not null and locale = 'es'), 1::bigint);
select test.check('no sent address is left in the table',
  (select count(*) from public.invite_emails where sent_at is not null and email <> 'removed@removed.invalid'), 0::bigint);

-- Asking again for the same expired link still sends nothing new.
set role anon;
select public.request_invite_link(:'mem_code', 'someone.else@example.org', 'en');
reset role;
select test.check('asking again for the same link makes no second row and keeps no second address',
  (select count(*) from public.invite_emails where expired_invite = :'mem_id'), 1::bigint);
select test.check('...nor does that address appear anywhere in the table',
  (select count(*) from public.invite_emails where email = 'someone.else@example.org'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- Never handed out once removed ---'
-- ===========================================================================
update public.invite_emails set claimed_at = null, sent_at = null where expired_invite = :'mem_id';
set role service_role;
select test.check('a removed address is not claimed, even if the row were marked unsent',
  (select count(*) from public.claim_invite_link_emails(100) where id = (select id from public.invite_emails where expired_invite = :'mem_id')), 0::bigint);
reset role;

-- ===========================================================================
\echo ''
\echo '--- Cannot be sent any more: it goes too ---'
-- ===========================================================================
update public.invite_emails set requested_at = now() - interval '8 days' where expired_invite = :'old_id';
update public.invite_emails set attempts = 5 where expired_invite = :'tries_id';
update public.invites set status = 'revoked' where id = (select new_invite from public.invite_emails where expired_invite = :'used_id');
set role service_role;
select public.claim_invite_link_emails(100);   -- the sweep runs at the start of every claim
reset role;
select test.check_text('a request more than seven days old loses its address',
  (select email from public.invite_emails where expired_invite = :'old_id'), 'removed@removed.invalid');
select test.check_text('...so does one that is out of tries',
  (select email from public.invite_emails where expired_invite = :'tries_id'), 'removed@removed.invalid');
select test.check_text('...so does one whose fresh link was used or withdrawn',
  (select email from public.invite_emails where expired_invite = :'used_id'), 'removed@removed.invalid');
select test.check_text('...and the one still waiting and worth sending keeps its address',
  (select email from public.invite_emails where expired_invite = :'wait_id'), 'wait.person@example.org');
select test.check('...with nothing marked removed on it',
  (select count(*) from public.invite_emails where expired_invite = :'wait_id' and address_removed_at is null), 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- The log copes ---'
-- ===========================================================================
select new_invite as mem_fresh from public.invite_emails where expired_invite = :'mem_id' \gset
set role authenticated;
select test.as_user(:'sup');
select test.check('a removed address shows as none, in the log',
  (select count(*) from public.invites_log() l where l.id = :'mem_fresh' and l.emailed_to is null), 1::bigint);
select test.check('...still marked as a re-sent link',
  (select count(*) from public.invites_log() l where l.id = :'mem_fresh' and l.reissued), 1::bigint);
select test.check('...and an address still waiting is still shown to the super admin',
  (select count(*) from public.invites_log() l where l.emailed_to = 'wait.person@example.org'), 1::bigint);
select test.check('no placeholder ever reaches the log',
  (select count(*) from public.invites_log() l where l.emailed_to = 'removed@removed.invalid'), 0::bigint);
reset role;

-- ===========================================================================
\echo ''
\echo '--- Staff keep their own address ---'
-- ===========================================================================
select test.check('a staff invite''s own address is on file',
  (select count(*) from public.invite_contact_emails where invite_id = :'staff_id' and email = 'staff.real@example.org'), 1::bigint);
update public.invite_emails set sent_at = now(), email = 'removed@removed.invalid', address_removed_at = now() where expired_invite = :'staff_id';
select new_invite as staff_fresh from public.invite_emails where expired_invite = :'staff_id' \gset
select public.keep_invite_email(:'staff_fresh', :'alice');
select test.check_text('after the typed copy is deleted, redeeming the renewed link still keeps the staff member''s own address',
  (select email from public.profile_emails where profile_id = :'alice'), 'staff.real@example.org');

-- ===========================================================================
\echo ''
\echo '--- Nobody else reaches it ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'dana');
select test.check_raises('a signed-in person cannot run the sweep', $$select public.purge_invite_email_addresses()$$);
set role anon;
select test.check_raises('nor a signed-out visitor', $$select public.purge_invite_email_addresses()$$);
reset role;
select test.check_raises('a removed address cannot be dressed up as anything else',
  $$update public.invite_emails set address_removed_at = now() where email = 'wait.person@example.org'$$);
select 'done' as done;

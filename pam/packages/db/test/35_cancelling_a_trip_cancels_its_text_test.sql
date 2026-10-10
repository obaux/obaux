-- Cancelling a trip cancels its day-before text, and only its own (the north
-- star: nobody is texted about a visit they called off).
--
-- 28 covers a cancel and a move on one trip. These attack the edges: two trips
-- (cancelling one leaves the other's text), a text already sent (left as it
-- was), a cancelled trip cannot be moved or cancelled again, and a trip moved
-- into the 24-hour window and then cancelled leaves no scheduled text.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set gia   '99999999-0000-0000-0000-000000000c01'
\set place '88888888-0000-0000-0000-000000000c01'

create or replace function test.philly(days integer, hour integer)
returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'America/New_York')
          + make_interval(days => days, hours => hour)) at time zone 'America/New_York';
$$;
grant execute on function test.philly(integer, integer) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'gia', '12675558831');
insert into public.profiles (id, role, first_name, region_id, phone, access_status)
values (:'gia', 'member', 'Gia', :'region_north', '+12675558831', 'active');
insert into public.notification_preferences (member_id, sms_enabled, sms_stopped_at) values (:'gia', true, null);
insert into public.services (id, name, category, address, source, needs_review, is_active)
values (:'place', 'Cancel Test Center', 'workforce', '5 Elm St, Philadelphia, PA 19107', 'manual', false, true);

set role authenticated;
select set_config('request.jwt.claim.sub', :'gia', false);
select public.book_trip(:'place', test.philly(4, 10), 'first');
select public.book_trip(:'place', test.philly(6, 14), 'second');

reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('two trips, two scheduled texts',
  (select count(*) from public.outbound_messages where member_id = :'gia'::uuid and template_key = 'appointment_24h' and status = 'scheduled'), 2::bigint);

-- ===========================================================================
\echo ''
\echo '--- Cancelling one leaves the other''s text ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'gia', false);
select public.cancel_trip((select id from public.appointments where member_id = :'gia'::uuid and note = 'first'));
reset role;
select set_config('request.jwt.claim.sub', '', false);

select test.check('the cancelled trip''s text is cancelled, with the reason',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.note = 'first' and o.status = 'cancelled' and o.failure_reason = 'the visit is no longer planned'), 1::bigint);
select test.check('the other trip''s text is still scheduled',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.note = 'second' and o.status = 'scheduled'), 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- A cancelled trip stays cancelled ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'gia', false);
select test.check_raises_like('a cancelled trip cannot be moved back to life',
  format($f$select public.move_trip(%L, test.philly(8, 10))$f$, (select id from public.appointments where member_id = :'gia'::uuid and note = 'first')),
  '%TRIP_NOT_FOUND%');
select test.check_raises_like('...nor cancelled twice',
  format($f$select public.cancel_trip(%L)$f$, (select id from public.appointments where member_id = :'gia'::uuid and note = 'first')),
  '%TRIP_NOT_FOUND%');
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('...and no new text appeared',
  (select count(*) from public.outbound_messages where member_id = :'gia'::uuid and template_key = 'appointment_24h' and status = 'scheduled'), 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- A text already sent is history, not touched ---'
-- ===========================================================================
update public.outbound_messages set status = 'sent', sent_at = now()
where appointment_id = (select id from public.appointments where note = 'second');
set role authenticated;
select set_config('request.jwt.claim.sub', :'gia', false);
select public.cancel_trip((select id from public.appointments where member_id = :'gia'::uuid and note = 'second'));
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('cancelling after the text went leaves it marked sent',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.note = 'second' and o.status = 'sent'), 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- Moved close, then cancelled: nothing is left scheduled ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'gia', false);
select public.book_trip(:'place', test.philly(5, 9), 'third');
select public.move_trip((select id from public.appointments where member_id = :'gia'::uuid and note = 'third'), now() + interval '5 hours');
select public.cancel_trip((select id from public.appointments where member_id = :'gia'::uuid and note = 'third'));
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('no scheduled text remains for any trip they cancelled',
  (select count(*) from public.outbound_messages where member_id = :'gia'::uuid and template_key = 'appointment_24h' and status = 'scheduled'), 0::bigint);

\echo ''
\echo 'cancelling a trip cancels its text: all checks passed'

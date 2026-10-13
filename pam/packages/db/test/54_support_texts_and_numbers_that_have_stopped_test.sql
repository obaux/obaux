-- support texts and numbers that have stopped (test 54, D-524).
--
-- A super admin can answer a help request by text. It is one text to the number the person typed, and only
-- when Pam's texts are on and that number has not asked Pam to stop: a number nobody in Pam has still counts.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set sue   '66666666-0000-0000-0000-0000000a7871'
\set mem   '66666666-0000-0000-0000-0000000a7872'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'sue', '12675559872'), (:'mem', '12675559873');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'sue', 'super_admin', 'Sue', :'region_north', '+12675559872', 'active'),
  (:'mem', 'member', 'Mel', :'region_north', '+12675559873', 'active');
delete from public.phone_stops;
delete from public.support_texts_log;
delete from public.outbound_messages where template_key = 'support_reply';
update public.app_settings set value = 'off' where key = 'texts_live';

create or replace function test.refuses(label text, sql text, expected text)
returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlerrm like '%' || expected || '%' then
      raise notice 'ok    % (%)', label, sqlerrm;
      return;
    end if;
    raise exception E'FAIL  %\n        got: %, expected it to say: %', label, sqlerrm, expected;
  end;
  raise exception 'FAIL  % (it was allowed)', label;
end;
$$;
grant execute on function test.refuses(text, text, text) to authenticated, anon, service_role;

-- Only a super admin.
set role authenticated;
select test.as_user(:'mem');
select test.refuses('a member cannot send a support text',
  $$select public.send_support_text('267-555-9871', 'hello')$$, 'Only a super admin');
select test.as_user(:'sue');
select test.refuses('while texts are off it says so',
  $$select public.send_support_text('267-555-9871', 'We can help.')$$, 'not on yet');
reset role;
update public.app_settings set value = 'on' where key = 'texts_live';
set role authenticated;
select test.as_user(:'sue');
select test.refuses('an empty answer is refused',
  $$select public.send_support_text('267-555-9871', '   ')$$, 'Write the answer');
select test.refuses('a long answer is refused',
  $$select public.send_support_text('267-555-9871', repeat('x', 121))$$, 'too long');
select test.refuses('so is something that is not a number',
  $$select public.send_support_text('12', 'We can help.')$$, 'not a phone number');

select public.send_support_text('267-555-9871', 'We can help. Write to hello@joinpam.org.') as id \gset
reset role;
select test.check('the text is queued straight to the number as a support reply',
  (select count(*) from public.outbound_messages where id = :'id' and phone = '+12675559871' and template_key = 'support_reply' and member_id is null and vars->>'reply' like 'We can help%'), 1::bigint);
select test.check('the log keeps who and a hash, never the number or the words',
  (select count(*) from public.support_texts_log where sent_by = :'sue' and phone_hash = public.phone_hash('+12675559871') and phone_hash !~ '9601'), 1::bigint);

-- A STOP from a number nobody has.
set role service_role;
select test.check('a STOP from a number with no profile is remembered',
  (public.record_sms_stop('+12675559871'))::int, 0);
reset role;
select test.check('...as a hash',
  (select count(*) from public.phone_stops where phone_hash = public.phone_hash('+12675559871')), 1::bigint);
set role service_role;
select test.check('...a queued support text to it is cancelled, not sent',
  (select count(*) from public.claim_outbound_messages(50) c where c.id = :'id'), 0::bigint);
reset role;
select test.check('...and says why',
  (select count(*) from public.outbound_messages where id = :'id' and status = 'cancelled' and failure_reason = 'number stopped texts'), 1::bigint);
set role authenticated;
select test.as_user(:'sue');
select test.refuses('a new support text to it is refused',
  $$select public.send_support_text('(267) 555-9871', 'Are you there?')$$, 'asked Pam to stop');

-- A member's stop counts too.
reset role;
insert into public.notification_preferences (member_id, sms_stopped_at) values (:'mem', now())
  on conflict (member_id) do update set sms_stopped_at = now();
set role authenticated;
select test.as_user(:'sue');
select test.refuses('a member who stopped texts cannot be sent one',
  $$select public.send_support_text('+12675559873', 'Hi')$$, 'asked Pam to stop');

-- START clears the phone-only stop.
reset role;
set role service_role;
select public.record_sms_start('+12675559871');
reset role;
select test.check('a START clears the remembered stop',
  (select count(*) from public.phone_stops where phone_hash = public.phone_hash('+12675559871')), 0::bigint);

-- Closed to everyone else.
select test.check('nobody but the service role may ask whether a number stopped',
  (has_function_privilege('authenticated', 'public.phone_is_stopped(text)', 'execute')
   or has_function_privilege('anon', 'public.phone_is_stopped(text)', 'execute'))::int, 0);
select test.check('anon cannot send a support text',
  has_function_privilege('anon', 'public.send_support_text(text,text)', 'execute')::int, 0);

update public.app_settings set value = 'off' where key = 'texts_live';
delete from public.phone_stops;
delete from public.support_texts_log;
delete from public.outbound_messages where template_key = 'support_reply';
delete from public.notification_preferences where member_id = :'mem';

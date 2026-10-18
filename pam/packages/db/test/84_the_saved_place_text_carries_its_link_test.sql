-- the saved place text carries its link (test 84).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

-- Marcus (seed member) saves a catalogue place; a place is taken out of the catalogue; the text that is queued for him must be
-- renderable: the dispatcher builds `reason` from `reason_key` and has no default for `link`, so both have to be in the vars.
\set marcus '33333333-0000-0000-0000-00000000000c'

reset role;
select set_config('request.jwt.claim.sub', '', false);

create temp table t84 as select id as service_id from public.services order by id limit 1;
delete from public.saved_places where member_id = :'marcus';
insert into public.saved_places (member_id, service_id) select :'marcus', service_id from t84;
delete from public.outbound_messages where member_id = :'marcus';

select test.check('control: the saved place exists and is Marcus''s',
  (select count(*) from public.saved_places sp join t84 on t84.service_id = sp.service_id where sp.member_id = :'marcus'), 1);

select test.check('one text is queued for the person who saved it',
  public.queue_saved_place_closed((select service_id from t84), 'closed'), 1);

select test.check('...with the reason key the dispatcher turns into the reason',
  (select count(*) from public.outbound_messages where member_id = :'marcus' and template_key = 'saved_place_closed'
     and vars ->> 'reason_key' = 'closed'), 1);

select test.check('...and the link the sentence ends with, from app_url: without it render() throws "missing variable link"',
  (select count(*) from public.outbound_messages where member_id = :'marcus' and template_key = 'saved_place_closed'
     and vars ->> 'link' = (select value from public.app_settings where key = 'app_url') || '/'
     and length(vars ->> 'link') > 1), 1);

select test.check('...and nothing else in it (never the place, never a phrase)',
  (select count(*) from public.outbound_messages where member_id = :'marcus' and template_key = 'saved_place_closed'
     and (select array_agg(k order by k) from jsonb_object_keys(vars) k) = array['link', 'reason_key']), 1);

delete from public.outbound_messages where member_id = :'marcus';
delete from public.saved_places where member_id = :'marcus';

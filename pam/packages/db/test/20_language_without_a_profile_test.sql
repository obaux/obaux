-- The language a text or an email goes out in, when there is no profile to read
-- it from (0085, D-424).
--
-- A denied staff request creates no profile; a fresh invite link is mailed to
-- an address with nothing known about it. Both used to be English whatever the
-- person was reading Pam in, and an approved request opened an English account
-- whatever it was asked in. These check that the language travels: asked for,
-- kept, copied where it belongs, and never a way to make a request fail.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set super '33333333-0000-0000-0000-0000000005a0'
\set vera  '33333333-0000-0000-0000-0000000005a1'
\set omar  '33333333-0000-0000-0000-0000000005a2'
\set lena  '33333333-0000-0000-0000-0000000005a3'
\set kofi  '33333333-0000-0000-0000-0000000005a4'
\set dana  '33333333-0000-0000-0000-00000000000a'

reset role;
insert into auth.users (id, phone) values
  (:'super', '12675550600'),
  (:'vera',  '12675550601'),
  (:'omar',  '12675550602'),
  (:'lena',  '12675550603'),
  (:'kofi',  '12675550604');
insert into public.profiles (id, role, first_name, access_status)
values (:'super', 'super_admin', 'Will', 'active');

-- ===========================================================================
\echo ''
\echo '--- The shape of the functions ---'
-- ===========================================================================
do $$
begin
  -- The old signatures are gone: with both present, an eleven-argument call
  -- would satisfy two functions and Postgres would refuse it.
  if to_regprocedure('public.request_staff_access(text,text,text,text,text,text,text,text,text,text,text)') is not null then
    raise exception 'FAIL  the eleven-argument request_staff_access is still there beside the new one';
  end if;
  if to_regprocedure('public.request_invite_link(text,text)') is not null then
    raise exception 'FAIL  the two-argument request_invite_link is still there beside the new one';
  end if;
  raise notice 'ok    only one request_staff_access and one request_invite_link exist';

  -- A pure helper, not an RPC: PostgREST exposes every public function.
  if has_function_privilege('anon', 'public.supported_language(text)', 'execute')
     or has_function_privilege('authenticated', 'public.supported_language(text)', 'execute') then
    raise exception 'FAIL  supported_language can be called from outside';
  end if;
  raise notice 'ok    supported_language is not callable by anon or authenticated';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Asking for staff access, in a language ---'
-- ===========================================================================
set role authenticated;

select test.as_user(:'vera');
do $$ begin perform public.request_staff_access('admin', 'Vera', 'Ivanova', 'North',
  null, null, null, null, null, null, null, 'ru'); end; $$;

select test.as_user(:'omar');
-- The app as it was before this migration: eleven arguments, no language.
do $$ begin perform public.request_staff_access('admin', 'Omar', 'Haddad', 'North'); end; $$;

select test.as_user(:'lena');
do $$ begin perform public.request_staff_access('admin', 'Lena', 'Wang', 'North',
  null, null, null, null, null, null, null, 'zh-HK'); end; $$;

select test.as_user(:'kofi');
-- A code the app does not offer must not turn somebody away.
do $$ begin perform public.request_staff_access('admin', 'Kofi', 'Mensah', 'North',
  null, null, null, null, null, null, null, 'tlh'); end; $$;

reset role;
do $$
declare
  got text;
begin
  select preferred_language into got from public.staff_requests where user_id = '33333333-0000-0000-0000-0000000005a1';
  if got <> 'ru' then raise exception 'FAIL  asking in Russian was stored as %', got; end if;
  raise notice 'ok    a request made in Russian is kept as Russian';

  select preferred_language into got from public.staff_requests where user_id = '33333333-0000-0000-0000-0000000005a2';
  if got <> 'en' then raise exception 'FAIL  asking with no language was stored as %', got; end if;
  raise notice 'ok    a request with no language (the app before this) is English';

  select preferred_language into got from public.staff_requests where user_id = '33333333-0000-0000-0000-0000000005a4';
  if got <> 'en' then raise exception 'FAIL  an unknown language code was stored as %', got; end if;
  raise notice 'ok    a language the app does not offer is stored as English, and the request still goes through';

  begin
    update public.staff_requests set preferred_language = 'pt' where user_id = '33333333-0000-0000-0000-0000000005a1';
    raise exception 'FAIL  the table took a language code it should not hold';
  exception when check_violation then
    raise notice 'ok    the table itself refuses a language outside the seven';
  end;
end;
$$;

-- Asking again, in another language, replaces the first (the same row).
set role authenticated;
select test.as_user(:'vera');
do $$ begin perform public.request_staff_access('admin', 'Vera', 'Ivanova', 'North',
  null, null, null, null, null, null, null, 'ar'); end; $$;
reset role;
do $$
declare got text;
begin
  select preferred_language into got from public.staff_requests where user_id = '33333333-0000-0000-0000-0000000005a1';
  if got <> 'ar' then raise exception 'FAIL  asking again in Arabic left %', got; end if;
  raise notice 'ok    asking again updates the language along with the rest';
end;
$$;
set role authenticated;
select test.as_user(:'vera');
do $$ begin perform public.request_staff_access('admin', 'Vera', 'Ivanova', 'North',
  null, null, null, null, null, null, null, 'ru'); end; $$;

-- ===========================================================================
\echo ''
\echo '--- Deciding it keeps the language ---'
-- ===========================================================================
select test.as_user(:'super');
do $$
begin
  perform public.review_staff_request('33333333-0000-0000-0000-0000000005a1', 'approved',
    '11111111-0000-0000-0000-000000000001');
  perform public.review_staff_request('33333333-0000-0000-0000-0000000005a2', 'approved',
    '11111111-0000-0000-0000-000000000001');
  perform public.review_staff_request('33333333-0000-0000-0000-0000000005a3', 'denied');
  perform public.review_staff_request('33333333-0000-0000-0000-0000000005a4', 'denied');
end;
$$;

reset role;
do $$
declare
  got text;
  n int;
begin
  select preferred_language into got from public.profiles where id = '33333333-0000-0000-0000-0000000005a1';
  if got <> 'ru' then raise exception 'FAIL  the approved account opened in %, not Russian', got; end if;
  raise notice 'ok    an approved account opens in the language it was asked in';

  select preferred_language into got from public.profiles where id = '33333333-0000-0000-0000-0000000005a2';
  if got <> 'en' then raise exception 'FAIL  an approved account with no language opened in %', got; end if;
  raise notice 'ok    an approved account asked with no language opens in English';

  -- The text that says yes is queued for the member, so it follows the
  -- profile's language at send time (0039) — which is now the right one.
  select count(*) into n from public.outbound_messages
  where member_id = '33333333-0000-0000-0000-0000000005a1' and template_key = 'staff_request_approved';
  if n <> 1 then raise exception 'FAIL  % approval texts queued for the Russian account', n; end if;
  raise notice 'ok    the approval text is queued against the account, whose language is Russian';

  -- The queue keeps the number in E.164, with its plus, however auth.users spelled it.
  select locale into got from public.outbound_messages
  where template_key = 'staff_request_denied'
    and phone = '+12675550603';
  if got is distinct from 'zh-HK' then raise exception 'FAIL  the denial text was queued in %, not Traditional Chinese', got; end if;
  raise notice 'ok    the text that says no is queued in the language it was asked in';

  select locale into got from public.outbound_messages
  where template_key = 'staff_request_denied'
    and phone = '+12675550604';
  if got is distinct from 'en' then raise exception 'FAIL  a denial for an unknown language was queued in %', got; end if;
  raise notice 'ok    a denial for a language the app does not offer is queued in English';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- A fresh invite link, mailed in a language ---'
-- ===========================================================================
insert into public.invites (code, created_by, role, region_id, expires_at)
values ('LANGEXP1', :'dana', 'member', '11111111-0000-0000-0000-000000000001', now() - interval '1 day'),
       ('LANGEXP2', :'dana', 'member', '11111111-0000-0000-0000-000000000001', now() - interval '1 day'),
       ('LANGEXP3', :'dana', 'member', '11111111-0000-0000-0000-000000000001', now() - interval '1 day'),
       ('LANGEXP4', :'dana', 'member', '11111111-0000-0000-0000-000000000001', now() - interval '1 day');

-- Signed out, as the expired-link page is.
set role anon;
do $$
begin
  perform public.request_invite_link('LANGEXP1', 'ana@example.org', 'pt-BR');
  -- The page before this migration: two arguments.
  perform public.request_invite_link('LANGEXP2', 'bo@example.org');
  perform public.request_invite_link('LANGEXP3', 'chen@example.org', 'zh-CN');
  perform public.request_invite_link('LANGEXP4', 'dee@example.org', 'klingon');
end;
$$;

reset role;
do $$
declare
  got text;
begin
  select e.locale into got from public.invite_emails e join public.invites i on i.id = e.expired_invite where i.code = 'LANGEXP1';
  if got <> 'pt-BR' then raise exception 'FAIL  a link asked for in Portuguese was queued as %', got; end if;
  raise notice 'ok    a fresh link asked for in Portuguese is queued in Portuguese';

  select e.locale into got from public.invite_emails e join public.invites i on i.id = e.expired_invite where i.code = 'LANGEXP2';
  if got <> 'en' then raise exception 'FAIL  a link asked for with no language was queued as %', got; end if;
  raise notice 'ok    a link asked for with no language (the page before this) is English';

  select e.locale into got from public.invite_emails e join public.invites i on i.id = e.expired_invite where i.code = 'LANGEXP3';
  if got <> 'zh-CN' then raise exception 'FAIL  a link asked for in Chinese was queued as %', got; end if;

  select e.locale into got from public.invite_emails e join public.invites i on i.id = e.expired_invite where i.code = 'LANGEXP4';
  if got <> 'en' then raise exception 'FAIL  an unknown language was queued as %', got; end if;
  raise notice 'ok    a language the app does not offer is queued in English, and the link still goes out';

  begin
    update public.invite_emails set locale = 'fr' where email = 'ana@example.org';
    raise exception 'FAIL  the outbox took a language code it should not hold';
  exception when check_violation then
    raise notice 'ok    the outbox itself refuses a language outside the seven';
  end;
end;
$$;

-- Nobody signed in reads the outbox, and the new column is no way round that.
set role anon;
do $$
begin
  begin
    perform locale from public.invite_emails;
    raise exception 'FAIL  a signed-out caller read the invite outbox';
  exception when insufficient_privilege then
    raise notice 'ok    a signed-out caller still cannot read the invite outbox';
  end;
end;
$$;
reset role;

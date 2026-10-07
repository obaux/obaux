-- Expired invite links (0071, D-258 reworked by D-263): an expired link says
-- who sent it and can ask — signed out, once — for a fresh link by email. No
-- approval; the fresh code is never handed back to the browser. Only the
-- super admin sees the outbox and the log of every invite.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana   '33333333-0000-0000-0000-00000000000a'
\set marcus '33333333-0000-0000-0000-00000000000c'
\set super  '33333333-0000-0000-0000-0000000000f9'

reset role;
insert into auth.users (id) values (:'super');
insert into public.profiles (id, role, first_name, access_status)
values (:'super', 'super_admin', 'Will', 'active');

-- A fresh invite from Dana lasts 30 days, as it always has (0002).
set role authenticated;
select test.as_user(:'dana');
do $$
declare
  inv public.invites;
  days numeric;
begin
  inv := public.create_invite('member', '+15555550801', null, 'Ana');
  days := round(extract(epoch from (inv.expires_at - now())) / 86400);
  if days <> 30 then
    raise exception 'FAIL  a new invite lasts % days, not 30', days;
  end if;
  raise notice 'ok    a new invite lasts 30 days';
end;
$$;

-- Make one expired and one still working, as the database owner.
reset role;
insert into public.invites (code, created_by, role, region_id, expires_at)
values ('EXPIRED1', :'dana', 'provider', '11111111-0000-0000-0000-000000000001', now() - interval '1 day'),
       ('STILLOK1', :'dana', 'member', '11111111-0000-0000-0000-000000000001', now() + interval '3 days');

-- Signed out: the preview says first name, role and state; nothing more.
set role anon;
do $$
declare
  r record;
begin
  select * into r from public.invite_preview('expired1');
  if r.inviter_first_name <> 'Dana' or r.invited_role <> 'provider' or r.state <> 'expired' then
    raise exception 'FAIL  preview of an expired link read % / % / %', r.inviter_first_name, r.invited_role, r.state;
  end if;
  select * into r from public.invite_preview('NOPE0000');
  if r.state <> 'not_found' or r.inviter_first_name is not null then
    raise exception 'FAIL  a wrong code previewed as %', r.state;
  end if;
  select * into r from public.invite_preview('STILLOK1');
  if r.state <> 'valid' then
    raise exception 'FAIL  a valid link previewed as %', r.state;
  end if;
  raise notice 'ok    a signed-out preview names the inviter and the role, and nothing else';
end;
$$;

-- Signed out: ask for a fresh link by email; asking twice is still one.
-- A working link, a bad address or a wrong code cannot ask.
do $$
declare
  answer boolean;
begin
  answer := public.request_invite_link('EXPIRED1', 'Andre@Example.org');
  if answer is distinct from true then
    raise exception 'FAIL  the request answered %', answer;
  end if;
  perform public.request_invite_link('EXPIRED1', 'someone-else@example.org');
  begin
    perform public.request_invite_link('STILLOK1', 'a@example.org');
    raise exception 'FAIL  a link that still works asked for a new one';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    perform public.request_invite_link('EXPIRED1', 'not an email');
    raise exception 'FAIL  a bad address was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  begin
    perform public.request_invite_link('NOPE0000', 'a@example.org');
    raise exception 'FAIL  a wrong code asked for a new link';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  raise notice 'ok    an expired link asks once, by email; nothing else can ask';
end;
$$;

-- Nobody reads the outbox directly — not signed out, not a member.
do $$
begin
  begin
    perform 1 from public.invite_emails;
    raise exception 'FAIL  anon read invite_emails';
  exception when insufficient_privilege then
    raise notice 'ok    signed out, the email outbox cannot be read';
  end;
end;
$$;

-- What was queued: one email, to the first address, lowercased, with a new
-- invite for the same role, city and inviter, open for 30 days.
reset role;
do $$
declare
  n int;
  e public.invite_emails;
  fresh public.invites;
  old public.invites;
begin
  select count(*) into n from public.invite_emails;
  if n <> 1 then
    raise exception 'FAIL  % emails queued, not 1', n;
  end if;
  select * into e from public.invite_emails;
  if e.email <> 'andre@example.org' then
    raise exception 'FAIL  queued to %', e.email;
  end if;
  select * into fresh from public.invites where id = e.new_invite;
  select * into old from public.invites where id = e.expired_invite;
  if fresh.role <> old.role or fresh.created_by <> old.created_by or fresh.region_id <> old.region_id
     or fresh.status <> 'pending' or round(extract(epoch from (fresh.expires_at - now())) / 86400) <> 30
     or fresh.code = old.code then
    raise exception 'FAIL  the new invite does not match the old one';
  end if;
  raise notice 'ok    one email queued, with a new 30-day link for the same role, city and inviter';
end;
$$;

set role authenticated;
select test.as_user(:'marcus');
do $$
begin
  begin
    perform * from public.invites_log();
    raise exception 'FAIL  a member read the invite log';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a member cannot read the invite log';
  end;
end;
$$;

select test.as_user(:'dana');
do $$
begin
  begin
    perform * from public.invites_log();
    raise exception 'FAIL  a case manager read the invite log';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a case manager cannot read the invite log';
  end;
end;
$$;

-- The super admin sees every invite: who made it, and where it stands.
select test.as_user(:'super');
do $$
declare
  n_open int;
  n_expired int;
  r record;
begin
  select count(*) filter (where state = 'open'), count(*) filter (where state = 'expired')
    into n_open, n_expired
  from public.invites_log()
  where inviter_first = 'Dana';
  if n_expired < 1 or n_open < 3 then
    raise exception 'FAIL  the log reads % open and % expired for Dana', n_open, n_expired;
  end if;
  select * into r from public.invites_log() where reissued;
  if r.emailed_to <> 'andre@example.org' or r.invited_role <> 'provider' or r.state <> 'open' then
    raise exception 'FAIL  the re-sent link reads % / % / %', r.emailed_to, r.invited_role, r.state;
  end if;
  raise notice 'ok    the super admin sees every invite, open or expired, and where a new link went';
end;
$$;

reset role;

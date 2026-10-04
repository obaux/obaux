-- Invite renewals (0071, D-258): an expired link says who sent it and lets
-- the holder ask for it to be renewed — signed out, once — and only the super
-- admin sees or decides those requests. Approving gives the same link 14 more
-- days. A preview never says more than a first name, a role and a state.

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

-- A fresh invite from Dana defaults to 14 days.
set role authenticated;
select test.as_user(:'dana');
do $$
declare
  inv public.invites;
  days numeric;
begin
  inv := public.create_invite('member', '+12155550142');
  days := round(extract(epoch from (inv.expires_at - now())) / 86400);
  if days <> 14 then
    raise exception 'FAIL  a new invite lasts % days, not 14', days;
  end if;
  raise notice 'ok    a new invite lasts 14 days';
end;
$$;

-- Make one expired, one used, as the database owner.
reset role;
insert into public.invites (code, created_by, role, region_id, phone, expires_at)
values ('EXPIRED1', :'dana', 'provider', '11111111-0000-0000-0000-000000000001', '+12155550199', now() - interval '1 day'),
       ('STILLOK1', :'dana', 'member', '11111111-0000-0000-0000-000000000001', null, now() + interval '3 days');

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

-- Signed out: ask for a renewal; asking twice is still one request.
do $$
begin
  perform public.request_invite_renewal('EXPIRED1', 'Andre');
  perform public.request_invite_renewal('EXPIRED1', 'Andre');
  begin
    perform public.request_invite_renewal('STILLOK1');
    raise exception 'FAIL  a link that still works was "renewed"';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  raise notice 'ok    an expired link asks once; a working one cannot ask';
end;
$$;

-- Nobody reads the requests table directly — not signed out, not a member.
do $$
begin
  begin
    perform 1 from public.invite_renewals;
    raise exception 'FAIL  anon read invite_renewals';
  exception when insufficient_privilege then
    raise notice 'ok    signed out, the requests table cannot be read';
  end;
end;
$$;

set role authenticated;
select test.as_user(:'marcus');
do $$
begin
  begin
    perform * from public.invite_renewals_pending();
    raise exception 'FAIL  a member listed renewal requests';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a member cannot list renewal requests';
  end;
end;
$$;

select test.as_user(:'dana');
do $$
begin
  begin
    perform * from public.invite_renewals_pending();
    raise exception 'FAIL  a case manager listed renewal requests';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a case manager cannot list renewal requests';
  end;
end;
$$;

-- The super admin sees who invited whom, and approving reopens the same link.
select test.as_user(:'super');
do $$
declare
  r record;
  n int;
  st text;
begin
  select count(*) into n from public.invite_renewals_pending();
  if n <> 1 then
    raise exception 'FAIL  the super admin sees % requests, not 1', n;
  end if;
  select * into r from public.invite_renewals_pending();
  if r.inviter_first <> 'Dana' or r.invited_role <> 'provider' or r.invited_name <> 'Andre'
     or r.invited_phone <> '+12155550199' then
    raise exception 'FAIL  the request reads % invited % (%)', r.inviter_first, r.invited_name, r.invited_role;
  end if;
  perform public.decide_invite_renewal(r.id, 'approved');
  select state into st from public.invite_preview('EXPIRED1');
  if st <> 'valid' then
    raise exception 'FAIL  an approved renewal left the link %', st;
  end if;
  select count(*) into n from public.invite_renewals_pending();
  if n <> 0 then
    raise exception 'FAIL  an approved request is still pending';
  end if;
  raise notice 'ok    the super admin sees who invited whom, and approving reopens the same link';
end;
$$;

reset role;

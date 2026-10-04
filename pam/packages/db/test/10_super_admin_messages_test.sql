-- The super admin and staff (0072, D-262): the person running PAM may message
-- a case manager or a program lead, and they may answer — but never a member,
-- and nobody else gains anything. A pending requester's number is the super
-- admin's alone.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana   '33333333-0000-0000-0000-00000000000a'
\set marcus '33333333-0000-0000-0000-00000000000c'
\set alice  '33333333-0000-0000-0000-00000000000f'
\set boss   '33333333-0000-0000-0000-0000000000f8'
\set asker  '33333333-0000-0000-0000-0000000000f7'

reset role;
insert into auth.users (id) values (:'boss');
insert into public.profiles (id, role, first_name, access_status)
values (:'boss', 'super_admin', 'Will', 'active');
insert into auth.users (id, phone) values (:'asker', '+12155550177');
insert into public.staff_requests (user_id, wants_role, first_name, city)
values (:'asker', 'provider', 'Andre', 'North');

set role authenticated;
select test.as_user(:'boss');
do $$
declare
  c uuid;
  again uuid;
  n int;
begin
  c := public.open_direct_conversation('33333333-0000-0000-0000-00000000000a');
  again := public.open_direct_conversation('33333333-0000-0000-0000-00000000000a');
  if c is distinct from again then
    raise exception 'FAIL  a second conversation was made with the same case manager';
  end if;
  perform public.open_direct_conversation('33333333-0000-0000-0000-00000000000f');
  raise notice 'ok    the super admin can message a case manager and a program lead';

  begin
    perform public.open_direct_conversation('33333333-0000-0000-0000-00000000000c');
    raise exception 'FAIL  the super admin opened a conversation with a member';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    the super admin still cannot message a member';
  end;

  select count(*) into n from public.messageable_people() where role = 'member';
  if n > 0 then
    raise exception 'FAIL  the super admin''s list has % members', n;
  end if;
  select count(*) into n from public.messageable_people() where role in ('admin', 'provider');
  if n < 2 then
    raise exception 'FAIL  the super admin''s list has % staff', n;
  end if;
  raise notice 'ok    the super admin''s list is staff only';

  if public.staff_request_phone('33333333-0000-0000-0000-0000000000f7') is distinct from '+12155550177' then
    raise exception 'FAIL  the super admin could not read a pending requester''s number';
  end if;
  raise notice 'ok    the super admin reads a pending requester''s number';
end;
$$;

-- Staff can answer, and send.
select test.as_user(:'dana');
do $$
declare
  c uuid;
begin
  c := public.open_direct_conversation('33333333-0000-0000-0000-0000000000f8');
  insert into public.messages (conversation_id, sender_id, body)
  values (c, '33333333-0000-0000-0000-00000000000a', 'Thanks — I will send the link.');
  raise notice 'ok    a case manager can answer the super admin';

  begin
    perform public.staff_request_phone('33333333-0000-0000-0000-0000000000f7');
    raise exception 'FAIL  a case manager read a requester''s number';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a case manager cannot read a requester''s number';
  end;
end;
$$;

-- A member gains nothing: still cannot reach the super admin.
select test.as_user(:'marcus');
do $$
begin
  begin
    perform public.open_direct_conversation('33333333-0000-0000-0000-0000000000f8');
    raise exception 'FAIL  a member opened a conversation with the super admin';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a member still cannot message the super admin';
  end;
end;
$$;

reset role;

-- Program leads invite (0070, D-219): a program may invite a member or
-- another program into its own region — never a case manager, never a super
-- admin, never into another region — and a member it invites lands on
-- nobody's caseload, so inviting someone never makes a program their case
-- manager.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set alice         '33333333-0000-0000-0000-00000000000f'
\set region_north  '11111111-0000-0000-0000-000000000001'
\set region_south  '11111111-0000-0000-0000-000000000002'
\set marcus        '33333333-0000-0000-0000-00000000000c'

reset role;
set role authenticated;
select test.as_user(:'alice');

do $$
declare
  inv public.invites;
begin
  inv := public.create_invite('member');
  if inv.region_id is distinct from '11111111-0000-0000-0000-000000000001'::uuid then
    raise exception 'FAIL  a program''s member invite did not land in the program''s region';
  end if;
  if inv.assigned_admin_id is not null then
    raise exception 'FAIL  a program''s member invite put the member on a caseload';
  end if;
  raise notice 'ok    a program invites a member into its own region, onto no caseload';
end;
$$;

do $$
declare
  inv public.invites;
begin
  inv := public.create_invite('provider');
  if inv.role <> 'provider' then
    raise exception 'FAIL  a program''s program invite has role %', inv.role;
  end if;
  raise notice 'ok    a program invites another program';
end;
$$;

do $$
begin
  begin
    perform public.create_invite('admin');
    raise exception 'FAIL  a program issued a case manager invite';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a program cannot invite a case manager';
  end;
  begin
    perform public.create_invite('super_admin');
    raise exception 'FAIL  a program issued a super admin invite';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a program cannot invite a super admin';
  end;
  begin
    perform public.create_invite('member', null, '11111111-0000-0000-0000-000000000002');
    raise exception 'FAIL  a program invited into another region';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a program cannot invite into another region';
  end;
end;
$$;

-- A program still cannot read the invites table itself.
do $$
declare
  n int;
begin
  select count(*) into n from public.invites;
  if n > 0 then
    raise exception 'FAIL  a program can read % invite rows directly', n;
  end if;
  raise notice 'ok    a program reads no invite rows directly';
end;
$$;

-- A member still cannot invite anybody.
select test.as_user(:'marcus');
do $$
begin
  begin
    perform public.create_invite('member');
    raise exception 'FAIL  a member created an invite';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a member still cannot create an invite';
  end;
end;
$$;

reset role;
delete from public.invites where created_by = :'alice';
reset role;

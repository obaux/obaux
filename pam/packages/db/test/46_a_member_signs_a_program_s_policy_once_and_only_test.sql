-- A member signs a program's policy (20261010145337, a25 points 1, 3, 4, 6).
--
-- Attacks: only a member signs; only a current policy of a live program; the
-- picture is private to the member and the table cannot be written directly; a
-- program's lead cannot read signatures (names and dates come in part 3);
-- signing again replaces rather than doubles; a new version is unsigned while
-- the old signature stays; a signer keeps reading an archived policy and its
-- pages; someone who never signed does not.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set luis   '33333333-0000-0000-0000-00000000000e'
\set lead   'cccccccc-0000-0000-0000-000000004601'
\set org    'dddddddd-0000-0000-0000-000000004601'
\set prog   'eeeeeeee-0000-0000-0000-000000004601'
\set wait   'eeeeeeee-0000-0000-0000-000000004602'

create or replace function test.check_raises_like(label text, stmt text, pattern text)
returns void
language plpgsql
as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlerrm like pattern then
      raise notice 'ok    % (%)', label, left(sqlerrm, 40);
      return;
    end if;
    raise exception E'FAIL  %\n        raised "%", expected like "%"', label, sqlerrm, pattern;
  end;
  raise exception 'FAIL  % — the statement was allowed and should not have been', label;
end;
$$;
grant execute on function test.check_raises_like(text, text, text) to authenticated, anon, service_role;

create or replace function test.png(tag text) returns text language sql as $$
  select 'data:image/png;base64,' || encode(convert_to(tag, 'UTF8'), 'base64')
$$;
grant execute on function test.png(text) to authenticated;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'lead', '12675558961');
insert into public.orgs (id, name, type, region_id) values (:'org', 'Signing Org', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id)
values (:'lead', 'provider', 'Lou', :'region_north', '+12675558961', 'active', :'org');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog', :'org', 'Signing Program', 'workforce', '1 Sign St', 'manual', false, true),
  (:'wait', :'org', 'Signing Waiting', 'workforce', '2 Sign St', 'manual', true, true);

set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select public.add_policy(:'prog', 'Sign Confidentiality', jsonb_build_array(jsonb_build_object('path', :'prog' || '/c1.pdf', 'name', 'c1.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)));
select public.add_policy(:'prog', 'Sign Liability', jsonb_build_array(jsonb_build_object('path', :'prog' || '/l1.pdf', 'name', 'l1.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)));
select public.add_policy(:'wait', 'Sign Not live yet', jsonb_build_array(jsonb_build_object('path', :'wait' || '/w1.pdf', 'name', 'w1.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)));
reset role;
select set_config('request.jwt.claim.sub', '', false);
-- The pages exist as stored files.
insert into storage.objects (bucket_id, name) values
  ('policies', :'prog' || '/c1.pdf'), ('policies', :'prog' || '/l1.pdf');

-- ===========================================================================
\echo ''
\echo '--- A member signs ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('with nothing drawn and nothing saved there is no signature to use',
  format($f$select public.sign_policy(%L)$f$, (select id from public.program_policies where title = 'Sign Confidentiality')), '%SIGNATURE_REQUIRED%');
select test.check_raises_like('a picture that is not a PNG is refused',
  format($f$select public.sign_policy(%L, 'hello')$f$, (select id from public.program_policies where title = 'Sign Confidentiality')), '%policy_signatures_is_a_png%');
select public.sign_policy((select id from public.program_policies where title = 'Sign Confidentiality'), test.png('tanya-first'));
select test.check('the signature is recorded', (select count(*) from public.policy_signatures), 1::bigint);
select test.check('...and becomes her saved signature', (select count(*) from public.member_signatures where image = test.png('tanya-first')), 1::bigint);
select public.sign_policy((select id from public.program_policies where title = 'Sign Liability'));
select test.check('the next policy is one tap: it uses the saved signature',
  (select count(*) from public.policy_signatures where image = test.png('tanya-first')), 2::bigint);
select public.sign_policy((select id from public.program_policies where title = 'Sign Liability'), test.png('tanya-second'));
select test.check('signing again replaces the picture, it does not add a second record',
  (select count(*) from public.policy_signatures where image = test.png('tanya-second')), 1::bigint);
select test.check('...there are still two',  (select count(*) from public.policy_signatures), 2::bigint);

select test.check_raises_like('a policy of a program still being checked cannot be signed',
  format($f$select public.sign_policy(%L, %L)$f$, (select id from public.program_policies where title = 'Sign Not live yet'), test.png('x')), '%POLICY_NOT_FOUND%');
select test.check_raises_like('a policy that does not exist cannot',
  format($f$select public.sign_policy('00000000-0000-0000-0000-000000000000', %L)$f$, test.png('x')), '%POLICY_NOT_FOUND%');
select test.check_raises('nobody writes a signature straight to the table',
  format($f$insert into public.policy_signatures (policy_id, member_id, image) values (%L, %L, %L)$f$,
         (select id from public.program_policies where title = 'Sign Liability'), :'luis', test.png('forged')));
select test.check_raises('...nor edits one', $$update public.policy_signatures set signed_at = now() - interval '1 year'$$);
select test.check_raises('...nor deletes one', $$delete from public.policy_signatures$$);

-- ===========================================================================
\echo ''
\echo '--- Whose is whose ---'
-- ===========================================================================
select set_config('request.jwt.claim.sub', :'luis', false);
select test.check('another member reads none of her signatures or her saved picture',
  (select count(*) from public.policy_signatures) + (select count(*) from public.member_signatures), 0::bigint);
select public.sign_policy((select id from public.program_policies where title = 'Sign Confidentiality'), test.png('luis'));
select test.check('he signs for himself', (select count(*) from public.policy_signatures where member_id = :'luis'::uuid), 1::bigint);

select set_config('request.jwt.claim.sub', :'lead', false);
select test.check('the program''s lead cannot read signatures, nor any member''s picture',
  (select count(*) from public.policy_signatures) + (select count(*) from public.member_signatures), 0::bigint);
select test.check_raises_like('a program lead is not a member and cannot sign',
  format($f$select public.sign_policy(%L, %L)$f$, (select id from public.program_policies where title = 'Sign Confidentiality'), test.png('lead')), '%NOT_A_MEMBER%');

reset role;
select id as cid from public.program_policies where title = 'Sign Confidentiality' \gset
set role anon;
select test.check_raises('nobody signed out signs',
  format($f$select public.sign_policy(%L, %L)$f$, :'cid', 'data:image/png;base64,eA=='));
select test.check_raises('...or reads signatures', $$select * from public.policy_signatures$$);

-- ===========================================================================
\echo ''
\echo '--- A new version is unsigned; the old signature stays; signers keep their copy ---'
-- ===========================================================================
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select public.add_policy(:'prog', 'Sign Confidentiality', jsonb_build_array(jsonb_build_object('path', :'prog' || '/c2.pdf', 'name', 'c2.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)),
                         (select id from public.program_policies where title = 'Sign Confidentiality' and version = 1));
reset role;
insert into storage.objects (bucket_id, name) values ('policies', :'prog' || '/c2.pdf');
set role authenticated;

select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check('she signed version 1; version 2 is not signed',
  (select count(*) from public.program_policies p
   where p.title = 'Sign Confidentiality' and p.archived_at is null
     and not exists (select 1 from public.policy_signatures s where s.policy_id = p.id)), 1::bigint);
select test.check('...and her signature on version 1 stands',
  (select count(*) from public.policy_signatures s join public.program_policies p on p.id = s.policy_id
   where p.title = 'Sign Confidentiality' and p.version = 1 and p.archived_at is not null), 1::bigint);
select test.check('she still reads the archived policy she signed, and its page',
  (select count(*) from public.program_policies where title = 'Sign Confidentiality' and version = 1)
  + (select count(*) from storage.objects where bucket_id = 'policies' and name = :'prog' || '/c1.pdf'), 2::bigint);
select test.check_raises_like('the replaced version can no longer be signed',
  format($f$select public.sign_policy(%L, %L)$f$, (select id from public.program_policies where title = 'Sign Confidentiality' and version = 1), test.png('late')), '%POLICY_NOT_FOUND%');

select set_config('request.jwt.claim.sub', '33333333-0000-0000-0000-00000000000c', false);
select test.check('someone who never signed does not read the archived one, nor its page',
  (select count(*) from public.program_policies where title = 'Sign Confidentiality' and version = 1)
  + (select count(*) from storage.objects where bucket_id = 'policies' and name = :'prog' || '/c1.pdf'), 0::bigint);

select set_config('request.jwt.claim.sub', :'tanya', false);
select public.forget_my_signature();
select test.check('she can forget her saved signature', (select count(*) from public.member_signatures), 0::bigint);
select test.check('...and what she signed keeps its picture', (select count(*) from public.policy_signatures where image is not null), 2::bigint);

\echo ''
\echo 'sign a policy: all checks passed'

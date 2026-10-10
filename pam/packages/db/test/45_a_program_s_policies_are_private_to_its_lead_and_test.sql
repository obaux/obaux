-- A program's policies (20261010144052, a25 point 3 and 4): private to its lead
-- and, for the current ones of a live program, to people signed in; never edited
-- (a new version replaces); at most 5 files; files in the program's own folder
-- of a private bucket; nothing written straight to the tables.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set boss   'cccccccc-0000-0000-0000-000000004501'
\set lead1  'cccccccc-0000-0000-0000-000000004502'
\set lead2  'cccccccc-0000-0000-0000-000000004503'
\set org1   'dddddddd-0000-0000-0000-000000004501'
\set org2   'dddddddd-0000-0000-0000-000000004502'
\set prog1  'eeeeeeee-0000-0000-0000-000000004501'
\set prog2  'eeeeeeee-0000-0000-0000-000000004502'
\set prog3  'eeeeeeee-0000-0000-0000-000000004503'

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

-- A file list in the shape add_policy takes.
create or replace function test.files(folder text, n integer default 1, kind text default 'application/pdf')
returns jsonb
language sql
as $$
  select jsonb_agg(jsonb_build_object(
    'path', folder || '/' || gen_random_uuid()::text || '.pdf',
    'name', 'page-' || i || '.pdf',
    'content_type', kind,
    'size_bytes', 1000
  ))
  from generate_series(1, n) i
$$;
grant execute on function test.files(text, integer, text) to authenticated;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'boss', '12675558951'), (:'lead1', '12675558952'), (:'lead2', '12675558953');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Policy Org One', 'program', :'region_north'), (:'org2', 'Policy Org Two', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558951', 'active', null),
  (:'lead1', 'provider', 'Lou', :'region_north', '+12675558952', 'active', :'org1'),
  (:'lead2', 'provider', 'Lena', :'region_north', '+12675558953', 'active', :'org2');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Policy Program One', 'workforce', '1 Policy St', 'manual', false, true),
  (:'prog2', :'org2', 'Policy Program Two', 'education', '2 Policy St', 'manual', false, true),
  (:'prog3', :'org1', 'Policy Program Waiting', 'workforce', '3 Policy St', 'manual', true, true);

-- ===========================================================================
\echo ''
\echo '--- A lead makes a policy for their own program ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select public.add_policy(:'prog1', 'Confidentiality', test.files(:'prog1', 2));
select test.check('the policy is made, version 1, with its two pages in order',
  (select count(*) from public.program_policies p join public.program_policy_files f on f.policy_id = p.id
   where p.title = 'Confidentiality' and p.version = 1 and p.archived_at is null), 2::bigint);
select test.check('a lead can prepare policies for a program still being checked',
  (select count(*) from (select public.add_policy(:'prog3', 'Waiting policy', test.files(:'prog3'))) _), 1::bigint);

select test.check_raises_like('a title is required',
  format($f$select public.add_policy(%L, '  ', %L::jsonb)$f$, :'prog1', test.files(:'prog1')), '%TITLE_REQUIRED%');
select test.check_raises_like('...and kept short',
  format($f$select public.add_policy(%L, %L, %L::jsonb)$f$, :'prog1', repeat('x', 121), test.files(:'prog1')), '%TITLE_TOO_LONG%');
select test.check_raises_like('a policy needs a file',
  format($f$select public.add_policy(%L, 'Empty', '[]'::jsonb)$f$, :'prog1'), '%FILES_REQUIRED%');
select test.check_raises_like('at most five files',
  format($f$select public.add_policy(%L, 'Six pages', %L::jsonb)$f$, :'prog1', test.files(:'prog1', 6)), '%TOO_MANY_FILES%');
select test.check('exactly five is fine',
  (select count(*) from (select public.add_policy(:'prog1', 'Five pages', test.files(:'prog1', 5))) _), 1::bigint);
select test.check_raises_like('only PDFs and photos (the table says so too)',
  format($f$select public.add_policy(%L, 'A video', %L::jsonb)$f$, :'prog1', test.files(:'prog1', 1, 'video/mp4')), '%program_policy_files_type_ok%');
select test.check_raises_like('a file over ten megabytes is refused',
  format($f$select public.add_policy(%L, 'Big', jsonb_build_array(jsonb_build_object('path', %L, 'name', 'big.pdf', 'content_type', 'application/pdf', 'size_bytes', 10485761)))$f$,
         :'prog1', :'prog1' || '/big.pdf'), '%program_policy_files_size_ok%');
select test.check_raises_like('a file outside the program''s own folder is refused',
  format($f$select public.add_policy(%L, 'Elsewhere', %L::jsonb)$f$, :'prog1', test.files(:'prog2')), '%FILE_NOT_IN_PROGRAM_FOLDER%');
select test.check_raises_like('...and so is a path that climbs out of it',
  format($f$select public.add_policy(%L, 'Climb', jsonb_build_array(jsonb_build_object('path', %L, 'name', 'a.pdf', 'content_type', 'application/pdf', 'size_bytes', 10)))$f$,
         :'prog1', :'prog1' || '/../x.pdf'), '%FILE_NOT_IN_PROGRAM_FOLDER%');
select test.check_raises_like('another program''s id is not theirs',
  format($f$select public.add_policy(%L, 'Not mine', %L::jsonb)$f$, :'prog2', test.files(:'prog2')), '%PROGRAM_NOT_FOUND%');

-- ===========================================================================
\echo ''
\echo '--- A policy is never edited: a new version replaces it ---'
-- ===========================================================================
select test.check_raises('nobody edits a policy straight in the table',
  $$update public.program_policies set title = 'Changed' where title = 'Confidentiality'$$);
select test.check_raises('...nor adds one',
  format($f$insert into public.program_policies (service_id, title) values (%L, 'Sneaked')$f$, :'prog1'));
select test.check_raises('...nor deletes one',
  $$delete from public.program_policies where title = 'Confidentiality'$$);

select public.add_policy(:'prog1', 'Confidentiality', test.files(:'prog1'), (select id from public.program_policies where title = 'Confidentiality' and version = 1));
select test.check('the new version is 2 and says what it replaced',
  (select count(*) from public.program_policies n join public.program_policies o on o.id = n.replaces_id
   where n.title = 'Confidentiality' and n.version = 2 and n.archived_at is null and o.version = 1 and o.archived_at is not null), 1::bigint);
select test.check_raises_like('a policy already replaced cannot be replaced again',
  format($f$select public.add_policy(%L, 'Confidentiality', %L::jsonb, %L)$f$, :'prog1', test.files(:'prog1'),
         (select id from public.program_policies where title = 'Confidentiality' and version = 1)), '%POLICY_NOT_FOUND%');

select public.archive_policy((select id from public.program_policies where title = 'Five pages'));
select test.check('removing a policy archives it, and the lead still reads it (the record)',
  (select count(*) from public.program_policies where title = 'Five pages' and archived_at is not null), 1::bigint);
select test.check('...with its files',
  (select count(*) from public.program_policy_files f join public.program_policies p on p.id = f.policy_id where p.title = 'Five pages'), 5::bigint);
select test.check_raises_like('removing it twice is refused',
  format($f$select public.archive_policy(%L)$f$, (select id from public.program_policies where title = 'Five pages')), '%POLICY_ALREADY_REMOVED%');

-- ===========================================================================
\echo ''
\echo '--- Who reads them ---'
-- ===========================================================================
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check('another program''s lead sees nothing of it, not even what is archived (their own program has none)',
  (select count(*) from public.program_policies where service_id in (:'prog1', :'prog3')), 1::bigint);
select test.check_raises_like('...and cannot archive it',
  format($f$select public.archive_policy(%L)$f$, (select id from public.program_policies where title = 'Confidentiality' and version = 2)), '%POLICY_NOT_FOUND%');

select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check('a member reads the current policies of a live program',
  (select count(*) from public.program_policies where service_id = :'prog1'), 1::bigint);
select test.check('...not an archived one, and not a program still being checked',
  (select count(*) from public.program_policies where archived_at is not null or service_id = :'prog3'), 0::bigint);
select test.check('...and its pages',
  (select count(*) from public.program_policy_files), 1::bigint);
select test.check_raises_like('a member cannot make a policy',
  format($f$select public.add_policy(%L, 'Mine', %L::jsonb)$f$, :'prog1', test.files(:'prog1')), '%NOT_A_PROGRAM_LEAD%');

select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('a super admin reads them all, archived too',
  (select count(*) from public.program_policies where service_id in (:'prog1', :'prog3')), 4::bigint);

reset role;
set role anon;
select test.check_raises('nobody signed out reads a policy', $$select * from public.program_policies$$);
select test.check_raises('...or makes one',
  format($f$select public.add_policy(%L, 'Anon', %L::jsonb)$f$, :'prog1', test.files(:'prog1')));

-- ===========================================================================
\echo ''
\echo '--- The private bucket ---'
-- ===========================================================================
reset role;
select test.check('the bucket is private, ten megabytes, PDFs and photos',
  (select count(*) from storage.buckets where id = 'policies' and not public and file_size_limit = 10485760
     and 'application/pdf' = any (allowed_mime_types) and not 'video/mp4' = any (allowed_mime_types)), 1::bigint);

set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
insert into storage.objects (bucket_id, name, owner) values ('policies', :'prog1' || '/draft.pdf', :'lead1');
select test.check('a lead puts a file in their own program''s folder', (select count(*) from storage.objects where name = :'prog1' || '/draft.pdf'), 1::bigint);
select test.check_raises('...and not in another program''s',
  format($f$insert into storage.objects (bucket_id, name, owner) values ('policies', %L, %L)$f$, :'prog2' || '/x.pdf', :'lead1'));
select test.check('...and takes back one that never made it into a policy',
  (select count(*) from (select 1 from storage.objects where name = :'prog1' || '/draft.pdf') _), 1::bigint);
delete from storage.objects where name = :'prog1' || '/draft.pdf';
select test.check('(it is gone)', (select count(*) from storage.objects where name = :'prog1' || '/draft.pdf'), 0::bigint);

select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check('another lead reads none of the files', (select count(*) from storage.objects where bucket_id = 'policies'), 0::bigint);

\echo ''
\echo 'program policies: all checks passed'

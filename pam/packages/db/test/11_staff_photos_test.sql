-- Staff photos (0074): a case manager or a program lead may put a photo in
-- their own folder; a member may not put one anywhere; nobody writes into
-- somebody else's folder.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana   '33333333-0000-0000-0000-00000000000a'
\set marcus '33333333-0000-0000-0000-00000000000c'
\set alice  '33333333-0000-0000-0000-00000000000f'

set role authenticated;

select test.as_user(:'dana');
do $$
begin
  insert into storage.objects (bucket_id, name, owner)
  values ('staff-photos', '33333333-0000-0000-0000-00000000000a/me.webp', '33333333-0000-0000-0000-00000000000a');
  raise notice 'ok    a case manager can add a photo to their own folder';
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('staff-photos', '33333333-0000-0000-0000-00000000000f/dana.webp', '33333333-0000-0000-0000-00000000000a');
    raise exception 'FAIL  a case manager wrote into a program lead''s folder';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a case manager cannot write into somebody else''s folder';
  end;
end;
$$;

select test.as_user(:'alice');
do $$
declare n int;
begin
  insert into storage.objects (bucket_id, name, owner)
  values ('staff-photos', '33333333-0000-0000-0000-00000000000f/me.webp', '33333333-0000-0000-0000-00000000000f');
  raise notice 'ok    a program lead can add a photo to their own folder';
  delete from storage.objects where name = '33333333-0000-0000-0000-00000000000a/me.webp';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  a program lead deleted a case manager''s photo'; end if;
  raise notice 'ok    a program lead cannot delete somebody else''s photo';
end;
$$;

select test.as_user(:'marcus');
do $$
begin
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('staff-photos', '33333333-0000-0000-0000-00000000000c/me.webp', '33333333-0000-0000-0000-00000000000c');
    raise exception 'FAIL  a member uploaded a photo';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a member cannot upload a photo, even to their own folder';
  end;
end;
$$;

reset role;

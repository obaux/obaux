-- Link previews (0081, D-407): only the two people in a conversation see a
-- link's title and picture; nobody signed in can write one — the
-- link-preview function does, with the service role, after asking
-- link_preview_targets() as the person.
--
-- The seed's conversation: Marcus (member) and Alice (program lead). Dana is
-- Marcus's case manager and NOT in it. Root is a super admin (added by 05).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana     '33333333-0000-0000-0000-00000000000a'
\set marcus   '33333333-0000-0000-0000-00000000000c'
\set alice    '33333333-0000-0000-0000-00000000000f'
\set root     '33333333-0000-0000-0000-000000000020'

\echo '--- Link previews (0081) ---'

do $$
declare b storage.buckets;
begin
  select * into b from storage.buckets where id = 'link-previews';
  if b.id is null then raise exception 'FAIL  there is no link-previews bucket'; end if;
  if b.public then raise exception 'FAIL  link-previews is a public bucket'; end if;
  if b.file_size_limit <> 2097152 then raise exception 'FAIL  link-previews is not capped at 2 MB'; end if;
  if not (b.allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          and array_length(b.allowed_mime_types, 1) = 4) then
    raise exception 'FAIL  link-previews takes something other than pictures';
  end if;
  raise notice 'ok    link-previews is private, 2 MB, pictures only';
end;
$$;

-- Marcus sends Alice a link.
set role authenticated;
select test.as_user(:'marcus');
insert into public.messages (conversation_id, sender_id, body)
values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c',
        'Look: https://example.org/workshop')
returning id as link_message \gset

-- The function asks, as Marcus, what it may fetch.
select count(*) = 1 as marcus_may from public.link_preview_targets(array[:'link_message'::uuid]) \gset
\if :marcus_may
  \echo 'ok    the person who asks gets their own conversation''s message to preview'
\else
  \echo 'FAIL  a person in the conversation was refused their own message'
  select 1/0;
\endif

-- Marcus cannot write a preview himself, true or false.
do $$
begin
  begin
    insert into public.message_link_previews (message_id, conversation_id, url, title, status)
    select id, conversation_id, 'https://example.org/workshop', 'Free money', 'ready'
    from public.messages where body = 'Look: https://example.org/workshop';
    raise exception 'FAIL  a member wrote a link preview';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    nobody signed in can write a preview (the function does)';
  end;
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('link-previews', '66666666-0000-0000-0000-000000000001/fake.jpg', '33333333-0000-0000-0000-00000000000c');
    raise exception 'FAIL  a member put a picture into link-previews';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    nobody signed in can put a picture into link-previews';
  end;
end;
$$;

-- Dana is not in the conversation: the function gets nothing to fetch for her.
select test.as_user(:'dana');
select count(*) = 0 as dana_refused from public.link_preview_targets(array[:'link_message'::uuid]) \gset
\if :dana_refused
  \echo 'ok    someone outside the conversation gets nothing to preview'
\else
  \echo 'FAIL  a case manager outside the conversation got its message to preview'
  select 1/0;
\endif

-- The function writes, with the service role (here: the owner).
reset role;
insert into public.message_link_previews (message_id, conversation_id, url, title, site, image_path, status)
values (:'link_message', '99999999-0000-0000-0000-000000000009', 'https://example.org/workshop',
        'Free resume workshop', 'Example Library', null, 'ready');
insert into storage.objects (bucket_id, name, owner)
values ('link-previews', '66666666-0000-0000-0000-000000000001/' || :'link_message' || '.jpg', null);
update public.message_link_previews
   set image_path = '66666666-0000-0000-0000-000000000001/' || :'link_message' || '.jpg'
 where message_id = :'link_message';

do $$
declare c uuid;
begin
  select conversation_id into c from public.message_link_previews limit 1;
  if c <> '66666666-0000-0000-0000-000000000001' then
    raise exception 'FAIL  a preview was filed under a conversation its message is not in';
  end if;
  raise notice 'ok    a preview belongs to its message''s conversation, whatever the writer said';

  begin
    update public.message_link_previews set image_path = '99999999-0000-0000-0000-000000000009/x.jpg';
    raise exception 'FAIL  a preview pointed at a picture outside its conversation';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a preview''s picture is in its own conversation''s folder';
  end;

  begin
    insert into public.message_link_previews (message_id, url, status)
    select id, 'javascript:alert(1)', 'ready' from public.messages
     where conversation_id = '66666666-0000-0000-0000-000000000001' and body is not null
       and id not in (select message_id from public.message_link_previews)
     limit 1;
    raise exception 'FAIL  a preview kept an address that is not a web page';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a preview''s address is a web address';
  end;
end;
$$;

set role authenticated;

select test.as_user(:'alice');
do $$
declare n int;
begin
  select count(*) into n from public.message_link_previews where title = 'Free resume workshop';
  if n <> 1 then raise exception 'FAIL  the other person in the conversation cannot see the preview'; end if;
  select count(*) into n from storage.objects where bucket_id = 'link-previews';
  if n <> 1 then raise exception 'FAIL  the other person cannot see the preview''s picture'; end if;
  raise notice 'ok    both people in the conversation see the preview and its picture';

  update public.message_link_previews set title = 'Changed';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  a person changed a preview'; end if;
  raise notice 'ok    nobody signed in changes a preview';
exception when insufficient_privilege then
  raise notice 'ok    nobody signed in changes a preview';
end;
$$;

select test.as_user(:'dana');
do $$
declare n int;
begin
  select count(*) into n from public.message_link_previews;
  if n <> 0 then raise exception 'FAIL  a case manager saw a preview in a conversation she is not in'; end if;
  select count(*) into n from storage.objects where bucket_id = 'link-previews';
  if n <> 0 then raise exception 'FAIL  a case manager saw a preview''s picture'; end if;
  raise notice 'ok    someone outside the conversation sees no preview and no picture';
end;
$$;

select test.as_user(:'root');
do $$
declare n int;
begin
  select count(*) into n from public.message_link_previews;
  if n <> 0 then raise exception 'FAIL  a super admin saw a link preview'; end if;
  select count(*) into n from storage.objects where bucket_id = 'link-previews';
  if n <> 0 then raise exception 'FAIL  a super admin saw a preview''s picture'; end if;
  raise notice 'ok    a super admin sees no preview and no picture';
end;
$$;

-- Ten at a time: the function cannot be asked to open a hundred pages at once.
select test.as_user(:'marcus');
do $$
declare n int;
begin
  select count(*) into n from public.link_preview_targets(
    array(select id from public.messages where conversation_id = '66666666-0000-0000-0000-000000000001' and body is not null)
    || array(select gen_random_uuid() from generate_series(1, 20))
  );
  if n > 10 then raise exception 'FAIL  the function was handed more than ten messages at once'; end if;
  raise notice 'ok    the function is handed ten messages at most';
end;
$$;

reset role;

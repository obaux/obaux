-- Documents in a conversation (0080, D-399): the photo rules (0079) for PDF
-- and Word files — only the two people in it can put one there or open one;
-- a reported document reaches exactly the people who see the report.
--
-- The seed's conversation: Marcus (member) and Alice (program lead). Dana is
-- Marcus's case manager and NOT in it. The south case manager has nothing to
-- do with either of them. Root is a super admin (added by 05). Runs after 15,
-- whose photo and its report are still there.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana     '33333333-0000-0000-0000-00000000000a'
\set south    '33333333-0000-0000-0000-00000000000b'
\set marcus   '33333333-0000-0000-0000-00000000000c'
\set alice    '33333333-0000-0000-0000-00000000000f'
\set root     '33333333-0000-0000-0000-000000000020'

\echo '--- Documents in a conversation (0080) ---'

do $$
declare b storage.buckets;
begin
  select * into b from storage.buckets where id = 'message-files';
  if b.id is null then raise exception 'FAIL  there is no message-files bucket'; end if;
  if b.public then raise exception 'FAIL  message-files is a public bucket'; end if;
  if b.file_size_limit <> 10485760 then raise exception 'FAIL  message-files is not capped at 10 MB'; end if;
  if not (b.allowed_mime_types @> array['application/pdf']
          and array_length(b.allowed_mime_types, 1) = 3) then
    raise exception 'FAIL  message-files takes other kinds of file than PDF and Word';
  end if;
  raise notice 'ok    message-files is private, 10 MB, PDF and Word only';
end;
$$;

set role authenticated;

-- Marcus sends Alice his lease.
select test.as_user(:'marcus');
do $$
begin
  insert into storage.objects (bucket_id, name, owner)
  values ('message-files', '66666666-0000-0000-0000-000000000001/lease.pdf', '33333333-0000-0000-0000-00000000000c');
  insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind, attachment_name, attachment_bytes)
  values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c', 'Here it is',
          '66666666-0000-0000-0000-000000000001/lease.pdf', 'file', 'Lease 2026.pdf', 245760);
  raise notice 'ok    a person in a conversation can send a document in it, with its name and size';

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c', null,
            '66666666-0000-0000-0000-000000000001/nameless.pdf', 'file');
    raise exception 'FAIL  a document was sent with no name to show';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a document always says what it is called and how big it is';
  end;

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind, attachment_name, attachment_bytes)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c', null,
            '99999999-0000-0000-0000-000000000009/elsewhere.pdf', 'file', 'elsewhere.pdf', 100);
    raise exception 'FAIL  a message pointed at a document from another conversation';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a message cannot point at a document outside its conversation';
  end;

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind, attachment_name, attachment_bytes)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c', null,
            '66666666-0000-0000-0000-000000000001/x.pdf', 'file', '../../etc/passwd', 100);
    raise exception 'FAIL  a document name with a path in it was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a document''s name is a name, not a path';
  end;

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind, attachment_name, attachment_bytes)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c', null,
            '66666666-0000-0000-0000-000000000001/big.pdf', 'file', 'big.pdf', 10485761);
    raise exception 'FAIL  a document said to be over 10 MB was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a document is 10 MB at most';
  end;

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_kind)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c', 'look', 'photo');
    raise exception 'FAIL  a message said it had a photo and pointed at nothing';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a message with a photo points at one (0079 let this through)';
  end;

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind, attachment_name, attachment_bytes)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c', null,
            '66666666-0000-0000-0000-000000000001/p.jpg', 'photo', 'p.jpg', 100);
    raise exception 'FAIL  a photo carried a document''s name and size';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a photo stays a photo (no name or size of its own)';
  end;

  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('message-files', 'not-a-conversation/x.pdf', '33333333-0000-0000-0000-00000000000c');
    raise exception 'FAIL  a document was stored outside any conversation folder';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a document cannot be stored outside a conversation folder';
  end;
end;
$$;

-- Alice, the other person in it, can open it; neither can take it back.
select test.as_user(:'alice');
do $$
declare n int;
begin
  select count(*) into n from storage.objects
   where bucket_id = 'message-files' and name = '66666666-0000-0000-0000-000000000001/lease.pdf';
  if n <> 1 then raise exception 'FAIL  the other person in the conversation cannot open its document'; end if;
  raise notice 'ok    the other person in the conversation can open the document';

  select count(*) into n from public.messages
   where attachment_url = '66666666-0000-0000-0000-000000000001/lease.pdf'
     and attachment_name = 'Lease 2026.pdf' and attachment_bytes = 245760;
  if n <> 1 then raise exception 'FAIL  the other person cannot read the document''s name and size'; end if;
  raise notice 'ok    the other person reads its name and size before opening it';

  delete from storage.objects where name = '66666666-0000-0000-0000-000000000001/lease.pdf';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  a person deleted the other person''s document'; end if;
  raise notice 'ok    nobody deletes the other person''s document';
end;
$$;

select test.as_user(:'marcus');
do $$
declare n int;
begin
  delete from storage.objects where name = '66666666-0000-0000-0000-000000000001/lease.pdf';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  a sent document was deleted out from under its message'; end if;
  raise notice 'ok    a document stays with the message it was sent in';

  insert into storage.objects (bucket_id, name, owner)
  values ('message-files', '66666666-0000-0000-0000-000000000001/unsent.docx', '33333333-0000-0000-0000-00000000000c');
  delete from storage.objects where name = '66666666-0000-0000-0000-000000000001/unsent.docx';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL  the uploader could not clear an unsent document'; end if;
  raise notice 'ok    the uploader can clear a document no message uses';
end;
$$;

-- Staff outside the conversation see nothing, and cannot add to it.
select test.as_user(:'dana');
do $$
declare n int;
begin
  select count(*) into n from storage.objects where bucket_id = 'message-files';
  if n <> 0 then raise exception 'FAIL  a case manager saw a document in a conversation she is not in'; end if;
  raise notice 'ok    a case manager does not see documents in a conversation she is not in';
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('message-files', '66666666-0000-0000-0000-000000000001/dana.pdf', '33333333-0000-0000-0000-00000000000a');
    raise exception 'FAIL  a case manager put a document into somebody else''s conversation';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a case manager cannot put a document into somebody else''s conversation';
  end;
end;
$$;

select test.as_user(:'root');
do $$
declare n int;
begin
  select count(*) into n from storage.objects where bucket_id = 'message-files';
  if n <> 0 then raise exception 'FAIL  a super admin saw an unreported document'; end if;
  raise notice 'ok    a super admin does not see a document nobody reported';
end;
$$;

-- Alice reports the message with the document in it.
select test.as_user(:'alice');
select public.report_message(
  (select id from public.messages where attachment_url = '66666666-0000-0000-0000-000000000001/lease.pdf'),
  'spam'
) is not null as reported \gset

-- Dana is Marcus's case manager: she sees reports about him (0065).
select test.as_user(:'dana');
do $$
declare n int;
begin
  select count(*) into n from storage.objects
   where bucket_id = 'message-files' and name = '66666666-0000-0000-0000-000000000001/lease.pdf';
  if n <> 1 then raise exception 'FAIL  the case manager of the reported person cannot open the reported document'; end if;
  raise notice 'ok    the reported person''s case manager can open the reported document';

  select count(*) into n from public.report_files_for_review()
   where file_path = '66666666-0000-0000-0000-000000000001/lease.pdf'
     and file_name = 'Lease 2026.pdf' and file_bytes = 245760;
  if n <> 1 then raise exception 'FAIL  the review screen does not get the reported document'; end if;
  raise notice 'ok    the review screen gets the reported document''s path, name and size';

  select count(*) into n from public.messages where conversation_id = '66666666-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'FAIL  a report opened the rest of the conversation'; end if;
  raise notice 'ok    a reported document opens nothing else in the conversation';
end;
$$;

select test.as_user(:'root');
do $$
declare n int;
begin
  select count(*) into n from storage.objects
   where bucket_id = 'message-files' and name = '66666666-0000-0000-0000-000000000001/lease.pdf';
  if n <> 1 then raise exception 'FAIL  a super admin cannot open a reported document'; end if;
  raise notice 'ok    a super admin can open a reported document';
end;
$$;

select test.as_user(:'south');
do $$
declare n int;
begin
  select count(*) into n from storage.objects where bucket_id = 'message-files';
  if n <> 0 then raise exception 'FAIL  an unrelated case manager saw a reported document'; end if;
  select count(*) into n from public.report_files_for_review();
  if n <> 0 then raise exception 'FAIL  an unrelated case manager got a reported document''s details'; end if;
  raise notice 'ok    an unrelated case manager sees no document, reported or not';
end;
$$;

reset role;

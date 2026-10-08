-- Photos in a conversation (0079, D-394): only the two people in it can put
-- one there or see one; a reported photo reaches exactly the people who see
-- the report, and nobody else on staff ever does.
--
-- The seed's conversation: Marcus (member) and Alice (program lead). Dana is
-- Marcus's case manager and NOT in it. The south case manager has nothing to
-- do with either of them. Root is a super admin (added by 05).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana     '33333333-0000-0000-0000-00000000000a'
\set south    '33333333-0000-0000-0000-00000000000b'
\set marcus   '33333333-0000-0000-0000-00000000000c'
\set alice    '33333333-0000-0000-0000-00000000000f'
\set root     '33333333-0000-0000-0000-000000000020'

\echo '--- Photos in a conversation (0079) ---'

do $$
begin
  if exists (select 1 from storage.buckets where id = 'message-photos' and public) then
    raise exception 'FAIL  message-photos is a public bucket';
  end if;
  raise notice 'ok    message-photos is a private bucket';
end;
$$;

set role authenticated;

-- Alice sends Marcus a photo.
select test.as_user(:'alice');
do $$
begin
  insert into storage.objects (bucket_id, name, owner)
  values ('message-photos', '66666666-0000-0000-0000-000000000001/flyer.jpg', '33333333-0000-0000-0000-00000000000f');
  insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind)
  values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000f', null,
          '66666666-0000-0000-0000-000000000001/flyer.jpg', 'photo');
  raise notice 'ok    a person in a conversation can send a photo in it';

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000f', null,
            '99999999-0000-0000-0000-000000000009/elsewhere.jpg', 'photo');
    raise exception 'FAIL  a message pointed at a photo from another conversation';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a message cannot point at a photo outside its conversation';
  end;

  begin
    insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind)
    values ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000f', null,
            '66666666-0000-0000-0000-000000000001/note.m4a', 'voice');
    raise exception 'FAIL  a voice note was accepted before voice notes exist';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    an attachment is a photo until voice notes are built';
  end;

  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('message-photos', 'not-a-conversation/x.jpg', '33333333-0000-0000-0000-00000000000f');
    raise exception 'FAIL  a photo was stored outside any conversation folder';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a photo cannot be stored outside a conversation folder';
  end;
end;
$$;

-- Marcus, the other person in it, sees it and can send one back.
select test.as_user(:'marcus');
do $$
declare n int;
begin
  select count(*) into n from storage.objects
   where bucket_id = 'message-photos' and name = '66666666-0000-0000-0000-000000000001/flyer.jpg';
  if n <> 1 then raise exception 'FAIL  the other person in the conversation cannot see its photo'; end if;
  raise notice 'ok    the other person in the conversation sees the photo';

  insert into storage.objects (bucket_id, name, owner)
  values ('message-photos', '66666666-0000-0000-0000-000000000001/reply.jpg', '33333333-0000-0000-0000-00000000000c');
  raise notice 'ok    the other person can send a photo back';

  -- Deleting somebody else's photo, sent or not, does nothing.
  delete from storage.objects where name = '66666666-0000-0000-0000-000000000001/flyer.jpg';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  a member deleted the other person''s photo'; end if;
  raise notice 'ok    nobody deletes the other person''s photo';

  -- A photo of your own that no message uses (a send that failed) can go.
  delete from storage.objects where name = '66666666-0000-0000-0000-000000000001/reply.jpg';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL  the uploader could not clear an unsent photo'; end if;
  raise notice 'ok    the uploader can clear a photo no message uses';
end;
$$;

-- Alice cannot take back a photo she has sent.
select test.as_user(:'alice');
do $$
declare n int;
begin
  delete from storage.objects where name = '66666666-0000-0000-0000-000000000001/flyer.jpg';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  a sent photo was deleted out from under its message'; end if;
  raise notice 'ok    a photo stays with the message it was sent in';
end;
$$;

-- Staff outside the conversation see nothing, and cannot add to it.
select test.as_user(:'dana');
do $$
declare n int;
begin
  select count(*) into n from storage.objects where bucket_id = 'message-photos';
  if n <> 0 then raise exception 'FAIL  a case manager saw a photo in a conversation she is not in'; end if;
  raise notice 'ok    a case manager does not see photos in a conversation she is not in';
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('message-photos', '66666666-0000-0000-0000-000000000001/dana.jpg', '33333333-0000-0000-0000-00000000000a');
    raise exception 'FAIL  a case manager put a photo into somebody else''s conversation';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a case manager cannot put a photo into somebody else''s conversation';
  end;
end;
$$;

select test.as_user(:'root');
do $$
declare n int;
begin
  select count(*) into n from storage.objects where bucket_id = 'message-photos';
  if n <> 0 then raise exception 'FAIL  a super admin saw an unreported photo'; end if;
  raise notice 'ok    a super admin does not see a photo nobody reported';
end;
$$;

-- Marcus reports the photo. Now the people who see that report see it too.
select test.as_user(:'marcus');
select public.report_message(
  (select id from public.messages where attachment_url = '66666666-0000-0000-0000-000000000001/flyer.jpg'),
  'harassment'
) is not null as reported \gset

select test.as_user(:'dana');
do $$
declare n int;
begin
  select count(*) into n from storage.objects
   where bucket_id = 'message-photos' and name = '66666666-0000-0000-0000-000000000001/flyer.jpg';
  if n <> 1 then raise exception 'FAIL  the reporter''s case manager cannot see the reported photo'; end if;
  raise notice 'ok    the reporter''s case manager sees the reported photo';

  select count(*) into n from public.report_photos_for_review()
   where photo_path = '66666666-0000-0000-0000-000000000001/flyer.jpg';
  if n <> 1 then raise exception 'FAIL  the review screen does not get the reported photo'; end if;
  raise notice 'ok    the review screen gets the reported photo''s path';

  select count(*) into n from public.messages where conversation_id = '66666666-0000-0000-0000-000000000001';
  if n <> 0 then raise exception 'FAIL  a report opened the rest of the conversation'; end if;
  raise notice 'ok    a reported photo opens nothing else in the conversation';
end;
$$;

select test.as_user(:'root');
do $$
declare n int;
begin
  select count(*) into n from storage.objects
   where bucket_id = 'message-photos' and name = '66666666-0000-0000-0000-000000000001/flyer.jpg';
  if n <> 1 then raise exception 'FAIL  a super admin cannot see a reported photo'; end if;
  raise notice 'ok    a super admin sees a reported photo';
end;
$$;

select test.as_user(:'south');
do $$
declare n int;
begin
  select count(*) into n from storage.objects where bucket_id = 'message-photos';
  if n <> 0 then raise exception 'FAIL  an unrelated case manager saw a reported photo'; end if;
  select count(*) into n from public.report_photos_for_review();
  if n <> 0 then raise exception 'FAIL  an unrelated case manager got a reported photo''s path'; end if;
  raise notice 'ok    an unrelated case manager sees no photo, reported or not';
end;
$$;

reset role;

-- APPLIED to the live project on 9 October 2026, through the connector, without three `drop policy if exists` guards (its two constraint replacements were kept):
-- no-ops on a database where these objects did not exist yet, and the connector hangs on them (D-387).
-- Everything else is exactly what is below.

-- 0080 — Documents in a conversation (Will, 8 October 2026: "We should also
-- allow files like pdf. Word doc. And Google Docs. To be dropped in."). D-399.
--
-- Builds on 0079 (photos) and changes none of its rules; what a photo is
-- allowed, a document is allowed, by the same tests.
--
--   * A second private bucket, `message-files`: PDF and Word (.doc, .docx),
--     10 MB at most. Never public and never a link — downloaded with the
--     person's own sign-in, and only when they tap it.
--   * The same layout as photos, one folder per conversation
--     (`<conversation id>/<random>`), and the same four tests to put one
--     there: in that conversation, an active account, chat allowed, no block
--     (0076, 0079).
--   * Who can see one: the two people in the conversation, and — once the
--     message it is in is reported — the people who see that report, exactly
--     as for a photo. No admin policy.
--   * A message with a document says what it is called and how big it is
--     (`attachment_name`, `attachment_bytes`), so the other person sees
--     "Lease.pdf · 240 KB" before deciding to download it on a data plan.
--     The size is what the sender's phone said; it is for showing, and the
--     bucket's own limit is what holds.
--   * A Google Doc is a link, not a file — nothing here. The app shows a link
--     to docs.google.com in a message as a card that opens it in Google
--     (D-399); who can open the doc is decided in Google, not in Pam.
--
-- test/16_message_files_test.sql attacks it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-files', 'message-files', false, 10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- What a message says about its document.

alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists attachment_bytes integer;

grant insert (attachment_name, attachment_bytes) on public.messages to authenticated;

-- A document joins photo as an attachment there is storage for (voice notes
-- stay unbuilt). Replaces 0005's list and 0079's photo-only rule. Every
-- part is required in so many words (`is not null`): a CHECK whose test comes
-- out NULL passes, so 0079's rule let a photo through with no path at all,
-- and a bare `char_length(attachment_name) between …` would let a document
-- through with no name (found by test 16).
alter table public.messages drop constraint if exists messages_attachment_kind_known;
alter table public.messages add constraint messages_attachment_kind_known check (
  attachment_kind is null or attachment_kind in ('voice', 'photo', 'file')
);

alter table public.messages drop constraint if exists messages_photo_in_its_conversation;
alter table public.messages drop constraint if exists messages_attachment_in_its_conversation;
alter table public.messages add constraint messages_attachment_in_its_conversation check (
  (
    attachment_url is null and attachment_kind is null
    and attachment_name is null and attachment_bytes is null
  )
  or (
    attachment_kind = 'photo'
    and attachment_url is not null
    and split_part(attachment_url, '/', 1) = conversation_id::text
    and attachment_name is null and attachment_bytes is null
  )
  or (
    attachment_kind = 'file'
    and attachment_url is not null
    and attachment_name is not null
    and attachment_bytes is not null
    and split_part(attachment_url, '/', 1) = conversation_id::text
    and char_length(attachment_name) between 1 and 200
    and attachment_name !~ '[[:cntrl:]/\\]'
    and attachment_bytes between 1 and 10485760
  )
);

-- ---------------------------------------------------------------------------
-- Who may see a stored document: the same answer as a photo (0079), for a
-- message whose attachment is a file.

create or replace function public.can_see_message_file(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    coalesce(public.in_conversation(public.message_photo_conversation(p_name)), false)
    or exists (
      select 1
      from public.messages m
      join public.reports r on r.target_type = 'message' and r.target_id = m.id
      where m.attachment_url = p_name
        and m.attachment_kind = 'file'
        and public.report_visible_to_me(r.target_type, r.target_id, r.reporter_id)
    );
$$;

revoke all on function public.can_see_message_file(text) from public, anon;
grant execute on function public.can_see_message_file(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage policies, the photo ones (0079) for the second bucket.

drop policy if exists message_files_insert_member on storage.objects;
create policy message_files_insert_member on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-files'
    and coalesce(public.in_conversation(public.message_photo_conversation(name)), false)
    and public.is_active_account()
    and public.my_feature_allowed('chat')
    and not public.conversation_has_block(public.message_photo_conversation(name))
  );

drop policy if exists message_files_select_seen on storage.objects;
create policy message_files_select_seen on storage.objects
  for select to authenticated
  using (bucket_id = 'message-files' and public.can_see_message_file(name));

drop policy if exists message_files_delete_unsent on storage.objects;
create policy message_files_delete_unsent on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'message-files'
    and owner = auth.uid()
    and not exists (select 1 from public.messages m where m.attachment_url = storage.objects.name)
  );

-- ---------------------------------------------------------------------------
-- What the moderation screen reads for a reported document: same audience as
-- `report_photos_for_review()`, plus what it is called and how big.

create or replace function public.report_files_for_review()
returns table (report_id uuid, file_path text, file_name text, file_bytes integer)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.id, m.attachment_url, m.attachment_name, m.attachment_bytes
  from public.reports r
  join public.messages m on r.target_type = 'message' and m.id = r.target_id
  where m.attachment_kind = 'file'
    and m.attachment_url is not null
    and public.report_visible_to_me(r.target_type, r.target_id, r.reporter_id);
$$;

comment on function public.report_files_for_review is
  'The document in each reported message the caller may review (D-399): '
  'its path, name and size. The file itself is downloaded with the '
  'reviewer''s own sign-in, which message_files_select_seen allows for '
  'exactly these people.';

revoke all on function public.report_files_for_review() from public, anon;
grant execute on function public.report_files_for_review() to authenticated;

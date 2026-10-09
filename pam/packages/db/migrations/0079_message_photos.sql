-- APPLIED to the live project on 9 October 2026, through the connector, without three `drop policy if exists` guards and one `drop constraint if exists`:
-- no-ops on a database where these objects did not exist yet, and the connector hangs on them (D-387).
-- Everything else is exactly what is below.

-- 0079 — Photos in a conversation (Will, 8 October 2026: "let's build the
-- photo storage and update the privacy policy and what we tell members and
-- staff about it"). D-394.
--
-- `messages.attachment_url` / `attachment_kind ('voice','photo')` have been
-- in the schema since 0005 and nothing filled them. This gives photos a place
-- to live and decides, in the database, who can ever see one.
--
--   * A private bucket, `message-photos`. Never public, and never handed out
--     as a link: the app downloads a photo with the person's own sign-in, so
--     a photo is read only by somebody the policies below let read it. 5 MB
--     at most, JPEG, PNG or WebP (the app sends a JPEG of at most 1600px,
--     re-drawn on the phone, which also drops the location and camera
--     details a phone writes into a photo).
--   * One folder per conversation: `<conversation id>/<random>.jpg`.
--   * Who can put a photo there: a member of that conversation, with an
--     active account and chat allowed, in a conversation with no block in
--     it — the same four tests `messages_insert_sender` makes (0076).
--   * Who can see one: the two people in the conversation. And, once
--     somebody reports the message the photo is in, the same people who see
--     that report (`report_visible_to_me`, 0065: the case manager
--     responsible for either person, and the super admins) — exactly as a
--     reported message's words reach them through `target_excerpt` and
--     nowhere else. Staff who are not in a conversation never see its
--     photos otherwise; there is no admin policy, as there is none on
--     `messages` (0007).
--   * Nobody edits a photo. The person who uploaded one may delete it only
--     while no message uses it (a send that failed half way); once it is in
--     a message it stays with the message, as words do.
--   * A message's photo must be in its own conversation's folder, so a
--     message cannot point at a photo from somewhere else. Voice notes stay
--     unbuilt: until they have storage and rules of their own, an attachment
--     is a photo.
--
-- The transparency contract and the privacy notice say this in words
-- (packages/config: transparency.ts, the locales); the tests in
-- test/15_message_photos_test.sql attack it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-photos', 'message-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Which conversation a stored photo belongs to: its first folder, or null
-- when the path does not start with a conversation id.

create or replace function public.message_photo_conversation(p_name text)
returns uuid
language plpgsql
immutable
set search_path = public, extensions
as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-- Who may see a stored photo. Security definer so the report half can look
-- at `messages` and `reports` the way `report_visible_to_me` does; it only
-- ever answers about auth.uid().
create or replace function public.can_see_message_photo(p_name text)
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
        and m.attachment_kind = 'photo'
        and public.report_visible_to_me(r.target_type, r.target_id, r.reporter_id)
    );
$$;

revoke all on function public.message_photo_conversation(text) from public, anon;
grant execute on function public.message_photo_conversation(text) to authenticated;
revoke all on function public.can_see_message_photo(text) from public, anon;
grant execute on function public.can_see_message_photo(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage policies.

drop policy if exists message_photos_insert_member on storage.objects;
create policy message_photos_insert_member on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-photos'
    and coalesce(public.in_conversation(public.message_photo_conversation(name)), false)
    and public.is_active_account()
    and public.my_feature_allowed('chat')
    and not public.conversation_has_block(public.message_photo_conversation(name))
  );

drop policy if exists message_photos_select_seen on storage.objects;
create policy message_photos_select_seen on storage.objects
  for select to authenticated
  using (bucket_id = 'message-photos' and public.can_see_message_photo(name));

drop policy if exists message_photos_delete_unsent on storage.objects;
create policy message_photos_delete_unsent on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'message-photos'
    and owner = auth.uid()
    and not exists (select 1 from public.messages m where m.attachment_url = storage.objects.name)
  );

-- ---------------------------------------------------------------------------
-- A message's photo lives in its own conversation's folder.

alter table public.messages drop constraint if exists messages_photo_in_its_conversation;
alter table public.messages add constraint messages_photo_in_its_conversation check (
  (attachment_url is null and attachment_kind is null)
  or (
    attachment_kind = 'photo'
    and split_part(attachment_url, '/', 1) = conversation_id::text
  )
);

-- ---------------------------------------------------------------------------
-- What the moderation screen reads for a reported photo. A separate function
-- rather than a new column on `reports_for_review()`, whose return type
-- cannot change without dropping it. Same audience, same rule.

create or replace function public.report_photos_for_review()
returns table (report_id uuid, photo_path text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.id, m.attachment_url
  from public.reports r
  join public.messages m on r.target_type = 'message' and m.id = r.target_id
  where m.attachment_kind = 'photo'
    and m.attachment_url is not null
    and public.report_visible_to_me(r.target_type, r.target_id, r.reporter_id);
$$;

comment on function public.report_photos_for_review is
  'The photo in each reported message the caller may review (D-394). The '
  'path only; the photo itself is downloaded with the reviewer''s own sign-in, '
  'which message_photos_select_seen allows for exactly these people.';

revoke all on function public.report_photos_for_review() from public, anon;
grant execute on function public.report_photos_for_review() to authenticated;

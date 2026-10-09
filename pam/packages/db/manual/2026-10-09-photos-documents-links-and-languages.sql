-- Photos, documents, link previews, and the language people ask in
-- (0079 + 0080 + 0081 + 0085), as ONE file for the Supabase SQL editor.
--
-- WHY A FILE AND NOT THE CONNECTOR: the connector stops at a `drop`
-- statement, and these have a few (D-387). This is the same SQL as the four
-- migration files, in order, in one transaction: either all of it happens or
-- none of it does.
--
-- HOW (about two minutes)
--   1. Supabase dashboard -> the "pam" project -> SQL Editor -> New query.
--   2. Paste this whole file. Press Run.
--   3. It should say "Success". If it says anything else, nothing was
--      changed: send Claude the message.
--   4. Tell Claude "applied". Claude reads the database back and checks it.
--
-- SAFE TO RUN TWICE: every statement is written to change nothing the second
-- time. It refuses to run at all on a database that is not in the state it
-- was written for (it needs 0078 and 0084 to be there), and it checks its own
-- work before it commits: if a bucket is public or a policy is missing, it
-- rolls everything back.
--
-- WHAT CHANGES FOR MEMBERS: nothing, until the app that sends photos is
-- merged. A photo or document is seen only by the two people in the
-- conversation, and by a guide or super admin only once someone reports that
-- message (the same rule as the message words, `report_visible_to_me`). A
-- link preview is seen only by the two people, reported or not. No admin
-- policy exists on any of them.
--
-- Generated from packages/db/migrations by hand; a test
-- (packages/config/test/manual-sql.test.ts) fails if it drifts from them.

begin;

-- Is this the database the file was written for?
do $$
begin
  if not exists (select 1 from supabase_migrations.schema_migrations where name = '0078_one_account_two_roles') then
    raise exception 'STOP: 0078 is not applied here, so this is not the database this file was written for';
  end if;
  if not exists (select 1 from supabase_migrations.schema_migrations where name = '0084_message_translations') then
    raise exception 'STOP: 0084 is not applied here; apply 0083 and 0084 first';
  end if;
end;
$$;

-- ===========================================================================
-- 0079_message_photos.sql
-- ===========================================================================

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

-- ===========================================================================
-- 0080_message_files.sql
-- ===========================================================================

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

-- ===========================================================================
-- 0081_link_previews.sql
-- ===========================================================================

-- 0081 — Link previews (Will, 9 October 2026: "add links shared go on the
-- list, with social image previews … Go ahead and set up server function").
-- D-407.
--
-- A phone cannot read another website's preview (its title and "social"
-- picture): browsers refuse to hand one site's page to another. So when a
-- message has a link, the `link-preview` Edge Function — Pam's server, not
-- the member's phone — opens the page once, takes its title and picture,
-- and keeps them here:
--
--   * `message_link_previews`: one row per message with a link — the
--     address, the page's title, its site name, and where its picture is
--     kept (or that it had none). Only the two people in the conversation
--     can read it. Nobody signed in can write it: the function writes with
--     the service role, after asking the database (below) whether the
--     person who asked is in that conversation.
--   * `link-previews`, a private bucket for the pictures, one folder per
--     conversation like photos (0079). Copied, not linked, so looking at the
--     list never contacts the other site; only tapping the link does. Read
--     with the person's own sign-in, by the same two people. 2 MB, images.
--   * `link_preview_targets(ids)`: the one question the function asks as the
--     person — which of these messages are in a conversation of yours, and
--     what do they say. Ten at a time.
--
-- No admin sees a preview, reported or not: a report shows the message, and
-- its words already carry the link (transparency: `message_link_previews`).
--
-- test/17_link_previews_test.sql attacks it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'link-previews', 'link-previews', false, 2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------

create table if not exists public.message_link_previews (
  message_id uuid primary key references public.messages (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  url text not null,
  title text,
  site text,
  image_path text,
  -- 'ready': the page answered (with or without a picture). 'none': it could
  -- not be read — refused, too big, not a web page — so nobody asks again.
  status text not null,
  fetched_at timestamptz not null default now(),
  constraint message_link_previews_url check (url ~* '^https?://' and char_length(url) <= 2048),
  constraint message_link_previews_title check (title is null or char_length(title) between 1 and 300),
  constraint message_link_previews_site check (site is null or char_length(site) between 1 and 253),
  constraint message_link_previews_status check (status in ('ready', 'none')),
  constraint message_link_previews_image_in_conversation check (
    image_path is null or split_part(image_path, '/', 1) = conversation_id::text
  )
);

create index if not exists message_link_previews_conversation on public.message_link_previews (conversation_id);

-- A preview belongs to the conversation its message is in, whatever the
-- writer said.
create or replace function public.message_link_previews_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  select m.conversation_id into new.conversation_id from public.messages m where m.id = new.message_id;
  return new;
end;
$$;

revoke all on function public.message_link_previews_conversation() from public, anon, authenticated;

drop trigger if exists message_link_previews_conversation on public.message_link_previews;
create trigger message_link_previews_conversation
  before insert or update on public.message_link_previews
  for each row execute function public.message_link_previews_conversation();

alter table public.message_link_previews enable row level security;
alter table public.message_link_previews force row level security;

revoke all on public.message_link_previews from anon, authenticated;
grant select on public.message_link_previews to authenticated;

drop policy if exists message_link_previews_select_member on public.message_link_previews;
create policy message_link_previews_select_member on public.message_link_previews
  for select to authenticated
  using (coalesce(public.in_conversation(conversation_id), false));

-- ---------------------------------------------------------------------------
-- The pictures: read by the two people, written only by the function.

drop policy if exists link_previews_select_member on storage.objects;
create policy link_previews_select_member on storage.objects
  for select to authenticated
  using (
    bucket_id = 'link-previews'
    and coalesce(public.in_conversation(public.message_photo_conversation(name)), false)
  );

-- ---------------------------------------------------------------------------
-- What the function may fetch for the person asking: their own
-- conversations' messages, ten at a time, and whether each already has a
-- preview (so a page is opened once, not every time somebody looks).

create or replace function public.link_preview_targets(p_message_ids uuid[])
returns table (message_id uuid, conversation_id uuid, body text, has_preview boolean)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select m.id, m.conversation_id, m.body,
         exists (select 1 from public.message_link_previews p where p.message_id = m.id)
  from public.messages m
  where m.id = any (p_message_ids[1:10])
    and m.body is not null
    and coalesce(public.in_conversation(m.conversation_id), false);
$$;

comment on function public.link_preview_targets is
  'The messages (at most ten of those asked) in the caller''s own '
  'conversations, with their words and whether they already have a link '
  'preview (D-407). The link-preview Edge Function calls it with the '
  'caller''s sign-in before opening any page.';

revoke all on function public.link_preview_targets(uuid[]) from public, anon;
grant execute on function public.link_preview_targets(uuid[]) to authenticated;

-- ===========================================================================
-- 0085_language_where_there_is_no_profile.sql
-- ===========================================================================

-- 0085 — A text or an email goes out in the language the person reads Pam in,
-- including when there is no profile yet to read it from (Will, 9 October 2026:
-- "We want SMS and emails to show up on their desired language"). D-424.
--
-- Most texts are queued against a member and rendered at send time in that
-- member's `preferred_language` (0039), so a member who switches language gets
-- their next text in it with nothing more to do. Two things are sent to people
-- who have no profile, and for those the language had nowhere to live:
--
--   * a staff request that is DENIED creates no profile, and its text was
--     queued with `locale = 'en'` written in (0055);
--   * a fresh invite link, mailed to whoever held an expired one, goes to an
--     address with nothing known about its owner (0071, 0077).
--
-- And one more, quieter: an APPROVED request creates its profile without a
-- language, so somebody who asked in Russian became an English-language
-- account the moment they were let in, and their approval text with it.
--
-- So the language is asked for where the person already is, in the language
-- they are reading, and carried:
--
--   * `staff_requests.preferred_language` — set when they ask; copied onto the
--     profile when approved, and onto the denial text's `locale` when denied.
--   * `invite_emails.locale` — set when the expired-link page asks for the
--     fresh one, read by whatever sends the email.
--
-- A value outside the languages the app offers (0083) is stored as English,
-- not refused: a person asking for access must not be turned away over a
-- language code. What reads it falls back to English for a language it has no
-- signed-off wording in, as texts already do.
--
-- ## Applying it — this one is by hand
--
-- Two functions change shape (a trailing `p_language text default 'en'`), and
-- the old signature has to be dropped first or a call would satisfy both and
-- Postgres would refuse it as ambiguous (the same call 0049 and 0056 made).
-- The live connector stops at a `drop`, so this goes in the SQL editor with
-- 0079–0081 and before the branch that calls it is merged:
--
--   * Migration first, app second: the old app calls `request_staff_access`
--     with eleven arguments and `request_invite_link` with two, and both still
--     resolve to the new functions through the default.
--   * App first, migration second would fail those two calls until it caught
--     up, because the app names `p_language`.
--
-- Run twice it changes nothing the second time. test/20_language_without_a_
-- profile_test.sql attacks it.

-- ---------------------------------------------------------------------------
-- 1. Somewhere to keep it

alter table public.staff_requests
  add column if not exists preferred_language text not null default 'en';

alter table public.invite_emails
  add column if not exists locale text not null default 'en';

-- Added only if it is not there (no `drop constraint` guard for the connector
-- to stop at). The same seven codes as profiles_language_supported (0083).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.staff_requests'::regclass
      and conname = 'staff_requests_language_supported'
  ) then
    alter table public.staff_requests
      add constraint staff_requests_language_supported
      check (preferred_language in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.invite_emails'::regclass
      and conname = 'invite_emails_locale_supported'
  ) then
    alter table public.invite_emails
      add constraint invite_emails_locale_supported
      check (locale in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'));
  end if;
end;
$$;

comment on column public.staff_requests.preferred_language is
  'The language the person was reading Pam in when they asked (0085). Copied '
  'onto the profile if approved, and onto the denial text''s locale if not.';
comment on column public.invite_emails.locale is
  'The language the person was reading Pam in when they asked for a fresh '
  'link (0085). The sender renders the email in it, in English if it has no '
  'signed-off wording in that language.';

-- A language the app offers, or English. Not exposed: only the definer
-- functions below call it.
create or replace function public.supported_language(p_language text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select case
    when p_language in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar') then p_language
    else 'en'
  end;
$$;

revoke all on function public.supported_language(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Asking for staff access says which language it was asked in

drop function if exists public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text
);

create or replace function public.request_staff_access(
  p_wants_role  text,
  p_first_name  text,
  p_last_name   text,
  p_city        text,
  p_program_name        text default null,
  p_program_category    text default null,
  p_program_subcategory text default null,
  p_program_description text default null,
  p_program_address     text default null,
  p_program_phone       text default null,
  p_program_website     text default null,
  p_language            text default 'en'
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if p_wants_role not in ('provider', 'admin') then
    raise exception 'That is not a role somebody can ask for';
  end if;

  insert into public.staff_requests (
    user_id, wants_role, first_name, last_name, city,
    program_name, program_category, program_subcategory, program_description,
    program_address, program_phone, program_website, preferred_language
  )
  values (
    caller, p_wants_role::public.user_role,
    nullif(btrim(coalesce(p_first_name, '')), ''),
    nullif(btrim(coalesce(p_last_name, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    nullif(btrim(coalesce(p_program_name, '')), ''),
    nullif(btrim(coalesce(p_program_category, '')), '')::public.service_category,
    nullif(btrim(coalesce(p_program_subcategory, '')), ''),
    nullif(btrim(coalesce(p_program_description, '')), ''),
    nullif(btrim(coalesce(p_program_address, '')), ''),
    nullif(btrim(coalesce(p_program_phone, '')), ''),
    nullif(btrim(coalesce(p_program_website, '')), ''),
    public.supported_language(btrim(coalesce(p_language, '')))
  )
  on conflict (user_id) do update
    set wants_role = excluded.wants_role,
        first_name = excluded.first_name,
        last_name  = excluded.last_name,
        city       = excluded.city,
        program_name        = excluded.program_name,
        program_category    = excluded.program_category,
        program_subcategory = excluded.program_subcategory,
        program_description = excluded.program_description,
        program_address     = excluded.program_address,
        program_phone       = excluded.program_phone,
        program_website     = excluded.program_website,
        preferred_language  = excluded.preferred_language,
        created_at = now();
end;
$$;

comment on function public.request_staff_access is
  'Records a claim to a staff role, and a program''s own details when the '
  'claim is to run one (0056), and the language it was asked in (0085). '
  'Creates no profile and grants nothing.';

revoke all on function public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.request_staff_access(
  text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Deciding it keeps the language

create or replace function public.review_staff_request(
  p_user_id  uuid,
  p_decision text,
  p_region_id uuid default null
)
returns public.staff_requests
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  request public.staff_requests;
  caller_phone text;
  new_profile public.profiles;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can review a request';
  end if;

  if p_decision not in ('approved', 'denied') then
    raise exception 'That is not a decision';
  end if;

  select * into request from public.staff_requests where user_id = p_user_id for update;
  if request.user_id is null then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if request.decision is not null then
    raise exception 'REQUEST_ALREADY_DECIDED';
  end if;

  if p_decision = 'approved' then
    if exists (select 1 from public.profiles where id = p_user_id) then
      raise exception 'This person already has an account';
    end if;
    if p_region_id is null then
      raise exception 'Say which city this account is for';
    end if;
    if not exists (select 1 from public.regions where id = p_region_id) then
      raise exception 'That is not a city PAM serves';
    end if;

    select phone into caller_phone from auth.users where id = p_user_id;

    -- The language they asked in becomes the language of the account (0085):
    -- without it an approved account opened in English whatever it was asked in,
    -- and so did the text that told them they were in.
    insert into public.profiles (
      id, role, first_name, last_name, home_city, phone,
      region_id, invited_by, access_status, preferred_language
    )
    values (
      p_user_id, request.wants_role, request.first_name, request.last_name,
      request.city, caller_phone, p_region_id, caller, 'active', request.preferred_language
    )
    returning * into new_profile;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'staff_request.approve', 'profile', p_user_id,
            jsonb_build_object('role', request.wants_role, 'region_id', p_region_id));

    -- A program lead who left their program's details gets it added directly
    -- rather than asked for again — same fields `services` (0003) always
    -- took, `needs_review` set true by its own existing trigger the moment a
    -- *_plain column is written, same as any other manual entry.
    if request.wants_role = 'provider' and request.program_name is not null then
      insert into public.services (
        name, category, subcategory, description_plain, address, phone, website,
        source, is_active
      )
      values (
        request.program_name, request.program_category, request.program_subcategory,
        request.program_description, request.program_address, request.program_phone,
        request.program_website, 'manual', true
      );

      insert into public.audit_log (actor_id, action, target_type, target_id, meta)
      values (caller, 'staff_request.program_added', 'service', p_user_id,
              jsonb_build_object('name', request.program_name));
    end if;

    insert into public.outbound_messages (member_id, template_key, vars)
    values (
      p_user_id, 'staff_request_approved',
      jsonb_build_object('link', (select value from public.app_settings where key = 'app_url'))
    );
  else
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'staff_request.deny', 'staff_request', p_user_id,
            jsonb_build_object('role', request.wants_role));

    select phone into caller_phone from auth.users where id = p_user_id;
    -- Sent with no member (there is no profile), so the language travels on the
    -- row. It was written as 'en' here until 0085.
    insert into public.outbound_messages (phone, locale, template_key, vars)
    values (
      caller_phone, request.preferred_language, 'staff_request_denied',
      jsonb_build_object('supportPhone', (select value from public.app_settings where key = 'support_phone'))
    );
  end if;

  update public.staff_requests
  set decision = p_decision, reviewed_at = now(), reviewed_by = caller,
      region_id = p_region_id
  where user_id = p_user_id
  returning * into request;

  return request;
end;
$$;

comment on function public.review_staff_request is
  'Approves or denies a staff_requests row. Approving a provider request '
  'with program details also adds the program to services (0056). The '
  'language the person asked in becomes their account''s, or the language of '
  'the text that says no (0085). Super admin only, checked inside the body.';

revoke all on function public.review_staff_request(uuid, text, uuid) from public, anon;
grant execute on function public.review_staff_request(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. A fresh invite link is mailed in the language it was asked for in

drop function if exists public.request_invite_link(text, text);

create or replace function public.request_invite_link(
  p_code     text,
  p_email    text,
  p_language text default 'en'
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  inv     public.invites;
  fresh   public.invites;
  address text := lower(trim(coalesce(p_email, '')));
begin
  if address !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(address) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;

  select * into inv from public.invites where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if inv.status in ('redeemed', 'revoked') then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if inv.expires_at >= now() and inv.status = 'pending' then
    raise exception 'INVITE_STILL_VALID';
  end if;

  -- Asked already: the same answer, and no second email.
  if exists (select 1 from public.invite_emails where expired_invite = inv.id) then
    return true;
  end if;

  update public.invites set status = 'expired' where id = inv.id and status = 'pending';

  insert into public.invites (code, created_by, role, region_id, assigned_admin_id, phone, first_name)
  values (public.generate_invite_code(), inv.created_by, inv.role, inv.region_id,
          inv.assigned_admin_id, inv.phone, inv.first_name)
  returning * into fresh;

  insert into public.invite_emails (expired_invite, new_invite, email, locale)
  values (inv.id, fresh.id, address, public.supported_language(btrim(coalesce(p_language, ''))));

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (null, 'invite.reissue', 'invite', fresh.id,
          jsonb_build_object('expired_invite', inv.id));

  return true;
end;
$$;

revoke all on function public.request_invite_link(text, text, text) from public;
grant execute on function public.request_invite_link(text, text, text) to anon, authenticated;

-- ===========================================================================
-- Check the work before keeping it
-- ===========================================================================
do $$
declare
  n int;
begin
  select count(*) into n from storage.buckets
  where id in ('message-photos', 'message-files', 'link-previews') and public = false;
  if n <> 3 then
    raise exception 'ROLLED BACK: expected three private buckets, found %', n;
  end if;

  select count(*) into n from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname in (
      'message_photos_insert_member', 'message_photos_select_seen', 'message_photos_delete_unsent',
      'message_files_insert_member', 'message_files_select_seen', 'message_files_delete_unsent'
    );
  if n <> 6 then
    raise exception 'ROLLED BACK: expected six storage policies for photos and documents, found %', n;
  end if;

  -- Nobody signed in may write a link preview.
  if has_table_privilege('authenticated', 'public.message_link_previews', 'insert')
     or has_table_privilege('anon', 'public.message_link_previews', 'select') then
    raise exception 'ROLLED BACK: message_link_previews is open to people who should not have it';
  end if;

  -- The old shapes are gone, so a call cannot be ambiguous.
  if to_regprocedure('public.request_staff_access(text,text,text,text,text,text,text,text,text,text,text)') is not null
     or to_regprocedure('public.request_invite_link(text,text)') is not null then
    raise exception 'ROLLED BACK: an old function signature is still there';
  end if;
end;
$$;

-- Record that these were applied, as the connector would have.
insert into supabase_migrations.schema_migrations (version, name)
select v.version, v.name
from (values
  ('20261009090001', '0079_message_photos'),
  ('20261009090002', '0080_message_files'),
  ('20261009090003', '0081_link_previews'),
  ('20261009090004', '0085_language_where_there_is_no_profile')
) as v(version, name)
where not exists (select 1 from supabase_migrations.schema_migrations s where s.name = v.name);

commit;

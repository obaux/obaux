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

-- 0074 — Staff add their own photo (Will, 7 October 2026: "Let's let staff
-- add images from profile. Small circle button next to avatar circle.").
--
-- Members meet a program's staff and their case manager by face (D-335), so a
-- staff account may put up a photo of itself. Members may not: a member's face
-- is theirs to keep out of Pam, and nothing in Pam shows one.
--
--   * A public bucket, `staff-photos`: the photo is shown to the members a
--     program or case manager serves, so it is read by URL without signing in,
--     like any avatar. 2 MB at most, JPEG, PNG or WebP only (the app sends a
--     512px WebP of about 40 KB).
--   * Writing is the person's own folder only — `<their id>/…` — and only for
--     a case manager, a program lead or the super admin whose account is
--     active. Nobody writes into anybody else's folder.
--   * `profiles.photo_url` was already the person's own to set (0046); the
--     app points it at the new file.
--
-- Nothing here touches `public` tables, grants or functions.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('staff-photos', 'staff-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists staff_photos_insert_own on storage.objects;
create policy staff_photos_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'staff-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.my_role() in ('admin', 'provider', 'super_admin')
    and public.my_access_status() = 'active'
  );

drop policy if exists staff_photos_select_own on storage.objects;
create policy staff_photos_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'staff-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists staff_photos_update_own on storage.objects;
create policy staff_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'staff-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'staff-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists staff_photos_delete_own on storage.objects;
create policy staff_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'staff-photos' and (storage.foldername(name))[1] = auth.uid()::text);

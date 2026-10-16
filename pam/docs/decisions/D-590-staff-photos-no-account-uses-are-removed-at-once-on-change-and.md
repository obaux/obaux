# D-590 — Staff photos no account uses are removed: at once on change, and each night

**Date:** 2026-10-16 · **Branch:** `claude/pam-staff-photo-cleanup`

## Decided

Mira asked for this on 16 October, from Lena's privacy guard (D-587). A staff photo is kept only while an account
points at it.

- **On change:** once a new photo is saved, the app removes every other file in the person's `staff-photos` folder
  (`staffPhoto.ts`, through the 0074 own-folder delete policy). If the new photo isn't saved, nothing is removed.
- **Each night, 04:35 UTC:** the Edge Function `sweep-staff-photos` keeps, in each folder, only the file the
  profile's `photo_url` points at. It removes everything else: the folder of a deleted account, the folder of
  someone who took their photo down, and an old file the phone failed to remove.

## Why a nightly function, not a trigger on account deletion

- An account is deleted by the Pam team, by deleting the profile with its auth user, when somebody asks. No app
  function or RPC does it, so there is no call to add a step to.
- A database trigger can delete the row in `storage.objects`, but not the file it describes. Only the Storage API
  removes the file. A trigger would make the photo look gone while the file stayed.
- So the database clock calls a function that uses the Storage API, the same shape as `dispatch-sms` and
  `send-invite-emails`, with the same shared secret from the vault. A deleted account's photo is gone by the next
  morning, not the same minute. Lena's Privacy line should say "within a day", not "at once".

## Safety

- A file younger than an hour is left alone. The app uploads first and points the profile at it second, so a file
  seen between the two is a photo being saved.
- The function reads every profile with a photo before it removes anything. It pages by the total the server
  reports, not by page size, because a missed page would read as "no photo" and empty a folder that is in use. If
  that read fails, it removes nothing.
- It logs counts only, never a path or an id.

## What a later session might change

- If the team wants a deleted account's photo gone the same minute, give account deletion a real function: an
  admin RPC or a small Edge Function the team calls, which removes the folder with the Storage API and then
  deletes the profile.

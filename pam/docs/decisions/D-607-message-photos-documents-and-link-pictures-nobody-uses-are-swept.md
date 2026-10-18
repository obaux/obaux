# D-607 — Message photos, documents and link pictures nobody uses are swept each night

**Date:** 2026-10-18 · **Branch:** `claude/messages-sweep-message-files`

**Decided by:** the merge desk (Mira), 18 October 2026, 07:38 UTC, on my finding while building Message Pam: "Privacy how-long.p1 is live today: 'We keep your account, and your messages, photos and documents, while you use Pam. Ask us to delete it and we will.' The database cascade doesn't reach Storage, so that promise breaks the first time someone with a photo or document deletes their account." She counted the live project: `message-photos` 0 files, `message-files` 0, so nothing was orphaned yet.

## What

An Edge Function, `sweep-message-files`, and a nightly cron (`20261018074530`, 04:50 UTC, ten minutes after the staff-photos sweep's neighbour), the same shape as `sweep-staff-photos` (D-590). In `message-photos`, `message-files` and `link-previews` it keeps only the files a message still points at (`messages.attachment_url`, `message_link_previews.image_path`) in a conversation that still exists:

1. a folder whose conversation is gone is emptied;
2. in a folder whose conversation exists, a file no message points at goes (an upload the phone lost its connection over);
3. a file younger than an hour is left alone (the app uploads first and inserts the message second).

It covers **every** conversation, not only Pam's. It needs the shared secret (`DISPATCH_SECRET`, `x-dispatch-secret`) and does nothing without it. It reads the conversations, every attachment path and every bucket listing **before** it removes anything, and it pages the database **by key** (the next page is the rows after the last one read, until an empty page), not by offset: the merge desk caught that an offset shifts when a row is added or taken away mid-read and one row is never read, which would have emptied a live folder (a conversation id missed) or removed an in-use file (an attachment path missed). Storage listings page by offset, where a missed file is only not removed, which is safe. Also: a page missed would read as "nothing points here" and empty a folder in use, so any failed, missing-count or short read stops it with nothing removed. It logs counts only, never a name, a path or an id.

## Not done here

- The function is **not deployed and the cron is not applied**: the merge desk does both. Until the function is deployed the cron's call answers 404 and nothing happens.
- Nothing is removed from a bucket that is not one of these three. `staff-photos` has its own sweep.

## Proof

`packages/config/test/sweep-message-files.test.ts` (fake database and storage): a deleted conversation's file goes, in each of the three buckets, while a live conversation's pointed-at file stays; an unpointed file in a live conversation goes; a file being sent right now stays; every row is read when the server caps a page below what was asked; **a conversation taken away between two pages does not hide a later one** (this fails on the offset version, on its assertion, which emptied a live folder); nothing runs without the secret or with a wrong one; any failed read removes nothing; the migration schedules it with the secret. `third-party-hosts.test.ts` lists the function as reaching only Pam's own database and storage.

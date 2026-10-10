# D-476 — One sender mails the first staff invite and the fresh link for an expired one

**Date:** 2026-10-10 · **Branch:** `claude/messages-expired-link-email`

The merge desk asked (for Will) that the expired-link email get a sender, under the same switch
and secrets as the staff invite email, so one email setup turns both on.

- **One function, two queues.** `send-invite-emails` now also claims the unsent rows of
  `invite_emails` (`claim_invite_link_emails`, migration `20261010133313_…`, expand only) and
  sends the wording Will approved on 4 October (`renderInviteEmail()`'s copy, shipped in
  `bundle.json` as `linkLocales`). Each kind has its own sign-off check, queue, mark-sent and
  mark-failed functions, and idempotency key (`staff-invite-<id>`, `invite-link-<id>`). A kind
  nobody has signed claims nothing; the other still goes.
- **Same rules as the staff queue:** a 15-minute lease, five tries, service role only, no address
  or code or word in any log.
- **What is worth sending:** the fresh invite is still open and the request is under **seven
  days** old. The email says the link works for 30 days, and a "here is your new link" a month
  after someone asked is worse than none. Requests made before the sender exists and inside
  those limits go out when it is first switched on. Reverse the limit by replacing the claim.
- **Roles:** a member's expired link is emailed too (the staff first-invite email never goes to
  a member; this one does, as Will wrote it with a member body).
- No new words. The two emails' layout is one function in `packages/config`; the sender's copy
  of it is tested byte for byte against it for all seven languages and all three roles.

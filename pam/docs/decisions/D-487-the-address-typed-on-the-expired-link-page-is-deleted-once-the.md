# D-487 — The address typed on the expired-link page is deleted once the link is sent

**Date:** 2026-10-10 · **Branch:** `claude/messages-member-address-deleted`

Lena found that the privacy page says "Members are never asked for an email" but the expired-link page (D-476)
does ask a member for one, and the address then stayed in `public.invite_emails` for ever and showed in the super
admin's invites log. The merge desk decided, as CTO, and Will has a card to approve the privacy wording ("…and delete
it once it is sent"): the address is deleted as soon as the fresh link is sent, since nothing needs it afterwards.

Migration `20261010151208_an_address_typed_on_the_expired_link_page_is_deleted_once_it.sql`, expand only, **no DROP**:

- **Sent → gone.** `mark_invite_link_email_sent` now replaces the address with a fixed non-address and stamps
  `address_removed_at`. The row keeps that a link was asked for, when, in what language, which invites, and when it was sent.
- **Unsendable → gone.** `purge_invite_email_addresses()` removes the address from a request older than seven days,
  one out of tries, one whose fresh link was used or ran out, and anything sent. It runs at the start of every claim and
  nightly (03:40) from pg_cron where the project has it, and once when the migration is applied.
- **The claim** never hands over a removed address.
- **The log** (`invites_log`) returns no `emailed_to` for a removed address; `reissued` is still true. The screen only
  shows an address when there is one, so it copes. Saying "sent by email" instead needs one new line of copy in
  seven languages and a change to Accounts' `InvitesLogScreen`; left for that lane.
- **Staff:** `keep_invite_email` follows the `invite_emails` chain by invite ids and reads only `invite_contact_emails`, so
  the staff member's own address is kept on the account at redeem (a test redeems after the typed copy is deleted). The
  address typed on an expired *staff* link is a second copy nothing uses, so it goes the same way: simpler and more private
  than a role test, and trivially narrowed to members by one condition if wanted.

**Why a placeholder.** `invite_emails.email` is NOT NULL and `alter column … drop not null` is a DROP, which the live
connector refuses (D-387). Not worked around: a removed address becomes `removed@removed.invalid` (a reserved domain
nobody can receive at; it satisfies the existing format check) and a check ties it to `address_removed_at`. A later migration,
pasted by Will, can make the column nullable and clear the placeholder.

Tests: `48_…` (new), and test 40 now finds the sent row by id.

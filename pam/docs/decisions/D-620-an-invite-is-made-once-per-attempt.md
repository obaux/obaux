# D-620 — An invite is made once per attempt

**Date:** 2026-10-19 · **Branch:** `claude/pam-invite-once`

**What:** making an invite carries a request id. The app makes a random id for one attempt (one set of details) and sends it
again on a retry. The database makes the invite once per (inviter, id) and hands it back on a repeat. If the same id arrives
with different details, it refuses with `INVITE_REQUEST_REUSED`. This happens through two new functions, `create_invite_once`
and `create_staff_invite_once`. `create_invite` and `create_staff_invite` stay, untouched, until they are retired in a later
migration with Will present. Migration `20261019021939`.

**Who:** found by Iris (D-618 table: "invite.create can make a duplicate on a retry"). The design was Ava's, changed by Mira
(19 October, 02:14) in three places, each recorded here because a later session could reasonably question it.

**Why:**
- **New names, not a new argument.** A new argument on `create_invite` makes a second overload. A live call with the old
  arguments would then match both and fail ("function is not unique") until the old one was dropped, and a drop on the live
  project is Will's to run (D-387).
- **The id changes when the details change.** A single id per form fill would hand the old invite back, with the old name, to
  someone who fixed a typo after a timeout. The screen keys the id on role, name, number, email and city.
- **Refuse rather than answer.** The same id with different details is a client bug; handing back an invite for somebody else
  would be worse than an error.
- **A partial unique index on (created_by, request_id) where request_id is not null.** Old invites and the old doors are
  untouched, and one inviter's id never reaches another's invite.
- **The id lives as long as the row** and is a random value with nothing personal in it. It's for Lena to classify.

**What it replaces:** nothing is removed. A timeout followed by Try again used to make a second invite, and for staff a second
email; now it gives the first one back.

**A later session might reverse:** keying the id on the details on the client side. If an inviter's form grows fields that
should not start a new attempt, key it on fewer.

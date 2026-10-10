# Program review queue: what a super admin sees (D-386)

**Status:** the table and the lead's side are built in the database (D-462,
`20261010083715_…`: `program_submissions`, `withdraw_program_submission`,
`request_program_change`); the super admin's side below (approve / ask for
changes / discard, and the screen) is part 6 and is **not built**. Will, 7 October 2026: "If user deletes and
starts over, make sure this is properly communicated in request for super
admin. Timed out Request, then let super admin discard. And approve new
program … Document this so it gets built properly."

The lead's side exists in the prototype (D-379, D-381, D-385): Add a
program → "Sent to Pam" (in review / taking longer / needs changes) → What
you sent, with **Delete and start over**. All of it runs on sessionStorage
today. This note is the other half, and what the real data has to carry so
both halves agree.

## What exists already

- `services.needs_review` (0003) — a listing that members can't see yet
  (`services` public read: `is_active and not needs_review`, 0007).
- Super admin **Requests** (`RequestsScreen.tsx`, 0054) — staff requests
  only. There is no program review list yet.
- Before-launch, Programs: "Load a program lead's own program" — Add a
  program writes a `needs_review` row instead of only showing "sent".

## One submission, one row, a status

Add a program writes one **submission** per send, not an edit in place, so
the history of what was sent survives a start-over:

| Field | Meaning |
| --- | --- |
| `id`, `service_id` | The submission, and the `needs_review` listing it creates |
| `submitted_by`, `org_id`, `region_id` | The lead, their organisation, their city |
| `details` (jsonb) | Exactly what was sent — what "What you sent" shows |
| `sent_at` | When; "taking longer" is `sent_at` + 3 days (`REVIEW_DAYS`) |
| `status` | `in_review` · `changes_asked` · `approved` · `withdrawn` · `discarded` |
| `changes_note` | Pam's note when asking for changes — what the lead's banner shows |
| `replaces_id` | The submission this one came after, when the lead started over |
| `withdrawn_at`, `reviewed_by`, `reviewed_at` | Who closed it and when |

Re-sending after "needs changes" (Edit and send again) updates the **same**
submission back to `in_review` and keeps its id: it is the same request,
fixed. Only **Delete and start over** makes a new one.

## When the lead deletes and starts over

1. The open submission becomes **`withdrawn`** (`withdrawn_at = now()`), and
   its `needs_review` listing is deactivated (`is_active = false`) so it can
   never go live by being approved late.
2. Nothing is deleted outright: the super admin still needs to see it, and
   it is the record of what was sent.
3. The lead's next send is a new submission with `replaces_id` set to the
   withdrawn one.

## What the super admin sees

A **Programs to check** section on Requests (or its own list beside it),
newest first, one card per open submission.

- **A withdrawn request** stays on the list, faded, with a status token
  **"Withdrawn — started over"** and the date. The card says, in one line:
  "{Name} deleted this and started again on {date}." It cannot be approved
  (no Approve button). One action: **Discard**, which sets `discarded` and
  removes it from the list. If the newer submission is already in, the card
  links to it ("See the new one").
- **A request that ran past three days** carries **"Waiting 4 days"** in the
  warning colour, so the oldest wait is visible at a glance — the same
  three days the lead's page uses to say "taking longer".
- **The new submission** shows **"Sent again — replaces an earlier one"**
  with a link to the withdrawn one, so the reviewer can compare, then the
  normal actions: **Approve**, **Ask for changes** (a note, required), and
  **Message the lead** (D-262).
- **Approve** sets the submission `approved`, the listing
  `needs_review = false`, and the lead's Program tab becomes their program;
  it texts them "live" if their text alerts are on. **Ask for changes** sets
  `changes_asked` with the note, which the lead sees in the amber banner.

Approving or discarding is only for super admins; each is written to the
audit log like the staff-request decisions (0054).

## Rules the database must enforce (test them)

- A lead sees and changes only their own submissions; withdrawing is theirs,
  approving/discarding/asking for changes is super admin only.
- A `withdrawn` or `discarded` submission can't be approved — refused in the
  function, not just hidden in the UI.
- A lead has at most one open (`in_review` / `changes_asked`) submission at a
  time.
- Members never see `needs_review` listings (already true, 0007) and never
  see submissions.
- `changes_note` reaches the lead only — no justice terms, reviewed copy if
  it is ever texted (SMS rules).

## Lead-side changes this unlocks

- `useProgramSetup` reads the open submission: `isUnderReview`,
  `reviewStatus` (`changes` from `changes_asked`, `late` from `sent_at`),
  `sent` from `details`, `isLive` from an approved listing. sessionStorage
  goes away.
- `startOver()` calls a `withdraw_program_submission()` RPC.
- "Text me when it's live" sends the approval text (needs a reviewed SMS
  template, `reviewedBy` filled by a person).

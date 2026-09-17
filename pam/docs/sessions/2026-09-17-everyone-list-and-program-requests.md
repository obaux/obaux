# 2026-09-17 — The Everyone list, a program's own details, and a demo view

**Phase:** 1 (member-facing product on Foundation) · **Sessions so far:** 26

## What changed

Continuation of the same multi-part request scoped across several rounds
earlier today (see `2026-09-17-deciding-a-staff-request.md` for Part 2, built
first). This session built the rest, in the order Will confirmed, plus one
mid-session addition he asked for after reading the first result.

- **The denial SMS, built after all** (`0055_staff_denied_sms.sql`). Flagged
  in the previous session as a real gap — a denial has no profile, so there
  is no safe place to hang a message inside §7.2's quiet-hours/STOP
  machinery. Will's answer: send it anyway, skip that machinery for this one
  message, and include PAM's support number so a real question has somewhere
  to go. Built exactly as asked: `outbound_messages` gained a nullable
  `member_id` plus its own `phone`/`locale` columns, and
  `claim_outbound_messages` claims a phone-only row the instant it is due,
  no quiet-hours check, no STOP check — a named, narrow exception (D-152),
  not a precedent for phone-only messages in general.
- **A program's own details, collected at sign-up** (`0056_program_submission.sql`,
  a new `/join/` step, `ProgramDetailsStep.tsx`). Manual entry only — the
  Google Maps auto-fill Will also asked for needs an Edge Function
  (`enrich-places`) that `STATUS.md` already documents as deliberately
  deferred, so this ships the front end for manual entry with a field set
  that matches `services` exactly, ready for that option to plug into later
  without reshaping the form (D-154). Approving a program lead's request now
  adds their program straight to the catalogue if they left one (D-153) —
  reusing `services`' own existing `needs_review` trigger, not a new review
  mechanism.
- **A demo view, grantable per account from the Everyone list**
  (`0057_demo_view.sql`, `useDemoView`, a `Switch` on each directory row).
  Re-scoped twice during the scoping conversation before landing here: not
  the existing session-only "Viewing as" preview (D-108), and not scoped to
  only the directory screen — a real, persisted `profiles.is_demo` column, set
  only by a super admin, that widens the app's *existing* `USE_DUMMY_PEOPLE`
  empty-state fallback to also fire regardless of whether an account's real
  data is empty (D-155). Wired into five screens that already had that
  fallback (`directory`, `admin`, `notifications`, `HeaderBell`, `PersonRow`);
  `place`, `person`, `HomePeoplePreview` and the saved-places dummy path are
  not yet — same mechanism, not yet repeated there.

## What was deliberately scoped down, and why

- **The demo view does not cover every screen.** Reaching all of them in one
  pass risked doing eleven similar edits carelessly rather than five
  carefully; the ones done are the highest-traffic (directory, the case
  manager screen, notifications) and prove the mechanism works. Documented
  as a specific, small follow-up (D-155, `STATUS.md` row 14) rather than
  claimed as finished.
- **Program submission is manual only.** Confirmed with Will directly before
  building — building a Maps auto-fill button that cannot call anything yet
  would have been a worse outcome than not building it.

## Decisions

D-152 through D-155, all in `DECISIONS.md`.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/config typecheck` | clean |
| `pnpm --filter web typecheck` | clean |
| `pnpm --filter web build` | succeeds; new `/join` program step, demo-view toggle on `/directory/` |
| `node scripts/check-bundle-budget.mjs` | 500.9 kB gz — 0.9 kB over, up from 0.7 kB before this session's changes; not chased given the size of the rest of the work, disclosed here |
| `pnpm --filter @pam/ui test` | 65 passed |
| `pnpm --filter @pam/config test` | 222 passed, 2 failed on purpose (`staff_request_approved`, `staff_request_denied` both unreviewed — §9's gate working as intended) |
| `pnpm --filter @pam/db test` | full suite passes, including new checks for `set_demo_view` (super-admin-only, shows up and clears on the directory, refuses an account that does not exist), the denial SMS queueing straight to a phone with RLS bypassed to verify it (no admin carve-out on `outbound_messages`, by design), and approving a program lead with program details adding it to `services` |
| Playwright, full suite, 3 viewport/theme projects | 426 passed, 0 failed — no regression from any of this session's three features |

## Left undone

- The demo view on `place`, `person`, `HomePeoplePreview`, and the
  saved-places dummy path (see above).
- Everything already carried from the prior session in this same request:
  Will's sign-off on both SMS templates' wording, applying migrations 0054–
  0057 to the live Supabase project, and Part 4 of the original request (a
  phone holding more than one account, invite-only) — still on hold pending
  the sign-in-resolution question raised during scoping.
- Same two larger pieces as the last several session logs: client-side
  routing for a genuinely non-reloading header, and the full
  share-places-with-people feature. Neither touched this pass.

## Needs a human

Will to read and sign off on `staff_request_denied`'s wording (the second of
the two new templates — see the previous session log for the first), and,
whenever convenient, to apply migrations 0054 through 0057 to the live
Supabase project.

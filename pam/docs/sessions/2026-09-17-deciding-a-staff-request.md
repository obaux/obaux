# 2026-09-17 — Deciding a staff request, for real

**Phase:** 1 (member-facing product on Foundation) · **Sessions so far:** 25

## What changed

Part 2 of a larger, multi-part request from Will about the super admin's
Everyone list and who gets access to what. Scoped first with the
`scope-my-instructions` skill across several rounds of back-and-forth, then
built in the order Will confirmed: this piece (the real approval workflow)
first, since the other confirmed pieces (a demo-only view toggle, a
manual-only program onboarding step) don't depend on it and a real,
multi-role account model does — that one is still on hold pending a decision
about how regular sign-in should behave when a phone has more than one
account.

`staff_requests` has recorded a claim to be a case manager or a program lead
since 0046 (14 September) and nothing has ever reviewed one — the columns for
it (`reviewed_at`, `reviewed_by`) sat empty. This session builds the missing
other half:

- **`0054_staff_review.sql`** — a `decision` column (`approved`/`denied`) and
  a `region_id` on `staff_requests`; `review_staff_request(user_id, decision,
  region_id?)`, super-admin-only, checked inside the function body (RLS does
  not cover the RPC surface — CLAUDE.md's own standing warning). Approving
  creates the real profile in the same insert shape `redeem_invite` (0049)
  already uses — phone pulled from `auth.users`, not re-typed — and queues
  `staff_request_approved` through the existing `outbound_messages` outbox.
  Denying records the decision and creates nothing.
- **A new notification kind**, `staff_request_pending`, fired by a trigger on
  `staff_requests` insert/update (same shape as 0038's existing two
  triggers), telling every super admin something is waiting — and only that;
  see the "not clickable" decision below.
- **A new screen, `/requests/`**, reached from a link on `/directory/`
  (the Everyone list). One region picker for the whole screen (matching how
  the invite card on `/directory/` already asks once), a card per pending
  request with Approve/Deny.
- **A new, unreviewed SMS template, `staff_request_approved`** — names no
  role (`"case manager"` is itself a `FORBIDDEN_SMS_TERMS` entry), ships with
  `reviewedBy: ''`. `pnpm --filter @pam/config test` is red on this until
  Will reads the exact wording and signs off; that is the gate working, and
  the fix is his word, not a code change.

## What was deliberately not built, and why

- **A "denied" SMS.** Will asked for both. Approved reuses `outbound_messages`,
  which is the one place §7.2's quiet-hours and STOP-list promises are
  actually enforced (`notification_preferences`, joined by `member_id`) — and
  an approved account has one. A denial creates no profile, so there is no
  safe place to hang a queued message without either rebuilding quiet-hours/
  STOP enforcement for a phone-only path or quietly skipping both. Flagged to
  Will directly (D-150) rather than shipped as a corner cut.
- **Notification-row actions.** `NotificationList`'s own docblock states, as
  a deliberate 16 September reversal, that a row is "a line in a log, not a
  thing with a state of its own to manage" — no row anywhere in the app is
  currently clickable. Rather than make this the first exception, the
  notification stays a plain alert and the actual decision lives on
  `/requests/` (D-148) — checked with Will as part of scoping, before
  building.

## Decisions

D-148 through D-151, all in `DECISIONS.md`. The one most likely to be
questioned later: D-150, the missing denial SMS — it is a real gap, not an
oversight, and needs its own small follow-up (most likely: `outbound_messages`
gains a nullable `member_id` plus its own `phone`/`locale` columns for the
no-profile case, with `claim_outbound_messages` updated to handle both).

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/config typecheck` | clean |
| `pnpm --filter web typecheck` | clean |
| `pnpm --filter web build` | succeeds; new `/requests` route, 499kB |
| `pnpm --filter @pam/db test` | 152+ checks pass, including 8 new ones for `review_staff_request` (super-admin-only, region required on approval, creates the real account with phone/name/city carried over, queues the approval text through the *normal* outbox — checked with RLS bypassed, since `outbound_messages` has no admin carve-out by design — denial records the decision and creates no account, an already-decided or nonexistent request is refused) |
| `pnpm --filter @pam/config test` | **red on purpose** — `staff_request_approved` is unreviewed; see D-151 |

## Left undone

Parts 1 (demo-view toggle) and 3 (manual program onboarding step) of the same
request, confirmed but not started this session. Part 4 (a phone holding more
than one account, invite-only) is on hold pending Will's answer on how
regular sign-in resolves when two accounts share a phone — flagged in the
scoping conversation, not yet a scheduled follow-up.

## Needs a human

Will to read and sign off on `staff_request_approved`'s exact wording
(`packages/config/src/sms-templates.ts`) before `pnpm --filter @pam/config
test` can go green, and before this template can ever actually send.

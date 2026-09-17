# 2026-09-17 — Messaging is staff-to-member, not peer-to-peer

**Phase:** 1 (correcting the scope of this same day's chat/messaging UI) · **Sessions so far:** 26

## What changed

Corrects the previous session's build (`docs/sessions/2026-09-17-member-to-member-messaging.md`,
commit `0698d34`). Will's direction, relayed mid-task: PAM's messaging is a
case manager or a program admin reaching a member they are actually
responsible for — never member-to-member. The earlier session scoped
eligibility to accepted mentor/buddy `connections`, which was the wrong
relationship entirely.

**Who can message whom, now:**

- A case manager (`role: 'admin'`) can message their caseload — the same
  people `/admin/`'s "Your people" screen already shows, reusing
  `useCaseload`'s exact "ask broadly, let RLS narrow" query pattern
  (`profiles where role = 'member'`, narrowed by `admin_covers()`).
- A program admin (`role: 'provider'`) can message members enrolled in a
  service under their org, via the existing `provider_linked_to()` — one
  program admin per org today, so this is deliberately an org-wide query,
  not a per-staff-row one (per Will's follow-up clarification; multi-staff
  programs are a later feature, not built toward here).
- A member sees and replies within a conversation staff already started,
  and gets no "start a conversation" affordance anywhere.

New hook `useMessageableMembers` (`apps/web/src/lib/`) replaces the deleted
`useConnectablePeople`. `useConversations` gained `otherRole` so a member's
conversation list can label a row "Case manager" or "Program" (reusing the
existing `role.*` i18n keys, no new ones needed for that). `openConversation`
dropped its `kind` parameter — always `'direct'` now, since the `'mentor'`
conversation kind belonged to the removed model.

**Two things the corrected model needed that the old one never hit, both
investigated before writing code, not discovered by a test:**

1. **No `profiles` policy let a member read a staff person's profile.**
   Every existing policy ran self, or staff-down-to-member — none ran the
   other direction. Under the old model this never mattered, because a
   member's only conversation partner was ever another member (covered by
   `profiles_select_connected`). Under the corrected model a member's *only*
   conversation partner is staff, and there was no policy for it — the
   conversation list and thread header would have shown every real
   conversation with no name attached, forever. Fixed in a new migration,
   `0054_conversation_partner_visibility.sql`
   (`profiles_select_conversation_partner`): symmetric, scoped to "you
   already share a `conversation_members` row," nothing broader.
2. **§4.1's transparency contract was written for a world where staff were
   never conversation participants.** `ADMIN_CAN_SEE` only listed chat
   metadata and flagged excerpts — both describe an admin *outside* a
   conversation. A case manager who is now genuinely inside one (because
   they started it) reads its full history, which the onboarding screen
   never disclosed. `transparency.ts` now says so: a new `ADMIN_CAN_SEE`
   entry and onboarding line ("Everything you say to them, if they message
   you directly"), and `cannotSee.messages` reworded from "What you write in
   your chats" (now flatly false for the only kind of chat that exists) to
   "What you say to someone else" (still true — a case manager who is *not*
   a participant still has no route in but a report).

Locale copy reworked throughout `messages.*`/`home.go.messages` for the
staff/member model; `messages.row.mentor`/`.row.buddy` (unused now) removed
from both `en.json` and `es.json`.

## What was wrong, and what missed it

**The whole previous session was the wrong relationship, and nothing in its
own verification caught it** — it typechecked, its tests passed, its RLS
reasoning (D-148) was honest and correct *about the relationship it chose*.
The mistake was upstream of all of that: reading A1's own text about
"program admin chat needing a gate" and inferring the gate meant
peer-to-peer connections, rather than the caseload/enrollment relationship
A1 was actually describing. Nothing in the codebase would have caught this
by itself; it needed Will's correction. Worth naming plainly for whoever
reads this next: verification proves a build does what it was told to do,
not that it was told the right thing.

**Two Playwright specs broke from the transparency-copy change, one of them
in a way that needed a real fix, not just a tolerant assertion.**
`e2e/join.spec.ts` asserted the literal old string "What you write in your
chats" on the sign-up screen — a direct, correct catch of a content change,
fixed by updating the assertion to the new wording. This is the right kind
of test failure: it exists specifically so a transparency-contract edit
cannot ship silently, and it did its job.

## Decisions

- **D-152** (supersedes D-148, extends D-150) — the corrected staff-to-member
  eligibility model, reusing `admin_covers()`/`provider_linked_to()` rather
  than inventing a new relationship, and the RLS gap this still leaves open
  (nothing at the database layer stops a case manager or program admin
  starting a conversation outside their caseload/org, or a member starting
  one at all) — flagged in full, with what a follow-up migration should
  check.
- **D-153** — the new `profiles_select_conversation_partner` policy (0054)
  and why it was necessary for the feature to function at all, plus the
  §4.1 transparency contract change and its reasoning. Also notes that
  `admin_visibility.test.ts`, referenced by `transparency.ts`'s own file
  comment as the thing that keeps `ADMIN_CAN_SEE` honest against real RLS,
  does not exist anywhere in this repository — flagged, not silently
  trusted or quietly built.
- **D-149, D-150, D-151** — D-149 unaffected (a fact about the schema, not
  the relationship model); D-150's "not previewable" reasoning extended from
  member-only to all three eligible roles; D-151's bundle numbers updated
  (500.8 kB → 501.0 kB gz) for this correction's additional copy.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 packages clean |
| `pnpm --filter @pam/config test` | 211 passed — same count as before the correction; two keys removed (`messages.row.mentor`/`.buddy`), several added, transparency-screen assertions (word-for-word `en.json` match, en/es key parity, dignity-language) all still pass |
| `pnpm --filter @pam/ui test` | 65 passed, unchanged |
| `pnpm --filter @pam/web build` | succeeds, static export |
| `node scripts/check-bundle-budget.mjs` | 501.0 kB gz — over budget by 1.0 kB (was 0.8 kB before this correction; see D-151's update) |
| Playwright, full suite, all 3 viewport/theme projects (`PLAYWRIGHT_CHROMIUM_PATH` as in the previous session) — first run caught the stale `join.spec.ts` assertion (3 failures, 423 passed), fixed, re-run | 426 passed, 0 failed |
| `pnpm --filter @pam/db test` | **not run** — this sandbox is missing the `postgis` extension, same limitation as the previous session. `0054`'s new policy is therefore unverified against the RLS penetration suite; flagged in DECISIONS.md D-153 and STATUS.md row 13 |

## Left undone

- **D-152's RLS gap.** The database still does not enforce "a case manager
  may only start a conversation with their own caseload" or "a program admin
  only with their own org's enrolled members" — that is `useMessageableMembers`'s
  own restraint, client-side. Exactly what a follow-up migration should
  check is written out in D-152.
- **`profiles_select_conversation_partner` (0054) needs the real `@pam/db`
  test suite**, not just careful reading, before it should be trusted
  against the live project.
- **`profiles.phone` column-level exposure.** The new policy grants row-level
  access to the whole `profiles` row, including `phone`, to a conversation
  partner. Nothing selects it today; a column-level `REVOKE`, matching this
  repo's own `bidder_contact` pattern elsewhere, would close the residual gap
  and was left for a follow-up rather than done same-day.
- **No message-reporting UI**, same gap the previous session already flagged
  and still true here — `report_message()` (0034) has no caller anywhere in
  `apps/web`.
- **Icon duplication on Home for staff.** A case manager or program admin now
  sees `PeopleIcon` twice on their Home screen (their caseload/interested
  tile, and the new Messages tile) — a small, accepted cosmetic cost, not
  fixed this session (see D-151's addendum).

## Needs a human

- **D-152, explicitly**: same question the previous session asked about
  D-148, now sharper — is shipping the UI now, with the database-layer gap
  fully documented, an acceptable interim state given the parties involved
  are staff accounts with real caseload/enrollment access, not peers?
- **`0054`'s policy needs to run through `pnpm --filter @pam/db test`** on a
  machine with `postgis` before this is trusted against the live project.
- **Whether `profiles.phone` should be column-restricted** for conversation
  partners specifically (D-153) — a real but currently-unexploited exposure,
  Will's call on priority.

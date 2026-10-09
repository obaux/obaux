# 2026-10-09 — two promises that contradicted other copy

**Phase:** Phase 1 (member-facing product), pre-launch · **Sessions so far:** many

## What changed

Two translators, translating Pam into Chinese, found two English promises that
contradict other copy. This session checked the code and the live database for
what actually happens, put the evidence to Will, and acted on the one he
decided.

- **Points — fixed (D-412).** `points.intro` said nobody else sees a member's
  points. The contract, the screens, the RLS and the tests all say the case
  manager does. Will confirmed: "Case manager can see awards, badges, and
  points from members." English and Spanish now say the person who invited you
  can see them and programs and other members cannot. `docs/points-awarding.md`
  matches. No behaviour or contract change.
- **Messages — the promise changed (D-413).** `terms.s.limits.p2` ("Messages
  are never turned off") was true of the per-feature switch only (0031, A6: a
  trigger refuses a `chat` row; live). It was false of account status:
  `is_active_account()` gates `messages_insert_sender` and
  `open_direct_conversation()` (live), so a `limited` account can read but not
  send or start a message, and a `suspended` one cannot sign in
  (`useSession.ts`). Will first asked for the problem to be explained, then
  chose to change the promise rather than the code (the alternatives were:
  limited accounts keep messaging; only the Pam team can turn sending off).
  The terms now say what happens; A6 is clarified; `before-launch.md` says
  members are told first. `feature.chat` is an unreachable label, left alone.
- **Badges named (D-413).** Will's answer included badges; the member's line
  now says "Your points, your level and your badges", and the privacy page and
  the case manager's "What you can see" were kept in step with it.

- **Telling members (D-414).** Will: "We can tell members this in privacy
  policy." The privacy policy has a new section, "When we limit an account"
  (en + es); both documents are dated 9 October. Will also answered who may
  limit someone ("any Case manager with that person in their list" — what the
  code already does) and to keep `terms.s.limits.p3`.

- **Who may limit someone — and read points and badges (D-415).** Will had
  meant only people *assigned* to a case manager, not "in their list" as the
  app shows it. `admin_covers()` lost its same-city arm: migration
  `0082_admin_reaches_assigned_only.sql`, SOP amendment A22, a new DB test file
  (`17_assigned_only_test.sql`), and one changed assertion in
  `02_rls_test.sql`. **Applied to the live project later the same day (Will, D-420).**
- **Member copy (D-415).** Will: add "or a staff responsible to guiding you"
  to describe the case manager. Eleven strings now read "the person who
  invited you, or a staff member responsible for guiding you" (en + es,
  `transparency.ts`, `notices.ts`); the invite-code strings, which are about
  the inviter literally, did not change.
- **The language files.** Will asked whether he needed to supply them. They
  are not on any branch. A running session on `claude/gallant-clarke-0dhizj`
  (title "Restore missing Spanish accents in Pam es.json", last summary "text-fit
  audit: fixing About tabs and long Russian title") appears to hold them;
  nothing from it is pushed, so they cannot be read from here.

- **Reading experience (D-416, D-417).** Will asked for ways to make the long
  screens easier for someone who knows nothing, then: "Short word is good, skip
  listen button … do one with icons and other without." Built both. After seeing
  them he chose icons and reshaped the screens (D-417): Profile › What others can
  see is the guide + short version + a link to the full policy + the two data
  actions (no "Your data" heading); the sign-up step keeps the full list (SOP
  §4.1); privacy and terms are flat, with Explore-style chips, an icon beside each
  heading, and one copy icon top right (tooltip, tick for 5 seconds). The plain
  look and its code were deleted.

- **The remaining items (D-427).** Will: "resolve the remaining. Yes use Your guide
  for short." (1) "Your guide" is the short word: the long phrase now appears only
  where it defines the word; Help, the three report screens and the paused /
  turned-off / limited notices say "your guide" (eight strings, en + es,
  `notices.ts`). (2) `terms.s.limits.p3` is true: a limited account sees the
  `account_limited` notice on Messages (in place of New message) and where the
  composer was in a conversation, and a refused send no longer says "Your
  connection dropped" — `useThread.send` asks once whether the account is limited
  (`lib/accountLimited.ts`). `Session` gained `accessStatus`. (3) The first-load
  budget check ran. (4) The translation session was sent the eight changed keys.

- **After the merge (D-429).** Will's answers to what was left: the big branch
  "go for it", privacy updates by email going forward, he will ask the other
  session about the native read, the assign-and-limit build in a new session
  (handoff in STATUS's Backlog), delete the unused key, make a refused New
  message say the account is limited, update the flow map. Done: the last four and
  the handoff. **Not merged: the big branch.** The ledger shows 0079–0081 live
  (the other session applied them, D-428) so the hold Will set is met; but the
  branch also publishes five machine-translated languages, privacy page, terms
  and transparency screen included, which its own record says no native speaker
  has read, and Will's answer on that is still to come. Privacy-by-email is not
  yet possible: Pam holds no member email address (D-429). The flow map: `flows.mjs` gained Limited
  Messages, Limited chat and Report a message (and three edges); the Figma page
  `1 · Member` of "PAM — User flows" was redrawn from it (25 screens, 28 arrows,
  checked in a Figma screenshot). Left as it was: the `0 · Overview` page (a
  one-flow run would have replaced all five columns with one; it needs a full run
  of every flow) and the screenshots in the slots (mcp.figma.com is blocked here,
  D-264). The "Open in Storybook" links on the three new cards use the old
  `claude-pam-storybook` Chromatic address in `STORYBOOK_URL`, which does not have
  these stories; change it when this branch's Storybook has an address.

- **Will's note on the limited screen (D-430).** "Your plan" made no sense; the
  notice now starts "You cannot send messages right now", says why, then Pam, in a
  calm card (`Notice quiet`: more padding, 16px text, the call as a link). All seven
  languages reworded (five are Claude's drafts). Merged `main` (the languages branch,
  D-422–D-428) into this branch first; the full browser suite passes on the merged
  tree (834), and the messages spec after this change (165).

## What was wrong, and what missed it

**A test hardcoded a count and broke without anyone seeing.** `e2e/legal.spec.ts`
asserted exactly eight contents entries. D-414 added a ninth privacy section
("When we limit an account") and only the config and database suites were run, so
the browser suite went red unnoticed until it was run for D-417 (three viewports
failed, 111 passed). Nothing in CI runs it per change here (STATUS: the web app's
suites are not in CI). Fixed by counting each document's sections from
`@pam/config`; the lesson is the one the file already states — a fixed number
in a test is a promise nobody re-reads.

Nothing in the code was wrong in the first two contradictions; the *copy* made
promises the rest of the system did not. Neither contradiction could be caught by a test: `copy.test.ts` keeps
the transparency screen identical to its contract and the locales key-for-key,
but nothing reads a sentence in `points.*` or `terms.*` against RLS. They
survived because each sentence was written in isolation, in the right spirit,
at a different time (A6 on 12 September, the points screen later). The
translators saw it because translation forces every sentence to be read slowly
and side by side.

**`notice.account_limited.body` said the opposite of the terms we had just
written.** Found while wiring p3: it read "Messages and new people are off for
now", and D-413's terms say a limited account can *read* messages. It existed since
before this session and nothing rendered it, so nothing showed the contradiction.
Rewritten (en + es) to what the database does. The check that would have caught it
is the same one that caught the first two: reading every sentence a member can meet
about one thing, side by side — a translator's habit, not a test's.

## Decisions

- D-412 — points: the Points screen says who can see them.
- D-413 — messages: the terms say a limited account cannot send and a paused
  one cannot sign in; badges named on the member's transparency line.
- D-414 — members are told in the privacy policy; p3 kept. (Its reading of
  "in their list" was corrected the same day by D-415.)
- D-415 — a case manager reaches only the people assigned to them (0082,
  A22); member copy adds "or a staff member responsible for guiding you".
- D-416 — "your guide", a short version, groups and a copy icon on the long
  screens, in two looks for Will to choose.
- D-417 — Will's choices: icons; a short Profile screen; a flat policy with one
  copy icon (tooltip, tick, 5 seconds).
- D-427 — "your guide" for short; a limited account is told it is off and who to
  call (p3 kept and built).

## Verified

| Check | Result |
|---|---|
| Live project `shobqzuhicoiymtumiaz`, read-only: `messages_insert_sender` | Requires `is_active_account()`, `my_feature_allowed('chat')`, no block |
| Live: `access_controls_reject_chat` trigger | Present (0031) |
| Live: `open_direct_conversation` body | Contains `is_active_account` |
| Live: `points_ledger` / `member_badges` policies | Own, `admin_covers`; badges also buddies; no program policy |
| Live: accounts | 1 super admin, 2 members; 0 case managers; 0 active assignments |
| Live: `admin_covers()` | Had the city arm before 0082; after applying it (D-420) it reads `admin_assignments` only, no region, still security definer with `search_path = public, extensions`, grants unchanged |
| `pnpm --filter @pam/db test`, baseline before 0082 | 420 checks, 0 failures |
| `pnpm --filter @pam/db test`, with 0082 | **440 checks, 0 failures** |
| Same suite with 0082 moved aside | Fails at `17_assigned_only_test.sql` ("Dana cannot read Tanya…"), so the tests bite |
| `pnpm --filter @pam/config test` | 242 pass (4 new for the grouping) |
| `pnpm --filter @pam/ui test` | 79 pass (was 81 until D-417 deleted the plain look and its two tests) |
| `pnpm --filter @pam/web build-storybook` | builds; the three screens in both looks and the "Copied" state photographed at 390px |
| Copy button size in the browser | 48 × 48 px |
| `pnpm -r typecheck` | 5/5 packages clean |
| Playwright `legal`, `join`, `a11y` specs (fresh build; 320px light and dark, iPhone SE; axe incl. contrast and target size) | pass, after one fix (the hardcoded section count above): 39 legal tests pass, join and a11y pass |
| Playwright, **full suite**, fresh build with the 16px body (D-418) | **588 passed, 0 failed** (light and dark 320px, iPhone SE) |
| `node scripts/check-bundle-budget.mjs` after D-427, on a fresh Next build | **556.4 kB** of 600 kB gzipped, 43.6 kB to spare |
| Playwright `messages.spec.ts`, with four new tests (limited list; limited conversation; a send refused with 42501 for an account that was active at load; a 500 for an account that is not limited) | 72 pass at three viewports; the two send tests give opposite answers to the same failing POST, differing only in `access_status`, so the refused-send test does discriminate |
| Playwright, **full suite**, fresh build (D-427) | **600 passed, 0 failed** (6.5 minutes) |
| `pnpm -r typecheck`, `pnpm --filter @pam/config test` (242), `pnpm --filter @pam/ui test` (79), `pnpm --filter @pam/web test` (18) after D-427 | clean / pass |
| Storybook, rebuilt twice; limited Messages, limited conversation (en, es), Help, the report-a-message screen, the three notices photographed at 390px | The first photograph of limited Messages showed the notice under the list, inside the 96px fade above the floating strip and tab bar (`edgeFade`): its call button and left edge were washed out. It moved to under the title; the second photograph is clean |

## Left undone

- ~~The privacy section's wording and the four short-version lines are Claude's
  draft~~ — Will read and approved both on 9 October (D-427).
- The New message picker's own failure line ("Your connection dropped") is
  reachable only by an account limited *after* Messages loaded. Not changed (D-427).
- The app has no button that limits anyone (nothing calls
  `admin_set_access_status`), and no screen to assign a case manager to a member
  (STATUS backlog); since 0082 a member with none is read by no case manager.
- Nothing re-shows the privacy policy or the transparency screen to an account
  that already agreed; `transparency_ack_at` is set once.
- The other five languages are now on `claude/gallant-clarke-0dhizj` (it merged
  `main` at 932d052 and translated D-412–D-415's strings). The eight strings
  D-427 changed were sent to that session; expect conflicts in `es.json` and
  `en.json` on those lines, and renumber when the branches meet (`docs/allocations.md`
  says D-427 is next; this entry first took D-426 and was renumbered D-427 when
  that branch pushed its own D-426 — the collision `allocations.md` exists to catch,
  found here by a message from that session rather than by a test).
  Native review of the new languages is open on their side.
- `claude/pam-storybook` (D-411) is not merged and is behind `main`.

## Needs a human

- Nothing from this session. Will said "Yes, merge" for this follow-up (done) and "Leave big branch held for now" for `claude/gallant-clarke-0dhizj`. The next build, when Will wants it, is the screen to assign a case manager and a limit / pause button: nothing in the app calls `admin_set_access_status`.

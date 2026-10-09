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
  `02_rls_test.sql`. **Written and tested, not applied to the live project.**
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

## What was wrong, and what missed it

Nothing in the code was wrong; the *copy* made promises the rest of the system
did not. Neither contradiction could be caught by a test: `copy.test.ts` keeps
the transparency screen identical to its contract and the locales key-for-key,
but nothing reads a sentence in `points.*` or `terms.*` against RLS. They
survived because each sentence was written in isolation, in the right spirit,
at a different time (A6 on 12 September, the points screen later). The
translators saw it because translation forces every sentence to be read slowly
and side by side.

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

## Verified

| Check | Result |
|---|---|
| Live project `shobqzuhicoiymtumiaz`, read-only: `messages_insert_sender` | Requires `is_active_account()`, `my_feature_allowed('chat')`, no block |
| Live: `access_controls_reject_chat` trigger | Present (0031) |
| Live: `open_direct_conversation` body | Contains `is_active_account` |
| Live: `points_ledger` / `member_badges` policies | Own, `admin_covers`; badges also buddies; no program policy |
| Live: accounts | 1 super admin, 2 members; 0 case managers; 0 active assignments |
| Live: `admin_covers()` | Still has the city arm (0082 not applied) |
| `pnpm --filter @pam/db test`, baseline before 0082 | 420 checks, 0 failures |
| `pnpm --filter @pam/db test`, with 0082 | **440 checks, 0 failures** |
| Same suite with 0082 moved aside | Fails at `17_assigned_only_test.sql` ("Dana cannot read Tanya…"), so the tests bite |
| `pnpm --filter @pam/config test` | 242 pass (4 new for the grouping) |
| `pnpm --filter @pam/ui test` | 81 pass (7 new: copy status, live region, axe in both looks) |
| `pnpm --filter @pam/web build-storybook` | builds; the three screens in both looks and the "Copied" state photographed at 390px |
| Copy button size in the browser | 48 × 48 px |
| `pnpm -r typecheck` | 5/5 packages clean |
| Not run | The Playwright a11y suite (real routes: contrast, target size) and the first-load budget check, after D-416 |

## Left undone

- `terms.s.limits.p3` is unkept for a limited account: nothing shows
  `account_limited`, and a refused send says "Your connection dropped"
  (`messages.thread.failed.body`). Will: keep it. On `docs/before-launch.md`
  as its own item; not built.
- The privacy section's wording ("A person who has you on their list in Pam
  can limit or pause…") is Claude's draft of Will's decision; he should read it.
- `0082` is not applied to the live project (`docs/before-launch.md`).
  `list_migrations` first. It numbers 0082 because both unmerged branches use
  0079–0081.
- There is no way to assign a case manager to a member (STATUS backlog), and
  since 0082 a member with none is read by no case manager.
- D-416/D-417: Will to read the short-version wording (STATUS row 34); the long
  phrase remains in Help, the report screens and two notices.
- The Playwright a11y suite and the first-load budget check were not run after
  D-416.
- Nothing re-shows the privacy policy or the transparency screen to an account
  that already agreed; `transparency_ack_at` is set once.
- pt-BR, zh-CN, zh-HK, ru, ar are on no branch of this repository (checked on
  every remote branch, including `claude/gallant-clarke-0dhizj`). Every string
  changed this session (D-412–D-415) must change in each when they land.
- This branch is at `main` (D-388); `claude/pam-storybook` (D-411) and
  `claude/gallant-clarke-0dhizj` (D-403) are far ahead and both edit
  `es.json`; expect conflicts on the strings changed here, and renumber the
  changelog heading ("Unreleased") when merging.

## Needs a human

- Will: apply `0082` (or ask for it to be applied); read the new privacy
  section; get the translations pushed from the `gallant-clarke` session.

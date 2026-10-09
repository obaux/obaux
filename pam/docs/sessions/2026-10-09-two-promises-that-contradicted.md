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
- D-414 — members are told in the privacy policy; any case manager with the
  person in their list may limit them (unchanged); p3 kept.

## Verified

| Check | Result |
|---|---|
| Live project `shobqzuhicoiymtumiaz`, read-only: `messages_insert_sender` | Requires `is_active_account()`, `my_feature_allowed('chat')`, no block |
| Live: `access_controls_reject_chat` trigger | Present (0031) |
| Live: `open_direct_conversation` body | Contains `is_active_account` |
| Live: `points_ledger` policies | `select_own`, `select_admin` (`admin_covers`) only |
| Live: profiles by `access_status` | 3, all `active`; no `access_controls` rows |
| `pnpm --filter @pam/config test` | 238 pass (after the privacy section too) |
| `pnpm -r typecheck` | 5/5 packages clean |

## Left undone

- `terms.s.limits.p3` is unkept for a limited account: nothing shows
  `account_limited`, and a refused send says "Your connection dropped"
  (`messages.thread.failed.body`). Will: keep it. On `docs/before-launch.md`
  as its own item; not built.
- The privacy section's wording ("A person who has you on their list in Pam
  can limit or pause…") is Claude's draft of Will's decision; he should read it.
- If Will meant only people *assigned* to a case manager (no region arm),
  `admin_covers()` has to change, which also narrows points and badges. Read
  as "what the case manager's list already shows"; unchanged.
- Nothing re-shows the privacy policy or the transparency screen to an account
  that already agreed; `transparency_ack_at` is set once.
- pt-BR, zh-CN, zh-HK, ru, ar are on no branch of this repository (checked on
  every remote branch, including `claude/gallant-clarke-0dhizj`). The six
  strings listed in STATUS row 32 must change in each when they land.
- This branch is at `main` (D-388); `claude/pam-storybook` (D-411) and
  `claude/gallant-clarke-0dhizj` (D-403) are far ahead and both edit
  `es.json`; expect conflicts on the strings changed here, and renumber the
  changelog heading ("Unreleased") when merging.

## Needs a human

- Will: read the new privacy section; say where the five language bundles are.

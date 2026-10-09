# 2026-10-09 — two promises that contradicted other copy (points fixed, messages open)

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
- **Messages — open.** `terms.s.limits.p2` ("Messages are never turned off")
  is true of the per-feature switch only (0031, A6: a trigger refuses a `chat`
  row; live). It is false of account status: `is_active_account()` gates
  `messages_insert_sender` and `open_direct_conversation()` (live), so a
  `limited` account can read but not send or start a message, and a
  `suspended` one cannot sign in (`useSession.ts`). `feature.chat` is an
  unreachable label (the database cannot hold that row). Nothing was changed;
  Will asked for the problem to be explained more. See STATUS row 32.

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

- D-412 — points: the Points screen says who can see them; badges, the region
  arm and the missing language bundles left open for Will.

## Verified

| Check | Result |
|---|---|
| Live project `shobqzuhicoiymtumiaz`, read-only: `messages_insert_sender` | Requires `is_active_account()`, `my_feature_allowed('chat')`, no block |
| Live: `access_controls_reject_chat` trigger | Present (0031) |
| Live: `open_direct_conversation` body | Contains `is_active_account` |
| Live: `points_ledger` policies | `select_own`, `select_admin` (`admin_covers`) only |
| Live: profiles by `access_status` | 3, all `active`; no `access_controls` rows |
| `pnpm --filter @pam/config test` | 238 pass |
| `pnpm -r typecheck` | 5/5 packages clean |

## Left undone

- Messages: Will's choice between changing the code (limited accounts keep
  messaging) and changing the promise (members told first). Then the English
  strings, `es`, and — if the contract moves — `transparency.ts`.
- The member-facing line names "points and your level" but the case manager
  can also read badges (`member_badges_select_admin`): Will's word needed.
- pt-BR, zh-CN, zh-HK, ru, ar are on no branch of this repository (checked on
  every remote branch, including `claude/gallant-clarke-0dhizj`); the same
  strings must change in each when they land.
- This branch is at `main` (D-388); `claude/pam-storybook` (D-411) and
  `claude/gallant-clarke-0dhizj` (D-403) are far ahead and both edit
  `es.json`; expect a merge conflict on the strings changed here.

## Needs a human

- Will: the messages decision (STATUS row 32), and whether badges belong on
  the member's transparency line.

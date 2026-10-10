# 2026-10-10 — Accounts & invites: assigning a guide, and limiting or pausing from a screen

**Branch:** `claude/pam-assign-and-limit` · **Lane:** Accounts & invites (`docs/lanes.md`)

Continues `2026-10-09-two-promises-that-contradicted.md` (the limited-account notice,
D-427, and 0082, D-415). Will, 9 October: "Next build (the one that matters): Assign a
case manager and limit or pause a member. Until this exists, the limits feature and the
notice I just shipped never fire. A member with no assigned case manager is also seen by
nobody." Shown the plan and six questions on 10 October: "You decide." Also: "LEt's
create a rule that you perform this on every Chat session other than PAM Agent 1: Read
the Pam record … before claiming numbers and drafting the plan", and "Remember your
onboarding instructions, and any merges will be done in the Merge desk session."

## What changed

1. **The rule** in `CLAUDE.md` ("Start every session by reading the record"): every
   session but PAM Agent 1 reads STATUS, the newest session log and the decisions its
   task touches before it claims a number or drafts a plan. It now points at
   `pnpm claim`, which replaced the allocations table while this session waited.
2. **Database, two migrations, not applied** (D-446):
   `20261010034711_guides_are_assigned_and_handed_over_through_functions.sql` (expand:
   `assign_guide`, `hand_over_member`, `guides_i_can_choose`, `directory_guides`, and
   the internal `set_guide_internal`, all checking the caller inside, all writing
   `audit_log`) and `20261010034713_case_managers_no_longer_write_assignments_directly.sql`
   (contract: closes the gap below).
3. **Case manager screens.** A member's page has **Limit or pause** (with the current
   state, "On", "Limited" or "Paused") and **Hand over to another case manager**. Both
   are new nested screens (`/person/access/`, `/person/handover/`) with a confirm
   dialog (D-411) and a done state. An example person is never written, and the screen
   says so.
4. **Super admin screens.** Everyone shows "Guide: {name}" or "No guide" on each
   member's row, a new filter **Members with no guide**, and a member's row opens
   **{name}'s guide** (`/directory/guide/`): a case manager, themselves, or No guide.
5. **Strings:** 62 new keys in all seven languages; see "New strings" below.
6. **Storybook:** *Case manager / Screens*: Limit or pause a member (example and
   caseload), Hand a member over; *Super admin / Screens*: A member's guide, A member
   with no guide. Routes in the prototype; fixtures for the five new calls; a fourth
   person (Tanya, no guide) on the Everyone fixture.
7. **The flow map:** `docs/user-flows/flows.mjs`, regenerated, and Figma pages
   *3 · Case manager* (A member → Limit or pause, Hand over) and *5 · Super admin*
   (Everyone → A member's guide) redrawn and checked
   (https://www.figma.com/design/DtlJg9Klx5BRfHbXBhkg98). A "Hand over → Home" arrow
   was dropped after the first render: it looped up the page onto the title. Both
   pages were drawn again after merging `main`, whose session had redrawn the super
   admin page for D-444, so each now shows both sessions' changes.

## What was wrong, and what missed it

- **Any case manager could assign themselves any unassigned member, straight from the
  client.** `admin_assignments_admin` (0007) was `for all` with a check only on
  `admin_id`, and no grant was ever revoked. Since 0082 that row is all that stands
  between a case manager and a member's profile, points, badges and the power to limit
  them. Nothing tested it: every test wrote assignments as the owner. Found while
  planning, by reading the policy. The new test fails without the contract migration
  (run: "Dana cannot assign herself the unassigned Hana with an insert — the statement
  was allowed").
- **My first test counted the picker's rows** and broke on a case manager another test
  file had left in the same city (Erin, `17_…`). Now it names who must and must not be
  listed.
- **Radio rows were too close.** A name with no description made a 24px row, and two
  of them sat 32px apart, so their 48px invisible inputs overlapped. The e2e target
  check measures each control alone and would not have caught it; found by measuring
  the Storybook page. Name-only rows are now 48px; every pair is at least 52px apart.
- **Two claims in my own records were wrong before I checked:** that `start_membership`
  writes assignments (only `redeem_invite` does), and that the limited notice says
  "meet new people" (it was reworded on `main`; the staff screens now match it).
- **A claim I could not push.** Before `pnpm claim` existed, this session tried to push
  its number claim to `claude/gallant-clarke-0dhizj` (another session's branch) and was
  refused by the permission check. Nothing was pushed there; the numbers are claimed as
  files on this branch now.

- **Merging `main` brought D-435's rule** (`tPlain` for an accessible name, so Arabic's
  isolates do not ride inside it). Two back buttons carrying a name moved to `tPlain`;
  found by reading the new `CLAUDE.md` line after the merge, not by the audit (whose
  run came after the fix).
- **Merge conflicts** in STATUS, the case-manager stories, the flow map and
  `ledger.json`: all were additions side by side; both kept. The ledger was taken from
  `main` and this branch's keys re-recorded with `copy:ack`, not edited by hand.

## Decisions made

- D-446 — the build, and the six answers to "You decide": case managers do not see the
  unassigned; the Pam team gains no power to limit (assign to yourself first); the super
  admin sees who guides whom; members are not notified of a new guide (yet); the reason
  stays staff-only; "Fold into the next build" still unresolved.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/db test` | **682 checks, 0 failures** (639 before the merge of main; `23_assign_and_limit_test.sql` new) |
| Same suite with the contract migration moved aside | Fails at "Dana cannot assign herself the unassigned Hana with an insert" |
| Live, read-only: `postgres` role | `rolbypassrls = true`, owns `admin_assignments` and the functions, so the definer functions still write after the contract step |
| `pnpm --filter @pam/config test` | 719 pass (numbering, copy parity, ledger) |
| `pnpm --filter @pam/config copy:status` | All languages in step (after `copy:ack`) |
| `pnpm -r typecheck` | 5/5 clean |
| `pnpm --filter @pam/ui test` / `@pam/web test` | 79 / 48 pass |
| `pnpm --filter @pam/web build`, bundle budget | builds; 54.4 kB under the 600 kB budget |
| `pnpm --filter @pam/web build-storybook` | builds; the new stories photographed at 390px; no `[journey] no fixture` |
| Playwright `e2e/assign-and-limit.spec.ts` (new) | 39 pass (13 tests × 320 light, 320 dark, iPhone SE): the filter asks for members and keeps the unguided; `assign_guide` gets exactly `{p_member, p_guide}` (and `null` for No guide); nothing is written before the dialog; Save waits for a change and a non-blank reason; the dialog opens on its question; axe clean on all three screens |
| Playwright, **full suite**, fresh build | **876 passed, 0 failed** (8.3 minutes) |
| **After merging `main`** (`d4f325e`: the languages and Arabic branches): DB / config / ui / web unit | 682 checks / 808 / 107 / 48 pass; typecheck clean; bundle 55.9 kB under budget; Storybook builds |
| Playwright, **full suite, after merging `main`**, fresh build | **900 passed, 0 failed** (8.6 minutes) |
| `audit:fit` on `screens--member` (11 stories) and `super-admin-screens--everyone`, all seven languages at 320px | 0 new defects; 9 already in English (ellipsis and clamp on the member page's trip cards), none from these screens |

## New strings (for the languages lane)

62 keys, all new (none reworded), in all seven bundles: `access.*` (35, minus
`access.limitedNotice`, which is older and unchanged), `handover.*` (10),
`assignGuide.*` (16), `directory.filter.unassigned`. English and Spanish are this
session's; **pt-BR, zh-CN, zh-HK, ru and ar are this session's drafts and need a native
reader** (`copy-changes.md` step 3). Vocabulary was matched to each bundle: ru "куратор"
(guide) and "кейс-менеджер" (case manager); es "gestor de casos"; zh-HK 您. The
translation session was not messaged (no tool here reaches it); this list is the
hand-off.

## Left undone

- **Not applied, not merged.** The two migrations need Will's word and the merge desk.
  They can go in either order with the app: no released app writes `admin_assignments`,
  and the new screens only call functions the expand step adds.
- **"Fold into the next build, no separate action"**: what it referred to is still
  unknown.
- **A member is not told when their guide changes.** Every sentence they read stays true
  ("your guide" is whoever is assigned), but nothing says "your guide is now Dana".
- **The super admin's example "A person" page** (`/person/?id=dummy-…`) has no guide
  row; the real path is Everyone → a member.
- **Members with no guide, over the example people**: with no real accounts the filter
  shows every example member (they have no guides). Fine for a look, not a statement.

## Needs a human

- **Apply the two migrations** (merge desk, `list_migrations` first). Until then the new
  screens fail politely ("That did not save") against the live project, and the
  assignments gap stays open there.
- **Native review** of the five drafted languages for the 62 keys.
- **What "Fold into the next build" meant.**

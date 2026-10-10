# Lanes — three sessions at once, without stepping on each other

Will regularly runs two or three sessions on PAM. Almost none of the trouble that
caused came from two sessions editing the same *code*. It came from the places
every session writes to at the end — the records, the numbers, the live
database — and from branches that stayed open for days. This page is the system
that removes those, written 10 October 2026 after five decision-number
collisions in two days, one order-sensitive deploy and a 19-commit branch.

The short version:

1. **One session per lane.** A lane is a topic with its own part of the code.
2. **Short branches.** One job, merged within a day or two.
3. **Numbers are files.** `pnpm claim` takes the next one after looking at every
   pushed branch.
4. **Records are files.** A decision, a changelog entry, a session log: each is
   its own file, so two branches never edit the same lines.
5. **Database changes go in two steps.** Add, switch the app, remove later — so
   a migration and the app never have to ship in the same minute.
6. **One merge desk.** Merging to main, applying to the live project and cutting
   a release are done by one session, in the order Will says.
7. **Everyone reports to the merge desk.** STARTED, QUESTION, BLOCKED, FINDING,
   MIGRATION, READY, DONE — how and when is in `docs/team.md`.

## The lanes

| Lane | It covers | Where it lives |
|---|---|---|
| **Accounts & invites** | Sign-in and joining; invites and their emails; roles and staff; caseloads, assigning a case manager, limiting or pausing a member; deleting an account and the audit log | `app/{signin,join,invite,invites,account,admin,requests,directory,person,connections,use-as,view-as}`, `screens/Invite*`, `lib/useCaseload.ts`, `lib/useSession.ts`; `identity`, `invites`, `profiles`, `audit_log` in the database |
| **Messages & notifications** | Conversations, photos, documents, link previews, message translation; the bell, texts and emails going out; blocking and reporting | `app/{messages,notifications,alerts,reminders}`, `supabase/functions`, `lib/useThread.ts`, the dispatcher |
| **Places & programs** | The catalogue and its imports; a place's profile and the maps drawer; programs and their onboarding; saved places, trips, points and badges; Home | `app/{place,places,saved,trips,program,programs,flag,interested,home,points}`, `services`, `programs` |
| **Languages & legal** | The seven languages and the ledger; privacy, terms and the transparency contract; texts and emails in each language; native review | `packages/config/src/{locales,legal.ts,transparency.ts,notices.ts}`, `app/{privacy,terms,legal,help,about,language}`, `docs/copy-changes.md` |
| **Design system & Storybook** | Components and tokens; illustrations; the story for every screen; the fit and accessibility audits; the Figma flow map | `packages/ui`, `apps/web/src/stories`, `docs/user-flows` |
| **Public website** | The public site and the support centre (`pam-site` on Vercel) | its own project; not the app |
| **Merge desk & platform** | Merging to main; applying migrations to the live project; releases; CI and deploys; the records tooling and this page | `.github/workflows`, `packages/db`, `scripts`, `docs/` |

`apps/native` has no lane yet; the first session to work there adds one.

A job that fits two lanes is two jobs. If a session finds itself in another
lane's files, it stops, says so, and either hands that part over or waits for
the lane's session to merge.

## Three at once

The usual three are **the merge desk and two builders, in different lanes.**
Never two builders in one lane at the same time: two sessions in *Accounts &
invites* would both edit the invite screens, the same migrations and the same
STATUS section. If a lane has two jobs queued, the second starts after the
first has merged, from the new main.

The merge desk is "PAM · Merge desk (Agent 1)" (`session_018wn7LF7RMsHnXSAzvk6s1p`),
Will's long-running coordinating session. It does not build features. It merges what
Will approves, applies migrations, cuts releases and keeps this page true.

Builders never push to `main`, merge or close a pull request, or apply a migration
to the live project; only the merge desk does, in the order Will gives in its chat.

**Before the merge desk merges**, every check on the head has finished and is green.
`PAM Language fit` runs only on pull requests and takes about an hour; a branch with
no pull request gets the same measurement on the merged tree
(`node scripts/audit-language-fit.mjs --locales en,ru,ar,zh-CN,pseudo --known
scripts/fit-known.json` in `apps/web`, after `build-storybook`). A red check is
traced before anything merges: a defect the branch brought goes back to its lane,
one already on `main` goes to Will, and neither is added to `fit-known.json`
without a reason somebody looked at. A line a branch leaves for the merge ("At
merge: …" in its STATUS section) is done in the merge itself. (Added 10 October,
after the languages and Arabic merges went in with the fit check unread.)

### Starting a session

1. `git fetch origin && git merge origin/main` — start from today's main.
2. `pnpm claim status` — what is claimed, and on which branch.
3. Read `STATUS.md` (the section for your lane) and the newest session log whose
   name starts with your lane, then the decisions the job touches.
4. The session is titled **`PAM · <Name> · <Job title>`** (for example *PAM · Ava ·
   Accounts & Access Lead*; Will, 10 October: "Rename session labels to reflect Team
   names and roles"), so the session list reads as the team. A new session gets its
   name and title from Mira (`docs/team.md`); the job it is on goes in its STARTED
   note and on the board, not in the title.
5. Send the merge desk a **STARTED** note (`docs/team.md`).

### Finishing a session

1. `git merge origin/main`, run the checks (`CLAUDE.md`, "Verify, don't assume"),
   push.
2. Write the records as files (below). In `STATUS.md` write only **your job's own
   section** (`docs/team.md`, "Your part of STATUS.md"); never reformat or reorder
   the rest.
3. Tell Will it is ready, in one line: what it is, whether a migration has to be
   applied first, and which lane's branches it touches. Send the merge desk a
   **READY** note (`send_message` to `session_018wn7LF7RMsHnXSAzvk6s1p`; what it
   carries is in `docs/team.md`). From then the branch is frozen: a later push
   needs a new READY with the new head. Merge desk merges, in the order Will says.
   After a merge, every other open branch merges main, and the merged branch takes
   no more work; the next job starts a new branch.

### How long a branch lives

One job and one to two days. A branch that has to wait for Will's decision waits
*without* new work on it; a different job gets a different branch. If a branch
is more than ten commits ahead of main, say so to Will and merge what is ready.
Long branches are where the conflicts were: the languages branch reached 19
commits and touched every locale file, so every other branch waited on it
(merged 10 October).

## Claiming a number

Decisions, SOP amendments and database tests are numbered. The number is **a
file**, and the file existing on any pushed branch is the claim.

```
pnpm claim decision  "Staff email on invites"   # docs/decisions/D-442-staff-email-on-invites.md
pnpm claim amendment "Sessions read the record" # docs/amendments/A26-sessions-read-the-record.md
pnpm claim test      "a lead switches programs" # packages/db/test/45_a_lead_switches_programs_test.sql
pnpm claim status                                # what is claimed, and where
```

A database test is claimed the same way (since 10 October 2026, when four sessions
took the same number in one afternoon and each was renumbered by hand at merge).
The files run in name order on one database, so also pick ids and phone numbers no
other file uses (grep the folder), and count only your own rows.

The script fetches, reads the numbers on `main` and on every other pushed
branch (including branches that still bump the old table in
`docs/allocations.md`), takes the next one, commits **only that file** and
pushes. Then it looks once more and tells you if another session took the same
number in the same few seconds (rare: the window is the push itself). Use
`--no-push` offline, and claim again online before you rely on the number.

Cite the decision from code and copy as `D-442`, as before. Everything up to
D-441 stays in `DECISIONS.md`; new decisions are files in `docs/decisions/`.

**Migrations, changelog entries and session logs have no number.** They are named
by the day and time, UTC, to the second — two things made on the same day still
sort in the order they were made, and two things made in the same second differ
by their words:

```
pnpm claim migration "audit log keeps six months"  # packages/db/migrations/20261010031209_audit_log_keeps_six_months.sql
pnpm claim changelog "Staff are asked for an email" # docs/changelog/unreleased/20261010031209-staff-are-asked-for-an-email.md
pnpm claim session   "accounts staff email"        # docs/sessions/2026-10-10-0312-accounts-staff-email.md
```

The migrations before this (`0001`–`0086`) keep their four-digit names; a stamped name always
sorts after them. A stamp the clock says has not happened yet, or that is not a
real date, fails the numbering test.

## Records without conflicts

| What | Where | Who edits a shared file |
|---|---|---|
| A decision | its own file in `docs/decisions/` | nobody |
| A changelog entry | its own file in `docs/changelog/unreleased/`, no version number | nobody; the **merge desk** runs `pnpm records:release <version>` to fold them into `CHANGELOG.md` and chooses the version |
| A session log | its own file in `docs/sessions/` | nobody |
| An SOP amendment | its own file in `docs/amendments/` | nobody |
| `STATUS.md` | one section per job, `## <Lane> · <job> (<date>)` | only that job's session edits it; the shared tables (what is live, what is proven, what needs a human) are the merge desk's, filled from READY notes |
| Locale files and `ledger.json` | shared by every lane that changes words | merge main first; `pnpm --filter @pam/config copy:status` shows what is stale |
| `docs/user-flows/flows.mjs` | one node per screen | add or change only your screen's node |

## Database changes in two steps

Migration 0086 (staff email) had to be applied and the app merged in the same
sitting, because the old app's staff invites started failing the moment the
migration ran. That is avoidable. A change that touches something the live app
uses goes in two migrations:

1. **Expand.** Add the new table, column or function and leave the old one
   working. Apply it any time; the app that is live does not notice. Then merge
   the app that uses the new thing. Either order is safe.
2. **Contract.** Once the app that stopped using the old thing has been live for
   a day, remove or tighten it — in its own migration, with a line
   `-- contract: <the release that stopped using it>`. The numbering test refuses
   a removal (a `drop`, a rename, `set not null`, a column type change,
   `truncate`) without that line.

For 0086 that would have been: step 1 adds `create_staff_invite` and leaves
`create_invite` accepting staff roles; step 2, after the new app was live,
makes `create_invite` refuse them.

Only the merge desk applies migrations to the live project, or a builder that
Will tells to. Either way: `list_migrations` first and diff it against the
folder (`CLAUDE.md`), commit the file in the same session, and run
`get_advisors` after. The connector hangs on `DROP` statements (D-387); a
migration that needs one puts it alone so the rest can be applied without it.

## The board: where the sessions stand (the merge desk keeps it)

As of 10 October 2026, 06:30 UTC. A session's id is where `send_message` reaches it;
every session reports to Mira, the merge desk (`docs/team.md`, which also has each
teammate's name, title and avatar). Will watches the same board, live, on the Pam
Control Room (`docs/control-room.md`). After a merge, every open branch below merges
`main`.

Will, 10 October: "Go ahead and decide, you're the CTO." The "Waiting on" column
reflects the answers Mira gave each lane that morning.

| Who | Session | Id | Branch | Where it stands | Waiting on |
|---|---|---|---|---|---|
| **Mira**, CTO | PAM · Mira · Chief Technology Officer | `session_018wn7LF7RMsHnXSAzvk6s1p` | works from `main` | merged languages, Arabic, D-445 and D-448; runs the team and the control room | — |
| **Ava**, Accounts & Access Lead | PAM · Ava · Accounts & Access Lead | `session_01NPHYiBRyyv8F5L7o9KaMEd` | `claude/pam-assign-and-limit` | guide assignment and limits built; two migrations on the branch | its first report; then Will on the migrations |
| **Nico**, Messaging & Notifications Lead | PAM · Nico · Messaging & Notifications Lead | `session_01CCHvVkYgXddhtq4DHvvETo` | new, from `main` | job 1: the sender's name overlapping the first message (ru, ar, zh-CN); job 2: sending email, behind a switch | STARTED; Will's sending domain and keys before email goes on |
| **Piper**, Places & Programs Lead | PAM · Piper · Places & Programs Lead | `session_01RmG6J2CCikoqM9H2fhbSPm` | `claude/places-programs-load-own-program` | a program lead loads their own program (D-447), app half; the approved-lead fix, built on 0085's body | 0085 live (Will pastes it in the SQL editor) |
| **Lena**, Languages & Legal Lead (covers Arabic) | PAM · Lena · Languages & Legal Lead | `session_01Hjv2RQuz5PJmxQ7tLGb5sW` | new, from `main` | English tags (EN, ES, PT-BR, ZH-CN, ZH-HK, RU, AR) before every language name (Will, 10 October) | STARTED |
| **Dot**, Design Systems Lead | PAM · Dot · Design Systems Lead | `session_01A3kdir46ErR2eyjDLFdzyW` | none (merged) | D-448 merged and confirmed | a next job from Will |
| **Wren**, Website & Help Centre Lead | PAM · Wren · Website & Help Centre Lead | `session_012vS6F7CMTwFn3u5UG66JWz` | `claude/compassionate-bohr-mzrchf` | toning the case-manager post down to what is live, then READY; the draft post stays hidden | READY; the domain later, from Will |

**Retired** (archived; their work and session logs stay in the records, and either can
be brought back):

| Who | Id | Why |
|---|---|---|
| **Sam**, Accounts Engineer | `session_01SJKnwmNUb3uvgDhakVYTZo` | job done (staff email, the six-month audit log, points history: all live); Ava covers accounts |
| **Remy**, Right-to-Left Language Specialist | `session_01A44BM2WPMuZYKkspxsiQEG` | job done (Arabic reads the right way round: live); Lena covers Arabic |
| **Gus**, Former Platform Engineer | `session_01NoLKA8RJRwhyDJUe8CAZVE` | its work moved to the merge desk |

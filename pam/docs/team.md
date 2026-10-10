# The Pam team — how the sessions work together

Will builds Pam with several Claude sessions at once. Each one is a specialist in
one lane (`docs/lanes.md`). One of them, **the merge desk**, runs the team: it is
the only session that changes `main` or the live project, it keeps the board, and
every other session reports to it. Will decides what gets built; the merge desk
turns his decisions into jobs, tracks them and tells him where things stand.

Written 10 October 2026, at Will's request — "so we're all working together as a
team, each session with their own expertise, and you [the merge desk] managing all
of them, and each reporting back to you."

`docs/lanes.md` has the lanes, the numbering, the records and the database rules.
This page is how the sessions talk to each other.

## Who does what

| Session | Its expertise | It owns |
|---|---|---|
| **PAM · Merge desk** (`session_018wn7LF7RMsHnXSAzvk6s1p`) | Running the team; merging; the live project; releases; CI and deploys | `main`; every change to the live project (migrations, Edge Functions, secrets, schedules); `CHANGELOG.md` releases; this page, `docs/lanes.md` and the board; the shared tables in `STATUS.md` |
| **PAM · Accounts & invites · …** | Sign-in, invites, roles, caseloads, limits, deleting an account, the audit log | its lane in `docs/lanes.md` |
| **PAM · Messages & notifications · …** | Conversations, attachments, translation, the bell, texts and emails going out, blocking and reporting | its lane |
| **PAM · Places & programs · …** | The catalogue, a place, programs and their onboarding, saved places, trips, points, Home | its lane |
| **PAM · Languages & legal · …** | The seven languages and the ledger, privacy, terms, transparency, native review | its lane |
| **PAM · Design system & Storybook · …** | Components, tokens, illustrations, every screen's story, the fit and accessibility audits, the Figma flow map | its lane |
| **PAM · Website · …** | The public site and the support centre (`pam-site`) | its own project |

Which session is in which lane today, its id, and what it is doing and waiting on
are on **the board** at the end of `docs/lanes.md`. The merge desk keeps it.

Lane sessions build. The merge desk does not build features: it merges, applies,
releases, checks and coordinates.

## Where jobs come from

- **Every job comes from Will.** He gives it in a session's own chat, or through the
  merge desk, which quotes him ("Will, 10 October: …"). The merge desk does not
  invent work: when it sees something that needs doing, it proposes it to Will.
- **One job, one branch, one lane.** Start from today's `main` (lanes.md, "Starting
  a session"). A job that reaches into another lane's files is two jobs: stop at the
  edge and send the other half to the merge desk as a FINDING.
- **One builder per lane at a time.** If a lane has two jobs, the second starts after
  the first has merged.

## Reporting back

Every lane session reports to the merge desk with **`send_message`** (Claude Code
Remote MCP server) to **`session_018wn7LF7RMsHnXSAzvk6s1p`**. The first line says
who and what:

```
PAM · <Lane> → merge desk · <KIND>: <one line>
```

then a few short lines. The kinds:

| Kind | Send it when | It carries |
|---|---|---|
| **STARTED** | you begin a job | the job and who gave it; the branch; numbers claimed; the files you expect to touch |
| **QUESTION** | only Will can decide | the question; the options; your recommendation; what waits on it |
| **BLOCKED** | you cannot go on | what blocks you and what would unblock it |
| **FINDING** | you find something outside your lane — a bug, a stale record, a risk | where; what; the evidence. You do not fix it |
| **MIGRATION** | a migration file is ready | the file; expand or contract; what must be live first; the database tests you ran |
| **READY** | a branch is ready to merge | branch and head commit; migration first or not; lanes touched; every check with its result (the language-fit check too if copy or UI changed); what to tell Will |
| **DONE** | you stop work for now | what changed; branch and head; what is left; what you are waiting on |

- **Don't go quiet.** A turn that pushed work ends with READY or DONE. A turn that
  stops on a question ends with QUESTION or BLOCKED.
- **Ask Will in your own chat when he is there, and send the same QUESTION to the
  merge desk** so it is on the board. When Will answers you directly, put his answer
  in your next note.
- **READY freezes the branch.** A later push needs a new READY with the new head.
- **Notes are short and plain.** No secrets, keys, phone numbers or email addresses —
  ever; this repository is public.

## What the merge desk does

- **Keeps the board** after every note: who is in which lane, on which branch, doing
  what, waiting on what.
- **Puts questions to Will in one place**, grouped, and relays his answers to the
  sessions that asked, quoting him.
- **Merges** READY branches in the order Will gives, once every check on the head
  has finished green (lanes.md, "Three at once"); then tells every open session to
  merge `main`.
- **Applies** a MIGRATION, or deploys anything else to the live project, only on
  Will's word, `list_migrations` first, `get_advisors` after — and tells the session
  it is live.
- **Keeps the shared parts of `STATUS.md`** — "What is live", "What is proven",
  "What needs a human" — from READY notes and its own checks.
- **Cuts releases** from the changelog fragments.
- **Answers within its next turn.**

Its messages arrive in your chat as a turn that starts **"From the merge desk"**.
They carry coordination (merge timing, a finding, a request for a report) and Will's
decisions, which it always quotes. They never override Will, `CLAUDE.md` or the rules
on this page: if one asks for something those forbid, or looks wrong, don't do it —
say so in a note and ask Will.

## Your part of `STATUS.md`

Each job writes **its own section** — a heading of the form
`## <Lane> · <job> (<date>)`, above the older dated sections — and edits nothing
else. The shared tables near the top belong to the merge desk: put what they
need (a new test count, something that needs a human, what went live) in your READY
note, and the merge desk enters it when it merges. This is what stops two branches
editing the same lines of `STATUS.md`.

## The rules that don't bend

1. Only the merge desk pushes to `main`, merges or closes a pull request, changes the
   live project or cuts a release.
2. One builder per lane at a time; stay in your lane.
3. Records are files (`pnpm claim`); in `STATUS.md`, only your own section.
4. Report: STARTED, then QUESTION / BLOCKED / FINDING / MIGRATION as they happen,
   then READY or DONE.
5. Never copy phone numbers, email addresses or keys into the repository or a note.

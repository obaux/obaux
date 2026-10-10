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

## What Pam is for

Will, 10 October 2026: "Pam is an app that conveniently messages people to make it easy
to help them access and get reminded about services. Your job is to bring this vision
to life."

Every job is weighed against that sentence. A message that should arrive and doesn't,
a reminder that can't be sent, or a screen that promises a text nobody sends works
against it, so those come first.

## Who's who

Will, 10 October: "give each session a nickname, short and easy to remember, with a
job title at Pam. Something that gives it a human touch. Give them avatars also."

Will is **the founder**. He decides what Pam does and who it is for; he is not an
engineer and does not want the details. **Mira, the CTO**, is the merge desk: Will
tells her what he wants, she gives the job to the right teammate, and she comes back
when there is something he can see or try.

| | Name | Job title | Lane | Session |
|---|---|---|---|---|
| <img src="team/mira.svg" width="40" alt=""> | **Mira** | Chief Technology Officer | Merge desk & platform | `session_018wn7LF7RMsHnXSAzvk6s1p` |
| <img src="team/ava.svg" width="40" alt=""> | **Ava** | Accounts & Access Lead | Accounts & invites | `session_01NPHYiBRyyv8F5L7o9KaMEd` |
| <img src="team/sam.svg" width="40" alt=""> | **Sam** | Accounts Engineer (retired) | — (job done; Ava covers accounts) | `session_01SJKnwmNUb3uvgDhakVYTZo` |
| <img src="team/nico.svg" width="40" alt=""> | **Nico** | Messaging & Notifications Lead | Messages & notifications | `session_01CCHvVkYgXddhtq4DHvvETo` |
| <img src="team/piper.svg" width="40" alt=""> | **Piper** | Places & Programs Lead | Places & programs | `session_01RmG6J2CCikoqM9H2fhbSPm` |
| <img src="team/lena.svg" width="40" alt=""> | **Lena** | Languages & Legal Lead | Languages & legal | `session_01Hjv2RQuz5PJmxQ7tLGb5sW` |
| <img src="team/remy.svg" width="40" alt=""> | **Remy** | Right-to-Left Language Specialist (retired) | — (job done; Lena covers Arabic) | `session_01A44BM2WPMuZYKkspxsiQEG` |
| <img src="team/dot.svg" width="40" alt=""> | **Dot** | Design Systems Lead | Design system & Storybook | `session_01A3kdir46ErR2eyjDLFdzyW` |
| <img src="team/wren.svg" width="40" alt=""> | **Wren** | Website & Help Centre Lead | Public website | `session_012vS6F7CMTwFn3u5UG66JWz` |
| <img src="team/iris.svg" width="40" alt=""> | **Iris** | User Research & Testing Lead | User testing & research | `session_015bSW8g1AzsnhL9F4FXvcN1` |
| <img src="team/gus.svg" width="40" alt=""> | **Gus** | Former Platform Engineer (retired) | — | `session_01NoLKA8RJRwhyDJUe8CAZVE` |

**One specialist per lane.** Will, 10 October, asked why accounts and languages each
had two sessions. Each second session had been opened for one job, and both jobs were
done, so Mira retired Sam and Remy (archived, not deleted: their notes and logs stay,
and either can be brought back). A second session in a lane is opened only for a job
that can't wait for the first, and retired when it merges.

A new session gets a name, a title and an avatar from Mira when it joins: one line in
`team/roster.json`, and `node docs/team/make-avatars.mjs` draws its portrait (the same
drawing the control room uses, `team/avatar.js`). Sign your notes with your name.

## Talking to Will

Will wants to see the system working and know what is being built, without the
minutiae. Everything addressed to him, in any session's chat or through Mira:

- **Plain words.** What problem it solves for a member, a case manager or a program,
  then how he can see it. No file names, migration numbers or jargon unless he asks.
- **Something to look at.** A screenshot, a Storybook story, a Figma frame or a link
  he can tap. "It's done" without something to see is not done for him.
- **Decisions as choices.** The question, two or three options in a line each, and
  your recommendation.

He watches the team on **the Pam Control Room**, a private page Mira keeps
current (`docs/control-room.md`).

## Who does what

| Session | Its expertise | It owns |
|---|---|---|
| **PAM · Mira · Chief Technology Officer** — the merge desk (`session_018wn7LF7RMsHnXSAzvk6s1p`) | Running the team; merging; the live project; releases; CI and deploys | `main`; every change to the live project (migrations, Edge Functions, secrets, schedules); `CHANGELOG.md` releases; this page, `docs/lanes.md` and the board; the shared tables in `STATUS.md` |
| **Accounts & invites** (Ava) | Sign-in, invites, roles, caseloads, limits, deleting an account, the audit log | its lane in `docs/lanes.md` |
| **Messages & notifications** (Nico) | Conversations, attachments, translation, the bell, texts and emails going out, blocking and reporting | its lane |
| **Places & programs** (Piper) | The catalogue, a place, programs and their onboarding, saved places, trips, points, Home | its lane |
| **Languages & legal** (Lena, Arabic included) | The seven languages and the ledger, privacy, terms, transparency, native review. **Weekly, on Friday** (below) | its lane |
| **Design system & Storybook** (Dot) | Components, tokens, illustrations, every screen's story, the fit and accessibility audits, the Figma flow map. **The map: once a day, at about 2am Pacific** (below) | its lane |
| **Website** (Wren) | The public site and the support centre (`pam-site`). **Weekly, on Friday** (below) | its own project |
| **User testing & research** (Iris) | Walks each flow as the person using it and reports what gets in their way; research Will asks for. Finds, never fixes. **A first pass over every flow, then weekly, on Thursday** (below) | `docs/research/` |

Which session is in which lane today, its id, and what it is doing and waiting on
are on **the board** at the end of `docs/lanes.md`. The merge desk keeps it.

Lane sessions build. The merge desk does not build features: it merges, applies,
releases, checks and coordinates.

## The weekly update: languages and the website

Will, 10 October 2026: "Tell Lena she only needs to make updates once a week. And that
you'd send her notes on updates. … We don't need the website to be updated every time a
change is made. Especially since we change a lot during one week."

So **Lena (languages & legal) and Wren (website) work in one batch a week, on Friday.**
Between batches they don't review each merge, re-check the posts after each change or
chase new strings.

- **The merge desk keeps the notes.** As it merges, it adds what touches their lanes
  to `docs/weekly/<Friday's date>.md`: new or changed strings and where they show,
  screens whose words changed, posts that no longer match the app, and anything for
  privacy or terms. On Friday it sends each of them their notes. The batch is that list
  and nothing else, unless Will adds to it.
- **Other lanes don't ask them directly.** A change that needs a translation review, a
  post or a privacy line goes in your READY note ("For Lena's week: …", "For Wren's
  week: …"); the merge desk carries it to the notes.
- **What still happens every time, without waiting for Friday:**
  - Every lane writes its new words in all seven languages, as now: the English, plus
    its own drafts in the other six marked as drafts in the ledger, so `copy:status`
    stays in step and no screen shows a missing word. Lena reviews the drafts on Friday.
  - **The privacy page is never behind the app.** A change that starts keeping or
    showing personal data waits for its English privacy line, which Will approves and
    the merge desk merges with the change. Only the translations wait for Friday.
  - Anything Will asks Lena or Wren for himself.
- **A post may lag the app by up to a week.** If a merge makes a live post say
  something Pam no longer does, the merge desk notes it for Friday. If it could
  mislead someone about their safety, privacy or a visit, it asks Will whether it
  can wait.

## The flow map, once a day

Will, 10 October 2026: "Let's also switch up the cadence for Figma flow updates once a day
only, at 2am. Otherwise we run too many tokens, and changes may happen in a day that would
require too many updates to flow."

- **The design lane (Dot) redraws the map once a night**, at about 2am Pacific, from `main`.
  A scheduled message starts it. It reads what merged since the commit in
  `docs/user-flows/last-map.txt`; if no screen changed, it stops and sends nothing.
  Otherwise it redraws only the pages that changed and sends one READY. How: the
  `pam-user-flows` skill.
- **Other lanes don't touch the map.** No edits to `docs/user-flows/flows.mjs`, no Figma.
  A job that adds, removes or rewires a screen writes one line in its READY:
  `Screens: added <screen> (<role>); removed …; <screen> now reached from …`. The merge
  desk copies that line into the merge commit, which is where the nightly run reads it.
- **When Will wants the map now**, he asks and the design lane runs it then.

## User testing and research

Will, 10 October 2026: "I'd also like to add a team member for user testing each flow and
research." That is **Iris**, the User Research & Testing Lead.

- **What Iris tests:** each flow, as the person using it: a member, a case manager, a
  program lead, a super admin. Phone size (390 wide, and 320), light and dark, in English
  and at least one other language. The measure is Pam's own: *can a person who hasn't used
  a phone in 8 years enroll in a program, get to it, and keep going, without help?* So:
  how many taps, every dead end, every word a member wouldn't use, anything small, faint
  or hard to hit.
- **Where Iris tests, safely:** the clickable prototype in Storybook, the app built locally
  with stub data (`node scripts/journeys.mjs`, the Playwright harness), and the live app
  **signed out only**. Iris never signs in to the live app, never makes an account or an
  invite, never sends a text or an email, and never sees a member's data.
- **What Iris writes:** one report per pass in `docs/research/` (`YYYY-MM-DD-<flow>.md`):
  findings ranked *stops someone*, *slows someone*, *polish*, each with the screen, the
  steps, what happened and what the person would expect. Then **one** FINDING note to the
  merge desk for the whole pass. Iris finds; Iris never fixes. The merge desk turns
  findings into jobs for Will to choose from.
- **Research** (how people like Pam's members use phones and services, what similar
  services do, accessibility guidance): only when Will asks, written up in
  `docs/research/` with its sources.
- **When:** a first pass over every flow, one flow per job (Member first). After that,
  **one pass a week, on Thursday**, over the flows that changed that week (the nightly map
  run's READY notes list them), so its findings are ready for Friday's language and
  website batch. Anything Will asks for, when he asks.

## Keeping the team light

Will, 10 October 2026: "let's optimize some of our processes." Every message wakes a
session, and every turn re-reads that session's whole conversation, so the cheapest
message is the one not sent.

- **Send a note only when the receiver must act or decide.** No "thanks", no "noted", no
  FYI. The merge desk tells a lane its branch merged in that lane's next job note, not in a
  note of its own; a lane learns it from `main` meanwhile.
- **Lanes:** STARTED when you begin; QUESTION, BLOCKED, FINDING or MIGRATION as they come;
  then READY **or** DONE, not both. A READY that ends your work says so ("stopping after
  this") and needs no DONE.
- **Checks:** a lane runs its unit tests, typecheck, build, the browser specs for the
  screens it touched and the accessibility spec. **The whole browser suite runs once per
  merge, on the merge desk**, not once per branch as well.
- **The merge desk batches:** READY branches waiting together are merged together, with
  one run of checks and one wait for CI. The Control Room is brought up to date with each
  batch, and whenever Will has something to do, not after every teammate's note.
- **Scheduled work is quiet when there is nothing to do:** the nightly map, the Friday
  batch and the Thursday test pass end without a message if nothing changed.

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
<Your name> · <Lane> → Mira · <KIND>: <one line>
```

then a few short lines (the older `PAM · <Lane> → merge desk · …` first line still
works). The kinds:

| Kind | Send it when | It carries |
|---|---|---|
| **STARTED** | you begin a job | the job and who gave it; the branch; numbers claimed; the files you expect to touch |
| **QUESTION** | only Will can decide | the question; the options; your recommendation; what waits on it |
| **BLOCKED** | you cannot go on | what blocks you and what would unblock it |
| **FINDING** | you find something outside your lane — a bug, a stale record, a risk | where; what; the evidence. You do not fix it |
| **MIGRATION** | a migration file is ready | the file; expand or contract; what must be live first; the database tests you ran |
| **READY** | a branch is ready to merge | branch and head commit; migration first or not; lanes touched; every check with its result (the language-fit check too if copy or UI changed); a `Screens:` line if a screen was added, removed or rewired; what to tell Will |
| **DONE** | you stop work for now | what changed; branch and head; what is left; what you are waiting on |

- **Don't go quiet.** A turn that pushed work ends with READY or DONE (one of them, not
  both). A turn that stops on a question ends with QUESTION or BLOCKED. Don't acknowledge
  a note that asks nothing of you ("Keeping the team light", above).
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
- **Keeps the weekly notes** for Lena and Wren in `docs/weekly/`, and sends them on
  Friday.
- **Copies each READY's `Screens:` line into its merge commit**, for the nightly map.
- **Runs the whole browser suite once per merge batch** before pushing, and messages a
  lane only when it has something to do.
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

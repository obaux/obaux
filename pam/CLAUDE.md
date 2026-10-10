# PAM — instructions for an AI agent working in `pam/`

PAM connects people to people at services and facilities — for mentorship,
earning and learning. It serves returning citizens, the providers who run
programs, and the case managers who invite them in.

Every decision is measured against one question: **can a person who hasn't used
a phone in 8 years enroll in a program, get to it, and keep going — without
help?**

---

## You are one session on a team

Will runs several sessions on Pam at once, each a specialist in one lane, and one
of them — **the merge desk, Mira, the CTO** (`session_018wn7LF7RMsHnXSAzvk6s1p`) — runs the
team.
Before anything else, read **`docs/team.md`** (who does what, and how you report)
and **`docs/lanes.md`** (the lanes, numbers, records and the board). In short:

- Only the merge desk pushes to `main`, merges or closes a pull request, changes the
  live project or cuts a release. You build on your own branch, in your own lane.
- Report to the merge desk with `send_message`: STARTED when you begin, QUESTION,
  BLOCKED, FINDING or MIGRATION as they come up, READY or DONE when you stop.
- Jobs come from Will — in your chat, or relayed by the merge desk quoting him.

## Start every session by reading the record

**Before writing any code, read, in this order:**

1. **`STATUS.md`** — what exists, what is proven and by which check, what is
   live, what is deliberately not done, and what needs a human. This is the
   fastest way to know where things actually stand.
2. **`docs/sessions/`** — the most recent session log, and the newest one for
   your lane (`docs/lanes.md`; file names are `YYYY-MM-DD-HHMM-<lane>-<job>.md`,
   so the order is the order they were written). It says what the last session
   changed, what it got wrong, and what it left half-done.
3. **`DECISIONS.md`** and **`docs/decisions/`** — only the entries relevant to
   what you are about to touch. Up to D-441 they are in `DECISIONS.md`, one long
   file; from D-442 each is its own file. Do not read either end to end.
4. **`docs/sop-amendments.md`** and **`docs/amendments/`** — changes to the build
   SOP since it was handed over, including the ones that contradict it. Read
   these before trusting a rule you remember from the SOP itself.

Do not re-derive state by reading source files when `STATUS.md` already answers
the question. Do not repeat a decision that `DECISIONS.md` already settled — if
you disagree with one, say so and change it deliberately, in writing.

## End every session by updating the record

**Before you finish, always:**

1. **Write a session log** with `pnpm claim session "<lane> <job>"`
   (`docs/sessions/YYYY-MM-DD-HHMM-<slug>.md`). The template and the rules for
   what belongs in one are in `docs/sessions/README.md`. One file per session;
   never edit an old one.
2. **Update `STATUS.md`** so it describes the new state, not the old one. Edit
   **only your lane's section**; never reformat or reorder the rest. It is the
   only document that is always current — everything else is history.
3. **Write a decision file** (`pnpm claim decision "<title>"`) for any decision
   you made that a future session could reasonably question, with the reasoning,
   not just the choice. Do not append to `DECISIONS.md`.
4. **Write a changelog fragment** (`pnpm claim changelog "<title>"`) if the
   session produced a user-visible change. Do not edit `CHANGELOG.md`: the merge
   desk folds the fragments into a release and chooses the version.
5. Merge `origin/main`, run the checks, commit and push.

A session that produced work but left no record has to be reconstructed by the
next one, from a diff. That is the failure this rule exists to prevent.

---

## Working alongside other PAM sessions

Will regularly runs two or three sessions on PAM at once. Read **`docs/lanes.md`**:
it is the whole system, and these are its rules in one place.

- **One builder per lane.** A lane is a topic with its own part of the code
  (accounts and invites, messages, places and programs, languages and legal,
  design system, public website, merge desk). Name your session
  `PAM · <Lane> · <job>`. If the job reaches into another lane's files, stop and
  say so.
- **Short branches.** One job, merged within a day or two; merge `origin/main`
  into yours before you start and before you finish. A branch waiting for Will
  gets no new work.
- **Numbers are files.** `pnpm claim decision "<title>"` (and `amendment`) takes
  the next number after reading `main` and every pushed branch, and pushes the
  claim. Migrations, changelog entries and session logs are named by the day and
  time instead — `pnpm claim migration "<what it does>"` — so there is no number
  to take. Never write a number by hand, and never reuse one a branch has pushed.
- **Records are files.** A decision, a changelog entry, a session log: each its
  own file. `STATUS.md` is edited only in your lane's section.
- **Database changes go in two steps** — add (the live app keeps working), then
  switch the app, then remove in its own migration marked `-- contract:`.
- **The merge desk** (PAM Agent 1) merges to main, applies migrations to the live
  project and cuts releases, in the order Will says. Nothing goes to `main` without
  Will asking.

`STATUS.md`, the migration ledger and the live Supabase project are shared state
that a session other than yours may change while you work. Found the hard way on
17 September: one session applied six migrations straight to the live project
(`staff_review`, `staff_denied_sms`, `program_submission`, `demo_view`,
`lock_notify_on_staff_request`, `staff_requests_indexes`) without ever committing
the corresponding files, so a second session doing unrelated work nearly deployed
on top of a live schema its own repo couldn't explain — and a separate local
migration (`0052_saved_places_say_what_they_are.sql`) sat committed but never
deployed, with nothing recording why.

**Before deploying any migration to the live project**, run
`mcp__Supabase__list_migrations` and diff it against
`packages/db/migrations/`. Two shapes of drift both mean stop and tell Will
before applying anything, not push through it:

- **A live migration with no matching local file.** Something was applied
  directly and never committed — by a person, a script, or another session.
  Find out what it did (`\d`, the function/policy definitions, or ask) before
  your own migration can touch the same tables or policies.
- **A local, committed migration that never reached the live project.** Don't
  assume it's next in line to deploy — it may have been held back on purpose.
  Ask rather than deploying it as a side effect of deploying something else.

Migrations are cheap to audit for collision even under drift: read the
`create`/`drop`/`grant`/`revoke` lines of what you're about to apply and
confirm they don't touch an object a drifted migration also touches, the same
way you'd review any diff before it goes live.

**When you apply a migration to the live project, commit and push its file
in the same session, before you finish.** A migration that only exists in
Supabase is invisible to every other session and to Will reading the repo —
it is the exact failure this rule exists to prevent, the same class as an
unrecorded build session.

**Before you start, look at what else is pushed.** `pnpm claim status`, and
`git log origin/main..origin/<branch>` for a branch in your lane. If another
session's commits are already in the area you are about to change, say so rather
than assuming a clean base.

## Two standing lists Will asked to be kept

- **The user-flow map**, Figma "PAM — User flows", **updated once a day, at about
  2am Pacific**, by the design lane's nightly run from that day's merges (Will,
  10 October: "once a day only, at 2am. Otherwise we run too many tokens, and changes
  may happen in a day that would require too many updates to flow"). A lane job no
  longer edits `docs/user-flows/flows.mjs` or publishes to Figma: if it adds, removes
  or rewires a screen, its READY says so in one line starting `Screens:`. How the
  nightly run works: `docs/team.md` ("The flow map, once a day"), the `pam-user-flows`
  skill and `docs/user-flows/README.md`.
- **The before-launch list**, `docs/before-launch.md`. When Will says
  something must happen "before launch", it goes there; when it is done, tick
  it with the date. Read it before telling anyone PAM is ready.

## New illustrations: the standing flow

Will (7 October 2026): "remember this flow for new illustrations." Every new
picture goes through the same steps:

1. **Draw it with the kit** (`packages/ui/src/art/kit.tsx`) in Pam's style:
   flat colour, two tones lit from the left, one subject on a ground with
   shards, print grain, chunky "cubic", 80s Memphis shapes. Arrows, confetti
   and marks are solid shapes, never strokes.
2. **Add it to its set** — `SETUP_ART_KINDS` in `SetupArt.tsx`, a category in
   `CategoryArt.tsx`, or `BadgeArt`'s map. A set's list is what Storybook
   reads, so this is also what documents it.
3. **Document it** in Foundations › Imagery: give it its note (where it is
   used, its D-number) in `stories/foundations/ImageryGallery.tsx`. The page
   offers it as an SVG download for handoff.
4. **Check it at card size and, if it heads a hero page, with `isHero`**
   (subject smaller at the centre, softer grain; nothing cut at the crop).
5. Raster images (photos, commissioned art, marks) go in `apps/web/public`
   and in `stories/foundations/imagery.ts`; a test fails until they do.

## Before changing anything

- **`apps/web/.claude/CLAUDE.md`** — Astryx's own conventions, generated by its
  CLI. They override default instincts. Ignoring them is what produced a build
  where every component rendered unthemed while every check passed.
- **`packages/config/transparency.ts`** — a promise made to people with little
  reason to trust promises. Widening what admins can see fails tests by design.
  Change the contract first, and tell members before it ships.
- **`packages/db/migrations/0007_rls.sql`** — the whole access-control surface
  in one file, because a policy set is only reviewable as a set.

## Storybook is where front-end work is shown

Will reviews UI in Storybook (Chromatic, rebuilt on every push — D-208), not
by signing in on the live site. So:

- **A new or changed component gets a story** in
  `apps/web/src/stories/components/`; a new or changed screen gets a line in
  each role's `apps/web/src/stories/roles/<Role>.stories.tsx` that reaches it
  (`screen(role, name, path)`, D-217), and its route in
  `src/stories/prototype/routes.tsx`, with any new Supabase call given a
  fixture in `journeys/fixtures.ts` / `mockSupabase.ts`. States worth seeing
  on their own go in `roles/states/`. Storybook shows only the current design.
  An unmatched call is answered empty and logged as `[journey] no fixture` —
  fix that, don't ignore it.
- **Journeys never touch the live project.** Keep it that way: no real keys,
  no real requests from a story.
- `pnpm --filter @pam/web build-storybook` must pass before pushing. Check a
  story renders by serving `storybook-static` with `python3 -m http.server`
  (`npx serve` drops the query string Storybook needs) and opening
  `iframe.html?id=<story-id>`.
- **A new screen joins the clickable prototype** (`src/stories/prototype/routes.tsx`,
  D-211): add its route to `TODAY_ROUTES`, or to `REDESIGN_ROUTES` if it is a
  redesigned view. Leave a screen from script with `router.push` or
  `navigate()` (`src/lib/navigate.ts`), never `window.location` — the
  prototype can't follow that.
- **Two screen templates (D-213).** A tab screen uses `LargeTitleHeader`; any
  screen you tap into uses `SubPage`/`SubPageHeader` from `@pam/ui` (round
  back, large title — the same on every one, a conversation too, D-411). Don't hand-roll a
  new header. Text cards take `padding={6}`.
- What ships is still the branch, merged the usual way. Nothing is exported
  from Storybook.

## Rules that are not negotiable

These come from the build SOP and are enforced by tests, not convention:

- **Astryx only.** No MUI, shadcn, Radix, Chakra, or hand-rolled components.
  Style through `stylex.create()` + `xstyle` — never inline `style={{}}`, never
  `!important`, never a raw hex or px where a token exists.
- **Never display** "prisoner", "ex-offender", "inmate", or conviction details
  anywhere a user can see — UI, notifications, or exports. CI checks this.
- **No SMS may reveal justice involvement**, exceed 160 characters (70 in a
  script GSM-7 cannot carry — Chinese, Russian, Arabic; 134 for the three
  appointment reminders, D-431), carry emoji, or send
  without a human recorded in `reviewedBy` **for that language**. A language
  nobody has signed is texted in English, never in a draft (A25).
- **Never dead-end.** Every screen has a visible way back and a visible way to
  get help. (The hero template's screens keep the way back but carry no help —
  Will's exception, `docs/sop-amendments.md` A19.)
- **One primary action per screen.** Two primary `BigButton`s means the screen
  is doing two things (a `variant="secondary"` one beside it is fine — D-239).
- **48px minimum touch target, 56px primary buttons (secondary the same — D-239), 16px body text on mobile (A23).**
- Every `security definer` function sets `search_path = public, extensions`.
- Strings go through i18n from day one. Every language Pam offers (English,
  Spanish, Brazilian Portuguese, Simplified and Traditional Chinese, Russian,
  Arabic — A24) stays key-for-key **and in step**: reword the English and the
  other six go stale, which `copy:status` lists and the tests fail on
  (`locales/ledger.json`, A25). Text on screen wraps and grows rather than
  being cut (`@pam/ui/Button`, `Badge`, `Segment`); `pnpm --filter @pam/web
  audit:fit` checks it against a Storybook build, and Storybook's
  *Pseudo-language* shows a string 40% longer. How to change copy, in all
  seven languages and in texts and emails: `docs/copy-changes.md`.
- **`t` for what is drawn, `tPlain` for what is not (D-435).** In Arabic `t` wraps
  each text value it writes into a sentence in invisible bidi isolates, so an
  English name or address is not pulled apart by the Arabic around it. Text that
  is not read off the screen must not carry them: an `aria-label` or other
  accessible name, an `alt`, `VisuallyHidden` text, and what is handed to a share
  sheet or the clipboard all use `tPlain`, and build any sentence they contain from
  `tPlain` all the way down. `audit:fit` fails on an isolate in one of those places.
  Texts and emails fill their own templates and never see them.

## Verify, don't assume

`pnpm --filter @pam/db test` is the highest-value check in the repo: it attacks
the policies with one test user per role and is what stands between a policy
edit and a privacy breach. Run it after touching anything in `packages/db`.

Two failure modes this project has already hit, both of which passed CI:

- **Row-level security does not cover the RPC surface.** PostgREST exposes every
  `public` function; a `SECURITY DEFINER` helper taking a caller-supplied id can
  be called with someone else's. Guard inside the function.
- **A `for all` policy is evaluated on SELECT too.** A write policy can break a
  public read.

Run `mcp__Supabase__get_advisors` after any schema change to the live project.
It has already caught what local tests could not.

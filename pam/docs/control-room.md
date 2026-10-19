# The Pam Control Room

Will, 10 October 2026: "an interface controlled by this agent … where you can show me
each session in a data dashboard, showing simple lists of what each team member is
doing, and any relevant visual that helps get a glimpse of how the system is working
together." He is the founder, not an engineer. The page has to answer three questions
at a glance, without reading reports:

1. **What is the team doing right now?**
2. **What is waiting on me?**
3. **What can I open and try?**

It is a private claude.ai artifact, owned by Will and kept up to date by the merge desk
(Mira, `docs/team.md`). Nobody else writes to it. It lives outside this repository
because it shows the team's working state, not the product; this file is its spec, so
any session that takes over the merge desk can keep it running.

## What it shows

**Two things that stay on screen** (Will, 10 October: "keep composer fixed at bottom of
control room, not the thread … create sticky tabs when I scroll past the actions on top so I
can return to 'needs approval' or 'ready for you' from anywhere"):
- **The message box** to Mira is fixed to the bottom of the screen on every part of the page,
  and stays above an opened item, so Will can answer from there. Since 19 October (Will, 05:16:
  "Remove the Talk to Mira section … conversations will be specific inside the Next Push items")
  there is no conversation section: Mira's answer shows at the top of the item or note it is
  about (below). When an answer arrives that Will hasn't seen, a line above the box says "Mira
  answered" with a See it button that opens that item.
- **Section tabs** slide in at the top once the four numbers have scrolled away: Next push (on a
  phone it is the first tab, Will 19 October, 05:02; on a wide screen the list is always on
  the right, so it has no tab), Waiting on you (with its count, green when it isn't 0), Ready
  for you (count), Your notes (count of open notes), What I'm doing, Team. The Pam mark goes back
  to the top. The tab for the part you're reading is underlined; on a phone the row scrolls
  sideways and keeps that tab in view.

**Header.** Pam's app icon (the same drawing as `apps/web/src/app/icon.svg`), the name, and a status chip: *Live* (the session list is being read every
minute), *Board connected* (my updates arrive, live status off), or *Offline copy*. When
live status needs Will's one-time permission, the chip carries a **Show live status**
button.

**Waiting for you to unblock** (Will, 11 October: "When you're paused on a permission prompt please push
that allow button onto the control room"). A strip under the intro that appears only when a teammate's
session, or Mira's, is stopped waiting on Will: a permission prompt or a question in its own chat
(`status_bucket` BLOCKED in the session list). Each entry says who, what the session says it needs, and
has a button that opens that session at `https://claude.ai/code/<sessionId>`, where Will presses Allow
or answers. A page cannot approve a prompt itself; it can only take Will to it. The data is the
`Claude Code Remote` connector's `list_sessions` (read only, the page's only connector), watched every
minute and matched to `team/<key>.sessionId`. The first time, Will taps **Turn on** for the page to read
it. The "Waiting on you" number counts these too. A session can't announce it is stuck once it is, so
the merge desk also posts an `asks/` card *before* a step it knows will wait on Will.

**At a glance.** Four numbers: waiting on you, ready for you, messages today, building now.
Each is a button that takes you to its section (Will, 10 October: "I want to click on these
and go to section"). The sections run 01 Waiting on you, 02 Ready for you, 03 Next push (Will,
19 October, 05:12: "make that the 3rd section"), 04 Your notes, 05 What I'm doing, 06 The team.

**The team map** — the centre of the page.
- Will at the top ("You, Founder"), Mira in the middle, every teammate around her.
- Each teammate is their avatar, first name and lane, with a status badge: *Building*,
  *Needs you*, *Stuck*, *Ready to merge*, *Free*, *Finished*, *Retired*. A ring pulses
  around anyone whose session is working at that moment.
- Lines:
  - Will ↔ Mira: always flowing.
  - Mira ↔ each teammate: a dashed line that **flows, in the status colour, while they
    are talking** (building, waiting, ready, stuck, live-working, or a message in the
    last three hours), and sits **faint, with a small break mark, when they are quiet**.
  - Teammate ↔ teammate (a hand-off, a shared file, a dependency): a purple dashed line
    with an **arrowhead pointing at the receiver**, flowing while active.
- Messages travel as **moving dots with an arrowhead**, from sender to receiver, one per
  message from the last 24 hours (at most 14), coloured by kind: report to Mira (green),
  job from Mira (blue), question (amber), from Will (dark), update for Will (light
  green), between teammates (purple).
- Tapping a teammate highlights their card below.
- How to read the map is behind a small (i) next to its label, not under it (v12, 11 October; Will: "less is
  more"). Hover or focus shows it, a tap pins it, and Esc or a tap elsewhere closes it.
- At phone width the map turns vertical: Will, then Mira, then teammates in two columns.
- With "reduce motion" on, nothing moves; colours and badges still say everything.

**Waiting on you.** One card per decision: the question in plain words, why it matters
in a sentence or two, Mira's advice, who asked, and a **Reply** button. Reply puts the
card's question at the start of the message box. (Until 19 October a chat, Talk to Mira, sat
under the cards; Will moved the conversation into each item, above.)
- **Pictures and colours on a card** (Will, 12 October: "It's difficult to approve design decisions without
  seeing it"): `images` show as a grid (a video plays in place; a picture opens full screen), and a hex colour in
  any text shows a sample of itself. A design change Will asked for goes back to him as a picture before it ships.
- **A tick box in front of every title** (Will, 13 October: "add a checkmark for me to cross off items already
  reviewed"), in Waiting on you and Ready for you: a ticked card folds into "Reviewed" at the bottom of its
  section, crossed out, and leaves the counts. Kept on the card (`reviewed`, `reviewedAt`), so it holds on every
  device; a card asked again (`askedAt`) or re-dated (`at`) after the tick comes back.
- **The title opens and closes its card** (same day: "clicking on header … should expand or minimize the item"),
  for every card; an answered card starts closed. **Reply is an outlined button** ("make Reply more prominent").
- Sending: the page keeps the message on the board (`chat/<id>`, `from: "will"`) and
  sends it to Mira with Claude's own **Send to Claude** (`comments.sendToClaude`, a
  comment anchored on `#chat`, which stays in the page as a one-pixel anchor though the
  conversation section is gone). That wakes the merge-desk session, which is subscribed
  to this artifact. The first send asks Will's OK once. Sent from an opened item, the box
  starts with `About "<title>": ` so Mira knows which one.
- Answering: Mira writes `chat/<id>` with `from: "mira"`, `text`, `at`, `re` (the id
  of Will's message, which ends every sent comment as "(Control Room chat · <id>)") and
  `about` (the `roadmap/` or `notes/` key it belongs to), then replies in the comment thread
  too. A decision answered in the chat gets its card marked `answered`.

**What I'm doing.** Mira's one-line "Right now", then the message feed: time, coloured
dot, who → who, and the message in plain words.

**Ready for you.** Will, 10 October: it "needs to provide me with useful links (if
available), and needs to be up to date."
- **Always here:** a row of links that are useful on any day (`desk/links`): the app, the
  website, Storybook, the Figma flow map, Supabase, Resend.
- **One card per thing Will can open:** where it is (In the app, On the website, In
  Storybook), when it went live, what it fixes, how to try it, and buttons that go straight
  to it (a deep link to the screen, post or story, not just the home page). Today's cards
  show; older ones fold under "Earlier".
- **Up to date means:** a card is added the moment something goes live, and a card that no
  longer says something new is hidden (`hidden: true`). The section heading says when it
  last changed.

**Next push** (v48, 18 October; Will: show what goes live next and why). One row per
feature (`roadmap/`), the next push's first, then the one after. A row has a small picture
(the first of the newest round, Will 05:07 and 05:12: "uses the latest images from Dot"), the
title, its state (Building, Finishing, Ready) and a **dot when something is new since Will
last opened it**: a Mira answer about it, or a new round of pictures (Will, 05:15: "So I know
when to check it"). What was seen is kept on Will's device (`localStorage`, `cr-seen`), so a
new phone starts with no dots. Under the heading: when the push goes live, **with its date and
time, marked tentative until it is certain** (`desk/push`, Will 05:18; how Mira sets it is in
`team.md`, "The merge desk batches"). On a wide screen the list is pinned on the right.
- Tapping a row opens it: **a dark box first with Mira's latest answer about it**, or "I have
  your question" while Will's message is newer than her answer (Will, 05:14: "a dark grey box
  reversed for Mira's summary to any questions I have, in real time"); then what changes, why,
  what it waits on, and the pictures.
- **Pictures in rounds, newest on top** (Will, 05:12: "latest images on top, older images
  below. Show images smaller … flip through them like a carousel, and click to expand"). A
  round is every picture with the same `at`; each is a row to swipe or step through with
  Previous and Next, "1 of N" beside it. A tap opens the picture full screen; Esc closes only
  that.

**Your notes** (v49, 19 October; Will, 04:51: "Why are decisions and revisions not being
pushed as new action items in Pam's control room?"). One row per decision or change Will
gives, anywhere: when, his words, and where it stands: *Needs you*, *Pictures for you*, *Being
built*, *Taken*, *Live*, *Noted*. Live and Noted fold into Done (five shown, then Show all).
Tapping one opens what he said, what is being done, where it lands, the pictures, and a link
to its Next push item when it has one.

**Who's on the team.** A card per teammate: avatar, first name, job title, lane, what
they do, status, live state, *Doing now*, *Waiting on*, *Finished recently*, branch.

## Where the data lives

The artifact's own store (the `db` capability). Only the owner and editors write; Mira
writes as Will with the artifact data tool.

| Path | One document per | Fields |
|---|---|---|
| `team/<key>` | teammate (`desk` is Mira) | `nick`, `title`, `avatar`, `name` (lane), `short`, `job`, `status`, `sessionId`, `doing[]`, `waitingOn[]`, `done[]`, `branch`, `links[]`, `order` |
| `links/<from>-<to>` | teammate-to-teammate link | `from`, `to`, `label`, `active` |
| `asks/<id>` | decision for Will | `question`, `why`, `advice`, `from[]`, `order`, `status` (`answered` hides it) |
| `ready/<id>` | thing to try | `title`, `where`, `problem`, `how`, `links[]` (`label`, `url`), `from`, `at`, `hidden` |
| `desk/links` | — | `items[]`: `{label, url}` (the Always here row), `updatedAt` |
| `desk/now` | — | `doing`, `updatedAt` |
| `events/feed` | — | `items[]`: `{at, from, to, kind, text}`, newest 40 kept |
| `chat/<id>` | chat message | `from` (`will` or `mira`), `text`, `at`, `state` (Will's: `sending`, `delivered`, `failed`), `re` (Mira's: the message answered), `about` (Mira's: the `roadmap/` or `notes/` key) |
| `roadmap/<key>` | feature in the next push or the one after | `title`, `summary`, `why`, `waiting`, `status` (`building`, `finishing`, `ready`), `push` (`next`, `after`), `order`, `pics[]`: `{src, caption, at, round}` (`src` is `/_blob/<id>`; one `at` is one round), `updatedAt` |
| `notes/<key>` | decision or change Will gave | `at`, `said` (his words), `title`, `doing`, `lands`, `status` (`you`, `pictures`, `building`, `taken`, `live`, `noted`), `pics[]`, `feature` (a `roadmap/` key), `updatedAt` |
| `desk/push` | — | `name` (the batch), `at` (when it goes live), `tentative`, `when` (what it waits on, in words) |

**Live layer (optional).** With Will's permission the page reads the Claude Code
session list every minute (`list_sessions`, read only, declared as the page's one
`mcp` tool) and matches it to `sessionId`, for "Waiting for you to unblock". If that is
off or unavailable, everything else still works from Mira's updates. Sessions that are
not on the team are ignored.

**Privacy.** No phone numbers, email addresses, keys or member data, ever. The page is
private to Will unless he shares it.

## How Mira keeps it current

- Every message to or from a teammate: one `events/feed` item, and the teammate's card
  (`status`, `doing`, `waitingOn`, `done`) if it changed.
- A question only Will can answer: an `asks/` card with Mira's advice. When he answers,
  `status: "answered"`, and the answer goes to the teammate.
- Something Will can test: a `ready/` card in plain words — where, what it fixes, how to
  try it, and a link straight to it — the moment it is live. Hide the cards it replaces.
- **Every answer to Will's chat message goes into `chat/` as well as the comment thread,**
  with `re` and `about`. The page shows only `chat/`; on 10 October, answers given only in
  comment threads left his afternoon's messages looking unanswered until they were filled in
  at 18:00, and from 14 to 19 October it happened again (the lesson in the merge desk's log,
  b78).
- `desk/now` whenever Mira's own work changes.
- **Every decision or change Will gives becomes a `notes/` row in the same turn, before anyone
  is sent to build it** (19 October, 04:51; until then his direct notes went only into
  `desk/now`, which had not changed for three hours). Its status moves Taken → Being built →
  Pictures for you → Live (or Noted), and pictures are added as they come.
- A teammate's READY ends with "For the roadmap:"; Mira moves the item's `status`, rewrites
  `waiting`, and adds its pictures to `pics[]` as a new round with the time they were taken.
- `desk/push` whenever the next push's time or what it waits on changes.
- **Every decision Will gives, anywhere** (this page, the terminal, a teammate's session) goes into the merge
  desk's session log within the hour: his words, the time, who builds it, and where it will be recorded (a
  decision file, a row in `docs/signed-english.md`, a card). Until it is built, the log is its record (Will,
  13 October: "ensure all these decisions are being documented").
- **Times come from the clock** (`date -u`), never estimated: a chat message stamped ahead of time sorts after
  Will's next message (13 October).

## Checks before it ships (the double pass)

**Pass 1: does it look right?** Render it with the real data, through a stand-in for the
store, at laptop and phone width, light and dark:
- nothing overlaps;
- no sideways scrolling;
- every badge and label is readable;
- lines, arrows and dots are visible;
- every section is filled;
- no errors in the console.

**Pass 2: is it built right?** A reviewer who did not build it reads the code against
this page, item by item. Is every item above present? Does the code read the same field
names the data has? Are errors handled? Does reduced motion work? Can each teammate be
reached by keyboard? Is there no way for stored text to become markup?

**After publishing:** read each collection back once to confirm the data landed.

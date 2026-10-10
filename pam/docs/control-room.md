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
- **The message box** to Mira is fixed to the bottom of the screen on every part of the page.
  The conversation itself stays in Waiting on you. When Mira answers while the conversation
  is off screen, a line above the box says so, with a button that goes to it.
- **Section tabs** slide in at the top once the four numbers have scrolled away: Waiting on
  you (with its count, green when it isn't 0), Ready for you (count), Conversation, What I'm
  doing, Team. The Pam mark goes back to the top. The tab for the part you're reading is
  underlined; on a phone the row scrolls sideways and keeps that tab in view.

**Header.** Pam's app icon (the same drawing as `apps/web/src/app/icon.svg`), the name, and a status chip: *Live* (the session list is being read every
minute), *Board connected* (my updates arrive, live status off), or *Offline copy*. When
live status needs Will's one-time permission, the chip carries a **Show live status**
button.

**At a glance.** Four numbers: waiting on you, ready for you, messages today, building now.
Each is a button that takes you to its section (Will, 10 October: "I want to click on these
and go to section"). The sections run in that order too: 01 Waiting on you, 02 Ready for
you, 03 What I'm doing, 04 The team.

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
- At phone width the map turns vertical: Will, then Mira, then teammates in two columns.
- With "reduce motion" on, nothing moves; colours and badges still say everything.

**Waiting on you.** One card per decision: the question in plain words, why it matters
in a sentence or two, Mira's advice, who asked, and a **Reply** button. Under the cards,
**Talk to Mira**: a chat, so Will can run the team from this page alone (Will, 10
October: "Add a chat in … 'Waiting on you' so I can use that alone to manage you").
Reply puts the card's question at the start of the message box.
- Sending: the page keeps the message on the board (`chat/<id>`, `from: "will"`) and
  sends it to Mira with Claude's own **Send to Claude** (`comments.sendToClaude`, a
  comment anchored on the chat). That wakes the merge-desk session, which is subscribed
  to this artifact. The first send asks Will's OK once.
- Answering: Mira writes `chat/<id>` with `from: "mira"`, `text`, `at` and `re` (the id
  of Will's message, which ends every sent comment as "(Control Room chat · <id>)"),
  then replies in the comment thread too. A decision answered in the chat gets its card
  marked `answered`.
- The message shows "sending…", "sent to Mira", or "not sent" with Try again. While
  Mira hasn't answered, a line says Mira is working on it.

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
| `chat/<id>` | chat message | `from` (`will` or `mira`), `text`, `at`, `state` (Will's: `sending`, `delivered`, `failed`), `re` (Mira's: the message answered) |

**Live layer (optional).** With Will's permission the page reads the Claude Code
session list every minute (`list_sessions`, read only) and matches it to `sessionId`,
only to light up "working right now". If that is off or unavailable, everything else
still works from Mira's updates. Sessions that are not on the team are ignored.

**Privacy.** No phone numbers, email addresses, keys or member data, ever. The page is
private to Will unless he shares it.

## How Mira keeps it current

- Every message to or from a teammate: one `events/feed` item, and the teammate's card
  (`status`, `doing`, `waitingOn`, `done`) if it changed.
- A question only Will can answer: an `asks/` card with Mira's advice. When he answers,
  `status: "answered"`, and the answer goes to the teammate.
- Something Will can test: a `ready/` card in plain words — where, what it fixes, how to
  try it, and a link straight to it — the moment it is live. Hide the cards it replaces.
- **Every answer to Will's chat message goes into `chat/` as well as the comment thread.**
  The page shows only `chat/`; on 10 October, answers given only in comment threads left
  his afternoon's messages looking unanswered until they were filled in at 18:00.
- `desk/now` whenever Mira's own work changes.

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

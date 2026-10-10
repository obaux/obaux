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

**Header.** The name, and a status chip: *Live* (the session list is being read every
minute), *Board connected* (my updates arrive, live status off), or *Offline copy*. When
live status needs Will's one-time permission, the chip carries a **Show live status**
button.

**At a glance.** Four numbers: building now, waiting on you, ready for you to try,
messages today.

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
in a sentence or two, Mira's advice, who asked, and "Reply to me in our chat". Will
answers in the chat; the page never takes answers itself.

**What I'm doing.** Mira's one-line "Right now", then the message feed: time, coloured
dot, who → who, and the message in plain words.

**Ready for you to try.** One card per thing Will can open: what it fixes, how to try
it, and buttons (the app, Storybook, the Figma flow map).

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
| `ready/<id>` | thing to try | `title`, `problem`, `how`, `links[]`, `from`, `at`, `hidden` |
| `desk/now` | — | `doing`, `updatedAt` |
| `events/feed` | — | `items[]`: `{at, from, to, kind, text}`, newest 40 kept |

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
- Something Will can test: a `ready/` card in plain words — what it fixes, how to try
  it, a link.
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

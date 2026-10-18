# Message Pam, pass 1: what's built so far (18 October 2026)

Iris. The merge desk's note at 16:10: Message Pam is the next release, and this pass is the gate
before it's switched on. Start now on what's built, with my test plan (`ea946d09`) and the switch
on in a local fixture. Walk it as a member, a case manager, a program lead and the super admin,
including the New York clock around 9:00 and 17:00. The full pass waits for Ava's S2 to S4.

## How

- **What I tested:**
  - **The person's side:** `claude/messages-pam-s0-s1a` at its tip, `42ad552b` (slices 2 and 3:
    per-message status, Pam's row and thread, the help route, photos with progress and Try again).
  - **The team's inbox:** `claude/pam-message-pam-admin` at `647dd0d3` (S1).
  - Each one's `build:e2e` app on 127.0.0.1. Every other host was refused, and Chromium's updater
    and speech feature were off.
- **People and data:** made-up people, with the database's answers given by the test the way the
  branches' own specs (`message-pam.spec.ts`, `pam-inbox.spec.ts`) give them, and the switch on.
  Nothing was sent. Nobody signed in to anything real, and nothing reached the live project.
- **The hours rule:** I ran the database's own functions (`pam_is_open`, `pam_next_open`,
  `pam_last_close`, copied from migration `20261018072339`) in a throwaway local Postgres. The repo's
  full database suite needs PostGIS, which isn't installed here, so I ran these functions alone
  rather than install anything.
- **The setup:** Playwright in Chromium with touch, at 320×568, in English and Arabic, with key
  screens at 390.

## The result

**The core works:**

- Sending is fast: on screen in 70–80ms in the stub.
- Nothing is lost or doubled, after a server error, a dropped connection, or an answer that went
  missing.
- Photos fail and retry cleanly, and a PDF to Pam is refused.
- A limited account can write to Pam.
- The inbox sorts and reads right in English and Arabic.
- The 9:00 and 17:00 edges are right in the database.

**Not ready to switch on, for three reasons:**

1. **Replies don't appear while the thread is open (S1 below).** A person writing at night sees
   nothing back, not even the automatic reply, unless they leave and come back.
2. **Pam's words are still English in all six other languages (S2).**
3. **The team's thread offers Block and Report on a Pam conversation (W5).** That was settled as not
   allowed.

## Findings, worst first

### Stops someone

| # | Lane | Where | What happened | What should happen |
|---|---|---|---|---|
| S1 | Nico | The person's Pam thread (and every conversation) | **Nothing new appears while the thread is open.** I wrote "Is anyone there?" on a Saturday afternoon (clock pinned in New York). The database adds the out-of-hours reply straight after, but the thread didn't show it right away, nor after 30 seconds. It showed only after leaving and coming back (one read of the messages at load, none after). A reply from the team would be the same. The app has no live update or polling anywhere in messaging (`useThread` reads once per open, and `refresh()` is returned but not used by `ThreadView`). For someone writing to a support line, often at night, the screen looks like nobody answered. | Pam's replies and the out-of-hours reply appear in the open thread. Live (realtime), or at least read again after a send and while the thread is open. The Messages list and the bell should follow too. |
| S2 | Lena | Everywhere Pam speaks, in the six languages other than English | **15 of the 24 new strings are still English in `ar`, `es`, `pt-BR`, `ru`, `zh-CN` and `zh-HK`** (16 with `pam.name`, which may be meant to stay "Pam"). That covers the welcome, the out-of-hours reply and its 988 line, the hours line, "Write to Pam" (the box and Help's row), "Send a photo.", and, in **every** conversation, "Sent", "Not sent", "Try again" and "Not sent. Try again.". The spec's per-language check passes only because each bundle holds the English words. In Arabic the hours line comes out half and half: "Pam is here الاثنين to الجمعة, 9 ص to 5 م Eastern time" (`shots/2026-10-18-mp1-away-ar-320.png`). | All of them in each language before the switch. |

### Slows someone

| # | Lane | Where | What happened | What should happen |
|---|---|---|---|---|
| W1 | Nico | The Pam thread, with a screen reader | **Every message from Pam is read as "This person":** the welcome, the out-of-hours reply and the team's replies ("This person, 2:19 PM, Hi Will, it's Pam…"). Pam's mark beside them is read as "This person" too. In Arabic, "هذا الشخص". | "Pam, 2:19 PM, …", and the mark named "Pam". |
| W2 | Nico (and Mira, on intent) | Help, and Your safety | **Help's first row, "Contact Pam", still opens the website's help desk for a signed-in person.** The in-app route is a separate last row, "Write to Pam". On Your safety, "Talk to someone now" opens the website's Your safety post. Will: "Help routes reach Pam in the app". The notices' "Contact Pam" and `/messages/pam/` do open the thread. | Signed in, "Contact Pam" on Help (and "Talk to someone now", if that's meant) opens Pam's thread. Or the two rows are told apart so nobody taps "Contact Pam" and leaves the app. |
| W3 | Nico / Lena | Messages, for a limited account | **The notice says "You cannot send messages right now"**, while the Pam row under it can be written to, and the notice's own "Contact Pam" opens that thread (`shots/2026-10-18-mp1-limited-messages-320.png`). | A line that says they can still write to Pam. |
| W4 | Nico | A send refused for the limit (`PAM_RATE_LIMITED`: 30 an hour, 150 a day) | **It shows "Not sent / Try again"**, and Try again fails the same way, with no reason. The words stay in the bubble, not the box. Migration `20261018073013` says the app "turns [it] into a calm line and keeps the draft"; the app doesn't check for that code when sending (it's only listed in `pam.ts`). Rare, but when it happens it can't be got out of. | The calm line, and no Try again until the limit has passed. |
| W5 | Ava | The team's view of a Pam thread (647dd0d3) | **⋯ is there, and opens Options with "Report suspicious activity" and "Block this person".** The desk settled this at 07:17: "no block and no report on a Pam conversation, on either side". The person's side has no ⋯. | No ⋯, or ⋯ without Report and Block, on a Pam conversation. |
| W6 | Ava (with Nico's `ThreadView`) | The team's view of a Pam thread | **Pam's welcome shows as the team's own message:** "You, 4:31 PM", in a green bubble on the right (`shots/2026-10-18-mp1-team-thread-en-320.png`). The team can't tell it was automatic, and the same will happen to the out-of-hours reply. | System messages read as Pam's or as automatic, on the other side from the team's own. |

### Polish

| # | Lane | What |
|---|---|---|
| P1 | Nico | The out-of-hours reply's "988" is plain text, not a tap to call or text (the safety page's 988 row is). |
| P2 | Nico | A send that never gets an answer stays "Sending…" with no end. A 20-second answer did finish as "Sent". |
| P3 | Nico | The out-of-hours reply draws the hours as they are when it's read, not when it was sent. If Pam's hours change, old replies change with them. |
| P4 | Ava | With the switch off, `/pam/messages/` tells the super admin "This screen is for the Pam team. Your account does not open this." That's the wrong reason. |
| P5 | Ava | When the inbox can't be read: "Something went wrong… Try again…", but there is no Try again button, only "Contact Pam", which is odd for the Pam team. |
| P6 | Ava | The team's thread says "Back to Messages" but goes back to Messages to Pam. Right place, wrong words. |
| P7 | Ava | The team's composer has "Add a document". The person can't send a document to Pam. Is the team meant to? |
| P8 | Lena | Arabic inbox: "في الانتظار منذ 2 يومين" puts a 2 before the dual "يومين" (which already means two days) (`shots/2026-10-18-mp1-inbox-ar-320.png`). |

## What passed

### The person's side (member, at 320, en and ar)

| Plan case | Result | What I saw |
|---|---|---|
| A1 Pam in Messages from day one | **PASS** | The row "Pam", New, with the welcome "Hi Will, it's Pam. If you need help with anything, reply here." The same for a case manager and a program lead. |
| A2 / H The thread | **PASS** | It reads like any other thread: the heading "Pam" and Pam's mark (`shots/2026-10-18-mp1-thread-en-320.png`). The box is "Write to Pam". The controls are Back, the microphone, Add a photo and Send, all 48px. There's no document button, no ⋯, no card, and nothing cut or scrolling sideways. |
| A3 Routes | **PASS / see W2** | Help's "Write to Pam" and `/messages/pam/` both open the thread. A notice's "Contact Pam" (limited account) opens it too. A super admin at `/messages/pam/` lands on Messages, as D-609 says. |
| B1, B4, B6 Sending | **PASS** | On screen in 81ms (en) and 70ms (ar), and the box clears. "Sent" under the last message. A double tap sends one. Three quick sends arrive once each, in order. Everything is still there after a reload. |
| B2, B3 Long and mixed | **PASS** | A 5,000-character message sends and doesn't widen the screen. Arabic with a link and an emoji reads right to left. |
| G1 to G5 Failure and retry | **PASS** | A 500, a dropped connection, or an answer lost after the message was stored: each shows "Not sent" with a 48px Try again, and the words are kept (`shots/2026-10-18-mp1-not-sent-en-320.png`). Try again stores exactly one copy. When the first try had in fact landed, it doesn't send again. |
| C1, C5 Photos | **PASS** | A screenshot shows a preview, uploads with progress and is stored. A failed upload stays "Not sent". Try again checks first, uploads once and stores one photo. A 12 MB screenshot goes. |
| C2 A PDF to Pam | **PASS** | "Send a photo.", and Send stays off (`shots/2026-10-18-mp1-pdf-refused-en-320.png`). |
| E A limited account | **PASS / see W3** | It writes to Pam, and the message is stored. |
| D The out-of-hours reply, as drawn | **PASS / see S1, S2** | Once on screen: "Thanks for writing. Pam is here Monday to Friday, 9 AM to 5 PM Eastern time, and we'll read your message then." and "In a crisis, call or text 988.", on Pam's side, not labelled as automatic. |

### The hours rule, in the database's own functions (throwaway Postgres)

| Moment (New York) | Open? | Next opening | Last closing |
|---|---|---|---|
| Mon 19 Oct 08:59:59 | no | Mon 09:00 | Fri 16 Oct 17:00 |
| Mon 19 Oct 09:00:00 | **yes** | – | – |
| Mon 19 Oct 16:59:59 | **yes** | – | – |
| Mon 19 Oct 17:00:00 | no | Tue 09:00 | Mon 17:00 |
| Fri 23 Oct 17:00:00 and Sat 24 Oct 12:00 | no | Mon 26 Oct 09:00 | Fri 23 Oct 17:00 |
| Sun 1 Nov 01:30, before and after clocks go back | no | Mon 2 Nov 09:00 (EST) | Fri 30 Oct 17:00 |
| Mon 2 Nov 09:00:00 (EST) | **yes** | – | – |
| Sun 8 Mar 2026 03:30, after clocks go forward | no | Mon 9 Mar 09:00 | Fri 6 Mar 17:00 |

**One reply per closed stretch.** A message on Friday at 17:00:00 gets the reply. Messages at
Friday 17:05, Saturday 10:00, Sunday 22:00 and Monday 08:59:59 don't get another, because their
"last closing" is the same Friday 17:00. Monday 17:01 starts a new stretch. In the app (stub server
using the same rule), 16:59:59 and 09:00 got no reply, and 17:00:00, 08:59:59 and Saturday got one.

### The team's side (super admin, 647dd0d3, 320 en and ar, and 390)

| Plan case | Result | What I saw |
|---|---|---|
| Home's row | **PASS** | "Messages to Pam" leads to the inbox. |
| F1 The inbox | **PASS** | "Waiting for Pam" puts the longest wait first: Marcus (2 days), Aaliyah (3 hours), Lou (20 minutes), Christopher-Alexander (5 minutes). Each says how long. Then Answered (Dana, "You: We have fixed your city."), then "Closed conversations 1" folded, then "Last 30 days: half of Pam's first replies came within 4 hours." Long names wrap, previews end in "…", and nothing is cut or scrolls sideways at 320 in English and Arabic (right to left), or at 390 in English. |
| F1 Tapping a row | **PASS** | A row opens from its avatar side, its date side and its middle, at the bottom edge. |
| F3 Opening and replying | **PASS / see W5, W6** | Marcus's conversation opens with his messages in order. A reply that fails stays "Not sent", and Try again stores one copy. Back returns to the inbox. The photo button is there. |
| States | **PASS / see P4, P5** | Empty: "Nobody is waiting for Pam." Inbox fails: the something-went-wrong notice. |

## Not covered yet

- **Ava's S2 to S4:** close and reopen, saved replies, starting as Pam (a person or a program), and
  the hours editor. The full pass runs when Mira says they've landed.
- **Real live delivery:** the stub has no realtime. S1 rests on the code having none, and on the app
  not reading again.
- **The whole database suite** (79 to 83), which needs PostGIS here. I ran only the hours
  functions.
- **On Will's phone:** VoiceOver and TalkBack, the keyboard over the composer, a real screenshot from
  the camera roll, and the bell or text when Pam replies.

Iris

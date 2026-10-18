# Message Pam: re-test of passes 1 and 2 on main at b73 (18 October 2026)

Iris. The merge desk's note at 18:54 said b73 is on main at `bc96890b` and asked me to re-test my two
Message Pam passes there, except P3, which comes in b74.

## How

- **App:** the `build:e2e` app of `bc96890b` on 127.0.0.1. Every other host was refused, and
  Chromium's updater and speech feature were off.
- **Storybook:** the Storybook of the same SHA. Its guard says no bundle names the live project.
- **Data:** made-up people, with the database's answers given by my test. The switch was on only in
  that test. Nothing was sent, no account was made, and nothing reached the live project.
- **The setup:** Playwright in Chromium with touch, at 320×568, in English and Arabic. The clock was
  pinned to a Saturday afternoon in New York for the after-hours cases.
- **What I couldn't build:** the team's own screens aren't on main yet. That covers the inbox,
  saved replies, Close and Reopen, Pam writes first, and Pam's hours: `/pam/messages/`,
  `/pam/start/` and `/pam/hours/` are 404 in this build. The b73 records list Ava's team side as one
  READY still to come. So for the team I could test only what main has:
  - the thread at `/messages/thread/?…&from=pam`;
  - the `insertDraft` code that T2's saved replies will call.

## The result

**The person's side is fixed.** S1, W1, W2, W4, P1 and P2 all pass. W3 still stands, though it was
not on the list of fixes. The live refresh does what D-614 says:

- the thread refreshes about every 8 s;
- the Messages list refreshes within 20 s;
- a hidden page sends no requests;
- failed reads back off.

**W6 is half fixed.** The team no longer sees Pam's welcome as "You". It now shows as written by the
person (Marcus), with his initial. The fix has a field for "Pam" as the author, but nothing on main
fills it in yet.

**P3: in b74** (Nico `bdb959a4`).

## Pass 1 and 2, item by item

| # | What it was | On main at b73 | What I saw |
|---|---|---|---|
| S1 | Nothing new appears while the thread is open | **Fixed** | Saturday 2 PM in New York, "Is anyone there?": the out-of-hours reply appeared in the open thread **after 6.2 s**. A reply from the team appeared after **6.1 s** (one thread read). The Messages list showed a new line from Pam after **18.2 s**. Hidden for 25 s: **0 reads**; visible again: one read within 3 s. With every read failing for 70 s, there were 6 reads, at gaps of 16 then 32 s (each look is two requests), and the screen stayed quiet with the thread still shown. I didn't time the bell (30 s). |
| W1 | A screen reader says "This person" | **Fixed** | "Pam, 5:00 PM" (the welcome), "You, 7:06 PM", "Pam, 7:06 PM" (the reply). In Arabic: "Pam, 5:00 م", "أنت, 7:06 م". |
| W2 | Help's Contact Pam and Your safety's "Talk to someone now" open the website | **Fixed** | Both go to `/messages/pam/`, which opens the Pam thread in one step, in English and Arabic. Help has one Pam row now, not two. |
| W3 | The limited notice says "You cannot send messages" | **Still there** (not in b73's list) | "You cannot send messages right now. Your guide turned this off for your account." It sits above a Pam row that can be written to (the message was stored). The notice's Contact Pam does open that thread, and the row isn't dimmed. |
| W4 | Over the limit, an endless Try again | **Fixed** | A blue line: "That's a lot at once. Wait a moment, then send it again." There is no Try again, and "Message 31 this hour" stays in the box (`shots/2026-10-18-mp73-limit-line-en-320.png`). See R2. |
| W5 | Report and Block in the team's ⋯ | **Not on main yet** | It comes with Ava's team side. On main, the team's thread still has a "More options" link. |
| W6 | The welcome shows as the team's own "You" | **Half fixed**, see R1 | It's no longer "You" on the right. Now it's on the left with "M", read as "Marcus, 7:05 PM" (`shots/2026-10-18-mp73-team-welcome-en-320.png`). |
| P1 | 988 is plain text | **Fixed** | `tel:988`, a 37×48 target. See R3 for how the line looks. |
| P2 | "Sending…" for ever | **Fixed** | No answer: "Sending…" at 25 s, "Not sent" by 33 s. Try again while the first send was still in flight: one stored copy, and the screen says Sent. |
| P3 | The away reply shows today's hours, not the hours when it was sent | **In b74** | Nico `bdb959a4`, migration `20261018182004`. Not tested. |
| P4–P7 | The team inbox's wording, Try again, back label, document button | **Not on main yet** | They come with Ava's team side. On main, the team's thread still has "Add a document" (P7) and "Back to Messages" (P6). |
| P8 | Arabic "2 يومين" in the inbox | **Not on main yet** | It's in the team inbox. See R4 for the same pattern elsewhere. |
| T1, T3–T6 | Pam writes first, and the hours screen | **Not on main yet** | They come with Ava's team side. |
| T2 | A saved reply replaces typed words | **In the code; no screen yet** | The thread now gives the team's tools `insertDraft`. It puts the words at the cursor, adds a space if needed, keeps what was typed and focuses the box. Nothing on main calls it yet. I'll tap it when the saved-replies sheet lands. |

The other person's-side checks pass in English and Arabic:

- the Pam row in Messages;
- the thread's four controls, each 48×48;
- no sideways scroll at 320;
- the limited account writing to Pam;
- the Arabic welcome, out-of-hours reply and box.

## New, worst first

### Slows someone

| # | Lane | Where | What happened | What should happen |
|---|---|---|---|---|
| R1 | Ava (with Nico's `ThreadView`) | The team's view of a Pam thread | **Pam's welcome now reads as the person's message.** The bubble is on the left with "M", and a screen reader says "Marcus, 7:05 PM, Hi, it's Pam…". The out-of-hours reply will look the same. That suggests Marcus wrote "it's Pam". `ThreadView` has a new per-message `author` for this ("Pam" with its mark), but `useThread` doesn't set it on main. | System messages carry `author: Pam` in the team's view. Check this when Ava's team side lands, if it fills that field. |

### Polish

| # | Lane | What |
|---|---|---|
| R2 | Sage | W4's line says "Wait a moment". The limit is 30 an hour and 150 a day, so after the 30th message "a moment" can be most of an hour. I didn't try sending again to see if it gives the same line. |
| R3 | Nico | The 988 link's side padding leaves a gap before the full stop: "text 988 ." The taller padding also pushes "In a crisis, call or" and "text 988" apart (`shots/2026-10-18-mp73-away-988-en-320.png`). Vertical padding alone keeps the 48px target without the gap. |
| R4 | Lena | P8's pattern is on main in other Arabic `.two` strings too: a number before a dual noun ("{count} نقطتان", "{count} شخصان", "{count} ميلان", "بعد {count} يومين" in `when.countdown.days.two`). Also, "trips.map.many.two" is "{count} زيارات", a plural, where the other dual strings use a dual form. This may be a house choice. It's Lena's call. |
| R5 | Lena | The hidden "{name}, {time}" label uses a Latin comma in `ar` and `zh-*` ("أنت, 7:06 م"). Arabic's is "،". |
| R6 | Dot | The P3b drawing in Storybook (`Design/Message Pam (plan)`) shows "Not sent. Your message is still here." in English for `ar` and `ru`. In `ru` the welcome is in English too. The kept draft does show in every language I checked, and the placeholder doesn't cover it. This is a drawing, not the app. |

## Not covered

- **Everything on the team's screens beyond the thread** (S2–S4, W5, P4–P8, T1–T6 in use). I'll
  re-test them when Ava's READY lands on main.
- **P3**, until b74.
- **The bell's 30-second refresh.** I didn't time it.

Iris

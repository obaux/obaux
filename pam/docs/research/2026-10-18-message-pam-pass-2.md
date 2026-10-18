# Message Pam, pass 2: the team's side, S2 to S4 (18 October 2026)

Iris. The merge desk's note at 17:05: start pass 2 on the team's side from a local build of
`claude/pam-message-pam-admin` @ `1b67f588`, with the person's side from Nico's `3a2f64a0`. The
slices are S2 (saved replies, close and reopen), S3 (Pam writes first, from Everyone and from a
program's page) and S4 (Pam's hours).

**Not filed again (already routed by the desk):**

- the team's words still in English in the other six languages;
- W6, the welcome showing as "You";
- P4 to P7;
- the team composer;
- `profile_roles`;
- S1, live updates.

## How

- **Builds:** the `build:e2e` app of each SHA on 127.0.0.1. Every other host was refused, and
  Chromium's updater and speech feature were off.
- **People and data:** made-up people, with the database's answers given by the test the way
  `pam-team.spec.ts` gives them, plus failures and slow answers of my own. Nothing was sent, and
  nothing reached the live project.
- **The setup:** Playwright in Chromium with touch, at 320×568, in English and Arabic.
- **The database:** I read its refusals in `20261018072644_the_pam_team_inbox_and_starting_a_conversation.sql`
  (for the start cases).

## The result

The three slices work, and each guards against double taps:

- a saved reply never sends itself;
- Close and Reopen call once per tap and say when it didn't go through;
- starting a conversation makes one, even on a double tap;
- the hours screen refuses bad hours before anything is sent.

**Two things lose the team's words**, and should be fixed before the switch:

- a failed first message empties the box (T1);
- a saved reply replaces what was already typed (T2).

## Findings, worst first (all for Ava)

### Slows someone

| # | Where | What happened | What should happen |
|---|---|---|---|
| T1 | Pam writes first, to a person or to a program's leads | **When sending fails, the words are gone.** I typed "Hi Aaliyah, your city is fixed." and the start was refused (a 500). The screen said "That didn't go through. Try again." in small grey text under the name, and the box was empty (`shots/2026-10-18-mp2-start-failed-en-320.png`). The same happens to a program's leads ("Your hours look out of date."). In a person's thread, a failed reply is kept as "Not sent" with Try again. Here it isn't. | The words stay in the box (or as a "Not sent" message with Try again, as in a thread), and the line is easy to see. |
| T2 | Saved replies, in a person's thread | **A pick replaces what was already typed, without asking.** With "Hi Aaliyah," in the box, picking "Your guide is the best person for this…" left only the saved reply; "Hi Aaliyah," was gone. Focus didn't go back to the box either, so the next step is a tap. | Add the reply to what's there (after a space or a new line), or ask before replacing. Then put the cursor in the box. |
| T3 | Everyone, on a super admin | **"Message Sam as Pam" is offered on a super admin, and can never work.** The database refuses a super admin as the person (`NOT_ALLOWED`), and the screen answers "That didn't go through. Try again." The same retry line answers `PAM_OFF` (the switch is off). Trying again can't help either. | No "Message … as Pam" on a super admin. A refusal that a retry can't fix says what's true (for example "Pam can't write to the Pam team."). |

### Polish

| # | Where | What |
|---|---|---|
| T4 | Pam's hours | While the times are wrong, the preview still shows a reply that can't be right: "Pam is here Monday to Friday, 5 PM to 9 AM Eastern time". Or "9 AM to 9 AM" with equal times. Save rightly refuses with "Pam has to close after it opens.", but the preview shouldn't promise the impossible. Hide it, or show it dimmed, while the times are wrong. |
| T5 | Pam's hours, at 320 | The times sit high in their fields: "9:00 AM" and "5:00 PM" overlap the top edge of each box (`shots/2026-10-18-mp2-hours-en-320.png`). The clock icon inside each field is a 16×48 target. |
| T6 | The start screen's failure line | "That didn't go through. Try again." is in the small grey line under "Aaliyah sees this as from Pam.". It's easy to miss for a failure. |

## What passed

| Slice | Case | Result | What I saw |
|---|---|---|---|
| S2 | The saved-replies sheet | **PASS** | "Saved replies" is 108×48 in the composer. The sheet has three replies (rows of 73, 73 and 97px), and nothing is cut or scrolls sideways at 320 in English or Arabic (`shots/2026-10-18-mp2-saved-replies-en-320.png`). |
| S2 | Leaving without a pick | **PASS** | A tap outside closes it, and the box is untouched. |
| S2 | A pick sends only on Send | **PASS** | Nothing went until Send, then one message. (See T2 for words already in the box.) |
| S2 | Close and Reopen | **PASS** | ⋯ opens the team's own Options: "Close conversation" (226×48) and "Stuff shared", with no Report and no Block. Close says "Closed." and turns into "Reopen conversation" (`shots/2026-10-18-mp2-closed-en-320.png`). In the inbox it moves to "Closed conversations 1". |
| S2 | A double tap on Close | **PASS** | One call. |
| S2 | Close fails | **PASS** | "That didn't go through. Try again.", and it stays open. |
| S3 | Starting a conversation | **PASS** | Send stays off with an empty box. One start, even on a double tap. It lands in the person's thread with the message marked "Sent". |
| S3 | A program's leads | **PASS** | "This goes to each of the program's leads. They see it as from Pam." Sending lands on the inbox with "Sent to 2 leads.". A program nobody runs (asked before, or refused with `PAM_NO_ACTIVE_LEAD` at Send) says "Nobody runs this program in Pam right now, so it can't get messages." with no composer. A long program name wraps, and nothing is cut. |
| S3 | Everyone | **PASS** (see T3) | "Message Aaliyah as Pam", "Message Dana as Pam" (case manager) and "Message Ben as Pam" (a limited account, as Will decided) are each 48×48 (`shots/2026-10-18-mp2-everyone-en-320.png`). |
| S4 | Pam's hours | **PASS** (see T4 and T5) | Days are seven checkboxes, then Opens and Closes (Eastern time), then "Outside these hours, people get this reply" with the reply as people will read it, then Save. |
| S4 | Saving | **PASS** | Adding Saturday changes the preview to "Monday to Saturday" and saves `[1..6], 09:00, 17:00` ("Saved."). Half hours save as 08:30 to 16:30, and the preview says "8:30 AM to 4:30 PM". |
| S4 | Bad hours | **PASS** | Closing before opening, or at the same time, says "Pam has to close after it opens." and sends nothing (`shots/2026-10-18-mp2-hours-close-before-open-en-320.png`). No day ticked says "Pick at least one day." and sends nothing. A refusal from the server says "That didn't go through. Try again.". |

**The person's side at `3a2f64a0`:** S2 from pass 1 is clear here. In Arabic, the welcome, the
out-of-hours reply ("…تتواجد Pam من الاثنين إلى الجمعة، من 9 ص إلى 5 م (التوقيت الشرقي)…" and the 988
line) and the box ("اكتب إلى Pam") are Arabic all through. W1 ("هذا الشخص") and W3 (the limited
notice) are still there, as routed. They aren't filed again.

## Not covered

- **The database side of starting a conversation:** I only read the code here. That covers what a
  person sees when Pam writes first to someone who has no Pam conversation yet (the welcome, then
  Pam's message, or Pam's message alone), and a closed conversation reopening when the person
  writes. These need a database with PostGIS, or the merged build.
- **The person's Messages row after Pam writes first:** my stub doesn't sort messages, so it can't
  say which line the row shows. I'll check it on main.
- **Arabic words on the team's screens:** they're English placeholders until Sage signs and Lena
  translates. I checked layout and fit only.

Iris

# Message Pam: the test plan for the first build (18 October 2026)

Iris. The merge desk's ask at 07:05: once Nico and Ava have a build, re-test the whole flow on the
`build:e2e` app (never live). Do it from a member's, a limited account's and the super admin's side,
covering sending, photos, out of hours, failure and retry, at 320 and in Arabic. Will's bar: "works
better than any other part of the app".

This plan tests what Will decided at 07:04, and does not reopen it:

- Pam can start a conversation with anyone.
- Limited accounts can write to Pam, with no lower limit.
- Screenshots are allowed.
- The thread looks like any other, with no card. The terms, crisis lines and who reads it live on
  the legal pages and a website post.
- Pam is in Messages from day one, with a welcome message.
- Outside business hours, an automatic reply says when Pam is available, with one 988 line.
- The help routes reach Pam in the app.

## Rules for the run

- **Builds:** the `build:e2e` app from the build's SHA, and Storybook from the same SHA, both on
  127.0.0.1. Every other host is refused, and Chromium's updater and speech feature are off.
- **People and data:** made-up people only. The database's answers are stubbed by the test, in the
  same way as the build's own e2e specs. Nothing is sent, and nobody signs in to anything real.
- **Sizes:** 320×568 for every case, and 390×844 for every case marked **·390**.
- **Languages:** English and Arabic for every case. The welcome message and the automatic reply are
  checked in all seven languages for fit at 320.
- **Clock:** pinned in the page (`page.clock`), in New York time, for every out-of-hours case.
- **Not covered here, needs Will's phone:** a real phone keyboard over the composer, VoiceOver and
  TalkBack, a real photo from the camera roll, and a real push or text notification.

## What "works better than any other part of the app" means here

I'll hold the flow to these, and report each as met or not:

1. **No dead taps, no double taps, nothing stuck.** Every control does something on the first tap,
   at its middle and its edges. Every screen and sheet can be left.
2. **No message is lost or doubled.** A message sent once appears once, in order, after a reload,
   on both sides. A retry never makes a copy.
3. **Every failure says what happened and what to do, and the retry works.** No "Something went
   wrong" without a way forward, and no message silently left unsent.
4. **Nothing is cut or crowded at 320, in English or Arabic.** Bubbles, times, names, the composer,
   the photo preview and the automatic reply all read in full. Arabic is right to left throughout.
5. **It answers the touch.** Press states on every control, 48px targets, and sending visible within
   0.3 seconds in the stub.
6. **A screen reader can follow it.** The thread is named "Pam". Each message says who sent it and
   when. "Sent" and "Not sent" are announced. Focus stays in the composer after sending.

## The cases

### A. Finding Pam

| # | Who | Case | Pass when |
|---|---|---|---|
| A1 | New member | First sign-in | Pam is in Messages from day one with the welcome message, unread, at the top. **·390** |
| A2 | Member | Opens the welcome | It reads in full at 320 in all seven languages. Pam's name and picture are the same as in the list. Replying works. |
| A3 | Member | Each help route: Help › Contact Pam, a notice's "contact Pam" (for example `notice.something_went_wrong`), Your safety's "Talk to someone now", Profile | Each opens the Pam thread in the app, not the website, with the composer ready. Back returns to where they came from. |
| A4 | Signed out (sign-in failed, paused) | "Contact Pam" | Still goes to the help desk on the website, because there is no thread to open. |
| A5 | Case manager, program lead | Messages | Pam is listed, with the welcome. The existing staff ↔ super admin conversations are unaffected. |
| A6 | Member | Search Messages for "Pam" | Pam is found. |

### B. Sending (member, limited account, super admin)

| # | Case | Pass when |
|---|---|---|
| B1 | A short message | Appears at once as sending, then sent. It is in order and survives a reload. **·390** |
| B2 | A long message: the limit, and one character over | The limit is said before sending. Over the limit, the message isn't lost: it stays in the composer with a clear line. |
| B3 | Arabic text, mixed Arabic and English, emoji, a link | Each reads in the right direction. A link opens as other threads' links do. |
| B4 | A double tap on Send | One message. |
| B5 | Leave the thread mid-draft and come back | The draft is still there, or the loss is a known decision. |
| B6 | Send three quickly | All three, once each, in order. |
| B7 | The super admin replies | The member sees it without a reload. The unread count and bell update, and the thread moves to the top of their list. |

### C. Photos (screenshots)

| # | Case | Pass when |
|---|---|---|
| C1 | Attach a PNG screenshot and send | A preview before sending, then the photo in the thread. Tapping it opens the viewer, which closes. **·390** |
| C2 | A JPEG, a HEIC-named file, a very large file (the limit and over), a non-image (PDF), a broken image | Each one is accepted, or refused with a line saying why and what to do. Nothing hangs. |
| C3 | A photo with a caption, in Arabic | The caption reads right to left, and the photo isn't cropped oddly. |
| C4 | The super admin sends a photo to a member | The member sees it and can open it. |
| C5 | Upload fails (stubbed) | "Not sent" with Retry. Retry sends one photo. |

### D. Out of hours

The clock is pinned in New York time. The hours are whatever the build sets; I'll take them from
its config, not guess.

| # | Case | Pass when |
|---|---|---|
| D1 | A message on a weekday inside hours | No automatic reply. |
| D2 | A weekday evening, the night, Saturday and Sunday | One automatic reply, saying when Pam is next available (the right day and time) and the 988 line. |
| D3 | Three messages in a row out of hours | **One** automatic reply, not three. |
| D4 | A member's phone in another time zone (pinned to Los Angeles) | The "back at" time is right for them, or plainly says the time zone. |
| D5 | **Sunday 1 November 2026, when clocks go back** (the night before and the morning of) | The reply says the right hour. |
| D6 | The reply in all seven languages at 320 | It reads in full, 988 is tappable, and Arabic is right to left. |
| D7 | Back inside hours | The next message gets no automatic reply. |

### E. A limited account

| # | Case | Pass when |
|---|---|---|
| E1 | The "limited" notice's "Contact Pam" | Opens the Pam thread. |
| E2 | Send text and a screenshot | Both work, with no lower limit than a full account, as decided. |
| E3 | Everything the limit turns off (other conversations, for example) | Still off. Pam is the one thing that opens. |
| E4 | A suspended account (can't sign in) | Goes to the help desk, as in A4. |

### F. The super admin

| # | Case | Pass when |
|---|---|---|
| F1 | The inbox with many threads | Unanswered ones are easy to find, the order is stated, and long names and Arabic previews fit. **·390** |
| F2 | Start a conversation with a member, a limited account, a case manager and a program lead | Each opens. A second start reuses the same thread, not a new one. |
| F3 | Reply to a thread written in Arabic | It reads correctly, with translation if the build offers it, and the reply arrives on the member's side. |
| F4 | Two threads at once | Replies go to the right person. |
| F5 | Out-of-hours replies seen from the super admin's side | Clearly marked as automatic. Not counted as "answered". |

### G. Failure and retry, on every side

Stubbed failures on the send call and the photo upload:

| # | Case | Pass when |
|---|---|---|
| G1 | No connection at send | "Not sent", with a Retry that works once. The text is never lost. **·390** |
| G2 | The server answers 500, or times out after 15 seconds | The same as G1. No endless spinner. |
| G3 | The session expired | It says to sign in again, and the message isn't lost. |
| G4 | A rate limit, if the build has one | Says when they can send again. |
| G5 | The connection comes back | Retry works. Nothing is sent twice, and the order holds. |
| G6 | The thread's own load fails | "Something went wrong" with a way to try again, not an empty thread. |

### H. Touch, reading and the screen reader

| # | Case | Pass when |
|---|---|---|
| H1 | The tap-by-tap run (as on 17 October) over the Pam thread, the inbox and the composer | No dead taps, nothing under 48px, and a press state on each. |
| H2 | Accessibility snapshot and Tab | The thread is named "Pam". Messages carry their sender and time. "Sending", "Sent" and "Not sent" are announced. Focus stays in the composer after Send. |
| H3 | Light and dark, and reduced motion | Bubbles, the automatic reply and failed states are readable in both themes. |

### I. The words that moved off the thread

The thread has no card of its own, so the legal pages and the website post carry who reads it, the
hours and the crisis lines:

| # | Case | Pass when |
|---|---|---|
| I1 | Privacy, Terms and the website post Will named | Each says who reads messages to Pam, the hours, and 911 and 988, in all seven languages. |
| I2 | The transparency screen | It says what members now read at onboarding about the Pam team reading messages to Pam. **I check that it is there; whether it should change is settled.** |

## What I need from Nico and Ava before the run

1. **The build's SHA**, with the e2e specs for Message Pam. I'll reuse their stubs.
2. **The names of the new calls** (send, start, list, upload), **their error codes**, and the
   **business hours setting** (where it lives, and its time zone).
3. **Storybook stories:**
   - the Pam thread (empty with the welcome, mid-conversation, the automatic reply, a failed send);
   - the super admin's inbox;
   - fixtures for each, so the tap-by-tap run covers them.
4. **Whether a member can block or report Pam**, so I know which result is right.

## The report

`pam/docs/research/<date>-retest-message-pam.md`, with a table per area (A to I): each case marked
PASS / PART / FAIL, what I saw, and a shot where it helps. The six bars above come first, each marked
met or not. Screens worst first, as before.

Iris

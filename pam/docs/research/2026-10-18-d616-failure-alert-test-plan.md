# D-616, when Pam fails: the test plan (18 October 2026)

Iris. The merge desk's note at 21:15 passed on Will's new rule (D-616) and asked for a plan now, to
run on main when it lands.

**The rule.** When Pam fails to save, switch or send:

- a small alert shows overlaid at the bottom of the screen;
- a switch moves only after its save succeeds;
- every failure is logged in `app_errors`, with nothing personal;
- super admins get a bell and a Problems list.

**Who builds what.** Dot builds the alert and the switch rule, Nico the log, and Ava the Problems list.

The plan tests that rule as written and doesn't reopen it. The desk answered my five questions at 21:24.
Those answers are folded in below and listed at the end.

## Rules for the run

- **Builds:** the `build:e2e` app from the SHA on main, and Storybook from the same SHA, both on
  127.0.0.1. Every other host is refused, and Chromium's updater and speech feature are off.
- **People and data:** made-up people only, with any phone number a 555 number. The database's
  answers are stubbed by the test, the way the app's own e2e specs do it. No account is made,
  nothing is sent, and nothing reaches the live project.
- **Failures are made in the page, three ways:**
  - **Offline:** Playwright's `setOffline(true)` (airplane mode). Requests fail at once.
  - **Slow:** a save or switch counts as failed after **15 s** with no answer. A send keeps its 30 s
    (P2). The answer is held for 5 s, 14 s, 16 s and 45 s, then given as a success or a 500.
  - **Refused:** a 500, a 400 with a database error code, and a 401 for an expired session.
- **Sizes:** 320×568 for every case, and 390×844 for the overlay cases. For the keyboard, I shrink
  the visual viewport to 568 − 290px, the height an iPhone SE keyboard leaves, and fire the resize. A
  real keyboard needs Will's phone (see the end).
- **Languages:** English and Arabic for every case. Russian and Spanish too for the alert's fit,
  since their lines are longest.
- **Themes:** light and dark for the alert.
- **Screenshots:** checked for phone numbers before they go in the repository.

## What passes

1. **Nothing is ever shown as saved when it wasn't.** A switch is in its old place until the save
   succeeds, and after a failure it's still there. A field keeps what was typed. A message is "Not
   sent" with Try again, never "Sent".
2. **The alert can be seen and doesn't get in the way.** It's on the screen at 320, never below the
   fold (b74's B3). It never covers the control that failed, the tab bar, or the box being typed in.
3. **It's said once.** A screen reader hears the alert one time for each failure, not again on every
   re-render.
4. **The log helps the team and tells nobody anything about a person.**
5. **Super admins hear about a problem once an hour for each action, not once for each tap.**

## A. Every switch and save, offline and slow

These are the places that save, switch or send on main at b74, found from the screens that use
`notice.something_went_wrong` or a `Switch`. The list gets re-checked on the SHA, since new places
are added.

| Group | Where (route, file) | What fails |
|---|---|---|
| Switches | Text alerts `/alerts/` (`AlertsView`): the saved-place switch with a yes, and every alert switch once live | the save |
| | Calendar link (`CalendarLinkView`) | the switch |
| | Directory `/directory/` (the super admin's switches) | the switch |
| Agreeing | the agree screen `/reminders/`: Agree and Not now; Join (`JoinScreen`) | the write |
| Messages | a message thread: a text and a photo; Message Pam | the send. **No overlay**: "Not sent" with Try again on the message is that screen's alert. Still logged |
| | a new message (`NewMessagePicker`); the thread's options (`ThreadOptionsViews`); its files (`ThreadFilesView`, `MessageFileCard`) | the send or save |
| Places | a place (`/place/`): save, I'm here (`ImHereCard`); Saved (`SavedView`); "Something is wrong here" `/flag/`; reported places | the save or report |
| Trips | a new trip (`NewTripView`); booking for a member (`BookForMemberView`); Schedule (`ScheduleView`) | the save |
| Programs | adding a program (`AddProgramView`); a program (`ProgramView`); editing a service (`ServiceEditView`); a program review; a request review | the save or decision |
| Profile and the rest | Profile (`ProfileScreen`), Use as (`UseAsView`), What you sent (`WhatYouSentView`), notifications, a support reply, invites (new, add, expired), Explore's saves | the save |
| Sign in | sending the code (didn't send, or the server errored) | the bottom alert. A wrong code, or a field to correct, **stays inline** (D-509) |

For **each** row, offline and with a 15-second wait that then fails:

- **A1. The alert shows.** It shows once, overlaid at the bottom, with Sage's line (834facaa,
  `notice.malfunction`): "That didn't go through. It's not your fault, so try again." It's in all
  seven languages once Lena's words land. The time from the failure to the alert is under 1 s
  offline. With a slow connection it shows at 15 s, the same everywhere: no alert at 14 s, the alert
  by 16 s. For a message send, there's no overlay; "Not sent" shows at 30 s.
- **A2. Nothing looks saved.** A switch doesn't move, and after a 15 s wait it's still in its old
  place. A field keeps its words. A message stays "Not sent", in place, and isn't duplicated.
- **A3. While it waits, it shows.** During the slow save the control says it's working (busy, or the
  button disabled), and a second tap makes no second request.
- **A4. Trying again works.** Back online, one tap saves, the switch moves, and the alert goes or is
  replaced. There's no stale alert on the next screen.
- **A5. Success is silent.** A save that succeeds after a 5 s wait moves the switch and shows no
  alert.
- **A6. A late success shows the truth (a requirement, the desk at 21:32).** A save held for 45 s
  that then succeeds: at 16 s the switch is back in its old place with the alert. When the answer
  comes, the screen re-reads the saved value and the switch ends up **on**, matching the database.
  The alert stays until the next tap. I check the screen at 14, 16, 30 and 46 s, check that a reload
  agrees, and check that the re-read makes no second write. The same goes for a late failure (a 500
  at 45 s): the switch stays off and nothing new is announced.
- **A7. Mistakes stay inline.** A wrong sign-in code, and a field to correct (D-509), show their own
  line by the field and no bottom alert. Nothing is logged for them, since they aren't Pam's
  failures.

## B. Where the alert sits

At 320 and 390, in English, Arabic, Russian and Spanish, light and dark:

- **B1. It's on the screen.** The whole alert is inside the viewport (its bottom ≤ the viewport's
  bottom), with no page scroll needed, including on a short page and on a long, scrolled one.
- **B2. It doesn't cover the control that failed.** Its box doesn't overlap the failed control's box.
  This covers a switch near the bottom (the last Text alerts row, scrolled down) and the composer's
  Send.
- **B3. It doesn't cover the tab bar**, on screens that have one (Explore, Saved, Trips, Messages,
  Profile). Every tab is still tappable with the alert up.
- **B4. With the keyboard up**, in the thread composer, the agree screen's fields, Flag's text box and
  an editing form: the alert sits above the keyboard, and the box and Send can still be seen and
  tapped.
- **B5. It fits.** No text is cut and nothing scrolls sideways. A long Russian line wraps. Its close
  button (if it has one) is at least 44×44 and isn't covered.
- **B6. Arabic.** It mirrors: its icon and close button are on the correct side and the words read
  right to left. A number in it (if any) keeps its direction.
- **B7. Two failures in a row** (two switches tapped offline): one alert, or two stacked that still
  fit. Never two over each other.
- **B8. It goes.** It closes by itself or by a tap, and it doesn't block taps on what's under it
  once it's gone. I record how long it stays. Under 5 s is too short to read for someone slow to
  read.
- **B9. Leaving the screen** while it's up: it doesn't follow to the next screen unless it's still
  about something there.

## C. A screen reader

- **C1. Said once.** One live region holds the alert's words. I count the times the words are put
  into it (a MutationObserver) across 10 s and any re-renders. Expected: once for each failure.
- **C2. The right kind.** It's `role="alert"` or `aria-live="assertive"` for a failure the person
  must act on, and `polite` if Sage and Dot choose that. Either way, it isn't announced twice by
  both.
- **C3. Focus.** Focus isn't stolen from the box being typed in. The alert's close button (if it has
  one) is reachable by keyboard and has a name.
- **C4. Arabic.** The live text is in Arabic, with no English left in it.

## D. The log (`app_errors`): Lena's nine rules

The desk's answer: a row keeps **nothing about the account**, no id and no hash, and no free text. I
test Lena's Privacy read (161e3ab1, `docs/legal/2026-10-18-error-log-privacy-read.md`, section 3)
rule by rule. In the app I capture each call to the writer in the stub. On the database I read the
migration and, where it doesn't need PostGIS, run its functions in a throwaway Postgres.

- **D1. The detail is never the error's own message.** I make each save fail with an error whose
  message, `details` and `hint` hold a 555 phone number, a made-up email address, a first name and a
  place name. None of them is in the call or the stored row. On the server, the writer refuses a
  detail that isn't from the closed list (HTTP status, SQLSTATE, offline, timeout, unknown) or that
  has a run of 7 or more digits, an `@`, or an `=`.
- **D2. The route is a pattern.** A failure on `/messages/thread/?id=…&from=pam`, `/place/?id=…` and
  `/reminders/?next=alerts&kind=closed` is stored as the route with no id and no query.
- **D3. The action key is from a closed list.** The writer refuses a key that isn't on it, including
  one with spaces or user text.
- **D4. Size limits.** The database refuses a field over its maximum. The writer is rate-limited for
  each account: a loop of 100 failures in a minute stops at the limit, and the app shows nothing
  more for it.
- **D5. Who writes and who reads.** A member, a case manager and a program lead each get nothing from
  `select` on the table or the list function. A super admin gets rows. `anon` gets nothing and can't
  write. The writer is `security definer` with `set search_path = public, extensions`.
- **D6. 30 days is enforced.** A scheduled delete exists and its text says 30 days.
- **D7. The bell carries no detail.** The bell and its notification row hold no more than the note
  does, and nothing from the person who met the error.
- **D8. No new host.** In the browser the only request a failure makes is to Pam's own database. My
  route log shows no other host asked.
- **D9. Off means off.** With `app_errors_live` off, a failure makes no call to the writer, and the
  person still sees the alert (the desk, 21:32).
- **D10. No account in the row:** no `profile_id`, no hash of one, and no device id. The request
  itself is authenticated, and that log is the platform's, kept a week, as Lena's read says.
- **D11. Offline.** A failure while offline is logged once when back online, or not at all by design.
  It's never logged twice. A failure to write the log is silent to the person (E5).

## E. The bell and the Problems list (super admins)

- **E1. One bell for each action each hour.** The same action failing 5 times in 10 minutes, for one
  person or for five, gives one bell. A second action in that hour gives a second bell. The first
  action failing again 61 minutes later gives a new bell. I'll test this in a throwaway Postgres
  with the clock set, if the function doesn't need PostGIS. Otherwise I'll read it and run it on
  the full suite's output.
- **E2. Who gets the bell:** only super admins, never a program lead, case manager or member.
- **E3. The bell's words** say what failed and how often, with nothing personal, in all seven
  languages.
- **E4. The Problems list** (Ava): newest first, grouped by action, with the count and the last
  time. At 320 nothing is cut, and it works in Arabic. Its own load failure shows the D-616 alert,
  with no loop of logging its own failure.
- **E5. A failure while logging the failure** (the log insert itself offline or refused) is silent
  to the person. It shows no second alert.

## F. What the rule doesn't change

- Message Pam's "Not sent / Try again" on the bubble stays (P2 at b73), and the limit's calm line
  (W4) stays. I check that the D-616 alert sits alongside them or replaces them as Dot intends.
- A switch the person can't use (Coming soon, after a STOP) never shows the alert on a tap.

## The desk's answers (21:24), as tested above

1. **A failed send** keeps "Not sent" with its retry on the message and gets no overlay; it's still
   logged. (If Will says otherwise, this changes.)
2. **The log** keeps nothing about the account (no id, no hash) and no free text. Codes, action keys
   and routes come from closed lists or patterns. See section D.
3. **The words** are Sage's new line at 834facaa: "That didn't go through. It's not your fault, so try
   again." Lena is translating it.
4. **A mistake the person can fix** stays inline (D-509). Pam's own failures get the bottom alert,
   on sign-in too.
5. **A save or switch** counts as failed after 15 s. A send keeps its 30 s.

## G. D-618: the alert says what to do, by kind of failure

Will, 19 October 00:13, as the desk passed it on: the failure alert says how to fix the problem by the
kind of error, and "contact Pam" is only an unspoken last resort. The kinds are offline, timeout,
signed-out, not-allowed, too-many, changed, gone and server. Which of them each action can really hit,
and with which codes, is in `2026-10-19-d618-failure-kinds-by-action.md`. These cases run on every
screen that uses the alert, on the local build and stack only.

**Making each kind.** Each kind is made in the stub, with the answer the real database or PostgREST
gives:

| Kind | Made by |
|---|---|
| offline | The page is offline and every request is refused. |
| timeout | No answer for 16 s, or 31 s for a send. |
| signed-out | A 401 with PostgREST's `PGRST301` (JWT expired), and the session cleared. |
| not-allowed | A 403 with `42501`, and a 400 with `P0001` and the function's own word (for example `NOT_ALLOWED`, `ONLY_A_SUPER_ADMIN`). |
| too-many | A 400 with `P0001` and `PAM_RATE_LIMITED`, and a 429. |
| changed | A 409 with `23505`, and a function's "already" refusal. |
| gone | A 406 with `PGRST116` (no row), a 409 with `23503`, and `P0001` with `NOT_FOUND`. |
| server | A 500 with no code, and a 503. |
| wrongTime | `P0001` with `OUTSIDE_THE_VISIT_WINDOW` (and `PLANNED_TOO_LATE` where it isn't inline). |
| refused | A 400 with `P0001` and a guard's word the screen doesn't map (for example `ROLE_PAIR_NOT_ALLOWED`), a `23514` and a `22P02`. Also every reachable guard in the table, each checked to give its mapped kind (for example `OUTSIDE_THE_VISIT_WINDOW` on `schedule.checkin`, `VISIT_CANCELLED`, `TRIP_NOT_FOUND`). |

**The desk's decisions (00:40) that these cases test:**

- `refused` is a kind.
- Guard words the screen holds map to their real kind:
  - not-found → gone;
  - cancelled or decided → changed;
  - not-active or `ONLY_*` → not-allowed.
- **`wrongTime` is a kind** (the desk at 00:42; Sage signed it at `5c1956c9`: "Not at this time / You
  can only do this near the time of the visit."). A window can still close while the screen is open,
  even after Piper makes the check-in circle and the "I'm here" card match the database's windows.
  **G8** checks both.
- **`refused` has Get help as its only button** (Sage, `98875861`): "Pam couldn't do that / Check
  what you chose or typed. If it's right, tap Get help." Get help opens
  `/support/something-didnt-go-through/`.
- An outcome that already happened is `done` (Nico's classifier) and shows nothing (G3).
- `INVITE_NEEDS_PHONE` is inline, by the field (Ava), not the alert.

- **G1. Each kind shows its own words.** The words are Sage's line for that kind, in the person's
  language, and say what to do: wait for the network, sign in again, ask your guide, wait a while,
  look again. They're the same for every action of that kind, and different from every other kind.
  "Contact Pam" is never in the first alert, written or spoken.
- **G2. The buttons do what they say.** Each button is tested by what follows. Today the alert closes
  on any `pointerdown` (capture), so a tap on its own button must still run the button, not just close
  the alert.
  - **Try again:** it re-sends that one action, once, and the request count goes up by exactly one.
  - **Sign in:** it opens sign-in, and after it brings the person back to the same screen, with the
    action not done twice.
  - **Look again / Refresh:** it re-reads, and the screen shows what the database now says.
  - **Offline:** no button that can't work while offline. If it retries by itself when the network is
    back, that happens once.
- **G3. A failure that is really a success shows no alert.** Every row the table flags as "the
  outcome already happened" gets its code (for example `23505` on a save that was already saved).
  Expected: no alert, the screen shows the done state, and nothing is announced. Whether it's still
  logged is the desk's call; I'll record what happens.
- **G4. A second failure shows Get help.** The same action failing twice in a row on the same screen,
  with no success between, shows the kind's words plus Get help. Get help opens where the desk says
  (Help, or the Pam conversation), and Back returns to the screen.
  - It's not on the first failure.
  - It's not after a success, then one failure.
  - A failure of a different action counts from one again.
  - It isn't kept across leaving the screen, unless the desk says it should be.
- **G5. It fits at 320.** For every kind, in all seven languages (the longest is usually Russian or
  Spanish), in light and dark, at 320×568 and 390×844:
  - nothing is cut and nothing scrolls sideways;
  - each button is at least 44×44 and inside the alert;
  - the alert stays inside the screen, above the tab bar and the keyboard;
  - it never covers the control that failed;
  - Arabic mirrors.
  With a button in it, the alert now takes taps, so B8 changes. Only the alert's own box is tappable,
  and the page around it still takes taps.
- **G6. A screen reader.** The words and the button are said once for each failure. The button is
  reachable by Tab and has a name, and focus isn't moved to it unasked. The second failure's Get help
  is said with it.
- **G7. The log still says which kind.** The code logged for each kind lets the Problems list tell the
  kinds apart. Today `appErrorCode` keeps only 3-digit codes, 5-character codes and the three word
  codes. So PostgREST's own codes (`PGRST116`, `PGRST301`, 8 characters) log as `unknown`, and every
  raised error logs as `P0001`, losing its word. Signed-out and gone then look like a server fault in
  the list. I'll record the code each kind logs, and flag any kind the list can't tell apart.
- **G8. Wrong time: the windows match, and a closed window says so.**
  - The Schedule circle isn't offered (or is disabled with a reason) on a visit more than 2 h ahead.
  - The "I'm here" and "I went" card isn't shown once the database's window is closed, including a
    visit under an hour, at `coalesce(ends_at, start + 1h) + 3h`.
  - A tap one minute inside each edge succeeds.
  - With the clock moved past the edge while the page stays open, the tap gives `wrongTime`'s words
    ("Not at this time / You can only do this near the time of the visit."), not "Pam's side". No
    Try again is offered, since trying again can't help until the window opens.
- **G9. `refused` and its Get help.** Sage revised it at `98875861` (claude/sage-signs), replacing
  `5c1956c9`. A `P0001` the screen can't map, a `23514` and a `22P02` show:
  - the title "Pam couldn't do that";
  - the line "Check what you chose or typed. If it's right, tap Get help.";
  - Get help as the **only** button. There's no Try again, on the first failure or any later one.

  Get help opens the help post `/support/something-didnt-go-through/`, and Back returns to the same
  screen with what was typed or picked still there. After the person changes the field, the action
  succeeds and no alert is left. The words fit at 320 in all seven languages, with Get help at least
  44×44.

## Needs Will's phone

- A real keyboard over the alert.
- VoiceOver and TalkBack reading it once.
- Real airplane mode on a real network.

Iris

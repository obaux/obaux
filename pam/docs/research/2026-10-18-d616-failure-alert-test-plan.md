# D-616, when Pam fails: the test plan (18 October 2026)

Iris. The merge desk's note at 21:15 passed on Will's new rule (D-616) and asked for a plan now, to
run on main when it lands.

**The rule.** When Pam fails to save, switch or send:

- a small alert shows overlaid at the bottom of the screen;
- a switch moves only after its save succeeds;
- every failure is logged in `app_errors`, with nothing personal;
- super admins get a bell and a Problems list.

**Who builds what.** Dot builds the alert and the switch rule, Nico the log, and Ava the Problems list.

The plan tests that rule as written and doesn't reopen it. It ends with the questions I'd like
answered before the build, so I test the intended behaviour, not my guess at it.

## Rules for the run

- **Builds:** the `build:e2e` app from the SHA on main, and Storybook from the same SHA, both on
  127.0.0.1. Every other host is refused, and Chromium's updater and speech feature are off.
- **People and data:** made-up people only, with any phone number a 555 number. The database's
  answers are stubbed by the test, the way the app's own e2e specs do it. No account is made,
  nothing is sent, and nothing reaches the live project.
- **Failures are made in the page, three ways:**
  - **Offline:** Playwright's `setOffline(true)` (airplane mode). Requests fail at once.
  - **Slow:** the answer is held for 5 s, 15 s, then 45 s, then given as a success or a 500.
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
| Messages | a message thread: a text and a photo; Message Pam | the send. Its own "Not sent" stays (see the overlap check) |
| | a new message (`NewMessagePicker`); the thread's options (`ThreadOptionsViews`); its files (`ThreadFilesView`, `MessageFileCard`) | the send or save |
| Places | a place (`/place/`): save, I'm here (`ImHereCard`); Saved (`SavedView`); "Something is wrong here" `/flag/`; reported places | the save or report |
| Trips | a new trip (`NewTripView`); booking for a member (`BookForMemberView`); Schedule (`ScheduleView`) | the save |
| Programs | adding a program (`AddProgramView`); a program (`ProgramView`); editing a service (`ServiceEditView`); a program review; a request review | the save or decision |
| Profile and the rest | Profile (`ProfileScreen`), Use as (`UseAsView`), What you sent (`WhatYouSentView`), notifications, a support reply, invites (new, add, expired), Explore's saves | the save |
| Sign in | sending the code; checking the code | the send. These may stay inline; see question 4 |

For **each** row, offline and with a 15-second wait that then fails:

- **A1. The alert shows.** It shows once, overlaid at the bottom. Its words are D-616's (the title and
  line Sage signs). The time from the failure to the alert is under 1 s offline. With a slow
  connection it shows when the app gives up; I record that time for each place, and whether it's the
  same everywhere.
- **A2. Nothing looks saved.** A switch doesn't move, and after a 15 s wait it's still in its old
  place. A field keeps its words. A message stays "Not sent", in place, and isn't duplicated.
- **A3. While it waits, it shows.** During the slow save the control says it's working (busy, or the
  button disabled), and a second tap makes no second request.
- **A4. Trying again works.** Back online, one tap saves, the switch moves, and the alert goes or is
  replaced. There's no stale alert on the next screen.
- **A5. Success is silent.** A save that succeeds after a 5 s wait moves the switch and shows no
  alert.
- **A6. Slow, then success.** A save held for 45 s that then succeeds isn't left showing "failed"
  while the database has it. I record what's on screen at 20, 30 and 46 s, and whether a reload
  agrees.

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

## D. The log (`app_errors`)

I read Nico's migration and its grants, and capture each insert from the app in the stub.

- **D1. Nothing personal in the row.** No name, phone, email, address, message text, photo URL,
  place a person saved, or free text they typed. No query string with an id in it (the screen is
  logged as its route, `/messages/thread/`, not `?id=…`). I'll check the device and user-agent fields
  too.
- **D2. Who it was:** see question 2.
- **D3. Who can read it.** Only super admins (by RLS), and no one through `anon`. A member can insert
  their own failure, but can't read or change anyone's, including their own after the fact.
- **D4. What it holds:** the action (a fixed key such as `alerts.switch` or `messages.send`), the
  kind (offline, timeout, refused, with the code), the route, the app's version, and the time. That's
  enough to act on without anything about the person.
- **D5. Offline.** A failure that happened offline is still logged once back online (queued), or
  isn't logged by design. Either is fine, but it should be stated. It's never logged twice.
- **D6. Flooding.** 100 failures in a minute from one account don't make 100 rows the team must
  read, or there's a cap.

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

## Questions before the build

1. **Messages:** does a failed send get the overlay as well as its own "Not sent", or only "Not sent"?
2. **The log's "who":** does a row keep the account's id (personal data in a strict reading), a
   one-way hash, or nothing? D1 says "nothing personal", so I'd expect no id.
3. **Words:** is the alert the existing "Something went wrong. This is not your fault…" or a new
   short line from Sage? The plan checks whichever is signed.
4. **Sign-in:** do the sign-in errors ("Check the number and try again") stay inline, as they are
   about what was typed?
5. **"Slow":** after how long does a save count as failed? P2's send uses 30 s. Is it the same for
   switches and saves?

## Needs Will's phone

- A real keyboard over the alert.
- VoiceOver and TalkBack reading it once.
- Real airplane mode on a real network.

Iris

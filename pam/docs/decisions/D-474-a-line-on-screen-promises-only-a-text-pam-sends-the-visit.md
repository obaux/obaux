# D-474 — A line on screen promises only a text Pam sends: the visit-reminder and alert lines say what Pam does today

**Date:** 2026-10-10 · **Branch:** `claude/lena-promise-sweep`

Will, 10 October 2026, relayed by the merge desk (Mira): the app's first slide told people "Pam reminds you
before you go, so nothing gets missed." Pam does not send that text. The public site already says reminders are
"coming" (`VISIT_REMINDERS_LIVE = false`, D-458); the app said the opposite. Rule (Will's a12): **say only what
Pam does.** Mira: make the slide true today, in all seven languages, say on the before-launch list what to put
back, then sweep the rest of the app for any line that promises a text or a reminder that is not sent. Saving a
trip, points for planning a trip and points for calling a place are true and stay.

What is sent today, checked against the code and the live function (the repo is ahead of what is live):
a sign-in code, and a note to a member who said yes when a place they saved closes or moves
(`AlertsView` `LIVE = ['closed']`; `reminders.today.member`). Not sent: the day-before visit reminder, the
staff alert texts, a text when a program is approved. No bell row is made when a visit is booked.

## What changed (English; the other six say the same, `copy:ack`ed)

| Key | Before | After |
|---|---|---|
| `onboarding.3` (slide, members) | Pam reminds you before you go, so nothing gets missed. | Pam keeps your planned visits in one place. |
| `onboarding.provider.2` (slide, program leads) | Fewer no-shows. Pam reminds people for you. | Members find your program and plan a visit. |
| `join.booked.body` | {place}, {day} at {time}. Pam will remind you before you go. | {place}, {day} at {time}. It is on your Trips now. |
| `trips.new.done.body` | It is on your map. We will remind you the day before if text reminders are on. | It is on your map. |
| `profile.promo.reminders.body` (Profile card) | We can text you the day before a visit. | We can text you if a place you saved closes or moves. |
| `profile.promo.alerts.body.providerList` | Bookings, changes and messages. Choose which. | Coming soon: texts about bookings, changes and messages. |
| `profile.promo.alerts.body.adminList` | Messages and trips. Choose which. | Coming soon: texts about messages and trips. |
| `join.program.review.note` | …We will let you know when yours is live. | …Your Program tab shows where yours is. |
| `terms.s.your-account.p3` | Tell us if you get a new number, so your reminders follow you. | Tell us if you get a new number, so you can still sign in and get your texts. |
| `notify.empty.body` | When someone books a visit, writes to you or needs you, it shows up here. | When someone writes to you or needs you, it shows up here. |

Why each is true now: the slide and the booked line say what the Trips tab does (a planned visit with its time
and how to get there, `trips.empty.body`); the provider slide repeats `programs.review.step.live`; the Profile
card says the one text a member can get; a program lead's review is not texted or belled when it ends (nothing
queues it, and the "Text me when it's live" row was already taken out of `ProgramReviewView`), but the Program
tab is the review screen until approval, so that is where the lead looks; the terms line names both texts that
need the number (the sign-in code and the saved-place note); no bell row exists for a booked visit
(`notify` is called for a flagged place, a reported message, a new message and a staff request only).

## What was looked at and left

- **The reminders and alerts screens** (`reminders.*`, `alerts.*`): they say "would send" over a line that says
  what is sent today (D-453), and every alert switch not sent says "Coming soon". "Text reminders" stays the
  name of the setting and of the Profile row. `reminders.intro` ("Pam can text you about the things you plan.")
  is the first line of the screen the carrier reviewed; changing it touches the registration, so it stays until
  the filing is redone, and the line under the list is what says what is sent.
- **Privacy** `privacy.s.texts.p1` says "Later we may text reminders and updates": a may, not a will.
- **`join.waitingDone.yes`** already says "Pam cannot text you about it yet".
- **Reported, not changed (Mira / Piper):** after a program books a visit for a member, `trips.booked.texted`
  says "Pam texted {name} a link to see it" and `trips.booked.sms` shows the text, but `bookTrip` keeps a
  booking made for a member in the browser tab (`forMemberId`) — nothing is saved and nothing is texted, and the
  step before it says "Example trips only for now — nothing is booked with the program yet." Words cannot make
  that true; the screen needs the booking to be real, or to say it is an example.
- The staff Profile card still offers a screen on which every switch is "Coming soon". The words are true now;
  whether the card should show at all is a product question (Messages & notifications).

## Putting it back, and keeping it from coming back

The day `dispatch-sms` sends the day-before reminder, `docs/before-launch.md` › *Visit reminders go live* lists
the lines and the English to restore, key by key. `test/promises-of-texts.test.ts` fails if an English line says
Pam reminds you while the site's `VISIT_REMINDERS_LIVE` is false, and fails if the site's flag is flipped and
the app's copy of it is not, so neither is flipped alone.

**What a later session might reverse:** keeping `reminders.intro` as it is (above); "coming soon" on the staff
card rather than hiding it; leaving the program-booking text to its own lane.

# What a text says: the promises that move from the Text alerts screen to the Privacy page (card a102, for Will to sign)

**Status:** English for Will to sign (A29); **nothing translated until he signs**; one test is on this branch already, because it holds code and needs no signature. Lena (Languages & legal), 18 October 2026, answering Mira's 15:23: Will's 15:19 rule that the app should not explain what belongs on a legal page ("Instead of having 'coming soon' and explaining what we don't do yet, we can simply have a badge saying 'coming soon'"), applied to the Text alerts screen. Each row loses its second line. Four of those lines are promises that `privacy.s.texts.p1`–`p3` (a code, STOP, charges) do not make, and `privacy.s.never-say.p1` makes only in part ("never say why you use Pam, never name your program, never say anything about your record").

## The line (and one more, optional)

New `privacy.s.texts.p4`, in the "Text messages" section, after the charges line:

> When a text tells you that someone messaged you, wants to connect, or booked, changed or planned a visit, it only says that something is waiting in Pam. It never says what was written, who it is from, or which visit.

Optional `privacy.s.texts.p5` (it replaces what the "Before your trip" row said in its second line, "The day before, with the address."):

> A reminder before one of your visits says when it is and where, and nothing else about it.

`legal.ts`: `section('privacy', 'texts', 3)` becomes 4 (or 5). `legal:date privacy <ship day>`, then `copy:ack`, on the day it ships. Native reader: a new entry in `docs/before-launch.md` when it is translated. The line goes on card a102 for Will.

## Why the line is scoped, and not "a text about something in Pam"

Mira's draft was "a text about something in Pam only says that something is waiting, never what was written, who it's from, or which visit", checked against `sms-templates.ts`. **As written, it is not true of every template.** The 21 templates:

| Template | English | Only "something is waiting"? |
|---|---|---|
| `message_waiting` | Pam: You have a new message in Pam. Open it: {link} | **Yes.** Also what Message Pam's replies use: the same template, nothing in it can name Pam, a person or the words. |
| `connection_request` | Pam: Someone on Pam wants to connect. Open Pam to reply: {link} | **Yes** (not queued by anything yet) |
| `visit_booked` | Pam: Someone booked a visit with your program. Open Pam to see it: {link} | **Yes** |
| `booking_changed` | Pam: A visit with your program was changed. Open Pam to see it: {link} | **Yes** |
| `trip_planned` | Pam: Someone on your list planned a visit. Open Pam to see it: {link} | **Yes** |
| `facilitation_provider` | Pam: Someone was introduced to your program. Open Pam to reply: {link} | **Yes** (the same kind as `connection_request`) |
| `appointment_24h`, `appointment_2h`, `appointment_morning_of` | Pam: You have a visit tomorrow at {time}. {address}. Tap for directions: {link} (and two kin) | **No, on purpose:** the time and the address. The optional second line says so. |
| `facilitation_member` | Pam: {adminFirstName} connected you with a program that can help. Open Pam to say hi: {link} | **No:** it names who introduced you (a first name). Left out of the line's verbs. |
| `attendance_check`, `attendance_missed_followup` | Pam: Did you make it today? Reply YES or NO. / Pam: No problem. We saved a step to set up a new time. … | **No:** both say something about a visit. |
| `saved_place_closed` | Pam: A place you saved is {reason}. Find others in Pam: {link} | **No:** the reason. |
| `staff_request_approved`, `staff_request_denied` | Pam: Your request was approved. … / … was not approved. … | **No:** the decision. |
| `access_limited_notice` | Pam: Some parts of Pam are turned off for now. … | **No:** the state of the account. |
| `support_reply` | Pam: {reply} | **No:** the reply itself (unsigned, cannot send). |
| `verify_code`, `invite_member`, `invite_provider`, `reply_no_read` | a code; an invitation; "This number can't read replies" | **No**, and no promise needed. |

So the line names the events whose text is the six above (a message, someone who wants to connect, a visit booked, changed or planned) and promises nothing wider. If Will wants the wider sentence, the broader promise would break on `facilitation_member`, `appointment_*`, `attendance_*`, `saved_place_closed`, `staff_request_*`, `access_limited_notice` and `support_reply`, and each would need a different text.

**Why it is true of the six, by construction, not by habit:** `queue_text_alert()` (migration 20261010134429, the only caller) inserts `vars = { link }` and nothing else, and its callers pass `base || '/messages/'` for a message and `base || '/'` for a visit, a page of the app and never a conversation, a person or a visit. The six templates have no placeholder but `{link}` in any of their seven languages. A message to Pam (`message_waiting`) is the same.

## The pin (on this branch, green, mutation-tested)

`packages/config/test/text-alerts-say-only-that-something-waits.test.ts`: the six templates carry only `{link}` in every language; the database queues `{ link }` and nothing else; every `queue_text_alert` caller's link is `base || '/messages/'` or `base || '/'`; the three reminders carry exactly the time, the address and a link. Mutation-tested: a `{name}` in `message_waiting` fails it; an id in the link fails it. Once the line is signed and translated I add the line's own pin (the sentence, in the English and the other six) to `message-pam-line.test.ts`' neighbour, as for every Privacy line.

**No privacy-guard entry applies.** The guard (`data-collected.ts`) lists what the app *takes* from a person; this is what Pam *sends*.

## What the screen keeps (for Sage): the minimum at the opt-in point

The Text alerts screen (staff) and the Text reminders screen (members) are the opt-in the carrier reads; the registered campaign (`docs/sms-campaign-samples.md`, "How do end-users consent") says what they show: what would be sent, plainly which of it Pam sends today, that STOP stops it for good, that HELP reaches a person, that rates may apply, and that nothing is pre-selected. **`alerts.how` stays whole** ("One text each time, only for what is switched on. Reply STOP any time and they stop for good. Reply HELP to reach a person. Text and data rates may apply."): the frequency, STOP, HELP and rates. What each row must keep is its **label**: "Someone messages you", "Someone wants to connect", "Someone books a visit", "Someone changes a booking", "Someone plans a trip", "Before your trip", "A saved place closes or moves" are the list of message types the campaign description names, and the carrier compares the two. The second lines can go; the label cannot. The "Coming soon" badge is "saying plainly which of them Pam sends today". Each switch being its own switch is the consent (`alerts.intro` says it). **One gap, not Will's rule but the carrier's:** the screen carries no link to the Privacy page or the Terms, which the campaign lists as its two URLs; one quiet link line to the Privacy page's "Text messages" section would be both the carrier's link and the place the trimmed promises now live. Sage's call.

## What the trim does to each row

| Row | Its second line now | After |
|---|---|---|
| `alerts.message.body`, `alerts.connect.body`, `alerts.booked.body`, `alerts.changed.body` | the four promises | gone; said once in `texts.p4` (after Will signs). **The cut does not wait:** removing a promise breaks no promise. |
| `alerts.visit.body` | "The day before, with the address." | gone; `texts.p5` says it, if signed |
| `alerts.trip.body`, `alerts.closed.body` | "A member on your list plans a visit to a program." / "So you do not go to the wrong door." | descriptions, not promises: gone with the rest, Sage's call |

`alerts.comingSoon` ("Coming soon. Pam does not send this text yet.") becomes the badge; the test in `promises-of-texts.test.ts` that the Text reminders screen "still says what is and is not sent today" (`reminders.today.*`, "does not send any") is about the members' screen and stays as it is until Sage and I look at it with the same rule.

## Update, 15:45: what Sage did with the minimum, and her version of the line

- **I said `alerts.how` stays whole. That was too strict.** Sage shortened it (D-608, 15:29) to "One text each time, only for what is on. Reply STOP to stop, or HELP for help. Text and data rates may apply." The minimum is frequency, STOP, HELP and rates, and it still has all four. "For good" and "to reach a person" are not required, and "reach a person" was untrue (the HELP reply is an address). Checked against `docs/sms-campaign-samples.md`; the words and the consent paragraph are on `claude/lena-text-alerts-words`.
- **Sage proposed her own `privacy.s.texts.p4`:** "A text alert says only that something happened, like a message waiting or a visit booked. It never says who, or what a message says." It is not true as written: "a text alert" is the name of a screen with seven rows, and two of them (Before your trip: the time and the address; a saved place that closes or moves: the reason) send texts that say more. The line above is scoped to the events whose text is only a link, and the pin holds it. Either the line above or this one, which is also true of the six: "A text about a message, someone who wants to connect, or a visit booked, changed or planned says only that something happened. It never says who, what a message says, or which visit." Card a102 carries one line, the one Sage signs.


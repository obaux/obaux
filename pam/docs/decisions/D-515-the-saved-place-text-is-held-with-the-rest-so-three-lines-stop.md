# D-515 — The saved-place text is held with the rest, so three lines stop promising it

**Date:** 2026-10-11 · **Branch:** `claude/lena-a28-help`

**Decided by:** Will's rule "say only what Pam does" (a12, 10 October 2026); the hold on texts (D-481, `texts_live`);
and Mira, 11 October 2026, 03:17 UTC, choosing option (a) when the A28 promise check found the gap: "Pam says only what's
true today, and texts stay off until Will says go."

**What was found.** D-474 (10 October) kept one text as true: a note to a member who said yes when a place they saved
closes or moves. D-481 (also 10 October) then held every text except the account texts (sign-in code, the decision on a
staff request, "parts of Pam are off", the invitations). `saved_place_closed` is one of the held ones
(`44_texts_are_held_until_the_day_test.sql`). No bell row is made for the person who saved the place either: the bell
for a flagged place goes to the super admins and the savers' case managers (`notify_on_service_flag`), and nothing writes
`service_removed`. So three lines were untrue.

**What changed (English; the other six say the same, `copy:ack`ed).**

| Key | Before | After |
|---|---|---|
| `flag.done.body` | Somebody at Pam looks at every one of these. If the place comes off the list, anyone who saved it is told. | Somebody at Pam looks at every one of these. |
| `reminders.today.member` | Today Pam sends only one of these: a note when a place you saved closes or moves. The others are coming. | Pam does not send any of these yet. They are coming. |
| `profile.promo.reminders.body` | We can text you if a place you saved closes or moves. | Coming soon: texts about your visits and the places you saved. |

`terms.s.your-account.p3` ("so you can still sign in and get your texts") is **true today** and stays: the sign-in code
and the staff-request decision are the texts that need the number and do go.

**Kept from coming back.** `promises-of-texts.test.ts` fails if `flag.done.body` says the person is told, or if the
Text reminders line or the Profile card promise the saved-place text, while no text is live. The day texts go on,
`docs/before-launch.md` › *Visit reminders go live* lists the English to put back for each (with "and said yes to texts",
since the text goes only to someone who did). Nico makes `AlertsView` show the closed-place switch as not live while
`texts_live` is off (Mira told him); the screen and its line agree only once that is done.

**Not changed (not mine).** The public site's *Texts from Pam* post still lists "A place you saved has closed or
moved" under the texts Pam sends today, and its screenshot alt says so too (Wren).

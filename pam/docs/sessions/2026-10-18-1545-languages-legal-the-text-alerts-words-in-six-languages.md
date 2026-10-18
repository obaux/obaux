# Languages & Legal · the Text alerts words in six languages, and the carrier check on `alerts.how` (18 October 2026, ~15:45 UTC)

Lena, on `claude/lena-text-alerts-words`, off main `1551ed31`. Asked by Sage at 15:29 (D-608: screens don't explain; Will, 15:19).

## What changed

- **Six keys, six languages:** `alerts.kinds` "Kinds of texts" (new), `alerts.comingSoon` "Coming soon" (was a sentence; now a badge), `alerts.privacy` "Privacy" and its accessible name `alerts.privacy.label` "Privacy: Text messages" (new; the link goes to `/privacy/#texts`), and the two carrier lines, signed by Sage at `c286f954`: `alerts.how` "Pam sends one text each time something you turned on happens. Reply STOP to stop, or HELP for help. Text and data rates may apply." and `reminders.how` "Pam sends one text each time something on this list happens. ..." (the /reminders/ screen and the join step). STOP and HELP stay in Latin letters in every language. The lines are no longer than the ones they replace, so there is nothing new for the 320 audit, and the Text alerts screen has no story.
- **`docs/sms-campaign-samples.md`:** the consent paragraph Will pastes into the registration said the screen shows "STOP stops them permanently, HELP reaches a person". It now says "replying STOP stops them, replying HELP gets help" (989 of 1,024 characters). A reviewer compares that paragraph with the screenshot.
- **`docs/before-launch.md` A28.2:** done for `alerts.how` and `reminders.how`; the HELP reply is an address, and neither screen says "reach a person" any more.

## Checked against the carrier minimum

Frequency, STOP, HELP and rates are on the line; the row labels are the list of what is sent; the "Coming soon" badge says which are live; nothing is pre-selected. Dropping "reach a person" is right: the HELP reply is an address (a59). The removed intro was the only place the screen said "Pam", so the line names the sender. I first suggested "Pam sends one text each time, only for what is on", then saw it reads as all of Pam's texting (the sign-in code and the account notices go without a switch) and has no referent on the consent screens (nothing is "on" yet); the signed lines say "something you turned on happens" and "something on this list happens". The screen had no link to Privacy; `alerts.privacy` is it.

## Found

- **Sage's proposed `privacy.s.texts.p4` ("A text alert says only that something happened...") is not true of two of the seven rows** it sits under: Before your trip (the time and the address) and a saved place that closes or moves (the reason). Sent to her with a true version; card a102 carries one line. My line and its pin are on `claude/lena-text-promises`; Sage then withdrew hers.
- Nico's `alerts.spec.ts` lines 70, 90 and 176 quote the old Coming soon sentence and fail when `alerts.comingSoon` becomes "Coming soon". Not edited here (his file); he gets the three lines.

## Left undone

- `alerts.intro` and the seven `alerts.*.body` come out of the six languages and `en.json` in the same commit that the Text alerts screen stops rendering them. Removing them first shows raw key names on the live screen.
- **The registration and the screens disagree about the member's list:** the registered paragraph names two texts for a member (a reminder before a visit; a note if a saved place closes or moves), `/reminders/` shows those two, and the join step shows three (`reminders.what.3`, "A note when someone wants to connect with you"). Nothing queues `connection_request`, so that third row promises a text Pam does not send. Sage and Mira have it.
- This branch fails `alerts.spec.ts` until Nico's screen lands. It ships with it, not before.

## Needs a human

Will refiles the registration with the new consent paragraph and a screenshot of the new screen (before-launch, "File the updated text-message registration").

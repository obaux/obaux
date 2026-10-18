# Languages & Legal · what a text says moves to the Privacy page (18 October 2026, ~15:35 UTC)

Lena, on `claude/lena-text-promises`, off main `1551ed31`. Asked by Mira at 15:23 (Will, 15:19: the app should not explain what belongs on the legal pages; Text alerts rows lose their second line).

## What changed

- **`docs/design/plans/2026-10-18-text-promises-to-privacy.md`:** the line for card a102 (`privacy.s.texts.p4`, and an optional `p5` for the reminder), the check of all 21 SMS templates against it, the answer for Sage on what the Text alerts screen must keep, and what each row becomes. Nothing in `en.json`, nothing translated.
- **`text-alerts-say-only-that-something-waits.test.ts`:** holds in code the promise four rows used to make. Six templates carry only `{link}` in every language; `queue_text_alert()` queues `{ link }` and nothing else; every caller's link is `base || '/messages/'` or `base || '/'`; the reminders carry the time, the address and a link. Mutation-tested (a name in `message_waiting`; an id in the link).

## Found

- **The sentence as first drafted is not true of every template** ("a text about something in Pam only says that something is waiting"): `facilitation_member` names who introduced you, the reminders carry a time and an address, `attendance_*`, `saved_place_closed` (the reason), `staff_request_*`, `access_limited_notice` and `support_reply` (the reply itself; unsigned) all say more. The line is scoped to the events whose text is the six that say nothing but "something is waiting".
- Message Pam's `message_waiting` is the same template: it cannot name Pam, a person or the words.
- `connection_request` has a template and no caller yet.
- The Text alerts screen has no link to the Privacy page or the Terms, which the registered campaign lists as its URLs.

## Left undone

Will's signature on a102. Then: the line into `en.json` and the six languages, `legal.ts` texts 3 to 4 (or 5), `legal:date privacy`, `copy:ack`, the line's own pin, a native-reader entry. Sage cuts the screen rows; that does not wait.

## Needs a human

Will signs the line. Sage decides the optional reminder line's twin on the screen and the link line.

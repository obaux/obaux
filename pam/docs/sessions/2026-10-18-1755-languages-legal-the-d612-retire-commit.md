# Languages & Legal · the retire commit after D-612 (18 October 2026, ~17:55 UTC)

Lena, on `claude/lena-retire-d612`, on Dot's `claude/pam-design-d608-badges` @ `940c6fe7` (D-612, on main `615e1078`). Asked by Mira at 17:43: retire only, the six keys the badges left unused.

## What changed

- **Six keys are gone from `en.json`, the six bundles and the ledger:** `profile.promo.reminders.body` ("Coming soon: texts about your visits and the places you saved."), `profile.promo.alerts.body.adminList` ("Coming soon: texts about messages and trips."), `profile.promo.alerts.body.providerList` ("Coming soon: texts about bookings, changes and messages."), `example.people.note` ("Example people, so you can see how this looks."), `notify.example.note` ("Examples, so you can see what this looks like.") and `home.calendar.preview.note` ("These are example people, so you can see how it looks."). 42 bundle lines and 36 ledger lines; `copy:ack` pruned the ledger and nothing else moved.
- **One test line goes with them.** `packages/config/test/promises-of-texts.test.ts` asserted `BUNDLES.en['profile.promo.reminders.body']` did not say "we can text you". With the key gone that is `expect(undefined).not.toMatch(…)`, which throws. The card is now a title and a Coming soon badge, so there is no body to keep honest; the other assertions in the test (the Text reminders screen's own lines) are untouched, and the general test above it still checks every English line for a promised reminder.

## How I know nothing else uses them

`git grep` over `apps` and `packages` (not the locale files) finds none of the six names except that test line. The only dynamic builders near them are `notify.kind.${kind}` on the bell (kinds are `message_received`, `service_flagged` and so on, not these), `notify.${row.kind}` in one e2e fixture, and `profile.promo.alerts.title` / `profile.promo.reminders.title` on Profile, which stay. No spec, test or story contains any of the six sentences.

## Left undone

`help.writeToPam`, after Nico's W2 lands (Mira, 17:40). `reminders.what.3`, after Sage's `fe81b1a3`.

## Needs a human

Nothing.

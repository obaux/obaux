# Languages & Legal · the retire commit after b72 (18 October 2026, ~17:45 UTC)

Lena, on `claude/lena-retire-b72`, off main `615e1078` (b72). Asked by Mira at 17:31: retire only, four keys; Dot's six wait for D-612; the Arabic twos stay with Ava's keys.

## What changed

- **Four keys are gone from `en.json`, the six bundles and the ledger:** `programs.new.done.body` ("Sent. We'll text you when it's checked."), `home.caseload.search.none` ("Nobody on your list by that name"), `points.intro` ("Points come from what you do out there …") and `programs.review.text.body` ("Turn on text alerts"). 28 bundle lines and 24 ledger lines; `copy:ack` pruned the ledger and nothing else moved.
- **How I know nothing uses them:** `git grep` over `pam/apps` and `pam/packages` (not the locale files) finds none of the four names. The only dynamic builders near them are `programs.review.title.${status}`, `.body.${status}` and `.step.${step}` on the program review screen, `home.caseload.*` is read for `title`, `count`, `search.label` and `search.placeholder`, and the Points page reads its own keys one by one; none builds these names.
- **No spec, test or story names the four keys, and none pins their sentences.** One spec does pin a sentence that is word for word `programs.new.done.body`: `e2e/add-my-program.spec.ts:76` ("Sent. We'll text you when it's checked."). It reads the screen, and the screen is `addProgram.ask.sent.body` (`AddMyProgramScreen.tsx:55`), which is untouched.

## Verified

`copy:status`: all languages in step. `@pam/config` suite: 65 files, 1,447 pass (1 skipped, 1 todo). `@pam/web` typecheck clean and its unit tests 37 files, 200 pass, both on a checkout of the commit itself. No e2e run: the commit changes no screen and no sentence a screen shows.

## Found

`programs.review.text` itself ("Text me when it's live") is also used by no code; `ProgramReviewView.tsx` says in a comment that the row is left out until something sends that text. It is not on Mira's list, so it stays for her to say.

## Left undone

- Dot's six, after D-612: `profile.promo.reminders.body`, `profile.promo.alerts.body.adminList`, `profile.promo.alerts.body.providerList`, `example.people.note`, `notify.example.note`, `home.calendar.preview.note`.
- `reminders.what.3`, after Sage's `fe81b1a3` (check `/reminders/` does not use it).
- The Arabic twos are with Ava's keys (`claude/lena-pam-team-words`).

## Needs a human

Nothing.

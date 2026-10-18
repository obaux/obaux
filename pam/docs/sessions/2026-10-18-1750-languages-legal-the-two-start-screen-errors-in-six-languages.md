# Languages & Legal · the two start-screen errors in six languages (18 October 2026, ~17:50 UTC)

Lena, on `claude/lena-start-errors`, on Ava's `claude/pam-message-pam-admin` @ `73e954cd`. Asked by Mira at 17:41: Sage signed two errors for the Pam team's start screen at `a93a69fe`, Ava has them in `0d2627e7`.

## What changed

- **Two keys in six languages:** `pam.start.failed` ("Your message is still here. Tap Try again.", the card under a first message that did not go) and `pam.start.notAllowed` ("You can't message the Pam team as Pam.", the calm line when the person is one Pam does not write to). Team screens, so usted, você, 您, вы. "Pam" stays.
- **"Try again" is the button's own words.** The Try again button is on the failed message (`messages.thread.tryAgain`), so the line names it the way that key says it in each language (Intentar de nuevo, Tentar de novo, 再试一次, 再試一次, Попробовать снова, حاول مرة أخرى) and puts it where the other "Tap …" lines put a button name (plain in Spanish, Portuguese and Arabic with «…» because the label is a sentence; “…” in zh-CN, 「…」 in zh-HK, «…» in Russian).
- `copy:ack` (12 ledger lines, nothing else moved), `copy:status` in step, `@pam/config` suite 66 files, 1,455 pass (1 skipped, 1 todo).

## Found

Neither line was drawn by any story when I first looked (the failed state is reached by a send that fails). Ava then wrote four (`super-admin-screens--pam-start-person-failed`, `…-program-failed`, `…-person-not-allowed`, `…-person-off`), and Mira asked for the audit on them (18:05). On her head `18518e7a`: **0 findings new in a language at 320×760 and 320×568 in seven languages** (6 stories × 7), and the one English ellipsis at 568 is the design's own. A separate check opened each of the four stories in each of the seven languages and found the signed line in the page text every time (28 of 28; `pam.inbox.off` for the off state), so the clean audit is of the real lines, not of an empty screen.

## Left undone

A native reader for the team's words (before-launch, with the rest).

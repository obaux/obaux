# Languages & Legal · the two start-screen errors in six languages (18 October 2026, ~17:50 UTC)

Lena, on `claude/lena-start-errors`, on Ava's `claude/pam-message-pam-admin` @ `73e954cd`. Asked by Mira at 17:41: Sage signed two errors for the Pam team's start screen at `a93a69fe`, Ava has them in `0d2627e7`.

## What changed

- **Two keys in six languages:** `pam.start.failed` ("Your message is still here. Tap Try again.", the card under a first message that did not go) and `pam.start.notAllowed` ("You can't message the Pam team as Pam.", the calm line when the person is one Pam does not write to). Team screens, so usted, você, 您, вы. "Pam" stays.
- **"Try again" is the button's own words.** The Try again button is on the failed message (`messages.thread.tryAgain`), so the line names it the way that key says it in each language (Intentar de nuevo, Tentar de novo, 再试一次, 再試一次, Попробовать снова, حاول مرة أخرى) and puts it where the other "Tap …" lines put a button name (plain in Spanish, Portuguese and Arabic with «…» because the label is a sentence; “…” in zh-CN, 「…」 in zh-HK, «…» in Russian).
- `copy:ack` (12 ledger lines, nothing else moved), `copy:status` in step, `@pam/config` suite 66 files, 1,455 pass (1 skipped, 1 todo).

## Found

Both lines are drawn by no story: the failed state is reached by a send that fails, and `PamStartPerson` / `PamStartProgram` draw only the screen before it. Both lines are wrapping text (a card body, a supporting line), with no fixed width, so a cut is not expected; the 320 audit cannot confirm it. A story per state needs the mock to answer `pam_start_conversation` with an error (and `PAM_OFF` / `NOT_ALLOWED` for the calm line).

## Left undone

A native reader for the team's words (before-launch, with the rest).

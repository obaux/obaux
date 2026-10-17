# 2026-10-17 — messages dictation can't start

**Branch:** `claude/messages-dictation-cant-start` · **Lane:** Messages & notifications (Nico)

## What changed

- `ThreadView.tsx`: the conversation's microphone reports every failure to start in a line above the box (Pam's warning banner, as "Pam can't send that file"), says "Listening" as soon as it starts, and still hides on a browser with no speech recognition (Mira put the old rule back after a first version showed it there). `lib/dictationProblem.ts` maps the browser's error codes to five lines (D-603).
- Ten new English strings, held as English in the other six languages (recorded unrecorded with `copy:ack`).

## What was wrong, and what missed it

- Pam passed no `onError` to Astryx's `useChatDictation`; `start()` returned silently on a browser with no recogniser; a throw from `recognition.start()` was uncaught; a start that never answers had no end. Iris's run-through (W4) found it by tapping the mic in a Chromium that could not reach the speech service. The D-397 test stubbed only a recogniser that works.

## Decisions made

- D-603. The mic stays hidden where the browser has no recogniser (Mira's call, 17 October, after a first version that showed it).

## Verified

- `dictationProblem.test.ts`; twelve cases in `messages.spec.ts` pass on this branch and the failure cases fail on main 62ba50e4.

## Left undone

- Sage signs the English; Lena translates. No line for `no-speech`; no "starting…" state.

## Needs a human

- Will tries it on his phone once it is live (Mira's plan).

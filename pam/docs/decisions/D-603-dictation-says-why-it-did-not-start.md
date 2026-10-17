# D-603 — dictation says why it did not start

**Date:** 2026-10-17 · **Branch:** `claude/messages-dictation-cant-start`

**Decided by:** Mira, relaying Iris's interaction run-through (finding W4, `claude/research-interaction-run-through` @ ea2583f9), 17 October 2026: in a conversation, tapping "Speak your message" showed nothing in her Chromium, no "listening" state and no message. Her browser could not reach the speech service, so that case may be her setup, but there was no code path that tells the member when dictation cannot start. Mira: "make every failure to start say so in one line, the way 'Pam can't send that file' does, and make 'listening' visible as soon as it starts."

**What was wrong:** `useChatDictation` (Astryx) reports a recogniser failure only through an `onError` callback, and Pam passed none. `start()` ignores a browser with no recogniser, and an `InvalidStateError` thrown by `recognition.start()` was uncaught. A refused microphone, no connection, no microphone, an unsupported language, a start that never answers, and a recogniser that ends without ever starting all looked like a button that did nothing. While it listened, the only sign was the equalizer bars on the button, at their smallest until a sound came.

**What changed (`ThreadView.tsx`, `lib/dictationProblem.ts`):**
- The browser's error codes map to six lines (`dictationProblemFor`): `blocked` (`not-allowed`, `service-not-allowed`), `noMic` (`audio-capture`), `offline` (`network`), `language` (`language-not-supported`), `unsupported` (no recogniser), `failed` (any other code, a start that throws, a recogniser that ends without starting, or no answer from the browser for ten seconds). `aborted` and `no-speech` are not failures to start and show nothing.
- The line is Pam's warning banner above the box, the same one and the same shake as "Pam can't send that file" (D-409): a title and a short hint, closable, announced as an alert. A start clears it; a second failure shakes it again.
- While it listens, the same place says "Listening" (the existing `voice.listening`), as well as the bars. A failure, a dropped file and a picked file take that place first.
- **The mic no longer hides on a browser with no speech recognition.** It used to (`isHiddenWhenUnsupported`, the §1 rule that a dead button is worse than no button). Mira's brief lists "the browser has no speech recognition" among the failures to say, which a hidden button can never do, so the button stays and a tap on such a browser says "This browser can't turn speech into words. You can type your message instead." Reverse this by setting `isHiddenWhenUnsupported` back; the `unsupported` line and its test then go.

**Ten seconds:** a permission prompt can legitimately take longer. The line is not an abort: if the person allows the microphone after it, the start clears the line and it listens.

**Not done on purpose:** no line for `no-speech` (it ended after listening, not a failure to start); no "starting…" state between the tap and the browser's start; no retry.

**Words:** twelve new English strings, `messages.thread.dictate.problem.<kind>.title` and `.hint`, held as English in the other six languages and recorded unrecorded (`copy:ack`). They await Sage (signing the English) and Lena (translating).

**Proof:** `lib/dictationProblem.test.ts` (the mapping); `e2e/messages.spec.ts` › "speaking a message that cannot start": a stub recogniser that is refused (`not-allowed`, `service-not-allowed`), has no microphone, no connection, a language it cannot hear, an unexpected code, ends without starting, throws, never answers (ten seconds, with the page clock), plus a browser with no recogniser; "Listening" and its clearing an earlier failure; the line closes and is an alert. On main (62ba50e4) the failure cases fail on the line not showing.

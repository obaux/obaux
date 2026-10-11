# 2026-10-11 — Languages & legal — the carousel's Pause and Play, in six languages

**Branch:** `claude/lena-carousel-words` (from Wren's `claude/compassionate-bohr-mzrchf`, where the keys exist, D-501) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 00:56 UTC: `carousel.pause` = "Pause" and `carousel.play` = "Play" (Will approved the English at 00:54 UTC) are the screen-reader names of the small round button that stops and starts the
picture carousel on Sign in, About Pam and the website. They block a merge because `@pam/config` fails until the six languages answer them.

## What changed

Two keys, six languages, `copy:ack`ed (status "in step", config 1067 green). They are verbs, as the button's name is said by a screen reader beside the carousel's own name ("How Pam works"):

| | Pause | Play |
|---|---|---|
| es | Pausar | Reproducir |
| pt-BR | Pausar | Reproduzir |
| zh-CN | 暂停 | 播放 |
| zh-HK | 暫停 | 播放 |
| ru | Приостановить | Воспроизвести |
| ar | إيقاف مؤقت | تشغيل |

Choices: the standard media-control words of each language, not the bundle's "Parar"/"Stop" family: `voice.stop` is "Stop" (end a recording), and Pause must not be confused with it, so Arabic says "إيقاف مؤقت"
(a temporary stop) against `voice.stop`'s "إيقاف". Russian uses the verb ("Приостановить", not the noun "Пауза"), like `voice.stop` ("Остановить") and the rest of its buttons. English has no other Play or Pause
string, so there was no existing word to match.

## What was wrong, and what missed it

Nothing: new keys with no translations, caught as designed by the copy test.

## Decisions made

None.

## Verified

`@pam/config` 1067 tests, `copy:status` in step. Not run: the browser suite and the fit audit. The names are `aria-label`s on an existing button, so no layout changes; Wren's branch carries its own checks.
The screen-reader reading itself is not heard by me: it joins the "listen to the screen reader" item on `docs/before-launch.md`.

## Left undone

A native reader for the six (before-launch).

## Needs a human

Nothing.

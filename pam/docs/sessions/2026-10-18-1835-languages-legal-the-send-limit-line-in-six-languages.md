# Languages & Legal · the send-limit line in six languages (18 October 2026, ~18:35 UTC)

Lena, on `claude/lena-rate-limited`, on Nico's `claude/messages-pam-b73-followup` @ `64d16ab5`. Asked by Mira (17:45, 18:22) once Sage had signed `messages.thread.rateLimited` at `035159dd`.

## What changed

- **`messages.thread.rateLimited`** ("That's a lot at once. Wait a moment, then send it again.", Iris W4) in es, pt-BR, zh-CN, zh-HK, ru and ar. It is the calm line in the banner over the box when a send hits the limit; the words go back in the box and there is no "Not sent". A thread screen, so tú, você, 您, вы, as `messages.thread.failed.body` is. The English says "a lot", not "too many messages", so the translations do not say what either (es *Es mucho a la vez*, pt-BR *É muita coisa de uma vez*, zh *一次发得有点多* / *一次傳得有點多*, ru *Слишком много сразу*, ar *هذا كثير في وقت واحد*).
- Nico's first draft in the bundles was his own wording; he replaced it with Sage's signed sentence at `64d16ab5` (all seven bundles, acked) before I started, so the translations are not stale. `copy:ack` re-acked the six; `copy:status` in step; `@pam/config` suite 65 files, 1,452 pass (1 skipped, 1 todo).

## Specs that pin the sentence

`e2e/message-pam.spec.ts` (the W4 test) checks the English sentence, in English. A translation changes nothing it reads.

## Found

No story draws the banner (the state needs a send that hits the limit), so the 320 audit cannot see the line. It is a Banner title with a close button, which wraps, but nothing proves it in Russian or Arabic. Nico's e2e `world()` already takes a `locale`, so a spec that runs the W4 case in the seven languages and checks the line is visible and the page does not scroll sideways would prove it; or a story.

## Left undone

A native reader for the line (before-launch, with the rest of the Message Pam words).

## Needs a human

Nothing.

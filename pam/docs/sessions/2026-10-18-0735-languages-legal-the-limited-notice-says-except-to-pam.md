# Languages & Legal · the limited-account notice says "except to Pam" (18 October 2026, ~07:35 UTC)

Lena, on `claude/lena-limited-notice`, off main `2bcb2e39`. **Held: it ships in the same batch as the Privacy and Terms `limits.p2` lines Will signs on card a100, and never before them** (Sage, ledger at A29 `b658ac15`; the notice before Pam is in everyone's Messages would say something untrue).

## What changed

- **`notice.account_limited.body`** (the banner a limited account sees at the top of Messages and in a thread), in `packages/config/src/notices.ts` and `en.json` together, and in six languages: "You cannot send messages right now, except to Pam. Write to Pam and we will help you reach your guide." It was "You cannot send messages right now. Your guide turned this off for your account. You can still read your messages. Contact Pam and we will help you reach your guide." The title ("Some things are turned off") and the "Contact Pam" link are as they were.
- Translations (member register: tú, você, 您, вы): es "No puedes enviar mensajes por ahora, excepto a Pam. Escribe a Pam y te ayudaremos a comunicarte con tu guía."; pt-BR "Você não pode enviar mensagens agora, exceto para Pam. Escreva para Pam e vamos ajudar você a falar com seu guia."; zh-CN 您现在不能发送消息，发给Pam的除外。给Pam发消息，我们会帮您与您的引导人取得联系。; zh-HK 您目前不能傳送訊息，傳給Pam的除外。傳訊息給Pam，我們會協助您與您的引導人取得聯繫。; ru «Сейчас вы не можете отправлять сообщения никому, кроме Pam. Напишите Pam, и мы поможем вам выйти на связь с вашим куратором.»; ar «لا يمكنك إرسال الرسائل الآن، إلا إلى Pam. راسل Pam وسنساعدك في الوصول إلى مرشدك.» "Pam" keeps its Latin letters, as in every other line.
- **The e2e that quotes the old words** (`messages.spec.ts` lines 641–642, "a limited account reads, and the composer says what is off and who to call", **Nico's file**) is **not** changed here: Mira (07:29) put those two lines in Nico's slice 2, which changes the limited screen anyway (the Pam conversation with a composer). **Until then this branch is held and its e2e would fail on those two assertions.** The lines for him: `/^You cannot send messages right now, except to Pam\./` for 641 and `/Write to Pam and we will help you reach your guide\./` for 642.
- `notices.test.ts` (reading grade 6) and the whole config suite pass: 60 files, 1,403 tests. `copy:status` in step.

## Verified

On the real build of this branch (`d77278fc`), **with the two assertions changed as above** (that change was then taken out of the branch at Mira's request): `messages.spec.ts -g limited` passed, 12 of 12 (the four limited-account tests in three projects, including the one whose words changed). The 320 fit audit on the notice stories (21 stories × 7 languages, at 760 and 568 tall) finds nothing: no clipping in any language.

## What it does not change

The three website posts (`StartHere`, `CaseManagerAssignments`, `PamWords`; Wren, signed at Sage's `fa8df003`) and the Privacy and Terms `limits.p2` lines (Will's, nothing translated until he signs) ride in the same batch; none is on this branch.

## Left undone

- Native readers: the six translations are in the Message Pam entry of `docs/before-launch.md` when that lands; this notice is not a promise line but `terms.s.limits.p3` ("Pam tells you it is off and who to ask") is, and the notice is how it keeps it.
- When Pam is built: a limited account must really be able to write to Pam (Nico), or this sentence is untrue.

## Needs a human

Will's signature on the `limits.p2` pair, which this waits for.

# Languages & Legal · the Pam inbox words in six languages (18 October 2026, ~08:20 UTC)

Lena, on `claude/lena-pam-inbox-words`, stacked on Ava's `claude/pam-message-pam-admin` @ `02f06698` (Sage's signed English, `b947f366`). Asked by Ava (S1 of card a100): the super admin's "Messages to Pam" inbox.

## What changed

- **The 24 `pam.inbox.*` keys** (title, the two groups, the closed row and its empty line, the empty line, four role labels, the waiting times and the reply-time lines) are in `es`, `pt-BR`, `zh-CN`, `zh-HK`, `ru` and `ar`. "Pam" is left as the name it is. Vocabulary is the bundles' own: conversation = conversación / conversa / 对话 / 對話 / разговор / محادثة; case manager and program lead as in `role.admin` and `review.theProgramLead`.
- **Plural forms.** The six `waiting.*` and `replyTime.*` families: `es` and `pt-BR` carry a `.one` ("Esperando {count} minuto"; Portuguese `one` also covers 0, so `{count}` stays); `zh-CN` and `zh-HK` have one form (the `.one` key repeats it); `ru` has base, `one`, `few`, `many` (a duration after "в течение" takes the genitive: 1 минуты, 2 минут, 5 минут; "ждёт" takes the accusative: 1 минуту, 2 минуты, 5 минут); `ar` has base, `zero`, `one`, `two`, `few`, `many`, with the number kept in each form (as `directory.count` does) and the dual written out (دقيقتين، ساعتين، يومين).
- **The Arabic program line** is "مسؤول البرنامج في {program}": the English-inside-RTL Ava saw was the missing Arabic; `t` isolates `{program}`, so the name is its own run (pictures below).
- **`test/_bundles.ts`:** the six English `.one` keys are in `NO_PLURAL_VARIANTS`, like `program.policies.rowBody.one`. Without it the plural test read each English `.one` as a family of its own and asked `ru` and `ar` for its forms.

## Verified

`copy:status` in step after `copy:ack`; `@pam/config`: 61 files, 1,406 tests pass. `tsc` clean; Storybook builds. The 320 fit audit on the super admin stories (50 stories × 7 languages, at 760 and 568 tall) finds nothing new in any language (the 15 clamp and ellipsis cases are the English design's own, as on Ava's branch). Pictures at 320 in ar, ru, es and zh-CN: `docs/research/shots/2026-10-18-lena-pam-inbox-320-*.png`.

## Left undone

No native reader: it is a super admin's screen and nothing in it is a promise to a member (Ava). The "Pam" reply preview in Arabic still draws an English message inside an Arabic line with the ellipsis on the near side; it is the mock's English text, and a real Arabic message does not do it, but it is worth a look once there is one.

## Needs a human

Nothing.

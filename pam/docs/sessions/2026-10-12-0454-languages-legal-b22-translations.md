# 2026-10-12 — languages-legal b22 translations

**Branches:** `claude/lena-program-sees-before-a-visit` (a63), `claude/lena-im-here-privacy` (a66), `claude/lena-who-starts-a-chat` (a72), `claude/lena-no-direct-appointment-writes` (DB test 69), `claude/lena-area-hint-wording`, this record · **Lane:** Languages & legal (Lena)

## What changed

- **a63, a66, a72 signed and translated, and live in b22.** Will signed a63 at 01:06 UTC (line 1 of `privacy.s.sharing.p2`, the "A program can see:" card, the short line), a66 at 01:08 (`what-we-keep.p9`/`p10`) and a72 at 03:33 (the sentence about who can start a chat). I wrote the six translations
  of each in the hour after (nine keys for a63, two for a66, the one sentence for a72), acknowledged the ledger, ran the config tests and a 320px fit audit of the Privacy page and both transparency screens in seven languages (no findings), and sent Mira one SHA each time.
  The final SHA was 6af68435 on the a66 head, so one branch carried everything. Piper's, Nico's and Sage's work merged around it.
- **The a66 conflict.** `transparency.ts` conflicted between a66 and the a63 stack (both appended to the end of the hidden list). Both sides kept. I did not merge a72's unsigned sentence into a66 as asked; the two merge clean in either order, so the sentence rode only when Will signed it.
- **Test 69** (`claude/lena-no-direct-appointment-writes`): nobody writes an appointment row directly (a lead, a member, another program's lead; no write grant; the columns that say how a visit was marked are not writable). Piper asked for the write pin her test 65 does not attack. Merged in b21.
- **Config tests that read the code:** `program-sees-before-a-visit.test.ts` reads Piper's two migrations (appointments read narrowed to nothing; the lead's card is three keys, each visit six) once they are on main; `program-starts-a-chat.test.ts` reads Nico's `can_start_conversation` and `message_program`;
  `im-here-location.test.ts` now checks every language's `p9` against that language's `checkin.here` / `checkin.went` (curly and straight apostrophes are one word). All three run on b22.
- **Words for the "I'm here" buttons**, quoted by Privacy p9, so they had to be one set: es Ya llegué / Fui; pt-BR Cheguei / Eu fui; zh-CN 我到了 / 我去过了; zh-HK 我到了 / 我去過了; ru Я на месте / Визит состоялся; ar وصلت / ذهبت. Piper put them in `checkin.here` / `checkin.went`.
- **Other lines translated for their owners,** each sent as six strings: Nico's `messages.program.note` (with three corrections: zh-CN, zh-HK and ar had added "only"), `messages.program.unavailable.*`, `messages.empty.body.provider`; Piper's `person.card.note`, `place.about`,
  `trips.booked.hasLead`, `place.lead.sees`, `trips.notMarked` and the eight `checkin.*` lines.
- **Area picker wording** (Iris, b20; branch `claude/lena-area-hint-wording`, merged in b21): no comma before o/ou in the hint (es, pt-BR); pt-BR says "ZIP code", not "CEP" (Brazil's own eight-digit code); the Spanish picker is tú throughout.

## What was wrong, and what missed it

- **English copies passed for translations.** Eight `checkin.*` lines and `trips.notMarked` were English text in all six language files, and `copy:status` said "All languages are in step" because the copies had been acknowledged in the ledger as if translated.
  The only check that notices is `copy.test.ts`'s "differs from English", and it was switched off for those keys by `MAY_MATCH_ENGLISH`. I caught it by reading the keys on Piper's branch, not by any test; Mira removed the allow-list loop and the desk now runs an English-copy check on every batch.
- **My own test failed for the wrong reason.** `im-here-location.test.ts` compared the signed English “I’m here” (curly apostrophe) with the app's "I'm here" (straight). Piper found it; the fix treats the two as one word and, better, checks p9 against each language's buttons.
- **A claim I nearly shipped,** earlier in the evening: "a program can never write first". It is false; the sentence says "start".

## Decisions made

None new (D-543 covers the card and the move of `transparency.canSee.signed`).

## Verified

Config on b22: 1176 passed, 0 failed, 1 skipped (Mira's run, with Nico's and Piper's migrations in the tree, so both halves of `program-starts-a-chat` run). My runs on each head: config green, `tsc` clean, `copy:status` in step, DB suite green with tests 68 and 69. Fit audit at 320px (Storybook rebuilt on each head). No native reader has seen any of it.

## Left undone

- Will's signatures on a67 and a68; six translations of each follow. a70 was signed at 06:00 (all seven languages already written; goes in b24). The Google sync lines (a71) wait until Will switches the sync on (06:03).
- Native readers for all seven languages; pt-BR "registrada" for "marked" first (Brazilian "marcar uma visita" means to book one).
- The retention figure in p11/p12 must change before the Supabase plan goes to Team; Twilio's retention (Nico); the City of Philadelphia licence read once (`docs/data-licences.md`).
- Friday 16 October's batch (welcome slides, attendance promise, privacy guard, staff-request words).

## Needs a human

Will: the two signatures above (a67, a68), and a71 when the sync goes on; the licence read; a native pt-BR reader (registrada) and the other readers.

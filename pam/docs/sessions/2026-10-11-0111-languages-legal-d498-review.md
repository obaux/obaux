# 2026-10-11 — Languages & legal — review of Piper's D-498 drafts (a place with no program lead)

**Branch:** `claude/lena-d498-review` (from `main` at `0402478`) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 00:57 and 01:08 UTC: review Piper's drafts of eight keys in six languages, once D-498 is on `main`. The English of all eight is Will's (the six on his card at 23:4x on 10 October,
`program.tools.needsProgram.title` and `.body` at 00:57 UTC on 11 October). They tell a member that a place with no program lead on Pam is not told about their visit: **the meaning must not soften**.

## What changed

The keys: `place.noLead`, `place.dropin.body.self`, `trips.new.note.self`, `trips.confirm.title.self`, `trips.moved.body.self`, `trips.booked.noLead`, `program.tools.needsProgram.title`, `.body`.
**The meaning of the two "not told" lines was checked first, in all six languages, and it held in every one:** "Pam does not tell {place} you are coming" and "{place} … is not told about this visit" are both said
as a plain, present, unconditional "no" (never "may not", never "might not"). The button named in `place.dropin.body.self` ("Plan a trip") matches the app's own label in every language
(`trips.new.where`: Planear una visita, Planejar uma visita, 安排预约, 安排到訪, Запланировать визит, خطط لزيارة).

What was wrong, and is fixed (13 strings, 5 languages; English untouched):

- **A place's name is a variable, so the sentence must not agree with it.** `trips.booked.noLead` said "{place} não está … é **avisado**" (pt-BR, masculine), "{place} не **представлено**" (ru, neuter) and "{place} **ليس** على Pam" (ar, masculine):
  each is wrong when the name is feminine ("a Biblioteca … é avisada", "Библиотека … представлена", "المكتبة … ليست"). Reworded without agreement: pt-BR "…então ninguém ali é avisado desta visita"; ru "Для «{place}» нет программы в Pam, поэтому о визите там не сообщают" (the
  bundle already quotes a place as «{place}»); ar "لا يوجد برنامج باسم {place} على Pam، لذلك لا يتم إبلاغ أحد هناك بهذه الزيارة". es and zh were already neutral.
- **zh-HK** — 你 → 您 in four strings (the bundle addresses everybody as 您; the two program-lead lines were the same slip).
- **pt-BR** — "O Pam" → "Pam" (the bundle says Pam bare); "colocá-la em Visitas" → "adicioná-la às suas Visitas" (the tab's name and the bundle's verb).
- **ar** — "لا يُبلغ Pam" (reads "does not reach" without its damma) → "لا يخبر Pam", which cannot be misread.
- **es** — "añadirla" → "agregarla" (the bundle's verb); `trips.new.note.self` "para usted (puede saltarla)" → "para ti (puedes saltarla)" because its sibling on the same screen, `trips.new.note`, is tú ("¿Algo que quieras decirles? (puedes saltarlo)").
- Kept as written: Russian except `trips.booked.noLead`; Spanish `place.noLead`, `trips.confirm.title.self` and `needsProgram.*`; pt-BR `needsProgram.*`; all of Simplified Chinese; and everything not listed above.

Re-acked (`copy:ack`; status "in step"); config 1067 green.

## What was wrong, and what missed it

A draft is written for the sample sentence, not for every value of a variable. A place name can be any gender and any case; a sentence that makes a verb or adjective agree with it, or puts it in a case the language needs,
is right for one name and wrong for the next, and nothing in a test sees it. In languages with grammatical gender (pt-BR, ru, ar, es) put the name where it needs no agreement: quoted, or after a preposition, or with an impersonal verb.

## Decisions made

None: a review of drafts.

## Verified

On `f023058` (main `0402478` plus this): `@pam/config` 1067 tests, `copy:status` in step, the browser suite on all three viewports **1110 passed, 18 skipped** (12.0 min), Storybook builds, and the fit audit
(7 languages and the pseudo-language): the two stories that draw the no-lead lines (`place-no-lead`, `plan-trip-no-lead`): **0 new**; the 46 stories with "place" in their id: 2 new, both already accepted;
the 12 with "trips": 17 new, all already accepted. **Not measured:** the needs-a-program screen (`NeedsOwnProgram`, reached from `/program/policies/` and `/program/service/` for a program lead with no program):
no story draws it. Its two lines are short (the body is at most 72 characters, in Russian).

## Left undone

- A native reader for the six (before-launch).
- Friday 16 October: the privacy guard, from the weekly notes.

## Needs a human

Nothing.

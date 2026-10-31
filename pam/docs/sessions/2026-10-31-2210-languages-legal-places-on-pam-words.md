# 2026-10-31 — languages & legal: "Places on Pam" and "Missing information", in six languages

**Branch:** `claude/lena-program-stats-words` (on Sage's `claude/sage-program-stats-words` @ `f2ab2f6a`, which is Ava's `claude/pam-program-stats` @ `f8c5451c` plus the English) · **Lane:** Languages & legal (Lena) · from Mira (21:57, 22:00 UTC, 31 October), D-623, Will's super admin counts and "Missing information" list

## What changed
- **31 keys** (`programStats.*` 8, `missingInfo.*` 22, `nav.back.missingInfo`) in es, pt-BR, zh-CN, zh-HK, ru and ar, in the words the app already uses for phone, website, address, hours, "Search places", "Reported places" and "Back to …" (Teléfono/Sitio web/Dirección/Horario; Telefone/Site/Endereço/Horário; 电话/网站/地址/开放时间; 電話/網站/地址/開放時間; Телефон/Сайт/Адрес/Часы работы; الهاتف/الموقع الإلكتروني/العنوان/ساعات العمل). Only a super admin sees these screens: staff register (usted, você, 您, вы).
- **"Places on Pam" is not "Programs on Pam".** The card counts places, and a place with a lead is a *program* elsewhere in the app (programa/programa/项目/計劃/программа/برنامج). The title says *places* in every language: Lugares en Pam, Lugares em Pam, Pam 上的地点, Pam 上的地點, Места в Pam, الأماكن في Pam. The word "program" is nowhere in the 31 lines.
- **Plurals.** `missingInfo.count` is a family in ru (base, one, few, many: место/места/мест) and in ar (base, zero, one, two, few, many; the dual "مكانان" has no digit, so `missingInfo.count.two` is in `AR_DUAL_WITHOUT_DIGIT`). es, pt-BR, zh-CN and zh-HK write the base and English's own `.one` (so `missingInfo.count.one` is in `NO_PLURAL_VARIANTS`, like `problems.times.one`). pt-BR's "one" covers 0 too, so a count of nothing reads "0 lugar", as `problems.times` does.
- **`missingInfo.shown` has no family.** It is a label and a number: Russian "Показано: {count}" (the verb does not agree with the number) and Arabic "المعروض: {count}" (the digit stays, even for two). es/pt-BR/zh write the number first with the participle (mostrados/exibidos/已显示…个). `missingInfo.shown` and `.shown.one` are in `NO_PLURAL_VARIANTS`. English's `.one` equals its base, which is harmless.
- **"{have} of {need}"** (`programStats.ofNeeded`): es/pt-BR "{have} de {need}", ru "{have} из {need}", ar "{have} من {need}", zh "{have}（共{need}）". The first version for zh was "{have} / {need}"; `copy.test.ts` ("written in its own script") wants a Chinese character in every string, and "共" is the one that says "of this many".
- **Test fix in my lane:** `test/error-log-line.test.ts` read the screens the error log may name only from the first migration's seed, so Ava's migration for the new screen (`insert into public.app_error_routes … ('/places/missing/')`) made it fail on her own tree. It now reads later inserts for screens as it already did for actions. Nothing else changed in the test.

## The Arabic "331 of 588" (Ava's pictures)
Checked in headless Chromium, in an RTL page, with the real numbers:

| string | what the eye reads, right to left |
|---|---|
| English fallback `331 of 588` | **331, 588, of** — reads as "of 588 331"; this is what Ava's pictures showed, because the Arabic key did not exist yet and the English fell back inside the right-to-left row |
| Arabic `331 من 588` | **331, من, 588** — correct; 331 is on the right, where the eye starts |
| Arabic `1,204 من 3,321` | the same |

So the fix is the Arabic string, and **no isolation is needed in the code**, because `ProgramStats.tsx` passes both numbers into one `t('programStats.ofNeeded', { have, need })`. It would break only if someone later draws the two numbers in two elements: then the order is the page's, not the string's. Nothing in the other five languages is order-sensitive (the two numbers sit either side of "de", "из" or "共" in a left-to-right line).

## Checks
`copy:ack`, `copy:status`: all languages in step. Config suite: 73 files, 1,590 tests pass. 
**320px fit audit** on a Storybook built from this branch (the 45 `Super admin/Screens` stories × 7 languages, at 320×760 and 320×568): nothing on **Home** (the "Places on Pam" card) or **Missing information** (with results, and with none) in any of the six languages. Two Russian lines were over before the fix: the small title in the nested-page bar, "Недостающая информация" (251px in 232), is now "Недостающие данные", and the search hint on that screen, `person.connect.search.placeholder`, "Поиск по названию или адресу" (251px in 236; the field is narrower there than on Connect), is now "Поиск: название или адрес"; the empty line and the "Назад:" line follow the new title. I looked at the real screens in Arabic, Russian and Chinese: the Arabic card reads "331 من 588" with 331 first, "590 مكانا" and "المعروض: 6" are right, Russian says "590 мест".
**Not mine, already on this tree:** four titles in the same stories are over the bar's 176px in es and pt-BR and are not in `fit-known.json` (`programs-to-check` "Programas por revisar" / "Programas para revisar", `invite-one` "Un enlace para un miembro" / "Um link para um membro"); the other five findings are accepted there. They do not come from these 31 keys, so they are left for the desk.

## Open
Nothing of mine. Native readers for the six languages stay on Will's list. If Sage changes `ofNeeded`, the order check above is the thing to repeat for Arabic.

## Lessons
- A worktree whose `node_modules` are plain links to the main checkout's builds Storybook out of the **main checkout's** `packages/` (`@pam/ui/SearchPill` "cannot resolve"; then `roles.ts` "Module parse failed"), and so would measure whatever branch main is on, not the one being audited. For each of `apps/web`, `apps/site` and `packages/ui` make `node_modules` a real folder holding links to the main entries, with `@pam/*` pointing at the worktree's own `packages/*`; then `build-storybook` and the audit read this tree's bundles. Nothing is committed for this; it is scratch wiring.
- The notice that a background command "completed" for `( … ) &` is the wrapper, not the build; wait for the log's own exit line.

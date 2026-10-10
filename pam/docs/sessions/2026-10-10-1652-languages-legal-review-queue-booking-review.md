# 2026-10-10 — Languages & legal — review of Piper's program review queue and the example booking

**Branch:** `claude/lena-review-queue-booking` (from `main` at `2aa5801`) · **Lane:** Languages & legal (Lena)

Mira's item 3: review the drafts that are on `main`. The program review queue (the super admin's list of programs to check: `review.*`, 38 keys) and the honest booking
(`trips.booked.example.title` and `.body`, which say that a program's booking for a member is only an example and nobody was texted: the finding of the promise sweep, D-474) are on `main` now.
Read in all six languages against the words each bundle already uses on the neighbouring screens.

## What changed

- **zh-HK** — the whole queue (thirty keys) was written Cantonese ("嘅", "呢", "冇", "喺", "畀", "睇", "咗", "嗰", "唔") in a bundle that is written Chinese with 您; rewritten in the bundle's style, with its own words:
  "提交" (the review screens say "已提交"), "審核中", "捨棄" for Discard, "待審核的計劃". The two example-booking lines too: "這只是示範：沒有向計劃預約任何時間，也沒有傳短訊給任何人." The back label `nav.back.review`
  and one stray in `points.way.setup` ("完成 Pam 嘅設定" → "…的設定") match.
- **zh-CN** — "检查" → "审核" in the title, the empty title and the back label ("待审核的项目"): the same screen's status already says "审核中"; and "没有向项目预订任何内容" → "…预约…", the bundle's phrase
  for a booking ("还没有向项目预约任何内容", `trips.new.example`).
- **es** — tú → usted on a staff screen ("Sea amable y concreto", "Primero escriba qué cambiar"); "programa activo" → "publicado", as `programs.review.text` and the review note say.
- **pt-BR** — "responsável" → "líder", the bundle's word for the program lead ("Líder do programa", `staff.title.provider`) in five lines; "programa ativo" → "no ar" (as in the program switch and the review note).
- **ru** — "Отклонить" (reject: a decision against the program) → "Убрать" for Discard, which only takes a withdrawn request off the list (the bundle's "Убрать" for remove); the example booking now says "записи в программу
  нет" like `trips.new.example`, and "SMS" like the rest of the bundle, not "сообщение" (which could be an in-app message).
- **ar** — "تجاهل" (ignore: leave it be) → "استبعاد" for Discard; the tanween diacritics the bundle does not use dropped ("مرة أخرى", "لطيفا", "أولا"); passive verbs keep theirs ("أُرسل") where they tell
  "was sent" from "sent".
- Kept as written: the rest of es, pt-BR, zh-CN, ru and ar (about 160 of the 280 strings): they say what the English says in the bundle's own words.

Re-acked (`copy:ack`); config 1060 green; English untouched.

## What was wrong, and what missed it

The same as the other draft reviews today: a draft follows the English, not the voice of the screen or the bundle. This time the largest case: a whole language, zh-HK, in a different register.
**A scan, for next time:** `node -e` over a bundle for the Cantonese particles in zh-HK and for 你 in zh-CN found two more stray lines (`points.way.setup` and the back label) that the review by screen would have
missed; the six Piper drafts I reviewed earlier (cancel a visit, policies, program switch) are clean of them. (zh-CN 你们 = "you both", in the block lines, is the plural and is fine.)

## Decisions made

None: a review of drafts.

## Verified

On `f015d05` (main `2aa5801` plus this): `@pam/config` 1060 tests, `copy:status` in step, the browser suite on all three viewports **1011 passed, 18 skipped** (11.9 min), Storybook builds, the fit audit
(7 languages and the pseudo-language) on the 11 stories with "review" in their id: **0 new**; on the 5 with "booked": 1 new, **already accepted**. The example-booking end screen needs a booking made first, so
the static audit does not draw it; its two lines are short and the longest (Russian) is a third shorter than the review queue's longest line, which fits.

## Left undone

- A native reader for all six (before-launch). Spanish still mixes tú (members' screens) and usted (staff screens) by design; a native reader should confirm the split.
- The About Pam "remember to go" question is with Mira.

## Needs a human

Nothing.

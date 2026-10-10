# 2026-10-10 — Languages & legal — Spanish says "visita", not "viaje"

**Branch:** `claude/lena-es-visitas` (from `main` with the queued promise sweep, `claude/lena-promise-sweep`, merged in: it adds a
Spanish "Viajes" line this branch also fixes, so **merge the sweep first**) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 14:08: Spanish uses "Viajes" in four strings and "Visitas" on the tab itself. Pick the tab's word and make every
string agree, in all the places it shows. (The same note asks me to review Piper's cancel-a-visit drafts, done on the sweep branch at `481afaf`,
and Piper's review queue, part 6, which is not on `main` yet.)

## What changed

- **`es.json`:** sixteen strings said "viaje" where the tab says "Visitas"; all say "visita" now (list in D-480), including the glossary entry
  ("Visita": "Una visita es el plan de un miembro para ir a un programa…"). It was sixteen, not four.
- **`zh-CN.json`:** `points.way.plan` said "行程"; now "安排去某个地方的预约", like every other zh-CN line.
- **`test/one-word-for-a-visit.test.ts` (new):** per language, words that may not be used for a planned visit; checked over every string.
  It caught my own Arabic sweep line at first ("مرحلة", a stage, contains "رحلة"), so the Arabic pattern now ignores a word that merely contains it.
- Ledger `copy:ack`ed; D-480; changelog fragment.

## What was wrong, and what missed it

- A language can have a good word on the tab and a different one in the sixteen strings written around it. Each string read well alone, and the
  ledger only checks that a translation follows its English, not that two translations agree with each other. The test is that check.
- The other five languages were read for the same drift: pt-BR, ru, ar were already consistent; zh-CN had the one stray; zh-HK says "行程"
  only inside the glossary's definition of 到訪 (left on purpose, the definition needs another word).

## Decisions made

- **D-480** — a planned visit has one name in each language, the tab's.

## Verified

On `41f7d94` (main at `1c3a275` plus the queued sweep): `@pam/config` 1035 tests (the new one included), `copy:status` in step, the browser suite on all three
viewports **933 passed** (10.9 min), Storybook builds, and the fit audit in en, es and zh-CN (519 stories): 7 new in a language, **all 7 already accepted in
`fit-known.json`, 0 not**. The CI audit set (ru, ar, pseudo) is untouched by this change: no ru, ar or pseudo string changed.

## Left undone

- **Not mine to edit:** the public site's Spanish draft `apps/site/src/content/about.ts` line 85 says "Guarde un viaje para encontrarlo fácilmente
  después." It should say "Guarde una visita para encontrarla fácilmente después." (Wren's lane; a draft until signed, D-466). Reported to the merge desk.
- Piper's review queue (part 6, about 38 strings) is not on `main` yet; I review it when it is.
- The mail-service paragraph on the privacy page still waits on Will's OK of the English (a21).

## Needs a human

Nothing new. A Spanish native reader should go over the whole Spanish bundle (before-launch), including this word.

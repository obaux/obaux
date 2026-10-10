# 2026-10-10 — Languages & legal — review of Piper's program-switch translations

**Branch:** `claude/lena-program-switch-review` (from `main` at `64d0a1b`) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 14:40, item 3: review the drafts on `main` in all six languages, re-ack as the lane does. The program switch (D-318: "Your
programs", add another, "Pam is checking this one") is the first of them that is on `main`; the honest booking (2) and Piper's review queue (about 38)
are not yet.

## What changed

Eight keys, `program.switch.*`, read against the words and the register the program lead's other screens already use. **Russian kept as written.** Changed:

- **es** — Piper wrote tú ("Tus programas", "Cuéntale a Pam", "Cambia a otro programa"). Every other program-lead screen is in usted ("Su programa", "Usted envió",
  "Cuéntele a la gente", "Revise su programa"), so it is usted here: "Sus programas", "Aún no tiene un programa.", "Cuéntele a Pam de otro programa que usted
  dirige.", "Cambie a otro programa o agregue uno." "Live" is "publicado" (as in `programs.review.text`), not "activo".
- **pt-BR** — "O Pam" → "Pam" (the bundle's program-review strings say Pam bare); "revisando" → "conferindo", the verb those strings use for "checks"
  (`programs.review.step.review`: "Pam confere os detalhes"); "no ar" for "live", as the review note said before D-474.
- **zh-CN** — 你 → 您 (the whole program-lead side says 您); "检查" → "核对" (`programs.review.step.review`: "Pam核对详细信息"); no space after "Pam".
- **zh-HK** — written Cantonese ("你嘅", "呢個", "仲未", "同 Pam 介紹", "轉去", "加") → the bundle's written style with 您: "您的計劃", "Pam正在核實這個計劃" (the
  bundle's word for checking is 核實), "新增另一個計劃", "切換到另一個計劃，或新增一個。"
- **ar** — "Pam تراجع" (Pam feminine, subject first) → "يراجع Pam" (masculine, verb first, as in `programs.review.step.review` and the review note); "منشورًا" and
  "برنامجًا" lose their diacritic like the rest of the bundle ("متاحا", "برنامجا").

Re-acked (`copy:ack`; status "in step"); config 1041 green.

## What was wrong, and what missed it

Drafts follow the English and neighbouring keys in the same *file*, not the register of the same *screen*. Spanish and the two Chinese bundles use a different
voice for the program lead than for a member; a draft that is right for a member read wrong here. The ledger checks that a translation follows its English, not
that it matches the screen around it. (Spanish has no mixed-register test: the bundle itself is mixed, tú for members' trips and usted for staff, and a test
would need a list of which keys are whose. Left for the native reader.)

## Decisions made

None: this is a review of drafts, in the lane's usual way.

## Verified

(see the READY note: head, browser suite, fit audit on the program stories)

## Left undone

- Piper's review queue (about 38 strings) and the honest booking (2): not on `main` yet.
- A native reader for the six (before-launch).

## Needs a human

Nothing.

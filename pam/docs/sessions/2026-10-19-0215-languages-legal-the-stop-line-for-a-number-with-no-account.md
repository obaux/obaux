# 2026-10-19 — languages & legal: the STOP line for a number with no account, in six languages (held)

**Branches:** `claude/lena-stop-line-p4` (undated) and `claude/lena-stop-line-p4-dated` (dated 19 October) · **Lane:** Languages & legal (Lena) · from Mira (02:00); Will signed a106 at 01:55, Sage's `05063732`

## What changed
- `privacy.s.texts.p4` in en, es, pt-BR, zh-CN, zh-HK, ru, ar, after `privacy.s.texts.p3`; `legal.ts` Text messages now counts four paragraphs; ledger acknowledged (`copy:status`: all languages in step).
- Register as on the other Privacy lines: usted, você, 您, вы, the Arabic second person; "Pam" untranslated; STOP and START in Latin letters; "scrambled code" follows the signed calendar line ("copia codificada", "cópia codificada", 编码后的副本, «закодированную копию», نسخة مرمزة).
- Built on `claude/lena-stopped-number-pins` @ `2b9056af` (which holds Nico's `1b821f37`) with main `6773c9c4` merged in. The 23 checks in `test/stopped-number-line.test.ts` all run now and pass, including the nine that waited for p4.

## Checks
Undated branch: config suite 70 files green and one test red by design (`legal-updated.test.ts`, the "Last updated" fingerprint, until the date commit). Dated branch: `legal:date privacy 2026-10-19` and `copy:ack`, 71 files and 1,524 tests green. Not run: the 320 fit audit.

## Open
- Goes live on the day texts people send back are switched on, with Nico's list: take the dated branch only then; re-run `legal:date privacy <day>` if it is not 19 October, and again for whichever of this line and the error-log line (`68a81d66`) goes live second.
- Native readers: "código codificado" (es, pt-BR), the zh renderings of "scrambled code", "закодированный код" (ru), "رمز مرمز" (ar).
- Found on main: `en.json` has seven `appError.action.*` keys twice (a b77 merge artifact, same values); harmless, offered to Mira as a tiny fix.
- "Text START" in the Texts from Pam post and `reminders.stopped.body`: after `sms-inbound` is live (Sage).

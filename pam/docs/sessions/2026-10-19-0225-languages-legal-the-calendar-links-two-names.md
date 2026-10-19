# 2026-10-19 — languages & legal: the calendar link's two error-log names

**Branch:** `claude/lena-calendar-names` (on Piper's `claude/places-programs-calendar-plan-c` @ `db53a9ab`, which merges main 6773c9c4 into the READY `131a9727`) · **Lane:** Languages & legal (Lena) · from Mira (02:12)

## What changed
- `appError.action.calendar.link` and `.link.off`: the English stand-ins Piper put in the six other bundles are now real names (es, pt-BR, zh-CN, zh-HK, ru, ar), by the words the calendar screen already uses; the ledger is acknowledged.
- Edited in place by text, not by re-dumping the JSON, so no other line moves.

## Checks
`app-error-action-names.test.ts` passes (both actions are on `APP_ERROR_ACTIONS` in Piper's branch); config suite 70 files, 1,513 tests; `copy:status`: all languages in step.

## Open
Piper's second batch (nine actions) is not built; its names (`d616d`) wait for her SHA.

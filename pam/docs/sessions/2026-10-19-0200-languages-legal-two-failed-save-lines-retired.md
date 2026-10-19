# 2026-10-19 — languages & legal: two failed-save lines retired

**Branch:** `claude/lena-retire-failed-lines` (off main 6773c9c4) · **Lane:** Languages & legal (Lena) · from Mira (01:53), Ava's `51f3e541`

## What changed
- `pam.thread.statusFailed` and `pam.hours.said.failed` removed from en, es, pt-BR, zh-CN, zh-HK, ru, ar and `ledger.json` (26 lines). Their English was "That didn't go through. Try again."; b77 draws the bottom alert for those saves instead.
- Checked first: no file in `apps`, `packages` or `supabase` outside the locale files names either key (`grep -rIn`, node_modules and build output excluded).

## Checks
`copy:status`: all languages are in step with the English. Config suite: 70 files, 1,501 tests, all passing. The web typecheck was not run (a scratch checkout resolves `@pam/config` to the old tree), which is safe only because nothing references the keys.

## Open
Nothing. The choice-controls guard (Mira 00:44) is the next item, on its own branch.

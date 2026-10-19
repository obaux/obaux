# 2026-10-19 — languages & legal: the staff review's "gone" notice in six languages

**Branch:** `claude/lena-review-gone-words` (on Ava's `claude/pam-review-gone-words` @ `6ae316b2`) · **Lane:** Languages & legal (Lena) · from Ava (02:33), Sage signed `34b590b0`

## What changed
- `requests.failed.gone.title` and `.body` in es, pt-BR, zh-CN, zh-HK, ru, ar. The `{name}` placeholder is kept in every body; the register is the staff one, like the `requests.failed.*` lines next to them.
- Words: "account" as the neighbours say it (zh-CN 账号 and zh-HK 帳戶, as `requests.failed.city.*`), "deleted" as the Delete-account lines say it (borrar, apagar, 删除/刪除, удалить, حذف), "Go back to the list" as `requests.failed.decided.body` and `person.notFound.body` say it.
- Inserted by text, so no other line moves; ledger acknowledged.

## Checks
`copy:status`: all languages in step; config suite 70 files, 1,501 tests. Not run: the 320 audit of the inline notice.

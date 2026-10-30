# 2026-10-30 — languages & legal: the Spanish filter word for super admins

**Branch:** `claude/lena-super-admin-role-words` (off `mira/b78` @ `0c820c27`) · **Lane:** Languages & legal (Lena) · from Mira's Friday batch (30 October), my own note of 23 October

## What changed
- `directory.filter.super_admin` in es: "Administradores" becomes "Super admins". Each Everyone row shows the role from `role.super_admin` ("Super admin") with the region, and the filter's case managers are "Gerentes de caso", so "Administradores" could be read as case managers. One line in `es.json`, edited by text; ledger acknowledged.

## Checked against the other five
Filter and role agree in pt-BR ("Super admins"/"Super admin"), zh-CN and zh-HK (超级管理员/超級管理員), ru ("Суперадмины"/"Суперадмин") and ar (مديرو النظام/مدير النظام), and each keeps the case manager's word distinct (个案管理员, 個案經理, «Кейс-менеджер», مدير الحالة). Nothing else in any bundle names a super admin (`role.super_admin` and the filter are the only two English values that do). No story, spec or test names the old word.

## Checks
`copy:status`: all languages in step; config suite 73 files, 1,590 tests. The new word is shorter than the old (12 characters against 15), so the dropdown option needs no audit.

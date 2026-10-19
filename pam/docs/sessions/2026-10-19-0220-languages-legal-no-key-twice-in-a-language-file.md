# 2026-10-19 — languages & legal: no key twice in a language file

**Branch:** `claude/lena-no-duplicate-keys` (off main 6773c9c4) · **Lane:** Languages & legal (Lena) · from Mira (02:10), who confirmed it on main

## What changed
- `en.json`: the seven second copies of `appError.action.places.save`, `.places.unsave`, `.checkin.here`, `.checkin.went`, `.trips.cancel`, `.schedule.checkin`, `.schedule.undo` are gone (the tail of the file; the last remaining entry lost its trailing comma). The parsed bundle is identical before and after, asserted when the lines were removed, so no screen changes.
- `test/no-duplicate-keys.test.ts`: reads the raw text (not the parsed object) of every `src/locales/*.json`, the seven languages and `ledger.json`, tracks each object's keys (nested objects and arrays separately, JSON escapes decide equality), and fails on a key twice in one object. The reader is tested first on small strings, and on the folder having exactly those eight files.

## Why it got through
`JSON.parse` keeps the last of two equal keys and says nothing, and the two copies had the same values, so `copy:status`, the key-parity tests and the names test all passed. They came from the b77 merge, which took Piper's `be3d5ee5` on top of my `ec6ffac2`.

## Checks
Fails on main (en.json, those seven keys), passes on the branch; config suite 71 files, 1,511 tests; `copy:status`: all languages in step.

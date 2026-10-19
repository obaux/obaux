# 2026-10-18 — languages & legal: the Spanish search placeholder

**Branch:** `claude/lena-es-search-people` (off main 4d39ccca, b75) · **Lane:** Languages & legal (Lena) · asked by the merge desk (Mira, 21:56): "shorten it, widen it, or accept it"

## What changed
- `home.caseload.search.placeholder` (es): "Buscar miembros" → **"Buscar personas"**; `home.caseload.search.label` (es): "Buscar miembros por nombre" → "Buscar personas por nombre". Two Spanish lines and their two ledger rows. No English change, no other language.
- `docs/before-launch.md` (the search-pill entry) and the STATUS paragraph in my section say what changed and why.

## Why shorten
- The case manager's search became a plain `SearchField` in D-610. Its room for the words is **124px**; the old pill gave 128px. "Buscar miembros" is 126px (it was kept in b55 with "only 2 spare"), so the audit's `home--spanish` placeholder finding is real: the last letter is clipped at 320.
- Widening is a layout change in a screen that is not mine (the field is the shared `SearchField`), and accepting a clipped word is not an option for a field people read.
- Measured in the real field at 16px / weight 600 (Figtree): "Buscar miembros" 126 ✗ · "Buscar a miembros" 138 ✗ · "Buscar integrantes" 137 ✗ · "Buscar en miembros" 148 ✗ · "Buscar miembro" 119 (singular, wrong) · "Busca miembros" 120 (tú, and this is a staff-only screen: usted) · **"Buscar personas" 119 ✓** · "Buscar mi gente" 118 (too casual).
- "Personas" is the word the neighbouring list already uses (`home.interested.search.placeholder`), and Russian says «людей» in this same field for the same reason (Mira decided that on 17 October). The label still begins with the visible words, so voice control can say them (WCAG 2.5.3).

## Checks
`copy:status` clean after `copy:ack`; config tests 66 files / 1456 passed (with `--testTimeout=60000`, as the `copy-sync-cli` test is slow under load).

## Open
Native readers: is «personas» right where the rest of the app says «miembros» for members (before-launch, search-pill entry).

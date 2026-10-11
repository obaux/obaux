# 2026-10-11 — Languages & legal — Explore's location note, and the native location reasons

**Branch:** `claude/lena-here-note` (from `main` at `e25e08fb`) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 05:50 UTC (delivered late, after a worker restart): when I wrote the Privacy paragraph for "I'm here" (location) I found that Explore's area picker says
"Stays on this phone" under "Use my current location", while `AreaPicker.tsx` passes the position to the server as `p_lat` / `p_lon` in `services_near` / `services_search`. Mira: fix it (Sage signs the English), and put the native-app location reasons on the before-launch list in my wording.

## What changed

- **`places.area.hereNote`** is "Used for this search only." (Sage signed it, 11 October 10:10 UTC, `docs/signed-english.md`), in seven languages: es "Solo se usa para esta búsqueda.", pt-BR "Serve só para esta busca." (no verb that must agree with an
  unseen noun), zh-CN "仅用于本次搜索。", zh-HK "只用於這次搜尋。" (the bundle's 搜尋, 26 uses, never 搜索), ru "Используется только для этого поиска.", ar "يُستخدم لهذا البحث فقط." (the passive keeps its damma, as elsewhere in the bundle).
- **`docs/before-launch.md`**: the iOS and Android location reasons in English (one sentence for both uses, "It does not keep where you are"), the "while using the app, never in the background" rule, and the store privacy labels, which are written from Piper's answer to the log check, not from this item.

## What was wrong, and what missed it

A screen line made a claim about the code ("Stays on this phone") that nothing tested: the position never leaves the phone *to be kept*, but it does leave it to be used. `services_near` is `stable`, `security invoker` and stores and logs nothing, so the honest line is about use, not place.
Found only because the Privacy paragraph for "I'm here" needed the same fact; no test reads screen copy against what a component sends. **Still open:** Piper is checking whether the search or the check-in puts latitude and longitude in a URL the API logs keep (a GET). If it does, "does not keep it" (here and in `privacy.s.what-we-keep.p9`) is not true until the call moves to POST, and this line goes back to Sage.

## Decisions made

None.

## Verified

`@pam/config` 1082 tests, `copy:status` in step. Storybook builds; the fit audit (7 languages, 320px) on the stories with `area` (7), `explore` (9) and `places` (18) in their id: one defect new in a language, an Arabic address chip (`areachip--long-address`), **already accepted**; none is this line. The note is a one-line row description in a bottom sheet and wraps.

## Left undone

The search sentence on the Privacy page ("When you search near you, Pam uses where you are for that search and does not keep it.") is on the held branch with the "I'm here" paragraph, waiting for Piper's log check and for Will. The native-app reasons are English only until the native shell asks for location.

## Needs a human

Piper's log check, then Will.

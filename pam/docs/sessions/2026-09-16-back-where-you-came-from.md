# 2026-09-16 — back where you came from

**Phase:** 1 (member-facing product) · continuation of the same day's earlier sessions

## What changed

**Every saved-place card now opens that place, not a list.** Home's "Places you saved" strip (`SavedStripLazy`/`SavedStrip`) linked every card to `/saved/` — the doc comment on `SavedStrip.tsx` said so explicitly, and was stale: it dated from before `/place/?id=…` existed as its own screen. Fixed to link to the actual place.

**"Back" now returns to wherever a place was actually opened from**, not always to Places (Will, 16 September: "if I'm in Places and I open a place, going back should take me to places, not home"). Every link into `/place/` now carries a `from` token (`home` / `places` / `saved`) from a small fixed set — `place/page.tsx`'s `resolveBack` looks it up against a map and falls back to Places for a bare `?id=…` link (a shared link, or an old bookmark), which is what every place link did before this. Wired at the three link sites: Home's saved strip, `places/page.tsx`, `saved/page.tsx`.

**Merged "No password to remember" into the sign-in consent sentence**, per Will's request to free up vertical space: it now reads "PAM texts you a code to sign in. No password to remember. Reply STOP to stop texts. Rates may apply." as one sentence instead of a separate line above the button. Removed the now-unused `signin.phone.hint` key and its `<Text>` row.

**Home shows a taste of the example people while previewing a role** (Will, 16 September: "pull in the dummy names for viewing modes into the dashboard home page"). A new `HomePeoplePreview` (lazy-loaded, same `next/dynamic` pattern as `RoleSwitchLazy`/`SavedStripLazy`, since it renders for exactly one condition — an active super-admin preview — that is false for almost everyone) shows three rows from the previewed role's own example list (`DUMMY_MEMBERS` for admin, `DUMMY_EVERYONE` for super_admin, `DUMMY_INTERESTED` for provider) with a "see all" link to that role's real screen. A member's own preview shows nothing here — members have no people list.

## What was wrong, and what missed it

Nothing new this pass broke the bundle budget meaningfully — `HomePeoplePreview` follows the same lazy-load discipline established across the last three sessions, and it cost 0.1 kB (500.8 → 500.9 kB gz). Two existing e2e assertions (`places.spec.ts`, `saved.spec.ts`) asserted the exact pre-`from` href on a place card and needed updating to include the new query param — an expected, mechanical fixup, not a regression.

## Decisions

- `from` is a short token from a fixed set (`home`/`places`/`saved`), looked up against a map, rather than an arbitrary path — so `place/page.tsx` never has to validate or trust a URL fragment from the query string.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean |
| `pnpm build` | succeeds |
| `node scripts/check-bundle-budget.mjs` | 500.9 kB gz of 500 kB — 0.9 kB over, consistent with the two prior sessions' disclosed overage |
| `pnpm --filter @pam/config test` | 211 pass |
| `pnpm --filter @pam/ui test` | 65 pass |
| Playwright e2e (all projects) | 426 pass, 0 failing |

## Left undone

- No new e2e coverage added specifically for the `from`-aware back link or the Home people preview — verified by the existing suite continuing to pass plus manual reasoning about the three link sites, not by new assertions.
- The bundle overage (0.9 kB) is still unresolved, third session running over budget.

## Needs a human

- Same open question as the prior two session logs: whether the accumulating bundle overage should block further shared-screen work until paid down.

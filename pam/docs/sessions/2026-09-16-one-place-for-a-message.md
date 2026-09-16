# 2026-09-16 — one place for a message, one place for a language

**Phase:** 1 (member-facing product) · continuation of the same day's earlier session (`2026-09-16-what-the-app-can-do.md`)

## What changed

**A shared alert banner** (`apps/web/src/lib/alertBanner.tsx`, `AlertBannerHost.tsx`), mounted once in `Providers`. `useAlertBanner().show({status, title, description?, actionLabel?, onAction?})` floats an Astryx `Banner` over the page, dismissed manually (`isDismissable`). First and only consumer so far: the sign-in screen's "You are signed out" message, which used to be a `<Text>` sitting in that screen's own column. **This is explicitly not a replacement for `Notice`** — `Notice` explains a state a screen is currently in; the banner is for something that already happened, said once. Migrating existing `Notice` usage onto it was not attempted and is a separate, larger piece of work if wanted.

**Locale is now a real, switchable preference**, not a constant nobody could change. `packages/db` already had `profiles.preferred_language` (since 0002) and a granted UPDATE column for it (0046) and `useJoin.ts` already sent the active locale as `language` on sign-up — none of it was wired to anything: `I18nProvider` always initialized to `DEFAULT_LOCALE` and nothing ever called anything to change it. Now:
- `I18nProvider` (`apps/web/src/lib/i18n.tsx`) holds locale as state, starting at `DEFAULT_LOCALE` (matches the static HTML, no hydration mismatch) and reading a `pam.locale` `localStorage` cache in an effect. Exposes `setLocale`.
- `LocaleSync` (new) pulls the *account's* `preferred_language` into the active locale once signed in — the account, not the local cache, is authoritative once one exists. One-shot per signed-in user id, so it does not fight a deliberate switch made while signed in.
- `LanguageSwitcher` (`apps/web/src/app/LanguageSwitcher.tsx`) — a `GlobeIcon` + Astryx `DropdownMenuRadioGroup` (English / Español, shown in themselves, not translated) — `icon` variant on the sign-in header, `row` variant in account settings. Writes `profiles.preferred_language` directly when signed in (RLS + the 0046 grant already permit it; no migration needed).
- The onboarding "details" step (`join/page.tsx`) now has a language `RadioList`, defaulting to whatever is already active and switching the whole screen's copy live. `submitDetails`/`redeemInvite` already sent `language: locale` — only the control to change it before submitting was missing.
- `AppHeader` gained a `centeredWithTrailing` mode: when `align="center"` (the sign-in screen) and `trailing` is set with no account button, `trailing` renders in an absolutely-positioned corner instead of pushing the row to `justify: 'between'`, so the mark stays exactly centred regardless of the trailing content's width (Will: "Make sure the logo remains symmetrical").

**Account settings reordered**: Help now sits among the other settings links, and Sign Out is the last thing on the screen — it used to be Sign Out then Help below it.

**Sign-in slideshow**: first slide's copy changed to "See what your city has to offer — Learning, Earning, and Family Support."; `OnboardingSlides`' line now caps at 280px (matching the artwork's own cap) and adds `textWrap: balance` where supported, so all three slides wrap to two visually balanced lines instead of risking a one-word widow on the second.

## What was wrong, and what missed it

**The alert banner and the locale-sync plumbing each separately cost §12's budget more than 1 kB by being statically imported into code every screen loads, twice, the same mistake this session's earlier half made repeatedly with dummy data and Skeletons.** `AlertBannerProvider` wraps every screen and initially rendered Astryx's `Banner` unconditionally in its own tree — 3.3 kB, whether or not anything was ever shown. Fixed by holding the render behind a plain `import()` in state (the same technique already established for `HeaderBell`/`useSavedPlaces`), not `next/dynamic` — that was tried first and cost an extra 1.4 kB of its own Suspense/lazy machinery on top of `Banner`'s weight. Separately, `LocaleSync`'s `useSession` import landed in Next's *root layout* chunk — shared by every route including `/help`, `/privacy`, `/terms`, none of which called `useSession` before — costing another ~1.1 kB nobody on those screens needed. Same fix: a plain `import()` behind `useState`/`useEffect` in `Providers`, deferred to just after mount. Final measured state: **500.8 kB gz, 0.8 kB over the 500 kB budget** — up from the 0.5 kB carried over from the prior session, not paid down further this session. **What would catch this earlier:** nothing does, currently — the pattern is now well-established (four instances this two-session stretch) but there is still no lint rule or test that flags "this import is reachable from `Providers`/a barrel and therefore ships to every screen"; only `check-bundle-budget.mjs` catches it, after the fact, on the one route it measures.

**Playwright `getByLabel('Your phone number')` started matching two elements once the alert banner existed**, because the banner's auto-generated dismiss button's accessible name ("Dismiss You are signed out... with your phone number...") contains the phone field's label as a substring. Fixed the one affected test (`account.spec.ts`) to scope by role (`getByRole('textbox', {name: ...})`) instead. Worth remembering for any future banner whose title happens to contain another control's accessible name.

## Decisions

- The account's `preferred_language` wins over the local `localStorage` cache once somebody is signed in, not the other way around — see `LocaleSync`'s own comment for the reasoning and the one-shot-per-user-id guard that keeps a live switch from being immediately overwritten.
- Language names in the switcher are shown in themselves ("English" / "Español"), not translated into the currently active locale.
- No migration was needed for account-level language persistence — `profiles.preferred_language` and its UPDATE grant already existed, unused, since 0002/0046.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 packages, clean |
| `pnpm build` | succeeds, static export, 20 routes |
| `node scripts/check-bundle-budget.mjs` | 500.8 kB gz of 500 kB — 0.8 kB over, disclosed above |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/config test` | 211 pass |
| Playwright e2e (all projects, `PLAYWRIGHT_CHROMIUM_PATH` set) | 426 pass, 0 failing |
| Manual screenshot check (signin, English/Spanish, panel open) | mark stays centred with the language icon present; switching live-updates every string on screen including the button and consent copy |

## Left undone

- **The 0.8 kB bundle overage**, carried forward and slightly worse than the 0.5 kB it started this session at.
- **No e2e coverage added for the language switcher, the alert banner, or the onboarding language step** — verified by hand (screenshots) and by the existing suite continuing to pass, not by new assertions.
- **Astryx's own `InternationalizationProvider` is not wired up** — PAM supplies all of its own copy explicitly already, so this is likely low-value, but any default string Astryx itself renders (if any exist) stays in English regardless of PAM's active locale.
- **`Notice` usage across the app was not migrated onto the new alert banner** — deliberately out of scope this session; see the banner's own file comment for the boundary.

## Needs a human

- Whether the 0.8 kB bundle overage is acceptable to keep carrying, now two sessions running over budget.

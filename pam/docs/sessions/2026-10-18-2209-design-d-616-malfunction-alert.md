# 2026-10-18 — design D-616 malfunction alert

**Branch:** `claude/pam-design-malfunction` (off main `4d39ccca`, b75, with Lena's `claude/lena-notice-malfunction` @ `0b7f3ffd` merged) · **Lane:** design system (Dot)

## What changed

- `apps/web/src/lib/malfunction.tsx` (new): `MalfunctionProvider` and `useMalfunction().show(action, error, control)` / `clear()`; `settleWithin` (15 s) and `codeFromError` (offline, SQLSTATE, HTTP status, timeout, unknown). One fixed bottom `CompactNotice`, `role="alert"`, above the tab bar, safe area and keyboard; scrolls the failed control clear; leaves on the next tap or key, a good retry, or a pathname change; no timer.
- `apps/web/src/lib/reportAppError.ts`: a stand-in with Nico's signature `reportAppError({ action, code })`. It does nothing until his client lib lands (his `claude/messages-app-errors` @ `f71a4665` has `packages/config/src/appErrors.ts` but not the client yet); then this file is replaced by his.
- Provider wired in `providers.tsx` and Storybook's `preview.tsx`.
- `AlertsView.tsx`: a switch moves only after its save (`onChange` + `isLoading`; Astryx's `changeAction` moves first, so it is not used), no answer in 15 s is a failure, a late success re-reads on mount, focus and visibility, and the inline failure notice is gone. `SettingsRow` loses its `below` slot (unused).
- Story: Components › Feedback › Malfunction alert (English, Spanish, Arabic).
- Patterns.mdx: "When Pam fails"; decision D-617; changelog fragment.

## What was wrong, and what missed it

The B3 spec pinned the old behaviour (an inline "Something went wrong" under the row) and passed against it; it is replaced by one that pins the alert's place and words.

## Decisions made

D-617 (Will's D-616 job, 18 October 21:14). Astryx `Switch.changeAction` is optimistic (moves the switch, then puts it back), so the screen uses `onChange` with `isLoading`.

## Verified

- `e2e/alerts.spec.ts` (all three viewport projects): B3 (alert at the bottom, said once, clear of the switch, switch still on), saving (stays put, then moves), A6 (15 s failure, late save at 45 s read back), dismissal on the next tap and on leaving. The four new tests fail on main's real build (4d39ccca, worktree); B6 passes on both.
- `tsc` clean in `apps/web` and `packages/ui`; Storybook builds.
- Pictures: `docs/design/review/2026-10-18-d616-*` (light, dark, Arabic at 320; a switch mid-save).

## Left undone

- Instant-save controls (person star, saved heart, language picker, role switcher) are named in the rule; their owners convert them.
- The save functions return only a boolean, so the log gets offline, timeout or unknown for Text alerts; real codes need `useReminderConsent.ts` (Nico) to return the error.
- Other failed-action rows in `docs/design/2026-10-18-something-went-wrong-audit.md` are not converted.
- Seven-language 48px check against Lena's cap; BigButton `tPlain` (D-435).
- Swap the stub for Nico's `reportAppError` when it lands.

## Needs a human

Will to see the pictures before ship. No new action keys were added to `APP_ERROR_ACTIONS` (the five Text alerts keys are already on Nico's list).

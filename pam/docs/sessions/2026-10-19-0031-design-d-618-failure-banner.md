# 2026-10-19 — design D-618 failure banner

**Branch:** `claude/pam-design-malfunction-banner` (off main `9aac8b6f`, with `claude/pam-design-malfunction-surface` and `claude/pam-design-notice-colours` merged) · **Lane:** design system (Dot)

## What changed

- `apps/web/src/lib/MalfunctionBanner.tsx` (new, lazy): the alert banner's style at the bottom: solid error ground and its own text colour, title, optional line, action buttons, close; `role="alert"`, 12px radius, shadow; takes taps (the host does not).
- `apps/web/src/lib/malfunction.tsx`: `show(action, error, control, { retry })`; kind from the code; second failure of the same action in a row (reset by a good retry, leaving the screen, or `clear`); actions Try again / Sign in / Get help; taps and keys inside the banner do not dismiss it (Tab only moves toward the buttons); the render is imported the first time a failure is shown.
- `apps/web/src/lib/malfunctionKind.ts` (+ test): code to kind, a stand-in for Nico's `classifyFailure`.
- `AlertsView.tsx`: passes `retry`.
- Stories: Malfunction alert › Offline, SignedOut, ServerFailed, SecondFailure (over a busy screen).
- `e2e/malfunction-banner.spec.ts`: bottom at 320×568 clear of the switch, Try again works the switch again, Get help on the second failure opens Help, Sign in goes to Sign in and back, close, axe clean.
- Pictures: `docs/design/review/2026-10-19-d618-banner/` (4 states × light, dark, Arabic at 320×568), drawn with the interim words.

## What was wrong, and what missed it

Nothing in D-617 told a person what to do. Will asked for it on the 19th.

## Decisions made

D-618.

## Verified

`malfunction-banner.spec` and `alerts.spec` 84 passed on all three projects, `@pam/config` 1491, `tsc` clean, bundle budget within with 5.4 kB spare.

## Left undone

- Sage's per-kind title and line (the pictures show the one line for every kind); then one key per kind in `WORDS`.
- "Reload": no signed word for it, so not built.
- Nico's `classifyFailure` to replace `malfunctionKind.ts`; an expired sign-in reaches the log as `unknown`, so it is not offered Sign in until the classifier sees the whole error.
- The seven-language fit at 320×568 with the tab bar and Sage's words; the English and Arabic pictures fit (the tallest, Arabic with Sign in and Try again, is 179px of 568).
- A fail-first run on main: every new test here exercises the banner, which is new; they fail on main by construction (no "Try again" button on a failure there).

## Needs a human

Will to see the pictures before it ships.

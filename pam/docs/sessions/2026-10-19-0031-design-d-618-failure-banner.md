# 2026-10-19 — design D-618 failure banner

**Branch:** `claude/pam-design-malfunction-banner` (off main `9aac8b6f`, with `claude/pam-design-malfunction-surface` and `claude/pam-design-notice-colours` merged) · **Lane:** design system (Dot)

## What changed

- `apps/web/src/lib/MalfunctionBanner.tsx` (new, lazy): the alert banner's style at the bottom: solid error ground and its own text colour, title, optional line, action buttons, close; `role="alert"`, 12px radius, shadow; takes taps (the host does not).
- `apps/web/src/lib/malfunction.tsx`: `show(action, error, control, { retry })`; kind from the code; second failure of the same action in a row (reset by a good retry, leaving the screen, or `clear`); actions Try again / Sign in / Get help; taps and keys inside the banner do not dismiss it (Tab only moves toward the buttons); the render is imported the first time a failure is shown.
- The kind comes from Nico's `failureKindOf` (merged `aed95a9c`); my stand-in `malfunctionKind.ts` is gone. Sage's words are keyed by kind with `notice.malfunction` as the fallback until Lena's keys land.
- The banner is fetched at idle, with a plain stand-in if it could not be (found by a test that went offline first).
- `AlertsView.tsx`: passes `retry`.
- Stories: Malfunction alert › Offline, SignedOut, ServerFailed, SecondFailure (over a busy screen).
- `e2e/malfunction-banner.spec.ts`: bottom at 320×568 clear of the switch, Try again works the switch again, Get help on the second failure opens Help, Sign in goes to Sign in and back, close, axe clean.
- Pictures: `docs/design/review/2026-10-19-d618-banner/` (offline, signed-out, server, second failure and changed × light, dark, Arabic at 320×568).

## What was wrong, and what missed it

Nothing in D-617 told a person what to do. Will asked for it on the 19th.

## Decisions made

D-618.

## Verified

`malfunction-banner.spec` and `alerts.spec` 99 passed on all three projects (including not-allowed having no buttons, and going offline before the tap), `@pam/config` 1522, `tsc` clean, bundle budget within with 2.9 kB spare (the drop from 6.0 is mostly Nico's classifier now in the bundle).

## Left undone

- Lena's keys in the seven bundles (`notice.malfunction.*`). Until then the banner says the one line and shows no body; the pictures were drawn with Sage's English patched into `en.json` for the build only (not committed), so the Arabic panels show English words in a right-to-left banner (layout only).
- The Show the latest button has no signed word to fall back to, so it appears with Lena's key; its test goes in then.
- Seven-language fit at 320×568 with the real words, once Lena has them.

## Needs a human

Will to see the pictures before it ships.

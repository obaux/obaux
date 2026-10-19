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

## Final inputs (Mira, 01:04)

Nico's classifier is final at `9df19119` (ten kinds, `failureFor(action, caught, { signedIn, online })` returning a kind or `'done'`, `failureKindKey`); Lena's words are final at `f60ad404` (26 keys, `again.title` "Still not working"). Built on both:
- `show()` looks at the failure once the reporter module is here (fetched at idle, with the supabase client, so offline is covered): `'done'` (a place already saved, a trip already cancelled, a request already decided) shows nothing and logs nothing; the session says whether to turn a 42501 into signed out.
- The second failure's title is `again.title` and its line `again.body`; "Get help" is always offered for refused (its only way on) and opens the help desk's page `/support/something-didnt-go-through/` (Wren), not Help in the app.
- The classifier is out of the root bundle (a lazy import), as Mira asked: budget within with 2.5 kB spare on this branch.
- Specs on the real words: server, second failure (with its title and body and the help-desk request), signed out, not allowed, offline, changed (Show the latest reloads), close with no timer, axe, and the alerts.spec titles. 102 passed on all three projects.

## Mira's two fixes (01:38)

1. The pictures Will sees are of the real Text alerts screen on the e2e build, not a story: `docs/design/review/2026-10-19-d618-banner/` (offline, signed out, server, changed, refused, wrong time and second failure, in light, dark, Arabic and Russian at 320×568). Wrong time is raised from the screen where it really comes up (Mira, 02:00): "I'm here" on a visit outside its time (`checkin.here` with the guard's `OUTSIDE_THE_VISIT_WINDOW`), shot on the e2e build of the real visit page, with the answer stubbed as the database gives it; the other six are on Text alerts.
2. Offline, the second failure keeps the offline words and Try again, with no Get help and no "Still not working": the help desk is on the website and cannot load offline. Test added (`offline, a second failure keeps the offline words…`); it fails without the change on a build of the tree without it.

## The surface (Mira, 02:36)

Red is for a fault: only server and timeout. Everything else (offline, signed out, not allowed, a limit, changed, gone, wrong time, refused) is the calm card, the inverse of the page, as D-619's notices are, so "Not at this time" is not drawn as though something broke. The pictures were re-shot on the real screens after that change (the seven kinds in four modes; wrong time from "I'm here").

## D-621 (Will 03:47, via Mira 03:52)

Every alert is Astryx's `Banner status="error"` (the same component as the visit page's blue info banner, in red): the failure banner and the status notices are drawn by one `StackBanner`, on an opaque backing of the page's colour so nothing reads through, with the stack, the lasting-has-no-close rule and the words kept. It supersedes D-619 point 4 and the calm-surface change (red for all). Calm states are `role="alert"` too (Banner's). Banner is loaded with the lazy stack: budget 2.3 kB spare on the tip.
Two defects the run found and fixed: Banner's title and line are 14 and 12px, so the words are set at Pam's 16px (A23, D-432); and the buttons were 32px, so they are 48px (§2.5).
The old header: `TabGate`'s paused, no-profile and could-not-load states and `/account/`'s not-signed-in, error, no-profile and paused states drew `AppHeader` and the Help block; they use the new bar now. `SignInScreen`'s `AppHeader` is the current sign-in bar (D-502). Pictures: `docs/design/review/2026-10-19-d621-banner/`. Targeted e2e: 1,344 tests, 6 failures, all two tests (a 12px body and a 32px button), fixed and re-run green.

## Left undone

- b77 (Piper's `settle.ts`) is not on main yet: merge main when it is, and resolve `malfunction.tsx` there.
- `@pam/config` has 7 failing tests, `app-error-action-names` (every error-log action has a plain name): the actions Nico's classifier branch adds (7) have no plain names in Lena's branch. A gap between the two merged branches, not in this one.
- Lena's real ru/ar audit on the banner; her measure at 232px agrees with what the pictures show.

## Needs a human

Will to see the pictures before it ships.

## Follow-up: banner never traps a control (Nico, 320x568)

`BottomStack` now adds an in-flow spacer as tall as the stack at the end of the page, so the last controls scroll above the banner. Test: `malfunction-banner.spec.ts` "scrolls its last control clear" (fails on the old build: 455 vs 413).

The spacer alone was not enough (Nico/Mira, b77 L1 on /reminders/ and thread report): the page grew after the failed save redrew the screen, so the one-time scroll ran too early. `BottomStack` now scrolls the tapped control clear on the next frame and again on body resize for the first second. Checked with Nico b77 merged (333ef92d) on narrow-320, dark-320, iphone-se: alerts, messages, malfunction-banner, notice-toast, im-here, saved, failure-done, places, signin-wrong-code all green.

## D-621 look (Will 04:51)

`StackBanner` uses Banner's own text sizes; actions are quiet ghost `sm` buttons in the description under the line, equal width (flex-wrap, basis 5rem, min-width max-content); close alone in the corner. e2e: new test "the close sits in the top corner…", the Contact Pam check is >=24px. Pictures re-shot, old ones replaced.

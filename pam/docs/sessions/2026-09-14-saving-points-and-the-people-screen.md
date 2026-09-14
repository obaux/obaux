# 2026-09-14 — Saving, points, and a screen for the person running PAM

**Phase:** 1 (member-facing) · **Sessions so far:** 7

Two days in one log. Will asked on the 13th to hold the records pass until end
of day, and the day ran past it; this covers both. Eight commits, `2323276`
through `4e61041`.

## What changed

**The way in explains itself.** Sign-in opens with three slides — a place to
look, a person to ask, a reminder so nothing gets missed — image-led, about half
the window, with dots. The heading and the consent sentence moved inside the
card. No help link (A9).

**Home became the app.** It was still the Phase 0 demo with sample places. Now:
the greeting with a points chip beside it, a swipeable row of saved places, and
a short menu. Notifications and Text reminders came off it — the first is the
bell, the second belongs to signing up.

**Saving works.** `saved_places` had existed since 0003 with nothing writing to
it. It writes now, optimistically, and earns five points through a database
trigger (0045). `/saved/` is the full list.

**Points have a screen.** `/points/` draws the ladder as a stepper with the
member's rung marked, then the category and one-off badges. The names are
Will's and they are the product decision (D-109).

**Reporting a place.** A menu in each card's corner — share, or "Something is
wrong here" — and `/flag/`, which sends one of the four reasons the database
already accepted. The fan-out to super admins has existed since 0038; this is
the first thing that can produce one.

**A super admin has a screen.** `/directory/` — everyone, filtered by role from
the header, backed by a narrow function rather than a widened policy (D-106) —
and a switcher that redraws the app the way each role sees it (D-108).

**The brand is in the theme.** Buttons, focus rings, icons and links carry the
logo's greens in both modes, with every state measured (D-100).

**Motion.** Framer Motion behind a dynamic import, budgeted separately, fetched
only on a connection that can carry it (D-104).

## What was wrong, and what missed it

**The §12 budget was counting 38 kB nobody downloads.** Next marks its legacy
polyfill chunk `noModule`; every browser that can run PAM skips it. The check
counted it anyway, so the measured number was 8% pessimistic — and the fix is
what made room for the animation library honestly (D-105).

**Every `light-dark()` colour resolved to its dark side during load.** Astryx's
theme sheet is the last of three to land, and until it does the browser's
default `color-scheme` picks the dark half of every pair — a light page painting
near-white text on near-white. Measured at 1.13:1. Declaring `color-scheme` on
the root fixes it from the first paint. It surfaced as flaky axe failures, which
is the tell worth remembering: contrast tests that fail *sometimes* are usually
measuring the load rather than the page. Every axe run now goes through
`e2e/settled.ts`.

**A theme's `:hover { backgroundColor }` did nothing, and looked right.** Astryx
paints hover and pressed as a translucent layer over the fill, so the property a
theme overrides is not the one the screen shows. The first version of the button
states was pure decoration; the test that caught it composites the overlay the
way the browser does, rather than reading `backgroundColor`.

**The animation chunk remounted the app.** The first design swapped the whole
motion provider once the chunk arrived, which changed the element type at the
top of the tree — the field somebody was typing in lost focus a second after the
page loaded, and a button under a finger would have dropped the tap. Page fades
and presses are CSS now; the library only wraps cards and rows.

**A category the front end had never heard of white-screened home.**
`CATEGORY_DEFINITIONS[key].labelKey` on `undefined`. Found because a screenshot
fixture used a wrong key — the cheap way. `categoryLabelKey()` falls back now.

**Reveal-on-scroll came out blank below the fold** in full-page screenshots: a
card that has never been in view has never revealed. The points ladder lost its
lower half. The journeys script scrolls the page before shooting, and the ladder
does not fade in rung by rung.

**Two points assertions hard-coded a balance** and broke the moment a real
points rule landed. They read the ledger now. A test that has to be edited every
time the product becomes more real is a test that has stopped meaning anything.

**A slide sized `width: 100%` ran off the side of the phone.** Astryx's carousel
wraps each child in a flex item with no width, so `100%` asks its own content
how wide it is. `100cqw` against a container. Every test passed; the screenshot
did not.

## Decisions

D-100 (the theme), D-101 (one place for the brand), D-102 (saving writes),
D-103 (one way back), D-104 (animation budgeted separately), D-105 (the budget
counts what a phone downloads), D-106 (the directory is a function, not a
policy), D-107 (points awarded by the database), D-108 (view-as changes only the
view), D-109 (badge names), D-110 (two tiles off home). D-099 is superseded by
D-101. Amendment A9: sign-in is the second screen without a help link.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean |
| `pnpm --filter @pam/config test` | 202 tests; en/es parity at 418 keys |
| `pnpm --filter @pam/ui test` | 63 tests, axe clean |
| `pnpm --filter @pam/web test:a11y` | 327 browser tests across 3 viewports |
| `pnpm --filter @pam/db test` | all checks pass, including the new directory and points suites |
| `node scripts/check-bundle-budget.mjs` | 495.6 kB first load (4.4 kB spare), animation 36.5 kB against its own 40 kB |
| `node scripts/journeys.mjs` | 130 screenshots, reviewed by eye in both themes |
| Supabase advisors | no new warnings from 0043–0045 |

Migrations applied live: 0043 (directory), 0044 (saved places read), 0045
(points for saving).

## Left undone

- **The sign-up flow does not exist.** Nothing creates a profile for somebody
  new; every account so far was made by the seeding script. It is the next task.
- **The bundle has 4.4 kB of headroom.** The next component on a shared screen
  breaches §12. Splitting the Astryx imports is the move.
- **The journeys sheet is still laptop-only** — `vercel.json` does not run the
  screenshot script after the build.
- **The five-tab member shell** is still unbuilt.
- **`pnpm lint` cannot run non-interactively** (`next lint` is deprecated and
  prompts).

## Needs a human

1. Twilio credentials into the Edge Function secrets, and somebody has to answer
   the reminders question — every row is `sms_enabled = false`.
2. HELP auto-reply on the Messaging Service; app URL into Supabase Auth.
3. **The dark-mode wordmark is coral while every button is now green.**
   Deliberate, or should the mark go green?
4. **The transparency screen says nothing about the PAM team**, and members were
   promised they would be told first if what is visible changes. The directory
   shows a super admin every account — name, role, region, status, last active;
   never messages or contact details. It wants a line.

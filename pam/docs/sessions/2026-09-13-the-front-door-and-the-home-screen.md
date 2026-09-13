# 2026-09-13 — The front door, and a home worth landing on

**Phase:** 0 → 1 (UI) · **Sessions so far:** 6

## What changed

**Sign-in explains itself before it asks for anything.** Three slides above the
card — a place to look, a person to ask, a reminder so nothing gets missed — one
idea per slide, with dots saying there are three. The mark is pinned at the top
of the window while the rest scrolls. The heading moved inside the card with the
field it names, and the sentence about texts moved inside too, directly under
the button that hands the number over. The "Get help" link is gone from this
screen (Will's call; amendment A9).

**Home stopped being a demo.** `/` was the Phase 0 foundation check: every
component rendered once against sample places, with placeholder names chosen to
be unmistakably fake and a points counter wired to a `+100` button. It is now a
short menu — your people (staff only), places, notifications with an unread
count, text reminders — greeting somebody by name when PAM has one. Signed out
it says what PAM is in one line and offers the one door. Nothing on it is
invented: no next step, no points, no plan, because there are no real ones yet.

**Two new components, one new token.** `NavTile` (a whole-card link, built on
Astryx's `ClickableCard`) and `OnboardingSlides` (the carousel above sign-in)
live in `@pam/ui`, not in the pages that needed them. PAM's own colour — deep
green on light, coral on dark — is now `pam.brandMark` beside the sizing floor,
rather than a hex typed into whichever component drew in it.

**The journeys sheet photographs home.** Nine screens per role now, in both
themes: 90 screenshots.

## What was wrong, and what missed it

**A slide asking for `width: 100%` ran off the side of the phone.** Astryx's
carousel wraps every child in a flex item of its own with no width, so `100%`
resolves against a box that is sized by its own content — a sentence, on one
line, wider than the screen. Every test passed: axe had no complaint, the 320px
horizontal-overflow check passed because the carousel clips its own scroller,
and the unit tests assert the words are in the page, which they were. Only the
screenshot showed it. The region is now a container and the slide is `100cqw`.

**The fix for that produced a second wrong thing, and the screenshot caught that
too.** Letting the next slide peek in at the edge is the standard "there is more
here" signal, and on a 390px phone it cut a sentence mid-word — which reads as a
rendering fault, not an invitation. Hence dots.

**Home's first paint was a dead end.** The old page was static; the new one
waits on the session, and its loading state was a single line of text with no
controls at all. Two browser tests failed on it — the 48px-target sweep found
zero controls to measure, and the no-JavaScript walk found no help link, which
is exactly §0's dead end: with JavaScript off, that state is the whole screen.
The loading state now carries the help bar. It deliberately does not offer
sign-in: whether that is the right next step is precisely what is still being
decided, and a link about to be replaced by a different one in the same place is
how somebody taps the wrong thing.

**`2 ne…`** — the unread badge in a tile was the thing that got squeezed, because
it was the short element beside a long description. `flexShrink: 0`. A truncated
count is worse than no count.

**Two regions, one name.** `OnboardingSlides` labelled both its own `<section>`
and the carousel inside it, so a screen reader saw two regions called "How PAM
works". Caught by the new unit test, not by a human.

**The database suite would not start for ten minutes**, which was not a bug in
it: a postmaster from an earlier run in the same container still held port
55432 after the script's own cleanup had run, and `pg_ctl` reports that as
"could not start server" with the reason only in a log file the script does not
print. It passed on a later attempt with nothing changed. Worth knowing before
somebody goes looking for a fault in `packages/db` that is not there — and worth
the script echoing the last few lines of `server.log` when it fails.

## Decisions

- **D-096** — the way in explains itself before it asks for anything.
- **D-097** — no "Get help" on sign-in; the number appears the moment anything
  fails, and a test asserts it.
- **D-098** — home is a menu, and says nothing it does not know.
- **D-099** — PAM's own colour is a token, not a hex.
- **A9** (`docs/sop-amendments.md`) — the second and last screen deliberately
  without a help link, with the bar an exception has to clear.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean |
| `pnpm --filter @pam/config test` | 202 tests, all pass; en/es key parity holds at 336 keys |
| `pnpm --filter @pam/ui test` | 63 tests (7 new), all pass, axe clean on `NavTile` and `OnboardingSlides` |
| `pnpm --filter @pam/web test:a11y` | 216 browser tests across 3 viewports (4 new), all pass |
| `pnpm --filter @pam/web build` | static export, 13 routes |
| `node scripts/check-bundle-budget.mjs` | 497.2 kB gzipped — inside §12's 500 kB, with 2.8 kB to spare |
| `node scripts/journeys.mjs` | 90 screenshots, reviewed by eye in both themes |
| `pnpm --filter @pam/db test` | all database checks pass (after a port clash held it up; see above) |

## Left undone

- **The bundle has 2.8 kB of headroom.** The carousel and the clickable card
  cost about 5 kB of the 7.8 kB that was spare. The next component added to a
  shared screen will breach §12. Splitting the Astryx imports the sign-in screen
  pulls in is the obvious next move.
- **The journeys sheet is still not shareable.** `vercel.json`'s build command
  does not yet install Chromium and run `scripts/journeys.mjs` after the Next
  build, so the sheet is only ever as fresh as somebody's laptop.
- **The five-tab member shell** (`AppShell` + `TabList`) is still unbuilt. Home
  is now the screen it will dock under, which makes it the natural next task.
- **`pnpm lint` cannot run non-interactively** — `next lint` is deprecated and
  prompts for a configuration choice. Pre-existing; it needs migrating to the
  ESLint CLI.

## Needs a human

Unchanged from the last session, and all still blocking the pilot:

1. Resubmit the A2P campaign — the checklist and the three final answers are in
   `docs/sms-campaign-samples.md`.
2. Twilio credentials into the `dispatch-sms` Edge Function secrets.
3. The app URL into Supabase → Authentication → URL Configuration.
4. The compliance profile and A2P brand under **Oba**.

Twilio is still a trial account: only numbers verified by hand in its console
can receive a text.

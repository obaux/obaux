# 2026-09-16 — A real sign-in hero

**Phase:** 1 (UI/product polish on Foundation) · **Sessions so far:** 21

## What changed

A direct follow-up to the same day's "A consistent top bar" session — Will
shared a Figma redesign of the sign-in screen and asked for it implemented:

- **`OnboardingSlides`** rebuilt as a full-bleed hero the sign-in card rides
  up over, replacing the earlier small-icon-on-a-pale-card layout. A `header`
  slot carries the mark, a "Philadelphia" pill, and the locale switcher over
  the art.
- **The exact gradient Will specified** — `linear-gradient(180deg,
  rgba(0,0,0,0) 40.88%, rgba(0,0,0,0.5) 66.12%), url(<image>) lightgray 50% /
  cover no-repeat` — is now the hero's background, verbatim.
- **Real artwork.** Three illustrations (a city crowd, a two-way flip-phone
  photo, sneakers) replace the placeholder SVG icons. See D-135: Figma's own
  MCP server returns asset URLs on figma.com, and this sandbox's network
  policy blocks every request to that domain — confirmed by `curl` failing
  with a policy-level 403 and by exhausting every Figma MCP tool that returns
  a URL rather than inline bytes. Will sent the files via Google Drive
  instead; each arrived around 600 kB and was resized to 900px wide,
  re-encoded as WebP at quality 68, landing at 29-73 kB.
- **A white, larger wordmark** (`pam-wordmark-white.svg`, built from the
  existing mark's own vector paths — recoloring needed no new asset) for use
  on the hero regardless of theme.
- **`LanguageSwitcher` gained an `onPhoto` tone** — a translucent dark scrim
  behind its icon trigger, since the plain ghost-button treatment disappears
  against a photo.
- **More card padding** (padding 4 → 5) and a **tighter, smaller consent
  line** under the sign-in button — the line's WORDS are unchanged; see
  "What was wrong" below and D-085/D-086.

## What was wrong, and what missed it

- **A real regression, caught only by the full e2e suite.** The hero's
  initial height (`clamp(360px, 62vh, 620px)`) pushed the sign-in card's
  consent sentence below the fold on the shortest supported viewport
  (iPhone SE, 320-375px wide) — failing `consent.spec.ts`'s "on screen
  without scrolling" check, the one test standing between a layout change and
  quietly breaking what carriers reviewed before approving PAM's ability to
  text anyone. Typecheck, build, and a manual screenshot at one viewport size
  all looked fine; only running the actual suite caught it. Fixed by shrinking
  the hero's height budget (down to `clamp(220px, 38vh, 420px)`) and the
  card's overlap margin to match.
- **The three source images' own Drive filenames ("Slide 1/2/3") did not
  match the order their content best paired with the onboarding copy.** The
  first pass wired them in by filename order and produced a mismatch — the
  phone photo under "see what your city has to offer," the city-crowd photo
  under "a real person can point you." Caught by looking at the actual
  rendered screenshots, not by any automated check (nothing asserts an
  image's *content* matches its caption — that judgment call has to stay
  human, or at least stay looked-at). Fixed by remapping and renaming the
  files to describe their content (`hero-city.webp`, `hero-phone.webp`,
  `hero-sneakers.webp`) rather than a slide position that turned out not to
  be stable.
- **This sandbox cannot fetch a pasted chat image's bytes at all** — there is
  no upload directory that populates when an image is pasted into the
  conversation, and no tool here extracts raw bytes from inline message
  content. Confirmed by an exhaustive filesystem search across `/tmp`,
  `/root/.claude/uploads`, and the session scratchpad after two separate
  image-paste attempts, both of which showed the images fine as chat content
  but left nothing on disk. Google Drive's `download_file_content` MCP tool
  was the way around it — it returns the actual base64 bytes inline (as a
  large tool-result file on disk, not just a URL), which `jq`+`base64 -d`
  turned into real files.

## Decisions

- D-135 — the sign-in hero's illustrations came from Google Drive, not
  Figma directly (network policy), and were resized/recompressed on the way
  in (`sharp`, a throwaway dev dependency, not committed).

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/ui typecheck` | clean |
| `pnpm --filter web typecheck` | clean |
| `pnpm --filter web build` | succeeds, static export |
| `node scripts/check-bundle-budget.mjs` | 501.3 kB gz — 1.3 kB over budget, unchanged by this session (images are `public/` assets, not bundled JS) |
| `pnpm --filter @pam/ui test` | 65 passed |
| Playwright `e2e/consent.spec.ts` (all 3 viewport/theme projects) | 51 passed — including the one that caught the regression above |
| Playwright e2e (full suite, 3 viewport/theme projects) | 426 passed, 0 failed |

## Left undone

- The same two larger pieces flagged in the previous session's log remain
  outstanding: client-side routing for a genuinely non-reloading header, and
  the full share-places-with-people feature. Neither was in scope for this
  pass.
- No alt illustrations exist for a failed-image state — if one of the three
  WebP files fails to load, the hero falls back to the CSS spec's own
  `lightgray` fill (per the gradient's own `background` shorthand), which is
  serviceable but untested against a real network failure.

## Needs a human

- None new. The sourcing question this session opened (how to get real
  design assets into a sandboxed session at all) is answered for next time:
  Google Drive, Slack, or a repo push all work; figma.com and pasted chat
  images do not.

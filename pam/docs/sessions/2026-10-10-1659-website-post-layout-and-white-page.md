# 2026-10-10 — website: post layout after Figma Learn, the white page, and the weekly rhythm

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Website

Will, in the session (10 October): gray alert banners for requirements; screenshots in a card, steps in a black-outlined card
beside it; "better hierarchy, see how Figma does it"; a light gray (a tint lighter than the page) for the picture card; a light
outline on the Still-stuck card and a light border on the button; and, via Mira at 16:45, "post page bg color set to white". Mira (16:59):
from now on the website is updated once a week, on Friday (`docs/team.md`, "The weekly update").

## What changed

- **Layout** (`PostScreen`, `Prose`, new `Needs`, `HowTo`/`ShotCard`, `Steps`): one centred 920px column; the path "Support → [page]"
  with the page as a pill; a large centred title; an outlined "Who this is for" box (audience and date); text at a 760px measure, cards at
  full width; the lead in regular weight. Requirements are `<Needs>` (gray banner, info icon). `<HowTo>` = the steps in a black-outlined card
  and the screenshots in a light-gray card beside it, stacked on a phone, where the step counters are smaller (24px) and the gaps closer;
  the number is centred on its text. Posts that had steps and a screenshot are converted; a screenshot separated from its steps by a
  paragraph was moved into the steps' card.
- **White page** (`globals.css`: `body:has([data-page='post'])` uses the theme's card colour): white in light mode, the theme's raised dark in dark.
- **Colours were wrong twice**: the picture card was first blue (Will asked for gray), then a color-mix toward white that failed dark-mode
  contrast on the captions (18 axe problems), then the page-gray variable, which resolves to white inside the theme provider so the card
  disappeared. The final: `light-dark(muted, surface)` from the theme (light #f1f1f1, dark #262626), measured on the rendered pixels.
- **Button border, scoped to the site** (Will, "adjust the ds"): I first put a 1px light border on every secondary `@pam/ui` Button; that failed
  `@pam/ui`'s option-tag test (the app's language chips drew a border they never had) and was Dot's lane. Reverted to main; the site's four
  secondary buttons use `SecondaryButton` (`apps/site/src/components/SecondaryButton.tsx`). Mira gave Dot the app-wide version. The
  Still-stuck card has a light outline.
- **Rules post live** (D-489, written up in `2026-10-10-1532-website-rules-post-signed.md`).

## What was wrong, and what missed it

- **My wait loop matched its own command line** (`while pgrep -f scripts/a11y.mjs`), so a background job spun for 20 minutes and I read
  an old log as new twice (a "still failing" that was stale, a "5 problems" that was my own `rm -rf out` under a running scan). Use unique
  log names, wait on the process that wrote them, never `pgrep -f` a string in the command doing the waiting.
- **Sampling the wrong pixel** (the gap between two cards) made a correct card look wrong; the computed styles and the card's own pixels agreed once
  I looked at the right place.

## Decisions made

None new (D-489 is the rules sign-off).

## Verified

- Site tsc and web tsc clean, 26 site tests, normal build, `a11y.mjs` 85 scans 0 problems; light and dark screenshots read; card colours
  measured (light #f1f1f1 on white, dark #262626 on #1f1f22).

## Left undone

- "Adding your program's policies" and the check of the rules post against the live screens move to Friday's batch (`docs/weekly/2026-10-16.md`).
- The checked-in screenshots are unchanged; the new layout was checked on the built site, not on a Vercel preview.

## Needs a human

- Dot: the app-wide secondary-button border, with the option-tag test reference updated (Mira has it).

# 2026-10-10 — Website: soften the assignments post and run the checks

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren)

## What changed

- Mira, relaying Will ("Go ahead and decide, you're the CTO"): keep the Places &
  programs draft hidden (Q1 a); tone "Case manager assignments" down to what is live,
  then READY (Q2 a). `origin/main` bf08d60 merged first. D-449.
- The post now describes only what is live; Will's full table is held in code behind
  `live: false`, one flag per row.
- Two layout defects found by the checks and fixed: the Support list cut summaries off
  with "…" on phones; at 320px "Sign in" sat on top of "Support" in the header (the
  wordmark is smaller below 400px and "Home" is hidden there, since the logo goes home).
- `apps/site/scripts/a11y.mjs`: axe against the built site (see Verified).

## What was wrong, and what missed it

- **The language-fit audit let the 320px header overlap through.** Run on Storybook
  after the first fix it reported zero, but the built site still overlapped. The audit
  measures Storybook, not `pam-site`; the site's own script now checks for overlapping
  header controls at 320px. I found it by looking at a screenshot of the real build.
- **I ran `git stash` by mistake** at the end of a command and set all uncommitted work
  aside. Popped straight away; nothing lost. (Untracked files are not stashed.)
- A "limit or pause" sentence in the first rewrite would have told readers a case manager
  can do something no screen does; the new test (held rows stay out of the post) caught it.

## Decisions made

- D-449 — the public post says only what Pam does today; held rows behind flags.

## Verified

| Check | Result |
|---|---|
| `@pam/site` typecheck, tests | clean; 8 pass (one new: held rows stay out of the post) |
| `@pam/site` build | all pages; the draft is not built |
| Accessibility, `apps/site/scripts/a11y.mjs` (axe wcag2a/2aa/21a/21aa + best-practice, no sideways scroll, no overlapping header controls) | 20 scans, 0 problems: 3 pages + Support searching, in desktop light/dark, 390px light/dark, 320px light. Sanity-checked: the same script flags a missing label, low contrast and a missing alt |
| Language-fit audit, `--match website-` | 6 stories x 7 languages at 320px: 0 new; the 8 English defects it found were fixed (see above) and the re-run is 0. Scoped to the Website stories: the change touches only one app story file |
| `@pam/web` typecheck, tests | clean; 48 pass |
| Storybook build | completes |
| App Playwright a11y suite (`apps/web/e2e`), full language-fit audit | not run: the app's screens are not touched; the Playwright suite does not cover pam-site |

## Left undone

- The production deploy of pam-site fails until the site is on `main` (Mira merges).
- The held rows: publish each when its screen ships (D-449). The hidden draft post when
  listing editing ships (before-launch).
- Not in a real unfurl; no real domain (Will's, later; none is hard-coded).

## Needs a human

- Nothing new.

# 2026-10-10 — Website: the help-centre audit and the first ten help posts

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren)

## What changed

- **Restart.** The site was merged (Mira, 7db5f0f). A force-push I tried to restart the branch was refused by the
  permission check, then every shell command was; I stopped, told Mira, and on her plain-command retry did a fast-forward
  (`git merge --ff-only origin/main`, plain `git push`): no force was needed.
- **First commit** (Mira's list): `joinpam.org/j/:code` forwards to `app.joinpam.org/j/:code` in `vercel.json` (with and
  without a trailing slash; a test reads the rules); `NEXT_PUBLIC_SITE_URL` defaults to `https://joinpam.org` and
  `NEXT_PUBLIC_APP_URL` to `https://app.joinpam.org` (matching the app); `a11y.mjs` runs in CI.
- **The audit** (Will, via Mira): three readers walked six kinds of person; I checked the claims I ranked on against the code;
  the top ten went to Mira as a FINDING, and the app's own problems as another, grouped by lane. Nothing in the app changed.
- **Ten posts + one hidden draft** (D-458, which says what each says, what was left out and why). New pieces: `Steps`,
  `Screenshot`, `CompareTable`, `StillStuck`, `Prose`; `scripts/screenshots.mjs` and `screenshots.json`; an audience line under each
  title; "Start here" on Support.

- **Later: main changed the Reminders screen** (Nico, 491375e) and Mira asked me to merge `main` (145a01e) and retake it. I retook all 13
  screenshots from main's Storybook and compared them pixel by pixel: only the Reminders screen changed (the other 12 are identical,
  which also covers the screens Mira named elsewhere: none of them is in a post). The post now follows the new screen's words, has a second
  screenshot ("Texts are off"), and a one-line switch (`VISIT_REMINDERS_LIVE`) for Piper's day-before reminder. Mira's decision on Will's
  question: keep "Texts from Pam" public.

## What was wrong, and what missed it

- **`screenshots.mjs` overwrote the size list when run for one picture**, leaving only that entry. Caught the same minute (a type check
  still passed because missing sizes fall back to a default); fixed so a partial run merges, and a full run restores all 14.

- **My audit was wrong in two places, and the fact-gathering caught both.** I said only staff can start a chat (D-176: a member may
  message their own case manager or a program), and I planned a post on "asking to be a case manager" (D-369: the request path is
  gone; staff join by link only). Both were claims from a reader's summary; reading the decisions fixed them. The posts follow the
  decisions, and I told Mira.
- **Astryx's list item trims a label to one line with "…".** It cut the numbered steps ("Pam texts you reminders only if you said yes. Yo…")
  and later the Support list's long titles. I found the steps by looking at a phone-width screenshot, not from a check; the language-fit
  audit then found the list titles. Steps and the post list are now built so text wraps.
- **The accessibility script found a skipped heading level** on phones (cards under a table that had no section heading in "Pam words").
  Fixed; the script now covers every built post, so a new one is checked without editing a list.
- **The first Points screenshot would have contradicted the post** (an example badge earned and four ways to earn that are not live), so it
  is cropped to the points card.
- **The Reminders screen's button is "Agree to receive texts"**, not the join step's "Yes, text me reminders"; the post named the wrong one for that
  screen until I looked at the screenshot.
- **I wrote a decision number (D-452) into a comment before claiming one.** Caught and replaced with the claimed D-458.

## Decisions made

- D-458 — what the posts say and leave out, and the pieces they are built from.

## Verified

| Check | Result |
|---|---|
| `@pam/site` typecheck, tests | clean; 14 pass |
| `@pam/site` build | every post built; the two drafts are not |
| `apps/site/scripts/a11y.mjs` | 70 scans (every page; desktop and 390px light and dark; 320px light), 0 problems |
| Language-fit audit, Website stories | 6 stories x 7 languages at 320px: 0 new; the 12 English defects (long titles trimmed) fixed; re-run 0 |
| Screenshots | 13, from Storybook at 390px; looked at all; pretend people and places only |
| Not run | the app's own Playwright suite and the full fit audit (no app screen changed); the bundle budget; the live `joinpam.org` (this sandbox cannot reach it) |

## Left undone

- Not read: the posts in a native speaker's eye. They are English only (the other languages are Lena's lane, later).
- A real unfurl of the share preview, and `https://joinpam.org` itself, were not checked from here.
- The posts need re-checking when the features they describe change (before-launch.md lists which).

## Needs a human

- Will: whether to say publicly that reminders are not sent yet ("Texts from Pam" does, because the Reminders screen implies they are).

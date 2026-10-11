# 2026-10-11 — website Home: case managers card

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), job from Will via the merge desk (card a50, "yes" at 02:16 UTC)

## What changed

- `apps/site/src/screens/HomeScreen.tsx`: the Case managers card body is now Will's Figma line, "Their plans, your guidance, in one place." Nothing else on Home changed. English only; website copy is not translated until a change merges.
- Also on this branch, from earlier: `docs/help-centre-gaps.md` parks "they said i missed it" (Pam does not record attendance yet), docs only.

## What was wrong, and what missed it

Nothing broke. "Know where your people are going" had passed review as marketing copy; Will's reading of it as surveillance came from the Figma pass (D-505, voice guide).

## Decisions made

None new; D-505 (the website uses Will's marketing words, the app keeps its own) covers it.

## Verified

| Check | Result |
|---|---|
| `@pam/site` tests | 38 passed |
| `@pam/site` typecheck, build | pass |
| Site a11y (axe) | 90 scans, 0 problems |

## Left undone

The app's About Pam still says, for case managers, "For a case manager: know where your people are going, and connect them in a tap." (`about.how.admin`). Will's card was about the website; the app's words are Dot's / Sage's call.

## Needs a human

Nothing.

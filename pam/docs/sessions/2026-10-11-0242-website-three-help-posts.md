# 2026-10-11 — website: three help posts

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), words by Sage, signed by Will (card a51, 02:18 UTC)

## What changed

- Three Support posts, from Sage's drafts: `start-here`, `talking-to-pam`, `your-language` (bodies `StartHere.tsx`, `TalkingToPam.tsx`, `YourLanguage.tsx`, registered in `posts.ts` and `bodies.tsx`, topic Members, audience everyone). Every quoted line was checked against `packages/config/src/locales/en.json` first.
- Eight gap phrases now have answers (`search-phrases.ts`): why is this happening, something went wrong, the page is blank, it wont load -> start-here; how do i talk to a real person, pam phone number -> talking-to-pam; change my language, en español -> your-language. Their rows moved to Done in `docs/help-centre-gaps.md`.
- Steps that are not steps (what we can help with, good to know, the languages) are plain paragraphs, not a numbered "In the app" card; the cards for steps carry a title that fits ("What to do", "How to call").
- Not built, not signed: "Is the place told about my visit?" (`claude/help-posts-visits`).

## What was wrong, and what missed it

Nothing broke. One draft line was wrong for some places (a phone number is on a place page only when the place has one, found on the way, reported to Sage).

## Decisions made

None new.

## Verified

| Check | Result |
|---|---|
| `@pam/site` tests | 38 passed, including every phrase finding its post first |
| `@pam/site` typecheck, build | pass |
| Site a11y (axe) | 105 scans, 0 problems (15 new: three posts, five views) |
| Look | the three posts at 390px, light |

## Left undone

- "Is the place told about my visit?" waits for Will.
- `your-language`: add the line about texts the day texts go live and the sign-in code follows the language (Sage's note in the draft).
- Screenshots were not added to these posts.

## Needs a human

Nothing.

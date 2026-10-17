# 2026-10-10 — research member flow

**Branch:** `claude/research-member-flow` · **Lane:** User testing & research (Iris)

## What changed

This was the first test pass of the Member flow. The report is
`docs/research/2026-10-10-member-flow.md`, with four screenshots of stub data in
`docs/research/shots/`. No app code was touched; Iris finds, Iris doesn't fix.

## What was wrong, and what missed it

- **The sign-in legal footer covers "Send me a code" on a 568px-tall viewport.** This
  happens for an invited member in English, Spanish and Arabic, and on plain sign-in in
  Spanish. `LegalFooter` is `position: fixed`, and on a short screen the card's button
  ends up underneath it. Every check passed because nothing renders sign-in shorter than
  640, and Chromatic shoots at its default size.

## Decisions made

None.

## Verified

| Check | Result |
|---|---|
| Prototype walk (Chromatic `main`), 390×844, English | every step completes; about 21 taps |
| Key screens at 320 wide, dark, Spanish and Arabic | no sideways scroll; findings in the report |
| Sign-in footer overlap, 4 viewports × 3 languages × invited/plain | covered at 320×568 only |
| Same check in the local build (`pnpm --filter @pam/web build`, `out/`, outside requests blocked) | reproduced in en (invited) and es |
| Contrast (WCAG AA) on 7 member screens, dark | none under |

## Left undone

- **The live app, signed out:** `app.joinpam.org` is refused by this environment's
  network policy.
- **Screen readers, the other three policies, changing a trip, expired invites.**
- **`STATUS.md`:** the research lane has no section yet. I didn't add one; the merge desk
  can say whether it wants one.
- **The merge desk was not messaged.** This session has no `send_message` to
  `session_018wn7LF7RMsHnXSAzvk6s1p`, so the STARTED and FINDING notes go to Will to relay.

## Needs a human

- **Will:** relay the FINDING note to Mira.
- **Will:** decide whether W1 (help missing from Explore, Saved, Trips and a place) was
  deliberate.

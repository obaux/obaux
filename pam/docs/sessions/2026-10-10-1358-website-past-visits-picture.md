# 2026-10-10 — website: the Past visits picture

**Branch:** `claude/compassionate-bohr-mzrchf` (main merged in, with Piper's story) · **Lane:** Website

## What changed

- "Planning a visit" has its Past visits picture (Mira, 13:57): `planning-a-visit/past-visits.png`, from main's
  Storybook story `member-created-states-saved-trips--trips-with-a-past-visit`, scrolled to the heading so
  "Past visits" and one earlier visit show (Riverside Job Center, Wednesday, October 7). Read before use; example
  data only. Alt text and caption added. Nothing else in the post changed.

## What was wrong, and what missed it

- My first shot showed only the coming-up visits: the Trips list sits in a drawer and "Past visits" is below the
  fold. `scrollTo: "Past visits"` in `screenshots.json` fixes it; the first picture was read before committing, which is
  what caught it.

## Decisions made

None new.

## Verified

- tsc, site tests, normal build and `a11y.mjs` (numbers in the READY note).

## Left undone

- The Text alerts help (Nico's four switches) waits for that work to be on main (Mira): check "Texts from Pam"
  and any staff mention against `AlertsView`, with `flags.ts` still ruling the reminder lines.

## Needs a human

- Will: sign the English of About Pam.

# 2026-10-13 — design help dialog backdrop wording

**Branch:** `claude/pam-design-help-dialog-docs` (off `main` @ 4d41d542) · **Lane:** design system

## What changed

D-562 now says what the help dialog does: Close or Esc closes it; clicking outside does not, because Astryx `purpose="form"` ignores the backdrop so nothing typed is lost. Added a dated correction at its foot. Docs only.

## What was wrong, and what missed it

D-562 (and Will's card a83) said the backdrop closes it. The built dialog does not, and I wrote the sentence from the native `<dialog>` behaviour, not from the built one. Iris found it on her walk-through (P1).

## Decisions made

None new. The merge desk decided to keep the behaviour (13 October).

## Verified

Searched the decision, the site's `HelpRequest.tsx` comments, stories, specs and the review notes: only D-562 said the backdrop closes it; the component's own comment already reads "Esc or Close".

## Left undone

Nothing.

## Needs a human

Will to hear that tapping outside does not close it (the merge desk tells him).

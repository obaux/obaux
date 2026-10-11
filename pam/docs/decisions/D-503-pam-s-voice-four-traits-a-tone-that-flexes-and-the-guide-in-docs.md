# D-503 — Pam's voice: four traits, a tone that flexes, and the guide in docs/voice.md

**Date:** 2026-10-11 · **Branch:** `claude/voice-guide` · **Decided by:** Sage (Voice & UX copy), from
Will's brief of 11 October: "I have UX copy needs and need to onboard someone on how to create a tone
of voice, and create impactful, yet very human UX copy that we can use to instill personality on
certain pages, like the website." The guide is a proposal until Will reads it; the rules it repeats
(no justice terms, seven languages, sign-off) were already his.

## What was decided

- **One guide, `docs/voice.md`.** Storybook's Foundations › Writing is now a one-page summary that
  links to it, so the two can't drift apart: change the guide, then the summary.
- **Four traits:** plain, warm, steady, respectful. Each has do/don't pairs from real `en.json`
  strings, so a writer can see the voice instead of reading adjectives about it.
- **The tone flexes, the voice doesn't.** Most personality on the website and in moments of
  welcome; calmer in tasks; plainest in errors and anything that is a promise (privacy, terms, the
  transparency screen, notices).
- **Personality never stands in for a fact.** The website may be bold about *how* Pam helps, never
  claim what isn't live. Found while writing the Home proposals: Will's newest frames said "24/7
  support", "powered by AI" and "reminders"; none of the three is true today (help hours are weekdays
  9 to 5, the support posts are written by the team and are English only, visit reminders are off in
  `apps/site/src/content/flags.ts`).

## Why

There was no single place that said how Pam sounds. Writing.mdx was a list of rules (and still said
"English and Spanish"); the app's best lines ("This is not your fault…", "You do not need to know what
to ask for") were good by instinct, not by guide, and the newer strings were drifting ("Create new
booking", "Unsave {name}", "{count} people want in").

## What a later session might reverse

- The "don't" examples are real strings the guide would write differently. They are **not** changed
  in `en.json`: that needs Will's sign-off, all seven languages and the screen's lane.
- One word is open: the staff who run a program are "Program partner" on the invite
  (`join.invited.role.provider`) and "program lead" on About (`about.signin.provider`). The guide
  suggests "program lead" and leaves it to Will.
- "Your guide" (D-416) stays the member's word on screens that define it; the guide uses "case
  manager" everywhere else, including the website.

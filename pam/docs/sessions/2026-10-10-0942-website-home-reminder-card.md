# 2026-10-10 — website: the home page's reminder card says what is true

**Branch:** `claude/compassionate-bohr-mzrchf` (restarted from `main` 3ddac79; the old branch was merged) · **Lane:** Website

## What changed

- Home card "Keep going" promised reminder texts that are not switched on (Control Room a12: Will
  approved fixing every such promise). Before: "Pam reminds you before you go, so nothing gets
  missed." After: "Pam keeps your planned visits in one place. Texts that remind you are coming."
  When `VISIT_REMINDERS_LIVE` is true: "Pam keeps your planned visits in one place, and texts you a
  reminder before you go."
- The switch moved from `TextsFromPam.tsx` to `apps/site/src/content/flags.ts`, so the Texts post and
  the card read one line. A test pins that the card reads it and the old promise is gone.
- `docs/before-launch.md`: a list (nothing rewritten) of what the posts need when reminders go live
  and when Dot's new app layout merges: posts, steps and the thirteen screenshots to re-take.

## What was wrong, and what missed it

- I flagged this card in the About Pam job but left it. The first version of the card was written
  from the app's onboarding copy, which promised more than was live; no check compares site promises
  with `VISIT_REMINDERS_LIVE`. Now this card is tied to it; the About Pam "What is coming" paragraph is
  still static text (before-launch lists it).

## Decisions made

None new (D-466 stands).

## Verified

- `tsc` clean; site tests 18 pass (1 new); normal site build.

## Left undone

- About Pam's "What is coming" paragraph is not driven by the switch.
- Not seen on a Vercel preview.

## Needs a human

- When Will signs the English of About Pam: `"en"` into `signed-off.json`.

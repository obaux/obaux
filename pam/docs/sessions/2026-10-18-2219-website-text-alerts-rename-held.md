# 2026-10-18 — website text alerts rename held

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** <see docs/lanes.md>

## What changed

One held patch off b75 (4d39ccca), `docs/design/review/2026-10-18-text-alerts-site/text-alerts-site.patch`: Sage's renames in TextsFromPam and PlanningAVisit (role sentence deleted), the D-608 block quote and the agree-screen/texts-off pictures re-shot (both titled “Get text alerts”) with alts signed by Sage at 744e4b2f (HELP and rates added). Also the sign-up texts step picture for Lena's packet.

## What was wrong, and what missed it

## Decisions made

## Verified

Patch applies on origin/main; tsc, site tests (only the two intended post-dates failures), build, a11y (125 scans), usability and scrollspy pass.

## Left undone

Ship day: `posts:date` for texts-from-pam and messages-in-pam (the patch leaves dates alone by design).

## Needs a human

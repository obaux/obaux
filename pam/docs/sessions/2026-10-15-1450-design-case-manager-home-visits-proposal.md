# 2026-10-15 — design case manager home visits proposal

**Branch:** `claude/pam-design-cm-home-visits` (off `claude/pam-design-cm-prototype-gaps`, which carries the P2 fixture; origin/main merged) · **Lane:** design system (Dot)

## What changed

Pictures and a patch only, in `docs/design/review/2026-10-15-cm-home-visits/`: what each member card on the case manager's Home could say about visits (Iris's W4). No app code changed on the branch.

## What was wrong, and what missed it

Home shows name and points; the sign-in slide promises "Know who showed up". Nothing connected the two.

## Decisions made

None recorded: a proposal until Will picks. Two open questions for him are in the README (sort missed first; points off Home or kept).

## Verified

Before and after shot from the same Storybook data (dev server), 320x568, 390x844, 320x568 Arabic, and 320 wide scrolled. Nothing new revealed (`transparency.canSee.appointments`; the member's page already shows it). The patch was reverted; the first revert left the dev server in an HMR reload loop, so the "before" row was shot after a restart.

## Left undone

Words are stand-ins (A29); Arabic needs Lena's gender-neutral form. The real build is one `appointments` read for the whole caseload, Piper's lane.

## Needs a human

Will picks the card content; Sage and Lena word it.

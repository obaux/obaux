# 2026-10-11 — design signin code contact

**Branch:** `claude/pam-design-signin-code-contact` · **Lane:** Design system & Storybook

## What changed

Iris CP1: a quiet `help.needHelp` link under Send again on the code step, to `SITE_URL/support/cant-sign-in/`. D-527.

## What was wrong, and what missed it

D-510 took Contact Pam off the wrong-code message with the full Notice and the code step never had its own, so A26 was broken there. My D-510 e2e even asserted there was none. Iris found it by walking the screen.

## Decisions made

D-527.

## Verified

tsc; `signin-wrong-code` (incl. the new test) and `signin-short` in 3 projects; build; build-storybook; fit audit on the Sign in stories.

## Left undone

Nothing.

## Needs a human

Nothing; no new English.

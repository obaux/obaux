# 2026-10-11 — design wrong code alert

**Branch:** `claude/pam-design-wrong-code-alert` · **Lane:** Design system & Storybook

## What changed

Will (03:00 UTC): a wrong sign-in code showed the full Notice with Call Pam and went back to the number. Now `CompactNotice` in `@pam/ui`; a refused code keeps the code step (`error: 'verify'`), empties and refocuses the boxes, shows `signin.code.wrong` under them. `CodeBoxes` `inputRef` and a retry of the same digits. Old `signin.failed.verify.*` removed. D-510.

## What was wrong, and what missed it

A wrong code was treated as a stuck state. No test covered a refused code.

## Decisions made

D-510.

## Verified

`tsc`; web 97, ui 120, config 1067 unit tests; `signin-wrong-code` and `signin-short` (incl. 320×568 en/es/ar) and the sign-in a11y in all three projects; build; build-storybook; fit audit on the Sign in stories.

## Left undone

Lena to read six drafts of `signin.code.wrong`. `signin.failed.send` unchanged (a54/A28 job next).

## Needs a human

Will: the English line, "That code did not work. Try again."

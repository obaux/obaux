# 2026-10-11 — design principles page

**Branch:** `claude/pam-design-principles` · **Lane:** design system & Storybook (Dot)

## What changed

Sage's finding (relayed by Mira, 01:16): Foundations › Principles was out of date in two places.
- Rule 3, "Never dead-end": now the way back on every screen (the tab bar on a tab screen) and help **where people get stuck**
  (sign in and joining, forms and errors, anything failed or waiting, each step of a task, any screen that says to call), with
  the tabs, lists and a place's page needing none; help is one tap from Profile and on Home (A26).
- Rule 7: "English and Spanish" is now the seven languages (A24), with the note that texts and emails stay English and
  Spanish until a template is signed (what A24 kept).
- `Writing.mdx` carried the same "Every string in English and Spanish" line: fixed the same way. `Layout.mdx`'s hero note (no Help
  on a hero screen, A19) already agrees with A26 and is unchanged.

## What was wrong, and what missed it

The Foundations pages restate the SOP, and nothing ties them to `docs/amendments/` or CLAUDE.md, so A24 (9 October) and A26
(11 October) changed the rule and not the page. No decision file: the rules are Will's (A24, A26), this brings the page in line.

## Verified

`build-storybook` passes. Docs only; no code, no tests touched.

## Left undone

Nothing else in Foundations mentions either rule (searched Colour, Typography, Actions, Imagery, Introduction).

## Needs a human

Nothing.

# 2026-10-11 — design contact pam

**Branch:** `claude/pam-design-contact-pam` · **Lane:** Design system & Storybook (touches other lanes' screens for the mechanical prop removal, as Mira allowed)

## What changed

A28 in the app. `Notice` offers Contact Pam (a link to `/help/`) instead of a `tel:` Call button; `useSupportPhone` and every `supportPhone` prop removed (~40 sites); `callLabel` → `contactLabel`; gallery number removed; Help screen rows and Privacy's two pages open the help desk / Help; HelpBar glyph. New key `help.contact.action`. D-512.

## What was wrong, and what missed it

Nothing was wrong; the rule changed (A28).

## Decisions made

D-512.

## Verified

`tsc` (web, ui); ui 120, web 97, config 1067 unit tests; build; build-storybook; e2e on narrow-320 for the specs that expected a Call link (account, directory, messages, places, consent, a11y, saved, staff-request-approve, flag, failed-load, signin-short).

## Left undone

About 33 English strings still say "call Pam"; they are Sage's words, Lena's carrying. `help.call.*`, `help.callSupport`, `help.menu.call` unused. Lena to read `help.contact.action` drafts.

## Needs a human

Sage's final label for `help.contact.action`; where Will wants the Help screen's first row to go (I sent it to the website's help desk).

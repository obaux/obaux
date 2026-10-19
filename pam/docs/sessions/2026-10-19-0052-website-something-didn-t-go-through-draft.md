# 2026-10-19 — website something didn't go through draft

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** <see docs/lanes.md>

## What changed

New Support post `something-didnt-go-through` (When something doesn’t go through; members, everyone), built from Sage’s signed draft (docs/help-drafts/something-didnt-go-through.md at 98875861). A **draft** (`status: 'draft'`) until D-618 is live: left out of the site, Support and search; shown only in Storybook’s Website › Journey › Post. Section titles are the alert titles. No “Contact Pam”; “Still stuck?” is the way to a person. No number for “I’m here” (Sage’s note).

## What was wrong, and what missed it

## Decisions made

## Verified

site tsc and tests (125) pass; post rendered in Storybook at 390 and 1280px with the Draft banner. Dated 2026-10-19 with posts:date.

## Left undone

On D-618 going live: remove `status: 'draft'` (and re-date if words change); check the headings against `notice.malfunction.<kind>.title` in en.json (not on main yet, so not checked). Optional: Sage’s short section labels.

## Needs a human

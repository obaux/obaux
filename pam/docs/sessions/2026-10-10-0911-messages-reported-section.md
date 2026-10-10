# 2026-10-10 — Messages & notifications (Nico): Reported, inside the redesigned Messages

**Branch:** `claude/messages-reported` · **Lane:** Messages & notifications

Mira, from Dot's finding: the redesigned `MessagesScreen` has no Reported section for case managers and
super admins, and the bell opens `/messages/?show=reported`. Build it so the old page can go.

## What changed

- `MessagesView` (the section control and the section), `MessagesScreen` (reports fetched by true role, drawn
  by viewed role, `?show=reported`), `app/messages/ReportedSection.tsx`, stories, D-464.

## What was wrong, and what missed it

- Nothing broke on `main`: the live `/messages/` is still the old page. The redesign had silently dropped a
  section when the screen was rebuilt (D-213), and only a role-by-role walk found it. There is no check that
  every role's old screens have a new home; the story set (`roles/<Role>.stories.tsx`) is the nearest thing.

## Decisions made

- D-464.

## Verified

- Config unchanged; `tsc` clean in web; Storybook builds; the three new stories looked at at 320px
  (Conversations / Reported for a case manager; Reported for a super admin); fit audit on every Messages story
  in seven languages: nothing new. Not run: Playwright (no live route changed), the database suite (no migration).

## Left undone

- Deleting `LegacyMessagesPage`, `DummyRowsLazy`'s conversation half and the two-role branch: after both this and Dot's
  shell are on `main` (said to Dot).
- The new screen's Reported section has no Playwright test until the shell routes to it.

## Needs a human

- Nothing. (A super admin now opens on Conversations; one initial value if Will wants Reported.)

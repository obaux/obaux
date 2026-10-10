# D-464 — Reported is a section of the redesigned Messages, for case managers and super admins

**Date:** 2026-10-10 · **Branch:** `claude/messages-reported`

Mira for Will, 10 October 2026, from Dot's finding while moving the new design in: the redesigned
`MessagesScreen` has no Reported section; the old `/messages/` showed a case manager "Conversations |
Reported" and a super admin "Reported" (D-171, D-184), and the bell's "a message was reported" opens
`/messages/?show=reported`. Dot's shell keeps the old page for those two roles until this exists.

## What was built

- `MessagesView` takes an optional `reported` prop: a "Conversations | Reported" segmented control under
  the title (`messages.sections`, `messages.section.*`, all already in seven languages), and `content` drawn
  in place of the list when Reported is chosen. The search button is hidden on Reported (it searches
  conversations). Without the prop the screen is as it was, for a member and a program.
- `app/messages/ReportedSection.tsx` holds the section's states: loading, offline or failed (with the
  call button), the cards (`ReportsList`, unchanged), the empty notice, the example set for a preview or an
  empty real list, and the line saying why a message shows here (`reports.intro`).
- `MessagesScreen` fetches reports for a case manager and a super admin by their **true** role and draws
  them by the **previewed** role (D-172), and opens on Reported for `?show=reported` (D-185).
- Stories: `Case manager/States/Messages — Reported` (conversations, reported, super admin reported).

## Choices a later session might question

1. **A super admin gets both sections**, not Reported only. D-171 gave them Reported only; 0072 / D-262
   then let them message staff, and the redesigned screen already lists their conversations, so they get the
   same control as a case manager. If Will wants a super admin's Messages to open on Reported, it is one
   initial value.
2. **The default section is Conversations**, except for `?show=reported`.
3. **`ReportedSection` is a new file rather than lifting the old page's code**, because the old page
   (`app/messages/page.tsx`, `LegacyMessagesPage` on Dot's branch) is to be deleted, and its three
   branches (real, preview, example) were a few lines each.

## Not done

- **Deleting the old page.** `LegacyMessagesPage`, `DummyRowsLazy`'s conversation half and the two-role branch
  in `app/messages/page.tsx` go in one small follow-up once this and Dot's shell (`claude/pam-design-app-shell`)
  are both on `main`; Nico does it unless Dot prefers to (said to Dot).
- A Playwright test of the new screen's Reported section: the live `/messages/` route is still the old page on
  `main`, so the existing reported specs cover what runs; the new screen is covered by Storybook until the shell
  routes to it (the route change is Dot's).

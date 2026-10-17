# 2026-10-17 — design drawer standard a93

**Branch:** `claude/pam-design-drawer-standard` · **Lane:** design system (Dot)

## What changed

D-601: `PamSheet` in `packages/ui` and every drawer on it: NewMessagePicker (Close), AreaPicker (Done), the signature sheet in MemberPoliciesView (Close), BringFriend (Close, banner under the row), PlaceDetail's hours and Open in… (Close). `PlaceDetail`'s `labels.close` is new and required, so place/page.tsx, ProgramView, RequestProgramScreen, the gallery, its story and two tests pass it (one line each).

## What was wrong, and what missed it

## Decisions made

## Verified

New `e2e/drawers.spec.ts` (band 48px and full width and closes on a tap; title room; link says Done, in the title row, first control after the title, band hidden from AT; Done and Escape close and focus returns): all four fail on main and pass here. Renamed Cancel to Done/Close in area-picker, focus-text-boxes and member-signs-policy. 17 specs (498 tests) pass on narrow-320, dark-320 and iphone-se-viewport. `@pam/ui` test (new `pam-sheet.test.tsx`), `@pam/config` test, tsc and the Storybook build pass. Pictures: `docs/design/review/2026-10-17-drawers/`.

## Left undone

Will's yes on the pictures. Ava adopts PamSheet for "What you can see" once on main.

## Needs a human

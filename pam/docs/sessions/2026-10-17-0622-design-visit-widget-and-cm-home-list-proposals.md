# 2026-10-17 — design visit widget and cm home list proposals

**Branches:** `claude/pam-design-visit-widget` (1b3cdb0d, a91) and `claude/pam-design-cm-home-list` (a93) · **Lane:** design system (Dot)

## What changed

Pictures and prototypes only; nothing is used by the app.
- a91: `VisitWidget` (`packages/ui/src/VisitWidget.tsx`) and its stories: the green visit card with a footer (Check in | Change), a Check in view, a Change view, Marked, and the status icon with its popover. `docs/design/review/2026-10-17-visit-widget/`.
- a93: the case manager Home with Invite someone and What you can see as rows under the cards, and the sheet. `docs/design/review/2026-10-17-cm-home-list/` (patch and pictures; no code on the branch).

## Verified

Static look in Storybook at 390 and 320, light and dark, and Arabic at 320. The widget's height is the same in all three views (249 at 390). `tsc` clean. The a93 patch was reverted.

## Left undone

a91: Sage's word for "Check in" (the second footer picture uses a stand-in); Piper's reply on the result slot. a93: Ava's reply.

## Needs a human

Will, cards a91 and a93.

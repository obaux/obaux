# 2026-10-16 — design count style super admin home

**Branch:** `claude/pam-design-count-style` · **Lane:** design system (Dot) · Asked by Mira

## What changed

Pictures and a decision only (`docs/design/review/2026-10-16-count-style/`, D-586): the two count rows on the super admin's Home, today and both ways, at 390 and 320, light and dark. No app code changed.

## Decisions made

D-586: a plain number (`value`) for "how many"; a red `badge` only for what is new (unread). Piper changes Reported places; Ava's row stays.

## Verified

Shot from Storybook (`super-admin-screens--home`, two example reports added for the picture only). The patch (`proposal.patch`) was reverted.

## Needs a human

Nothing; the merge desk may overrule D-586.

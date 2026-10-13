# 2026-10-11 — Search fields heard once

**Branch:** `claude/pam-design-search-fields-once` · **Lane:** Dot, Design Systems Lead · **Decision:** none new (follow-up to the area picker fix, D-540)

## What changed

Mira asked me to check the other four `SearchField` screens for a placeholder that only repeats the label. Of the four, one is word for word the label: the New message sheet ("Search by name" twice). Its placeholder is gone (`NewMessagePicker.tsx`) and `messages.spec.ts` asserts the accessible name and no placeholder.

## Checked, and left

- Messages list: label "Search messages by name", placeholder "Search by name".
- Schedule: label "Search people, or a day or time", placeholder "Search people or times".
- Connect: label "Search programs", placeholder "Search by name or address" (adds words, a different thing).
Chromium exposes the name once whenever a label is present, whatever the placeholder says (probed with the accessibility tree), and the double label that read the name twice is already fixed in `SearchField`. The first two repeat the label in other words and are the only visible prompt in an otherwise empty pill, so I left them; whether a screen reader on a phone says them twice was not measured here.

## Verified

`messages.spec.ts` "New message" tests pass at narrow-320; web typecheck and build pass.

## Left undone

If the near-repeats should go too, the sighted prompt needs somewhere else to live (a visible hint under the field, as the area picker has).

## Needs a human

Nothing.

# 2026-10-10 — messages remove legacy

**Branch:** `claude/messages-remove-legacy` · **Lane:** Messages & notifications (Nico)

## What changed

- `app/messages/page.tsx` always renders `MessagesScreen`; the role branch is gone.
- `LegacyMessagesPage.tsx` deleted. `DummyRows.tsx` loses `DummyConversations` and the helpers only it used;
  `DummyRowsLazy.tsx` loses `DummyConversationsLazy`.
- `MessagesView.tsx`: "New message" is hidden while Reported is open (the old page did the same).
- `e2e/messages.spec.ts`: the reported-message guards moved to the segmented switch; the case-manager list
  tests read the new row ("Marcus, New …") and Home in the tab bar; the two example-person tests mock an empty
  conversation list so the examples stand in. None deleted.

## What was wrong, and what missed it

Nothing wrong. Two tests had quietly relied on the legacy page showing examples whatever the list request did.

## Decisions made

D-469.

## Verified

Typecheck, `pnpm build`, `e2e/messages.spec.ts` on narrow-320, dark-320 and iphone-se-viewport: 174 passed.

## Left undone

Nothing from this job.

## Needs a human

Nothing.

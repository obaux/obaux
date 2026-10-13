# 2026-10-11 — messages no examples

**Branch:** `claude/messages-no-examples-real-accounts` · **Lane:** Messages & notifications

## What changed

One gate for example data (`lib/examples.ts`, `useExamplesOn`): Storybook and demo accounts only. Messages, thread page, Reported, bell, Notifications, Interested, Connections, Profile count, place message links and example people now use it. The Messages tab hides when `messageable_people()` and `conversation_members` are both empty (`lib/useMessagingReach.ts`, shared cache, rechecked on navigation). Bell moves to a member's Home when the tab is hidden. D-511.

## What was wrong, and what missed it

`USE_DUMMY_PEOPLE` was a constant `true`, and each screen checked only it (plus `isFreshAccount`). Every e2e used a real-looking account and asserted the examples, so the tests held the bug in place.

## Decisions made

D-511.

## Verified

e2e on three projects; web unit tests; tsc; Storybook fit audit on touched stories. `failed-load.spec` fails in this sandbox because the Next patch (D-495) is not applied in node_modules here; unrelated.

## Left undone

Member Home still shows an example "Your next visit" (`ExploreScreen`, Trips lane). Other `USE_DUMMY_PEOPLE` users outside Messages (BookForMemberView etc.) are not moved to `examplesOn()`.

## Needs a human

Nothing new in English: every empty state uses existing strings.

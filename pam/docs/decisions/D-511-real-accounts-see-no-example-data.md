# D-511 — real accounts see no example data

**Date:** 2026-10-11 · **Branch:** `claude/messages-no-examples-real-accounts`

**Decided by Will, 11 October 2026**, from a screenshot of Messages on his own account: "Same here, I am seeing fake messages. And if no connections exist no need to show the tab."

## Decision

A real account sees only its real things: no example people, conversations, notifications, offers or connections. Examples live in Storybook and in the Sign in / About Pam preview, and on a demo account (`profiles.is_demo`, a super admin grants it).

The gate is one function, `examplesOn()` in `apps/web/src/lib/examples.ts` (hook: `useExamplesOn`). It is true only inside Storybook (`window.__pamRealFetch`) or for a demo account. `USE_DUMMY_PEOPLE` stays as the master switch; it no longer decides anything on its own.

The Messages tab is hidden for a member or provider who has no one to message (`messageable_people()` empty) and no conversations. It appears when there is someone, without a reload. Case managers and super admins keep it, because Reported is reviewed there. When the tab is hidden the bell moves to the member's Home header; Notifications stays reachable. `/messages/` with no one shows the existing empty state. An example thread URL on a real account says "not found".

"People who offered help" shows only for real offers.

## Why

Examples on a real account read as real people who are not there. The tab with nothing in it is a dead end.

## What a later session might reverse

Showing the tab to everyone once Pam has enough people that "no one to message" is rare. The gate stays either way.

# D-614 — Messaging looks again on a timer; Realtime is the road not taken

**Date:** 2026-10-18 · **Branch:** `claude/messages-pam-s0-s1a`

**Decided by:** the merge desk (Mira), 18 October 2026, 16:55 UTC, on Will's rule that messaging "works better than any other part of the app" (D-605): "A, the quiet refetch. It's the reliable one, and Will asked for reliability first. B (Realtime) only later, and only if 8 seconds turns out to be too slow."

## The problem

Iris's pass 1 (S1, a stop): no conversation updated while it was open. Pam's replies and the out-of-hours reply only appeared after leaving the thread and coming back. It was every conversation, not only Pam's: the app had no push and no refetch anywhere. The list, the tab bar's unread mark and the bell were each loaded once.

## What was built (A)

- **One shared ticker**, `lib/useLiveTick.ts`, for every reader of messaging. It runs only while the app is in front of the person and on the network. A hidden tab makes no requests. It asks again at once when the app comes back (visible, focus) and when the network does.
- **Back-off.** Every ask ends in `settle(true|false)`. After a failure the wait doubles (8, 16, 32, up to 60 seconds); after a success it is the short wait again. A reader that never settles counts as a failure after 20 seconds. No tight loop, and a failed background ask shows nothing: the next ask is the catch-up. A person's own actions still show their errors.
- **A thread** asks every 8 seconds for messages not older than the last one seen, by conversation and `created_at` only (the existing `messages_conversation_idx` serves it; no migration, nothing typed in a URL). New rows are merged by id, so a message sent here or already fetched is never shown twice. No loading flash. The existing scroll-to-bottom cue handles a reader who has scrolled up. The conversation is marked read only when something from the other person arrived.
- **The list and the tab bar's unread mark** every 20 seconds (`useConversations`); **the bell** every 30 seconds (`useNotifications`, so `HeaderBell` is untouched). The notifications screen opts out: its list stays as it opened.
- The ticker is exported for the Pam team's inbox (`/pam/messages/`) at 20 seconds.

## The road not taken (B): Supabase Realtime

Instant, but it needs a migration adding `messages` to the realtime publication, a websocket that must be kept alive on a phone that sleeps and changes networks, and a gap-fill after every reconnect anyway (a message that arrived while it was down). That is the same refetch plus a second mechanism that can fail without a sound. Will asked for reliability first, and a missed message with no sign of it is the worst failure here. Reverse this only if 8 seconds proves too slow in use; the ticker's `tick` is what a push would replace.

## What it costs

One small request per open thread every 8 seconds while it is visible, and one per list or bell every 20 or 30. Nothing in the background or offline.

**Proof:** `messages.spec.ts`: a reply that lands while the thread is open appears without leaving it and is not shown twice; a hidden tab makes no requests, and a failing connection backs off and says nothing; the Messages tab's unread mark comes on by itself. Each fails with the ticker off.

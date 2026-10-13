# D-549 — A member's Explore shows the bell only when there are notifications

**Date:** 2026-10-13 · **Branch:** `claude/messages-explore-bell-only-with-notifications`

**Decided by:** Will, 12 October 2026 (Control Room, 06:17): "Only show Notifications bell for members Explore page, when notifications exist, if no notification, please hide it, so all we see is the full search bar."

On a member's Explore (`/places/`) the bell is drawn only when the list it opens is non-empty. Other roles and other screens are unchanged.

- **"Exist"** means the real list is non-empty, read or unread. A member who has read everything still has the bell, without a dot; hiding it would take away the way to the history. With examples on (Storybook, demo accounts) it follows `/notifications/`: the example set for the role, none for a fresh account (D-361).
- **No flash:** the bell starts hidden and appears only when the list arrives non-empty (`HeaderBell`'s `hideWhenEmpty`). A failed load also shows nothing.
- **Coming back:** `useNotifications` loads when the screen mounts and does not poll or subscribe. A notification that arrives while Explore is open shows the bell the next time Explore is opened, the same as the dot lights today. Home's bell is the other way in.
- **Layout:** the area chip stays in the header; the search box was already its own full-width row, so nothing moves when the bell goes.

**Number:** first claimed as D-548, which Wren's About Pam decision (D-548) already holds; renumbered to D-549 at merge by the merge desk, 13 October.

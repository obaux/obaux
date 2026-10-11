# D-518 — A real account sees no examples on Profile, Points and Connections

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-real-accounts-no-examples`

**Decided by:** Will, via the merge desk (11 October 2026, 03:02 UTC), a launch rule from the Trips and Messages screenshots: a real account sees only its real things, never examples. Real ones stay; example ones show only in Storybook; where a list empties, a short empty state.

**What, in this lane (Profile, Points, Account).**
- **Points** (`app/points/page.tsx`): `DUMMY_EARNED_BADGES` (the example member's Scholar) was shown to every member. A real account now earns none beyond the ladder's own real levels, which come from its points; the "Newest badge" line goes with it.
- **Profile** (`ProfileScreen.tsx`): the Connections stat counted the example cast (3) for every member. A real account shows 0, as there is no real query yet for "the people on my side".
- **Connections** (`ConnectionsScreen.tsx`): it listed the example cast (Teresa, Sandra) for every member. A real account sees the screen's own empty state, "No connections yet / When a case manager or a program takes you on, they show up here." (existing strings).
- **Account** (`app/account/page.tsx`): nothing example in the page itself; it renders the Profile above, and a super admin's preview name stays.
- One rule, the one D-509 made in `lib/exampleMode.ts` (`showsExamples`): examples show for **a super admin previewing a role** ("See the app as"), for **a demo** (a tab that asked for them, `sessionStorage['pam.examples']`), and in **Storybook's prototype**. Each is an explicit mode, not an ordinary account. Everything else is real or empty. (I had written a second helper, `lib/examples.ts`, with an `isDemo` account rule; main gained D-509's first, so I dropped mine and use it.)
- Tests: `e2e/no-examples-profile.spec.ts` (a real member: no earned Scholar, Connections 0, empty Connections, axe; a demo tab and a super admin's preview still see them).

**Decision for Mira.** I read "show only in Storybook" as "never on a real account", and kept the two existing explicit demo modes (a super admin's preview, and an account in demo view), since they are what those features are for. If Will wants them gone too, it is one line in `showsExamples`.

**Not done here.** The global switch `USE_DUMMY_PEOPLE` in `@pam/config/dummy-flag` is still `true`: other lanes' screens (Places, Notifications, Directory, Messages, Explore) read it, and changing it is theirs. A real query for connections (and anything that awards badges) does not exist yet; the Connections stat is 0 until it does.

**What a later session might reverse.** Whether a demo account keeps its examples.

# 2026-09-16 — A bell worth trusting

**Phase:** 1 (member-facing) · **Sessions so far:** 12

One message, several asks at once (Will, 16 September):

1. Make the notification bell and the account icon filled icons, so they
   look consistent. Make both much larger. Don't make the alert button
   primary unless new alerts exist; if the user opens the notifications
   page, the bell returns to default. Notifications should be more
   descriptive — say the place name, or the person's name. Don't make
   alert items clickable; they're just logs, and there's no need to mark
   them read — that creates unnecessary tasks. Wrap the account icon in a
   light border.
2. "On the top of alerts, it seems like I can't view it from the view of
   different users. Let's make sure all pages are properly showing based
   on the user's permissions."
3. "No need to show text saying which user, since the top bar does the
   communicating" — quoting the redundant "Viewing as Program. This is
   what a Program sees..." card on Home as the example.

## What changed

**Icons and the bell.** `MeIconFilled` joins `MeIcon` in `@pam/ui`'s icon set
— the account button now draws the same solid-fill style `BellIcon` already
used, at 28px, matching the bell's own new size. `NotificationBell` is
`ghost` (bordered, like the account button) until `unreadCount > 0`, and only
then `primary` — reversing 14 September's "always filled" call. The account
button now carries a light `--color-border` frame.

**`NotificationList` is a log, not a form.** Every row used to be a ghost
`Button` with an `onSelect` that nothing in the app ever wired up — tappable,
and doing nothing — plus its own "Mark as read" button. Both are gone. Rows
are plain text; `isRead` survives only as a small "New" label with no
control on it. `useNotifications` traded its per-row `markRead(id)` for
`markAllSeen()` — one write, everything currently unread, fired once by the
notifications screen the moment its list is on screen, and never touching
the already-rendered list (so the "New" labels somebody is looking at don't
disappear under them).

**Notifications are descriptive.** New migration `0053` adds `place`
(`services.name`) to `service_flagged`'s `body_vars` and `name`
(`profiles.first_name` of the message's sender) to `message_reported`'s,
both looked up in the trigger that already routes the notification. "Someone
reported a place: closed" is now "Example Learning Center was reported: It
is closed." — and while in the file, fixed a real bug: `{reason}` had always
been interpolated as the raw database enum (`closed`), untranslated; it now
goes through `flag.reason.*` first.

**The bell is on every signed-in screen.** New shared `HeaderBell` component
(`apps/web/src/app/HeaderBell.tsx`) does the fetch-and-count that Home,
`admin` and `directory` each used to do by hand — and that Places, the place
screen, Saved and Points never did at all, so leaving Home lost the only
route back to a flagged place until you went home again.

**A super admin's role preview follows them off Home.** New
`useViewedRole(trueRole)` reads the same `useViewAs`/`sessionStorage`
mechanism Home already used and returns the previewed role when one is set.
`admin` and `directory` now gate their `isAdmin` / `isSuperAdmin` checks on
the *viewed* role, not the real one — so "Viewing as Program" and then
opening the case manager screen now shows what a program actually sees
(the closed door), where it silently reverted to the super admin's own
screen before. Nothing about which rows a query can reach changed; only
which arrangement of the screen — and which gate — a super admin's own
account is drawn behind.

**The redundant "Viewing as" card is gone.** Home carried a `Notice` under
the tiles repeating, in a full sentence, what the switcher's own chip
already says ("Viewing as Program"). Removed, along with the now-dead
`view.notice` locale key.

## What was wrong, and what missed it

**The bell's bug was general, and the symptom that surfaced it was
specific.** Will's report — "I can't view it from the view of different
users" — was about the bell not reflecting a role preview. The actual bug
was that *no* screen but Home asked `useViewAs` at all; the bell just
happened to be the thing on three of nine signed-in screens, so it was the
first place the disagreement between the header and the page became visible.
Fixing only the bell would have left the same bug live on every other role
gate. `useViewedRole` is deliberately generic and now used by both role-gated
screens in the app.

**Two existing e2e tests were quietly asserting the thing being removed.**
`directory.spec.ts` had `a super admin can look at the screen each role
gets` and `switching the view never changes whose data is asked for` —
written for the *original* role-switch feature, both checking for the exact
sentence this session was asked to delete. Removing the `Notice` broke them
immediately; a first full suite run caught it. Both now check the switcher's
own chip text ("Viewing as Case manager") instead, which is what actually
carries the information now.

**A background Playwright run was edited out from under itself.** Started
the full suite before finishing the e2e edits to `admin.spec.ts` and
`directory.spec.ts`; realized mid-run that spec files loaded by an
in-progress worker do not reflect edits made after the run started, killed
it, and re-ran clean once every edit was in. Worth remembering: don't start
the full suite until the specs it will read are done changing.

## Decisions

- **D-126** — the bell is filled only when there is something new; both
  header icons are filled and sized to match.
- **D-127** — a notification is a log line, not a task; `markAllSeen()`
  replaces per-row `markRead`.
- **D-128** — notifications say the place, or the person. Reads as a
  reversal of part of A7's reticence, but A7 never barred a name — only
  message text — and this puts a fact the recipient was already entitled to
  one screen earlier.
- **D-129** — a super admin's role preview now follows them off Home,
  via `useViewedRole`, applied to `admin` and `directory`.
- **D-130** — the redundant "Viewing as" sentence is removed; the
  switcher's own chip is the only place it is said now.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/db test` | All database checks passed (0053 applied) |
| `pnpm --filter @pam/ui test` | 65 passing |
| `pnpm --filter @pam/config test` | 211 passing |
| `pnpm -r typecheck` | clean |
| `node scripts/check-bundle-budget.mjs` | within budget, 0.9 kB to spare (up from 0.4) |
| Playwright, all three projects | 426 passing, 0 failing |
| `get_advisors` after 0053 | no new findings |
| Journey screenshots | regenerated; bell/account icon consistent across all four roles, light and dark |

## Left undone

- No unit test asserts the bell's *visual* variant (ghost vs. primary)
  directly — Astryx's variant styling is StyleX/CSS, not a DOM attribute a
  unit test can cheaply assert on. Covered instead by the accessible-name
  tests already in place, plus a visual check via the regenerated journey
  screenshots.
- `enrich-places` is still not written (deferred, unrelated to this session).
- Everything else `STATUS.md` already listed as left undone.

## Needs a human

- Nothing new. The Twilio question from the last session log is still
  Will's word, unverified here.

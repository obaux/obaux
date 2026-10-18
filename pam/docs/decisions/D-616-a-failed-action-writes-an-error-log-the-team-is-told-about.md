# D-616 — A failed action writes an error log the team is told about

**Date:** 2026-10-18 · **Branch:** `claude/messages-app-errors`

**Decided by:** Will, 18 October 2026, 21:14, to the merge desk: "...if something breaks, please create an error log so the team can be notified and fix the issue." It goes with his new pattern for a failed action (a small alert at the bottom of the screen, Dot's `useMalfunction()`).

## What

- **`public.app_errors`** holds one row per failure the app reports: when, the route (`area`), a stable key for the action (`alerts.switch.closed`), the code (an HTTP status, a Postgres code, `offline`), a short `detail` (200 characters at most), the build, the platform, the role the person was acting as, and the language. **No account id, phone, message text or place name**: no column holds one, and the route, key and code are held to a narrow alphabet by the table's own checks. The role is read from the person's sign-in inside the function, so a screen cannot claim one.
- **Inserts go only through `report_app_error()`**, a security definer function (`search_path = public, extensions`) callable signed in, signed out, and by an Edge Function through the service role. RLS is on and forced with a deny-all policy and no grants: nobody reads the table but the database. It never raises for a bad value (a report must not break the screen that sent it): it makes the value harmless first (the route loses its query; the key and code lose odd letters; the detail loses email addresses and runs of six or more digits and is cut at 200).
- **A switch, `app_errors_live`, starts `off`.** With it off the function writes nothing, not even a counter. It is turned on by the merge desk once Lena has read it for Privacy and, if Privacy needs a line, Will has signed it.
- **A rate limit:** ten reports a minute per caller (the account, else a one-way hash of the network address, counters kept an hour), sixty for the service role, and two hundred a minute overall.
- **The team is told once an hour per action.** The first time an action fails in an hour, every super admin gets one bell row (`app_error`, `notify.app_error`, `{action, count: 1}`); each further failure of that action in the hour raises the count and makes no new row. An hour later it is news again. Ava builds the list they open; the bell text `notify.app_error` needs Sage.
- **Thirty days, then a nightly sweep** (`sweep_app_errors()`, 04:20) removes the rows, the counters and the bell rows.

## Not decided here

- Whether Privacy needs a line (Lena reads it first). The switch is the guard: nothing is collected until it is on.
- The client (`lib/reportAppError.ts`), its offline queue, and `useMalfunction()` are built on top of this once b75 is on main; the Edge Functions' own reporting after that.

## What a later session might reverse

- The detail field is free text up to 200 characters. If it ever carries something it should not (the cleaning catches emails and long digit runs, not names), the answer is to take the field away, not to widen the cleaning.

**Proof:** DB test 85, each check shown to fail with its guard removed: the switch ("off: a signed-out report is not taken" fails), the rate limit ("one caller gets ten reports a minute" fails), the cleaning ("the detail lost the email address" fails). Anon and authenticated cannot read, write, or read the counters; the table has exactly the ten named columns, none of which is an account, phone, message or place; the notification once an hour with its count; the service role; the sweep.

# D-539 — Pam keeps a calendar of a member's visits in their Google account

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-google-sync` (stacked on the calendar link, `claude/places-programs-calendar-link`, because the Calendar page and the place's-name switch live there)

**Decided by:** Will, via the merge desk, 11 October 2026: "offer both link or full sync options" (the link is D-538); the merge desk's go on the sync only, 17:40 UTC: "Use only calendar.app.created. If it turns out to need more, stop and tell me." The finder ("find my appointments") stays a written plan until Will says yes to its Privacy line.

## What

A member connects Google Calendar once. Pam makes ONE secondary calendar, "Pam visits", in their account and keeps it in step: a visit planned, moved or cancelled in Pam is added, changed or removed within 15 minutes. Disconnect deletes the calendar, revokes the token and deletes Pam's record of it, all at once.

- **One permission.** `https://www.googleapis.com/auth/calendar.app.created`: Pam can see, create, change and delete only the secondary calendars it made itself, and their events. It cannot read the member's own calendars. If Google ever grants more (or less), Pam refuses it, revokes it and keeps nothing (`grantedOnlyOurScope`). I could not read Google's pages from the build container; the scope name and what it permits are from memory and **must be confirmed on Google's consent-screen page** when Will makes the project (before-launch item).
- **The token.** The refresh token is kept encrypted (AES-GCM, a fresh nonce each time) with `GOOGLE_TOKEN_KEY`, a function secret that is never in the database or the repository, in a table nobody but the service role can reach. The access token is never stored. Nothing is logged but a route and a status.
- **What goes in an event** is what the calendar link sends and nothing more: "Pam visit", the time, a link to the visits screen; with the member's switch, the program's name, address and a link to its page. One setting (`calendar_prefs.show_details`, off by default) now serves both the link and the sync; the link's own column stays unused until a later migration marked `-- contract:`. Never: a note, the member's name, the service a program sees, attendance, points, a reminder of its own.
- **Never retry forever.** A refused token breaks the connection at once (the member sees "Reconnect Google"); a calendar the member deleted in Google does the same; five failed runs in a row break it; a run does at most 100 writes per member and 50 members. A broken connection is left alone until the member reconnects.
- **Off means off.** `GOOGLE_SYNC_LIVE` unset: the app hides the section, the function touches neither Google nor the database, and the clock (`google_sync_kick`, every 15 minutes) does nothing, and calls nothing when no one is connected.

## Edge function to deploy

`google-calendar` (one function, JWT verification OFF: Google's redirect and the clock have no member login; the member's own calls are checked inside against their login). Secrets, names only: `GOOGLE_SYNC_LIVE`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_KEY`, `GOOGLE_STATE_SECRET`, `DISPATCH_SECRET` (the one the other clocks use). Steps for Will are in `docs/before-launch.md`.

## What Privacy must say (Will signs; Lena words it)

1. When a member connects, Google gets Pam's request to make a calendar called "Pam visits" and then the visits in it: by default "Pam visit" and the time; with the member's switch, the program's name and address too.
2. Pam can see and change only that calendar. It cannot read the member's other calendars.
3. Pam keeps a sealed key to that one calendar (not the member's password), and the key is deleted when they disconnect.
4. Disconnect deletes the calendar from Google and takes away Pam's access, at once.
5. Google's own policies apply to what Google holds; the member can also remove Pam under Google Account > Security > Third-party access.
Also true: the connection is stored as long as the member is connected; Pam keeps no copy of what is in the calendar except the id of each event it wrote.

## Not done / known

- When an account is erased, the token row goes with it (cascade) but the Google calendar stays and the token is not revoked. Erase should call Disconnect first (before-launch item).
- Not built, by decision: the finder ("find my appointments from places I've planned"): a read scope on the whole calendar, a sensitive scope needing Google's verification; the plan was sent to the merge desk.
- The event text is English whatever the member's language.

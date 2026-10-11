# D-538 — A member can follow their Pam visits in their own calendar app by a secret address

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-calendar-link`

**Decided by:** Will, 11 October 2026, via the merge desk: "We'd want to merge anyways so trips show up on their calendars" and "offer both link or full sync options". This is the link; Google sync is separate. The merge desk's three changes (11 October 16:11): discreet by default, no read time kept, two sentences said on the page.

## What

On Profile > Calendar a member makes a calendar address. A calendar app (Apple, Google, Outlook) follows it and shows their Pam visits, moved or removed when the visit is. Read-only: nothing in the calendar changes Pam.

- **A secret address.** 32 random bytes (43 characters, base64url). Pam stores only its SHA-256 (`calendar_feeds.token_hash`), so a copy of the database holds nobody's address. The address is shown once, when made; "Make a new link" is how to see one again, and the old one stops at once. "Turn it off" deletes the row.
- **Discreet by default.** A calendar is often seen by others (a shared phone, a work account, family). Each event says only "Pam visit", with its time and a link to the visits screen (no id in it). One switch, "Show the place's name and address in my calendar" (`show_details`, default off), adds the program's name, address and a link to its page. It changes without a new address. When it is off, the database function does not even return the name or address to the edge function.
- **No read time.** Pam does not record when someone's calendar app asked (no `last_read_at`). No rate limit either: the address is 256 bits.
- **The feed** is the `calendar-feed` edge function, public (deploy with JWT verification off): `GET /functions/v1/calendar-feed/<token>.ics`. It hashes the token and asks `calendar_feed_read`, which only the service role may call. Unknown, malformed and turned-off addresses all get the same bare 404. No CORS. Nothing logged but statuses.
- **Window:** 7 days back to 6 months ahead, not cancelled. Times in UTC. REFRESH-INTERVAL and X-PUBLISHED-TTL of 12 hours (Google follows its own schedule, up to a day; the page says so).
- **Never in it:** a note, the member's name, the service a program sees, attendance, points, a phone.

## The exact file

Discreet (default), one visit:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pam//Visits//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Pam visits
REFRESH-INTERVAL;VALUE=DURATION:PT12H
X-PUBLISHED-TTL:PT12H
BEGIN:VEVENT
UID:aaaaaaaa-0000-0000-0000-000000000001@joinpam.org
DTSTAMP:20261012T150000Z
DTSTART:20261014T140000Z
DTEND:20261014T153000Z
SUMMARY:Pam visit
URL:https://app.joinpam.org/trips/
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
```

With the switch on, the event instead has:

```
SUMMARY:Pam visit: Fresh Start Kitchen
LOCATION:1234 Market St\, Philadelphia
URL:https://app.joinpam.org/place/?id=4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a&from=trips&trip=aaaaaaaa-0000-0000-0000-000000000001
```

(Long lines are folded at 75 bytes, as the format requires.)

## What Privacy must say (Will signs; Lena words it)

1. The program's name, address and time of your visits go to the calendar app you paste the link into, which Pam does not know; by default the name and address are left out and each visit says only "Pam visit".
2. Anyone who has the link can read those visits: it is a secret address, not a private one. Make a new link and the old one stops.
3. Pam does not keep what your calendar shows, nor when it was last read.
4. Turning it off stops it at once, but your calendar app may keep copies it already has for a while.
Also true and worth a line: the address is in the request, so the gateway log (1 day on the Free plan) and the calendar provider's servers hold it, with the caller's IP address.

## Not done

The event text is English whatever the member's language (the function does not know it). A calendar sync that proves attendance is not this: a link only shows what Pam planned.

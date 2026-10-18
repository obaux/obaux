# D-604 — a98 plan C: the calendar link is shown again from a key; the event names the place and address; one visit is added from the phone (supersedes D-538's hash-only default)

**Date:** 2026-10-18 · **Branch:** `claude/places-programs-calendar-plan-c`

## Decided

Will, 18 October, approved plan C (Dot's CalendarPlan stories; Mira's three answers, 00:38 and 00:45):

1. **The link is shown again.** A link's address is a random lookup id (made fresh with every new link, never the member's id: Apple, Google and Microsoft see it in every request) and the HMAC-SHA256 of "lookup id:version" under a key in Supabase Vault, made in the database. Pam stores the lookup id and a version number, never the address or a hash of it, and works the address out when the member opens the Calendar screen. A copy of the database without the key cannot make a working link.
2. **A new link** takes the next number from a sequence, so the old address stops at once and no address ever comes back to life, even after Disconnect and a new link. **Disconnect** deletes the row.
3. **Every event names the place** (SUMMARY: its name, LOCATION: its address) with UID, DTSTART, DTEND and TRANSP, and nothing else: no URL, no DESCRIPTION, no "Pam visit". The details switch is gone. The calendar's name is "Visits" in the member's saved language, read when the feed is fetched (`profiles.preferred_language`, one join); legacy links keep "Pam visits".
4. **The row says which calendar** the member chose (apple, google, outlook, other) and the day they linked it, in their own time zone. It is the member's own word: Pam cannot know that a calendar fetched the feed, so the screen says "Set up on {date}", not "Linked".
5. **One visit** from the booked screen is added on the phone: Apple and Outlook get an `.ics` made in the browser by the same module as the feed, Google gets a `calendar.google.com/calendar/render?action=TEMPLATE` link. No Pam server, no request, nothing stored.

## Why

D-538 kept a hash so that a leaked database could not hand out working links, at the price that a member who came back could never see their link again and the details were off by default. Will wanted both fixed ("it's obviously a yes"). The key in Vault keeps the first property: the table alone makes no link.

## Shape

A new table `calendar_links(member_id, lookup_id, version, calendar, linked_on)` beside an untouched `calendar_feeds`: relaxing `token_hash not null` would be a DROP. Legacy hash-only links keep answering as before ("Pam visit" and the time) until their owner makes a new link, which deletes the legacy row. The old functions stay defined and nothing calls them. Tokens: legacy 43 characters, new 65; the edge function tells them apart by length and never sees the key.

## Tests

DB test 78 (key secrecy, who can make or read a link, shape, that the address is not on any row nor names the account, new-stops-old, never-revive, disconnect, legacy). `packages/config/test/calendar-feed.test.ts` pins the link event's exact lines and the one-visit file equal to the feed's event. `calendar-link.spec.ts` and `add-visit-to-calendar.spec.ts`.

## Not shipped until Will signs

The three Privacy lines (p12, the one-visit line, p6). The migration is applied by the merge desk after `list_migrations`; the `calendar-feed` function is redeployed with the changed `ics.ts` and `handler.ts`. Without a Vault, `calendar_link_key()` raises `NO_CALENDAR_KEY`.

## What a later session might reverse

Remove `calendar_feeds`, `calendar_link_set_details` and the legacy branch of the feed once no legacy row is left. The translated calendar names live in `LINK_CALENDAR_NAMES` (`ics.ts`), English until Lena translates.

# 2026-10-13 — street search through Google

**Branch:** `claude/places-programs-street-search` · **Lane:** Places & programs (Piper)

## What changed

- `supabase/functions/places-search` (D-552): Google Places (New) from Pam's server, signed-in only, off until `GOOGLE_MAPS_SERVER_KEY` exists.
- The area search asks it for an address, a corner, or what Pam's own list has no match for; rows come below Pam's with a "powered by Google" mark.
- Tests: `places-search.test.ts` (the function, fake Google), `streetSearch.test.ts` (when Google is asked), `street-search.spec.ts` (e2e, the function mocked).
- Host guard: `places.googleapis.com` and `places-search` entered as pending the card (Lena's line).

## What was wrong, and what missed it

Nothing was wrong; the City-file plan was replaced (Will, 12 October) because Google finds corners and places by name.

## Decisions made

D-552 (with the cost reading and Google's terms).

## Verified

See the READY message.

## Left undone

The key (Will), the Privacy line (Lena, Sage, Will), Google's own mark (Dot), the field hint wording (Sage).

## Needs a human

Will: make the key, restrict it to the Places API (New), set a daily quota, enter `GOOGLE_MAPS_SERVER_KEY`, deploy `places-search` with JWT verification on. Check Google's live price list.

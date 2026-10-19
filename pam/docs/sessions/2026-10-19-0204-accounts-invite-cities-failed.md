# 2026-10-19 — accounts invite cities failed

**Branch:** `claude/pam-invite-city-failed` · **Lane:** Accounts & invites

## What changed

- A super admin's New invite reads the cities with `loadRegions()`, which throws on failure. `listRegions()` is now its quiet
  wrapper, kept for Staff request review, which doesn't change here.
- If the cities couldn't be read (or haven't come in yet, or there are none), Create link reads them again first:
  - **Two or more:** the city card appears with "Pick a city first."
  - **One:** it's used and the invite is sent.
  - **Still none:** the bottom alert shows, logged as `invite.create`, and nothing is sent. The form keeps what was typed.

## What was wrong, and what missed it

Iris's D-618 table: when `listRegions()` failed it returned `[]`, so no city card was drawn. Create link then set `needsCity`,
whose line lives inside that card, so the tap did nothing anyone could see. A tap before the first read came back did the
same. No test failed the city read.

## Decisions made

None that need a file. A list that can't be read is Pam failing, so it uses the D-616 bottom alert and its signed words.

## Verified

- `invite.spec`: two new tests (cities that never load; cities that fail once, then load on Create link). Both fail on main
  6773c9c4, 6 of 6, and pass now. With admin and staff-request-approve: 108 passed. tsc is clean.
- Picture: `docs/design/review/2026-10-19-invite-cities/cities-failed-390-en.png`.

## Left undone

- Staff request review's approve also needs a city, and it still uses the quiet `listRegions()`. That's worth the same look
  when its "gone"/"decided" job is done.

## Needs a human

Nothing.

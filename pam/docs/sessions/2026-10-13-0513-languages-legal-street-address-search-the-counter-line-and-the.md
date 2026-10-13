# 2026-10-13 — languages-legal street-address search, the counter line and the pins

**Branches:** `claude/lena-street-search-guard` (live in b26), `claude/lena-street-search-line` (p7, this one), `claude/lena-street-search-pins`, `claude/lena-privacy-counter` (held), `claude/lena-counter-pins` · **Lane:** Languages & legal (Lena)

## What changed

- **Street-address search (Piper a74, D-552).** The host guard names `places.googleapis.com` and `places-search` (arriving a74); `test/street-search-line.test.ts` reads a function's source and holds it to the four things Privacy promises (typed words in a POST body, no log of them, only the listed headers and host and nothing about the member, nothing stored), tried on a right sample and thirteen wrong ones, and on Piper's real `places-search` once it was pushed (she adapted it to read `handler.ts` too and to accept the auth check). I tightened it to inspect every `fetch` but the member's own sign-in check, and added a source pin that a Google pick is kept nowhere on the phone (`saveOrigin`, `loadOrigin`, no storage in the street-search code, nothing else touches `pam.origin`). `privacy.s.sharing.p7` is Sage's six sentences, signed by Will 13 October 05:02 (card a81), in seven languages; the English is checked equal to the ledger. `docs/before-launch.md`: no `GOOGLE_MAPS_SERVER_KEY` until p7 is live in seven languages; the Google Maps Platform terms are unread.
- **The counter line (a76, D-555).** `privacy.s.what-we-keep.p13`, signed by Will 13 October 04:24 UTC, translated, held on `claude/lena-privacy-counter` until Nico's counter merges. DB test 71 and `screen-opens-counter.test.ts` (on top of Nico's branch) hold the counter to its line from both ends.
- **Two street strings for Piper** (`places.areaHint.street`, `places.areaLabel.street`): six translations each.
- **The "Last updated" date** (`claude/lena-legal-date`, in b26): the fingerprint moves when p7 and p13 ship, so `legal:date privacy 2026-10-13` was re-run here.

## What was wrong, and what missed it

- **The first Privacy sentence for the street search would have been false.** `saveOrigin` kept any picked area on the phone (label and coordinates), so a typed home address would have stayed there; "Pam does not keep what you type" was only true of the servers. Found by reading the code against the draft, before it went to Will; Mira decided a Google pick is for that search only (option A), Piper built it, and the source pin now holds it.
- **My first host-guard test skipped any fetch that did not name Google in its call text**, so a Google call through a variable address could hide; now every fetch but the sign-in check is inspected (a wrong sample proves it).
- **A comment in `saveOrigin` said a Google pick is "not sent to Pam's server"**; the point is sent to Pam for the search itself (an rpc body, not logged, not kept), like "near you". Told to Piper; the promise is "not kept".
- **An Arabic sentence read "Pam Google"** (two Latin names side by side as one name); restored the word for "company" between them.
- **The date mechanism worked as designed when it was first tripped:** adding p7 and p13 turned `legal-updated.test.ts` red until the date was re-pinned.

## Decisions made

None new here (D-552 is Piper's; D-555 is Nico's).

## Verified

Config on this branch: 48 files, 1251 passed, 2 skipped; `copy:status` in step; the Privacy page fits at 320px in seven languages (audited when p7 was written; the text is unchanged). DB test 71: whole suite green, four mutations of Nico's migration red. Not verified: the function against Google (it is off without a key; nothing has been sent to Google by anyone).

## Left undone

- The key (Will, only after p7 is live in seven languages) and the Google Maps Platform terms read.
- The counter line waits for the counter to merge; then `legal:date privacy <day>` once more.
- The Google Calendar lines (a71) wait for Will; they renumber to `sharing.p8` and `what-we-keep.p14`.
- Native readers for every translation.

## Needs a human

Will: the Google key when p7 is live; the Maps terms read; native readers.

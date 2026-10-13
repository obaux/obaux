# 2026-10-11 — languages-legal privacy lines, calendar strings, fit audit

**Branch:** `claude/lena-fit-triage` · **Lane:** Languages & legal (Lena)

## What changed

Privacy and transparency lines, each held on its own branch for Will's signature (Sage signs the English under A29, then
Will for anything in Privacy; the six translations follow his word, never before):

- **a63, a program sees a visit** (`claude/lena-program-visits-contract`): `privacy.s.sharing.p2` says "whether you were marked as there";
  the contract gains `who_marked_a_visit_or_how` in what admins cannot see. Mira reversed twice that afternoon (first "marked it
  yourself", then back); the final is the first wording. `program-visits-contract.test.ts` pins it.
- **a66, "I'm here" and location** (`claude/lena-im-here-privacy`): `what-we-keep.p9`/`p10` say the phone's location is not kept
  ("the location your phone sends"), after Piper's log check showed the gateway keeps the IP address and time.
- **a67, what the servers write down and who else gets it** (`claude/lena-request-log-line`): `what-we-keep.p11` (the request log, deleted
  within a week) and `sharing.p5` (the Trips map is Google's). Tests: `request-log-line`, `google-map-line`, `no-typed-text-in-urls`.
- **a68, the calendar link** (`claude/lena-calendar-privacy`): `sharing.p6`, `what-we-keep.p12`; `calendar-link-line.test.ts` checks the code once D-538 is on main.
- **Host guard** (`third-party-hosts.test.ts`, merged in b18): every outside host the app, the shared UI, the config and the website name;
  a host the page loads must be named in Privacy; the Maps script is the only Google load.
- **Picker strings** (b18): "ZIP code", "Like 19107.", "Pam remembers the area you pick on this phone only." in seven languages.
- **Calendar link screen** (`claude/lena-calendar-strings`, `claude/lena-calendar-google-lines`, on Piper's D-538 branch): all 29 `calendar.*` strings in six languages.
- **This branch:** `audit:fit` now passes `--known scripts/fit-known.json`, as CI does.

## What was wrong, and what missed it

- **The audit's "13 findings on main" were never findings.** The full seven-language run on clean main (b770551) exits 0 with `--known`:
  13 new-in-a-language findings, all in `fit-known.json` with reasons (the Trips drawer fade, file names in the Shared things stories, the folded
  week on Home, the long-address chip story). `pnpm audit:fit` had no `--known`, so locally it exited 1 on a clean main while CI (which passes it)
  stayed green. Fixed in `package.json`; `docs/copy-changes.md` says so. Nothing needed shortening.
- **Two lines I (or Sage) had written were false for the phone, and only reading the code showed it.** `places.area.hereNote` ("Used for this
  search only.") and p10: the area picker saved the GPS pick in localStorage and reused it as "your location". I had checked the server, not the
  phone. Piper's `saveOrigin` now skips the "here" pick; `im-here-location.test.ts` fails unless it stays that way.
- **The picker's new words promised neighborhoods the `areas` table does not have** (46 ZIPs and City Hall): "Fishtown" found nothing. Caught by
  querying the live table, not by any test. The words are "ZIP code" until neighborhoods are seeded.
- **Privacy said nothing about three flows**: the request log (Piper's check), the street-address lookup to the City (removed, D-536), and the Google
  map in Trips (fitted to the member's trips, so Google could tell roughly where they were going; now opens on the whole city). Nothing tested what
  the app sends to hosts other than Pam's; the host guard now does.
- **Sage's "but not where your trips are" was untrue** (the map was fitted to the pins); `google-map-line.test.ts` now fails if it is fitted again.

## Decisions made

None of my own. D-536 (Mira, on my finding), D-538 (Piper's calendar link) and A29 (Sage signs new sentences) govern these.

## Verified

Config tests on each held branch: red only on the missing-translation checks of its own lines (a66 14, a67 14, a68 14, a63 2). The other tests are green, including
the code checks against Piper's calendar migration and handler. Full seven-language fit audit on clean main b770551: exit 0, 570 stories, 13 accepted
findings. Picker e2e (area-picker, focus-text-boxes): 48 passed on the three phones. Calendar screen at 320px: see Left undone.

## Left undone

- The six translations of a63, a66, a67 and a68, when Will signs (merge order: a66, a67, a68; a63 after Piper's `trips.booked.hasLead`/`place.lead.sees` say "you were marked").
- Calendar link screen at 320px in ru/ar/zh: the run was started on Piper's branch and its result is not in this log.
- A native reader for everything translated this week, and for the Google Calendar / Outlook / "Desktop site" names (`docs/before-launch.md`).
- Twilio's retention (Nico); the retention figure in p11/p12 must change before the Supabase plan goes to Team.

## Needs a human

Will's signatures: a63, a66, a67, a68. Vercel's plan and log retention (Settings › Billing) to confirm "within a week" for the website.

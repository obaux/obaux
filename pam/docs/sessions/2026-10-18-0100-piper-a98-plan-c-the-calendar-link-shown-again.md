# Piper, 18 October: a98 plan C

**Built:** D-604. Migration `20261018003713` (new `calendar_links` table, Vault key, issue/state/off/feed-read functions, no DROP), DB test 78, the feed's versioned-link event and the one-visit builder in `supabase/functions/calendar-feed/ics.ts`, the Calendar screen and the booked screen's "Add to calendar" sheet, specs `calendar-link` and `add-visit-to-calendar`, Sage's signed words (ledger ef40b2fb, 9190aac3).

**Decided along the way (Mira, 00:38 and 00:45):** the address carries a random lookup id, not the account id; the calendar's name is "Visits" translated by the member's saved language read at fetch time (one join to `profiles`).

**Proof:** all 11 new assertions fail on main's screens; they pass on the branch on three projects. DB checks pass; config tests pass.

**Left:** Dot's booked-card button redraw (mine overlaps a long place name at 320), Lena's translations, Will's signature on the three Privacy lines, applying the migration and redeploying the function. Retire after: `calendar.once`, `calendar.lostLink`, `calendar.details`, `calendar.details.hint`, and `calendar.slow`/`calendar.secret`/`calendar.new.*` if unused.

**Update, 18 October ~02:00:** Will signed the three Privacy lines at 01:46 (p12, one visit, p6; card a98). Mira merged main (6cc00c76) and Dot's calendar-redesign branch (a97 drawer, PamSheet, VisitCard `action` and `actionOwnRow`) into the branch. The booked card's "Add to calendar" now goes through `VisitCard`'s `action` slot, with `actionOwnRow` when the place name and label are long (`ownRowFor` in `AddVisitToCalendar.tsx`); spec: the longest example place name at 320 in English and Arabic. The Arabic label is still an English stand-in until Lena translates. The request log promise (p12) is written in the feed handler's header comment. Waiting for Sage's words and Dot's drawing for the card's quieter "synced" state (a member who already has a link: SyncIcon, opens the Calendar screen); `AddVisitToCalendar` is where it goes.

**Also from this lane, no log of its own:** the Sunday example-schedule fix (`4785216f`, in b64): a Sunday with no example times emptied the example schedule and broke the visit-row taps; the test puts the old formula back and fails 3 on assertions.

# 2026-10-17 — languages-legal: the seven Book a visit refusals in six languages

**Branch:** `claude/lena-refused-words` (stacked on Piper's `claude/places-programs-book-list` @ `d2f08672`) · **Lane:** Languages & legal (Lena) · written Saturday 17 October, about 17:45 UTC, after b58. Read `2026-10-17-1557-languages-legal-a94-words-the-a93-chip-key-and-the-trips-fit.md` first.

## What changed

- **Sage's seven lines (ledger `33175aed`, 17:30) are in es, pt-BR, zh-CN, zh-HK, ru and ar** (`db15a63a`): `trips.new.refused.member`, `.already`, `.limit`, `.past`, `.far`, `.place`, `.service`. They sit under the existing "We could not save that" and are read by a program lead, so the register is staff: *usted* in Spanish, *você*, 您, *вы*. Piper's English stand-ins in the six bundles are replaced; `copy:ack` records them; `copy:status` is in step.
  - **`.member` gives no reason in any language** (Sage; Mira). It says only that Pam cannot book for that person right now, with `{name}` and nothing else.
  - **`.limit` keeps Sage's "for this member or for your program"** and does not say which one was hit (3 a day for the member, 30 for the program); the translations use "or" (es *o*, ru *или*, zh 或), not "neither ... nor".
  - **Russian puts `{name}` and `{place}` in the nominative**, after a colon or inside «», as the other `{name}` lines do ("Pam сейчас не может записать на визит: {name}."), so no name has to be declined.
  - zh-CN says 预约 for a visit and zh-HK 到訪 (預約 for the booking), as `book.title` does; ru says *визит*, *записать*; ar says *زيارة*, *حجز*.
- **A pin, `test/booking-refusals.test.ts` (11 tests, `e95373df`):** the seven lines exist in the seven languages with exactly their placeholders and are not the English stand-ins; the member line has `{name}` only and no word about a block, an account or a link; `book_visit_for_member` raises `MEMBER_NOT_LINKED` both when the member is not linked to the program and when either side has blocked the other (one answer for both, so a lead cannot learn who has an account or who blocked whom); the function raises no code that has no line and is not a known staff-side one (so a new code needs somebody to choose its words); the app turns each of the seven codes into its line and the staff-side ones (`NOT_A_PROGRAM_LEAD`, `ACCOUNT_NOT_ACTIVE`) into none. Mutation-tested: an English stand-in left in es, and an es member line that names a block, fail three tests.
- **Records:** the native-reader entry in `docs/before-launch.md`, the lane paragraph in `STATUS.md`, this log.

## What was wrong, and what missed it

- Nothing found in Piper's wiring. The one thing I checked that could have leaked a cause: `book_visit_for_member` raises `MEMBER_NOT_LINKED` for "not linked" and for "blocked" both, and its other member-side checks (the 3 a day and the double booking) come after the link check, so they cannot be used to find out who is linked. The pin holds that.
- The lesson from this morning, applied: before the READY I grepped `apps/web/e2e` and `apps/web/src` for the seven English lines (only `program-books-for-member.spec.ts` asserts them, in English, and the English did not change) and ran every spec that books a visit on narrow-320, dark-320 and iphone-se-viewport.

## Decisions made

- The refusal lines are staff register, so Spanish is *usted* (the member's screens are *tú*); Russian *вы* throughout.
- The member line is a pin, not only a wording: if the function ever raises a code of its own for a member-side cause, the test fails until somebody decides what the lead may be told.

## Verified

- `db15a63a`, `e95373df`: config tests pass (1375, plus the new 11); `copy:status` in step; tsc was clean on Piper's tip and I changed no code.
- Storybook built at `db15a63a` (stub env). Fit audit, 7 languages: **Program lead / Booking refused / AllSeven** (seven banners, the long Free Library name on the place line) at 320×760 and 320×568: **0 findings**. **Book for member** (14 stories) at both heights: 0 new; the 2 English ellipses that were already there. I looked at ru and ar at 320 as well: nothing clipped, the Latin place name inside the Arabic line wraps cleanly.
- e2e on narrow-320, dark-320, iphone-se-viewport: `program-books-for-member`, `book-for-member-real`, `program-book-example`, `no-examples-for-real-accounts`: **72 passed, 0 failed**.

## Left undone

- **Native readers** for the seven lines in six languages (`docs/before-launch.md`).
- **a91** `place.lead.sees` and `place.noLead` (Sage's `1f8e4d46` words) after Will signs, with the Arabic "Pam" fix (name in «»).
- **Retire sweep:** `join.waitingDone.yes` (after Ava removes the tick) and `person.savedPlaces.*`.
- **Held:** the Google calendar line (`sharing.p10`), the a84 lines, the a86 `p7` wording.
- Not mine, noticed: `packages/ui/src/NextTripCard.tsx:32` ("Booked for you by {program}") and `apps/web/src/app/reminders/page.tsx:18` ("the things you plan") still carry comments with the old a94 English. Wren's `TextsFromPam.tsx` was fixed in b59 ("A reminder before each visit").

## Needs a human

- A native reader per language. Will: a91, a84, the a86 `p7` wording, the Google calendar card, a93.

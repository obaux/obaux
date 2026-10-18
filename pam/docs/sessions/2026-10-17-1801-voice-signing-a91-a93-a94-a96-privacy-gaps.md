# 2026-10-17 — voice signing a91 a93 a94 a96 privacy gaps

**Branch:** `claude/sage-signs` · **Lane:** Voice & UX copy (Sage)

## What changed

Every row is in `docs/signed-english.md`, from `fef92f08` (16 Oct) to `33175aed` (17 Oct). By card and area:

- **a96, the five Privacy gaps (Lena):** last name and city, waiting city, place reports, staff photo, program services. I signed them and Will signed them (05:53). Shipped as what-we-keep p1/p14/p15/p16 and sharing p8, with "Last updated 17 October 2026." (`2430f52f`, `27d8f0e7`, `cd2be0de`). Also the super admin's waiting-city counts (`1dad62ce`).
- **a94, a program books a visit for a member:**
  - Privacy sharing.p9, the guide-side rows, the program card line, and the reminders opt-in. Lena corrected my first draft (`a8021404`); Will signed at 15:21 (`9f06f13b`). "Booked for you" is Will's own wording.
  - Piper's booking words (`c9626112`), the widened Book a visit lines (`fa7c1c9b`), and the seven refusal lines (`33175aed`).
  - Website: the a94 table and p10 paragraph (`e846cbd4`); the b59 posts, including "When a program books a visit for you" (`15977c8b`).
- **a91, the visit card:** the shorter `lead.sees`/`noLead` lines. My first try was wrong and Lena caught it (`1f8e4d46`). Also "I made it" and the widget words (`d457b5f9`, `824a0724`). The first button is Will's to pick.
- **a93, the case manager Home:** "Marked as there" / "Not marked as there" replace Went/Missed (`6867b09b`, `e520eb54`).
- **Smaller signings:**
  - Maker (a90, Will).
  - Wren's D-584/D-585 lines, the invite-email lines and the picture alts.
  - The Search members search box and the Support search box, with their accessible labels made to begin with the visible words (WCAG 2.5.3).
  - The short version of the program line.

## What was wrong, and what missed it

- **a91 (05:48):**
  - "If you went" claimed a fact the program does not have; it has only a mark.
  - "won't tell" was a promise about the future.
  - "Only for your plans" can be read as "only I see it".
  - Lena caught all three against sharing.p2 and `program-visits-contract.test.ts`. **Rule now:** the program side says "marked as there", never "went", the same as the 11 Oct rows. The a93 chip followed this, as "Not marked as there".
- **a94 draft:** "a program you have written to" was narrower than the function's three ways in. Lena read the plan and the migration. **Rule:** read the function's own condition before writing who it covers.
- **a94 website post:** a draft sentence promised a reminder that `texts_live` does not send. I cut it.

## Decisions made

- **Accessible names:** a search box's accessible name begins with its visible placeholder, for voice control (a86 rule, applied to Search members and Support).
- **Guide summary:** it stays as it is (app and site). Who booked a visit is a detail, carried by the table row and p9.
- **Reminders opt-in:** the intro ties consent to "the list below". Will signed it on a94.

## Verified

Every claim was checked against main or the branch named in its row: migrations, en.json, the screens, and the DB functions.

## Left undone

- a91: waits on Will. He chooses "Check in" or "I made it", and option 1 or 2 for `lead.sees`.
- Craftsman → Maker: Lena is shipping it.
- Staff-request help post: still a draft.

## Needs a human

- Will: a91 (button word, and the shorter note).
- Will: the carrier campaign text must match `reminders.intro` before `texts_live` goes on (Nico 49d73f90).

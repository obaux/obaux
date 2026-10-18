# Languages & Legal · the Message Pam lines in six languages (18 October 2026, ~15:00 UTC)

Lena, on `claude/lena-message-pam-lines`, off main `1551ed31` (b69), with the held limited-notice branch (`claude/lena-limited-notice`) merged in. Will signed card a101 at 14:44, with one change in his words: "no need to mention photos in there… That should just be a hidden feature (from legal) to allow people to submit screenshots." Sage's ledger fa8df003.

## What changed

- **The lines, in English and the six languages** (Privacy and Terms in the formal register: usted, você, 您, вы; the transparency screen in the member's: tú, você, 您, вы):
  - L1 `privacy.s.what-we-keep.p17` (new): "If you write to Pam in the app, or Pam writes to you, we keep what you both write. Only the Pam team reads this conversation. Your guide and your programs don't see it. We keep it while you use Pam, and if you ask us to delete your account, we delete the whole conversation with it." No photos.
  - L2 `privacy.s.contact.p3` (new): "The Pam team can start a conversation with you, as Pam. You will see it in Messages, and only the Pam team can read it."
  - L3 `privacy.s.limits.p2` and `terms.s.limits.p2`: a limited account can read messages and write to Pam, and cannot send other messages. The app's notice (`notice.account_limited.body`, Sage's A29 sign-off b658ac15) comes from the held branch.
  - L4 `transparency.pam.heading` "The Pam team can see:", `transparency.pam.messages` "What you and Pam write to each other. Your guide and your programs cannot see it.", `transparency.summary.pam` "Only the Pam team can see what you and Pam write to each other." (Sage's choice between "cannot see it" and "cannot see any of it", now there is no list, is "it" in the file until she says; one word in six languages if it changes.)
  - No notice in the app, no pinned line above the composer, no Profile switch: Will's "Keep the UI clean" and the a94 precedent (D-595).
- **`legal.ts`:** what-we-keep 16 to 17, contact 2 to 3. **`legal:date all 2026-10-18`** (Privacy was 17 October, the Terms 11 October). The day is the day the lines are *merged*; it moves with the ship (`legal:date all <day>`, then `copy:ack`) in the batch that turns `pam_messaging_live` on, never after it.
- **The transparency contract** (`TRANSPARENCY_SCREEN`): `pamHeadingKey`, `pamHeading`, `pam` (one line) and `transparency.summary.pam` in `TRANSPARENCY_I18N_KEYS`, so the completeness tests walk them and a missing translation fails CI. The screen does not draw the card yet (`TransparencyReading.tsx` is not touched): it is drawn from Dot's pictures on a101, by whoever builds it; `PAM_TEAM_CAN_READ` is the list behind it.
- **The privacy guard:** a new entry `pam-conversation` (what a person writes to Pam, what Pam writes back, the photos in it), covered by `what-we-keep.p17`, `what-we-keep.p3` and `how-long.p1`, with "photos and documents" in its `says` and no photo wording of its own; `ThreadView.tsx` collects it beside `messages`.
- **Tests:** `message-pam-line.test.ts` (new): L1 to L4 word for word in English, both directions and only the Pam team in L1 and L4, no photos in the lines, the Privacy page's paragraph counts, the Pam card is its own card and in no guide list, every other language has every line and says Pam where the English does; two `it.todo` for Nico's migration-4 policy pins and the erasure. `pam-team-can-read.test.ts`: the lines are told on the Privacy page and the transparency screen. `copy.test.ts`: the transparency English source equals `en.json` for the Pam card too.

## Verified

`copy:status` in step after `copy:ack`; `@pam/config`: 62 files, 1,422 tests pass, 2 todo. See below for the build, the e2e and the fit audit.

## Left undone

- **The seven-places L3 test** is on its own commit and is **red until Wren's three website posts** (`StartHere`, `CaseManagerAssignments`, `PamWords`) **are in the tree**: it reads the posts, the notice and the two policy lines and fails if any still says a limited account cannot send without Pam. Take it with the batch, or leave that commit out until the posts land.
- **Plan C and this branch both move `legal-updated.json` and the ledger:** whichever merges second re-runs `legal:date all <day>` and `copy:ack`.
- Native readers: `docs/before-launch.md`, new entry at the top of Open.
- `docs/signed-english.md` is Sage's.

## Needs a human

Sage: "cannot see it" or "cannot see any of it" on the card line (one word). The ship day, for the two dates.

# 2026-10-18 — accounts message-pam iris passes

**Branch:** `claude/pam-message-pam-admin` · **Lane:** Accounts & invites (Ava)

Follows `2026-10-18-1653-accounts-message-pam-s2-s4.md`. Mira (16:49 to 18:54) folded everything after S2–S4 into one READY:
Dot's three, Iris pass 1 (W5, W6, P4–P7), Iris pass 2 (T1–T6), the words through Sage and Lena, the start-error stories,
main merged.

## What changed

- **Dot's review:**
  - The inbox preview's body is its own `dir="auto"` element, cut at its own end. In Arabic "أنت:" comes first and the
    English keeps its order.
  - The reply-time line is cut, with its keys removed from all seven languages and the ledger.
  - Back only, with no Help, on Messages to Pam, Closed, and Pam's hours.
- **Iris pass 1:**
  - W5: the team's ⋯ is `/pam/thread/options/`.
  - W6: Pam's automatic messages carry author Pam in the team's view. This uses Nico's `author` prop and his `toMessage` fix.
  - P4: with the switch off, the team reads "Message Pam is off."
  - P5: the inbox error has Try again.
  - P6: `from=pam` goes back to the inbox. This is two lines in Nico's `thread/page.tsx`, and he cleared it.
  - P7: photos only, with "Reply as Pam" and "Write as Pam", using Nico's `placeholder` and `attachments` props.
- **Iris pass 2:**
  - T1 and T6: a failed first message stays as Not sent, with Try again, under the error card.
  - T2: a saved reply is inserted at the cursor once the sheet has closed.
  - T3: no "as Pam" button on a super admin. NOT_ALLOWED and PAM_OFF show one calm line in place of the conversation; Mira
    accepted this at 18:05.
  - T4: the preview is hidden while the hours are invalid.
  - T5: the typed time field at size lg, with the clock as a picture.
- **Messages to Pam looks again every 20 seconds** with Nico's `useLiveTick` (D-614). A background look that fails leaves the
  list on screen.
- **Stories:** `pam-start-person-failed`, `-not-allowed`, `-off` and `pam-start-program-failed`. Each one sends in its
  `play` function, so the state can be seen in any language. The mock option is `pamStartFails`.
- **Words:**
  - Sage signed them at 61ddd4fb and a93a69fe, with four D-608 cuts.
  - Lena translated them at 959a0df1, 37b2f8ce, 32f90fe2 and 05d04a72.
- **Merges:** main 615e1078 (b72) and bc96890b (b73).
- **Proofs:** `docs/design/review/2026-10-18-pam-team/old-code-proof-647dd0d3.txt` and `old-code-proof-1b67f588.txt`.

## What was wrong, and what missed it

- **The T2 cursor.** I sent Nico a wrong finding. The cause was mine: `insertDraft` was called while the sheet's modal dialog
  was still open. The box behind it was inert, so `execCommand` failed and the reply was appended through state, with the
  cursor at 0. A log inside his restore that never fired is what showed it. I told Nico; his 13989ef3 restore is harmless
  and not needed.
- **The sheet's focus.** The sheet gave focus back to its own button. It now uses `finalFocusRef` to give it to the message
  box.
- **T5 on the old build.** The old-code run on narrow-320 passed T5, because a fine pointer never had the button. It fails
  on iphone-se-viewport, where the 16px button is.
- **My first `pkill`** of the Storybook server matched the shell running it.

## Decisions made

None new. D-613 holds. The refusal screens are Mira's call (18:05), recorded here and in her desk log.

## Verified

- Full e2e before merging b73: 2,465 passed, 0 failed, 19 skipped.
- The Pam specs on the merged base: see the READY.
- Config: 1,455 passed. Web unit tests: 206. `tsc` clean. `build-storybook` passes.

## Left undone

- **The join step's texts block**: swap in Nico's `TextKindsList` when b74 lands (Mira 18:20, Nico 0299b2d7).
- **D-608 shortens READY**: open.

## Needs a human

Nothing new.

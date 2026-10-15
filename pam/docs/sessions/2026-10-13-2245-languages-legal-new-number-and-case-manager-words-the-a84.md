# 2026-10-13 — languages-legal new number and case manager words, the a84 privacy lines, staff Join usted

**Branch:** `claude/lena-records-13-oct-pm` · **Lane:** Languages & legal (Lena) · written 13 October, 22:45 UTC, after b34

## What changed

All of it is words and the stories that let the fit audit see them; no screen or migration is mine.

- **`nav.back.reported` and `place.notFound.body` (D-565, b33):** each in six languages, using that language's own `places.reported.title` / `tab.explore`, so Back and the sentence name the screen exactly (`911312da`, `c8f192ed`).
- **D-567, a new phone number (Ava):** the 60 `newNumber.*` strings in six languages (`965bc897`), and 26 stories, one for each state of the person's screens and the super admin's (`4c7594be`). The pretend database gained a `newNumber` option block in `journeys/mockSupabase.ts`; the taps are in `support/newNumberSteps.ts`.
- **D-568, "Join as a case manager" (Ava):** the 23 new strings in six languages and ten stories, in `support/caseManagerSteps.ts` (`1b38c2d9`). Its pretend answers sit in that file, not in `mockSupabase.ts`, so it and D-567 merge in either order.
- **Spanish staff Join in usted (b34, `134af68d`):** `join.privacy.title.admin`, `.provider`, `join.privacy.admin.intro`, `join.staff.title`, `join.staff.body`; `join.invited.as` is register-neutral ("Invitación como:"). Five stories draw the staff privacy step and the "We will text you" notice, which no story drew in any language.
- **Card a84, the Privacy lines for the two plans (nothing of mine is in the repo yet, Will has not signed):** I checked Mira's two draft lines against what Ava's plans store and found five things that made them untrue as drafted; the final English was edited by Sage and is in `docs/signed-english.md` on `claude/sage-signs` (ledger `402dc982`): `what-we-keep.p14` (move to a new number), `p15` (case manager and add-a-program requests), `p7` (staff keep a last name and a city, "or gave us"; the short form without those words can ship alone) and `sharing.p8` (an approved program is shown on Pam). I build one branch from main when Will signs.

## What was wrong, and what missed it

- **Mira's draft lines were not true of what the plans store.** The 30-day delete contradicted `review_staff_request` ("updated in place, never deleted"), the 90-day delete left an audit row behind, the temporary sign-in (the new number in `auth.users`) and a refused person's phone were not in "the request" at all, and nothing said what happens on a yes. Found by reading the migrations before writing a word. Ava built the purges to match (D-567 `5285f31b`, D-568 `purge_staff_requests`) and her DB tests 72 and 73 hold them to it.
- **The purge was wider than the line.** `purge_staff_requests` deletes every refused or unanswered staff request, including a member's "add a program" request (D-525). Privacy said nothing about those at all. Mira decided to keep the purge and widen `p15`; Sage's (j) line says an approved program is shown on Pam.
- **My own promise sweep was wrong.** I read D-474 and the "texts are off" notes and told Sage and Mira that `join.staff.*`, `addProgram.ask.*` and `caseManager.waiting.body` ("We will text you") promised a text Pam does not send. They are true: a decision on a staff request (`staff_request_approved` / `_denied`) is an account text and is exempt from `texts_live` (D-481, migration 20261010141859; Mira checked the live project, one approved and one denied text sent). I had stopped at the notes that say "texts are off". **What now catches it:** the question to ask is "is it an account text?" first; `docs/sms-setup.md` lists them, and it is the live `claim_outbound_messages` that decides.
- **Sage's "Your name is not." (in (j)) was false.** A member who writes to a program sees the lead's first name in the thread header (`conversation_partners()`, `messages.thread.leadAt`). Withdrawn before Will saw it.
- **Zero fit findings meant nothing for the first D-567 audit.** The two stories Ava wrote drew 17 of the 60 strings. The audit measures only what a story draws, so I added a story per state and checked the count of strings drawn (59 of 60; `newNumber.list.title` is an accessible name) and that the final state is on screen at the audit's measuring moment.

## Decisions made

- No decision file: nothing here a later session would reasonably reverse that is not already a card or a ledger row. The reasoning for each line is in Sage's `docs/signed-english.md` rows for a84, and in D-567/D-568 for the purges.

## Verified

| Check | Result |
|---|---|
| `copy:status` after each branch | in step |
| `@pam/config` tests | 1310–1317 passed, 1 skipped, each branch |
| `@pam/web` unit tests (D-567 branch) | 173 passed |
| Typecheck of the stories | clean (apart from stale `.next` types that already failed) |
| Fit audit, D-567 stories x 7 languages, 320x760 and 320x568 | 26 stories, 0 findings; 59 of 60 strings drawn |
| Fit audit, D-568 stories x 7 languages, both heights | 12 stories, 0 findings; 23 of 23 drawn |
| Fit audit, staff privacy step and notice, es, both heights | 5 stories, 0 findings |
| Live project, read-only (Mira) | `pg_cron` installed; `auth.audit_log_entries` has 0 rows; one approved and one denied staff-request text sent |

## Left undone

- **a84 on main:** `p14`, `p15`, `p7` (full and short), `sharing.p8` in English and six languages, `legal.ts` counts (`what-we-keep` 13 to 15, `sharing` 7 to 8), `legal:date privacy` for the day the text goes live. The page date follows the day the words go live, so this ships with Ava's D-567 and D-568 builds (the short `p7` may go alone). The held Google lines become `what-we-keep.p16` and `sharing.p9`.
- **Native readers for every translation** (pt-BR "juntar-se" for join first; the Spanish registers; "ZIP code").
- The two helper files, `support/newNumberSteps.ts` and `support/caseManagerSteps.ts`, share a few lines (`words`, `press`, `sees`); fold them into one once both are on main.
- `docs/before-launch.md`: the "Pam won't text you when it's done" line in `newNumber.received.body` and the old-number text (with its other copies) are in the D-567 branch's note; the zero-rows fact for the Auth log goes next to p11. They land with that branch.

## Needs a human

- Will: sign a84 (`p14`, `p15`, `p7`, the short `p7` (h), `sharing.p8` (j)). 90 and 30 days are Mira's advice; change a number in Ava's purge, the line and its six translations together.
- Will, later: the text to the old number (Nico, Sage, "contact Pam") needs one sentence in `privacy.s.texts` and a look at `outbound_messages.phone` and the text company's retention before it is signed.

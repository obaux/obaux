# 2026-10-17 — languages-legal a94 words, the a93 chip key and the Trips fit keys

**Branch:** `claude/lena-records-17-oct-pm` · **Lane:** Languages & legal (Lena) · written Saturday 17 October, about 16:00 UTC, after b57. The afternoon after `2026-10-17-1025-languages-legal-search-members-the-placeholder-check-a93-words.md` (read that first).

## What changed

- **a94, signed by Will (card a94, 15:21: "signed on all. But under trip card say 'booked for you' that's it"), accepted at `2c725ac1` and in b58.**
  - **First commit, `2de56eb5`, pushed at once so Piper could build on it:** `trips.bookedForYou` is "Booked for you" with no `{program}`. es "Reservada para ti", pt-BR "Reservada para você" (the participle agrees with "visita"; it said "Reservado" before), zh-CN 已为您预约, zh-HK 已為您預約, ru «Запись для вас», ar "تم الحجز لك".
  - **Second commit, `c780d42b`:** `privacy.s.sharing.p9` (Sage's provisional p10), the clause in `who-can-see.p1`, the new guide row `transparency.canSee.bookedBy`, `transparency.program.visits`, `reminders.intro` and `reminders.what.1`, and `join.privacy.admin.2` (signed by Sage at 15:35), in seven languages. `person.trip.bookedBy` es and pt-BR became "Reservada por {program}" to agree with the first commit. `ADMIN_CAN_SEE` gained `which_visits_a_program_booked_for_them`, with the reason and the four places that say it. `legal:date privacy 2026-10-17` re-pinned the fingerprint. `legal.ts` says sharing has 9 paragraphs.
  - **`2c725ac1`:** `admin.seeing.body` is retired in the seven languages and the ledger (unused since D-580).
  - **Guard tests** in `program-booking-line.test.ts` (22): the Privacy paragraph word for word, the field in `ADMIN_CAN_SEE` and not in `ADMIN_CANNOT_SEE`, the guide's row in the contract, its group and the bundle, the Privacy clause and the staff list, `BOOKED_BY_SHOWN_ON` is `'every'` and both screens use `showsBookedBy`, the migration adds one column and it names an organisation, the card says "Booked for you" and its title is the place, and no text is sent on a booking (`reminders.what.4` does not exist).
  - The first audit-row pin (`ee6a7e3b`: the booking's audit row is about the member) is on the same branch.
- **a93, the chip key:** Will wanted the unmarked visit as one red line like the marked one (15:12). `caseload.visit.missed.chip` is removed from the seven locale files and the ledger on a branch stacked on Ava's `b007c419` (`claude/lena-visit-line-no-chip` @ `806ce909`, READY; it ships with her branch on Will's yes). Russian wraps to two lines at 320 and Arabic fits on one; nothing clips.
- **Trips fit keys, after b55's TripCard** (in b57, `8effdeb6`): eight entries re-keyed.

## What was wrong, and what missed it

- **Sage's provisional `sharing.p10` would have left a gap, and broken a guard.** A section's paragraphs run 1..N, and the held Google calendar line (D-539) was reserved as `sharing.p9`. A new paragraph must be the next free number, so the booking line is `sharing.p9` and the Google line becomes `sharing.p10`. `third-party-hosts.test.ts` named `sharing.p9` as the line that names Google for three hosts, so it would have failed the moment p9 existed without Google in it; it now names p10 ("pending", skipped until the line lands).
- **"Which program" is said to the guide, not the lead.** The fact the guide sees is an organisation (`appointments.booked_by_org`); which lead did it is in `audit_log`, which only the Pam team reads. The test pins the migration to one column and that column names an organisation.
- **A fit run without English in it reports more.** `--locales es,zh-HK` has no English baseline, so everything English also shows (the saved trip's name under the fade, the `--spanish` stories) is reported as new. The CI job always includes `en`. Mira's run found eight entries my all-language run did not; I reproduced them with her command and entered them.
- **A git worktree path can already exist.** Twice in the afternoon `git worktree add -b ... /tmp/wt/<name>` failed because the path was an old worktree, and the next commands ran there anyway (the first time a `git merge` ran on an old branch: reset to its pushed tip, nothing pushed; the second a `pnpm claim session` that wrote a stray file, removed). A failed `worktree add` must stop the chain: check the path first, and use a fresh one.
- **The Support placeholder, found yesterday by the CI-exact run, was fixed by Wren in b55** ("Ask a question"); the fit job is now green on the CI languages.

## Decisions made

- `sharing.p9`, not p10 (above); Mira checked the English word for word.
- The guide sees "Booked by {program}" beside every booked visit (Will's answer to the open question); the staff list says "which ones a program booked".
- `trips.bookedForYou` has no program name; Explore's next-visit card never showed the place, so "Booked for you" alone is right there (Mira).

## Verified

- a94 (`2c725ac1`, then `c100b5d6` with Piper's tip merged): config tests 1375 pass; web unit tests 188 pass; tsc clean; `copy:status` in step; no `node_modules` tracked. Fit audit, 7 languages, 320×760 and 320×568: the transparency screens, nested pages, Privacy, Legal, Text reminders (3 stories), the staff privacy step (5), Book for member (with and without people), Program booked a visit, Invited by program and Trips: 0 findings from the new words; every new string is drawn in 7 of 7 languages; the only findings are known Trips-under-the-tab-bar keys at 568 (two more entered: es "13:00" and "12:00").
- a93 chip key (`806ce909`): config tests 1353 pass; the repo has no use of the key outside history; 53 Case manager stories, 7 languages, both heights: 0 unaccepted at 760, one at 568 (the Russian fourth paragraph of the What you can see sheet at the foot of a scrolling sheet; entered with its reason).
- Not run: the Playwright e2e.

## Left undone

- **Native readers** for the new translations (the entry is in `docs/before-launch.md`).
- **a91** `place.lead.sees` and `place.noLead` (Sage's `1f8e4d46` words) after Will signs, with the Arabic "Pam" fix (name in «»).
- **Retire sweep:** `join.waitingDone.yes` (after Ava removes the tick) and `person.savedPlaces.*`.
- **Held:** the Google calendar line (now `sharing.p10`), the a84 lines, the a86 `p7` wording.
- Dot's drawer "Close" / "Done": reuse `action.done` and `trips.confirm.close`; no new key.

## Needs a human

- Will: a91, a84, the a86 `p7` wording, the Google calendar card, a93 (Ava's branch).
- A native reader per language.

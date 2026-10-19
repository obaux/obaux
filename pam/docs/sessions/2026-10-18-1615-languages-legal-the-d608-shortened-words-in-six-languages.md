# Languages & Legal · the D-608 shortened words in six languages (18 October 2026, ~16:15 UTC)

Lena, on `claude/lena-d608-words`, stacked on Sage's `claude/sage-signs` @ `b50e386a` (which carries main `16962fc4`). Asked by Sage at 16:03: Mira approved the D-608 audit, and the English is in `en.json` in one SHA.

## What changed

- **34 changed values and two new shared keys** (`common.comingSoon` "Coming soon", `common.example` "Example") in es, pt-BR, zh-CN, zh-HK, ru and ar. `copy:ack` records them; the config suite is green (1,419 tests, 1 skipped), where Sage's SHA alone was red in `copy.test`, `copy-sync` and `copy-sync-cli` (stale and missing keys), as expected. This commit goes on top of hers in one merge.
- **Three values drop placeholders, so the translations drop them too:** `memberPolicies.intro` ({place}), `person.connect.done.body` ({program}), `trips.booked.example.body` ({place}, {day}, {time}).
- **Register:** member screens tú / você / 您 / вы; case manager, program lead and super admin screens usted / você / 您 / вы. "Pam" untranslated.
- **"Marked as there" keeps `trips.notMarked`'s words** in each language (es "marcar como presente", pt-BR "presença não registrada", zh "未标记为已到场", ru "отметка о присутствии"). This replaces the zh "未签到" (checked in, which reads as supervision) in `schedule.checkin.undo.body`.
- **Kept on purpose:** the Arabic `schedule.checkin.undo.body` (it already said "recording attendance"; `copy:ack --keep`).

## Found

- `programs.new.done.body` is used by no screen (no `.ts` or `.tsx` references it). Sage's new English and my translations are there, but nothing shows them. A retire candidate.
- "We'll text you when it's checked" (`addProgram.ask.sent.body`, `.waiting.body`) says what the old lines said: the request's decision is a `staff_request_approved` / `_denied` text. It reaches a person with a phone number and `texts_live` on; no new promise.
- 193 of the 203 changed translations are no longer than before. The ten that are: `programs.new.done.body` (es, pt-BR, ar; unused), `schedule.checkin.undo.body` (every language but ar, because it now uses the words `trips.notMarked` already uses), and `reminders.what` (pt-BR by 1 character, ar by 6). The last two are on screens (the undo confirmation; the heading of the Text reminders list), so they are in the fit audit below.

## Fit at 320

Storybook built from `709691c0`; the audit at 320×760 and 320×568 for the stories that show the two screens with longer lines: Text reminders (3 stories) and the texts step (2 stories): **0 new findings in any language**. The undo confirmation (`schedule.checkin.undo.body`) and the join step are in no story, so the audit cannot see them; the undo is one wrapped sentence in a dialog, 4 to 11 characters longer in five languages.

## Left undone

- Held by Sage, not in this batch: `messages.report.*` and `policy.replace.hint` (until Will signs).
- `reminders.what.3` and the other keys Sage's later commits stop using: a retire pass after the screens land.

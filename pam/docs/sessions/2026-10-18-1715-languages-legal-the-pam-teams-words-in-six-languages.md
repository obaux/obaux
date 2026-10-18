# Languages & Legal · the Pam team's words in six languages, and Arabic twos without the digit (18 October 2026, ~17:15 UTC)

Lena, on `claude/lena-pam-team-words`, on Ava's `claude/pam-message-pam-admin` @ `028dc9d2`. Asked by Ava (17:06) and Mira (17:07, 17:09): the 30 English words of the Pam team's side of Message Pam, signed by Sage at `61ddd4fb` with four D-608 changes (`pam.start.note` cut; `programNote`, `noLead` and `said.order` reworded), which Ava made in `028dc9d2`.

## What changed

- **30 keys in six languages** (`pam.saved.title`, `.guide`, `.program`, `.aboutMember`; `pam.thread.close`, `.reopen`, `.closed`, `.reopened`, `.statusFailed`, `.placeholder`; `pam.start.action`, `.programNote`, `.placeholder`; `pam.program.action`, `.noLead`; `pam.inbox.sent` and `.one`, `pam.inbox.off`; `pam.hours.title`, `.row`, `.days`, `.times`, `.open`, `.close`, `.preview`, `.save`, `.said.saved`, `.failed`, `.noDays`, `.order`), with every plural form of `pam.inbox.sent` in Russian and Arabic. The two saved replies a member reads (`guide`, `program`) are in the member register (tú, você, 您, вы); the one staff read (`aboutMember`) and the team's screens are in usted, você, 您, вы. The legal saved reply is not signed and is not here.
- **Four Arabic twos without the digit** (Iris, pass 1, P8): `pam.inbox.waiting.minutes/hours/days.two` and `when.countdown.days.two` ("منذ يومين", "بعد يومين"). `copy.test.ts` allows exactly those four to have no `{count}` and pins that they have none (`AR_DUAL_WITHOUT_DIGIT`).
- `pam.inbox.sent.one` joins `NO_PLURAL_VARIANTS` in `test/_bundles.ts` (English picks the singular itself, as for the waiting times).
- A before-launch entry for a native reader: the other 28 Arabic twos keep the digit ("{count} نقطتان").

## Found

- `{zone}` in `pam.hours.times` is "hora del Este", "восточное время США" or a city name, so the zone sits in brackets in every language.
- Config suite: 65 files, 1,451 tests pass, 1 skipped.

## Left undone

The 320 audit of the admin stories (below, if it ran), and a native reader for the Pam voice and the team's words.

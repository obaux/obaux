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

## The 320 audit (Message Pam and the Pam stories, 760 and 568, seven languages, on `959a0df1`)

Seven findings new in a language; none comes from the 30 keys.

- **Five overlaps, one story** (`design-message-pam-plan--p-3-b-text-failed-draft-in-box`, es, pt-BR, zh-CN, zh-HK, ru): the app's own placeholder ("Escribe un mensaje") is painted over the draft that the story keeps in the box. Cause: the story's `PamComposer` (Dot's, in `MessagePam.stories.tsx`) draws the kept draft by hand and hides the placeholder only when its text equals the story's English word, which fits English and Arabic; the five other languages carry the app's translation of `messages.thread.placeholder`, which was already there. The build does not do this (the placeholder goes when the draft is not empty). Not accepted in `fit-known.json`, because the drawing is wrong, not the design; the fix is one line in his file (hide the leaf `div` with `aria-hidden="true"` in the composer, which is exactly the placeholder in all seven languages, checked in the built story). Sent to Dot (Nico first, wrongly: the file is hers).
- **Two Arabic ellipses** (`super-admin-screens--messages-to-pam`, `…-closed`): a row in Messages to Pam trims what was said to one line, in English as well. In Arabic the row is two text nodes (the label «أنت:» and then the words), so the detector reports the words under another text and calls them new. Accepted in `fit-known.json` with the reason.

## Left undone

A native reader for the Pam voice and the team's words. The overlap story waits for Dot's one line.

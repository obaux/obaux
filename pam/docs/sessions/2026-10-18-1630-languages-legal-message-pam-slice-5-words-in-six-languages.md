# Languages & Legal · Message Pam slice 5: Pam's words in six languages (18 October 2026, ~16:30 UTC)

Lena, on `claude/lena-slice5`, on Nico's `claude/messages-pam-s0-s1a` @ `135a8881`. Asked by Nico (16:19, with Mira): everything the switch-on batch needs from the words side.

## What changed

- **Sixteen Pam keys in six languages** (the bundles held English copies): `messages.pam.placeholder`, `help.writeToPam`, `pam.welcome`, `pam.welcome.noName`, `pam.away`, `pam.away.crisis`, `pam.hours`, `pam.hours.days.range`, `pam.hours.days.every`, `pam.hours.zone.eastern`, `messages.thread.sent`, `.notSent`, `.tryAgain`, `.notSent.label`, `messages.thread.attach.wrongType.pam.hint`. Pam speaks to the member: tú, você, 您, вы; "Pam" untranslated. The crisis line reuses the wording of `terms.s.emergencies.p2` and `help.safety.crisis.heading` (988).
- **The hours line is built from parts** (`pamHoursLine`: days and times from `Intl`, the zone as "Eastern" or a city), so the zone sits in brackets and may be a phrase or a city name, and the Russian day range is a dash ("понедельник – пятница": the weekday names arrive in the nominative and "с … по …" needs two cases). That one key is allowed in `copy.test.ts` (no word of its own to translate).
- **My Text alerts branches merged in** (`dd03b8f5`, `a37039b1`): my translations win over Nico's English copies of `alerts.*` and `reminders.how`. Five more unused keys retired: `messages.block.done.body`, `messages.unblock.body`, `messages.unblock.done.body`, `connections.intro`, `reports.intro`. `messages.program.note` stays (Will's card a102).

## Found

- `Intl` with an hour and no minutes gives a bare "9"/"17" (es) and "09"/"17" (pt-BR, ru), which do not read as times. Nico has the fix: format hour and minute when the hour alone has no AM/PM or unit part.
- The fit audit at 320×760 and 320×568, in all seven languages, on the Message Pam, Messages and Help stories (4, 15 and 15 stories): **0 new findings**.

## Left undone

Nico's `pamHoursLine` fix; Sage's signature on "Send a photo." if not yet given (Mira says Sage signed it at `9763e383`); a native reader for the Pam voice lines (welcome, out-of-hours reply, hours).

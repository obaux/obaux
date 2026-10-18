# 2026-10-18 — languages-legal: a98 plan C, the three Privacy lines, the screen words, the calendar's name, and the pins

**Branch:** `claude/lena-plan-c-pins` (stacked on Piper's `claude/places-programs-calendar-plan-c` @ `c8cd0705`) · **Lane:** Languages & legal (Lena) · written Sunday 18 October, about 03:00 UTC. Read Piper's `…-a98-plan-c-the-calendar-link-shown-again.md` first.

## What changed

- **The three lines Will signed (18 October, 01:46, "Signed 1,2,3", via Mira) are in all seven languages, word for word** (Sage's ledger f5d64686 for p12, bb474f6d for the one-visit line, e1956821 for p6; the optional "whole" is not in). `privacy.s.what-we-keep.p12` and `privacy.s.sharing.p6` replace the signed-in-October lines; **`privacy.s.sharing.p10` is new** (one visit added to a calendar), so `legal.ts` says sharing has 10 paragraphs and the held Google calendar line (D-539) is now `sharing.p11` (`third-party-hosts.test.ts` and `program-booking-line.test.ts` follow). The Privacy page is dated **18 October** (`legal:date privacy 2026-10-18`, `copy:ack`). **p6's last sentence names a day: "A link made before 18 October…"**, written out in each language (18 de octubre, 18 de outubro, 10月18日, 18 октября, 18 أكتوبر); it must be the day the build goes live, and a pin ties it to the page's "Last updated" day, so moving the date with `legal:date` fails until the seven p6 lines are changed with it.
- **Privacy register:** usted (es), você (pt-BR), 您 (zh), вы (ru). "Disconnect" is the screen's own verb in each language (desconectar, 断开 / 斷開, отключить, إلغاء الربط), so the line and the button agree. "Pam visit" stays English inside the quotes: it is what an older link's events say.
- **Piper's 25 new screen keys** (`calendar.*`, `trips.addToCalendar*`, `trips.syncAll`; Sage's ledger ef40b2fb) are in the six languages, member register. Google Calendar is "Google Agenda" in pt-BR (the name in Brazil's stores).
- **`LINK_CALENDAR_NAMES`** in `supabase/functions/calendar-feed/ics.ts`: Visitas / Visitas / 预约 / 到訪 / Визиты / الزيارات. The one edit I made in her file, as she asked. `test/calendar-name.test.ts` fails if one goes back to English.
- **14 unused calendar keys retired** in seven languages and the ledger: Piper's four (`once`, `lostLink`, `details`, `details.hint`) and `slow`, `secret`, `intro`, `making`, `link.label`, `google.open`, `new.title`, `new.body`, `new.confirm`, `warn` (each has no use in apps, packages, stories, tests or e2e).
- **The privacy guard knows the calendar link:** `data-collected.ts` has a `calendar-link` entry (which calendar, the day, the version, the random id) covered by p12, p6 and p10, and the guard's collector pattern counts `.rpc('calendar_link_issue'` so a second place that sends the member's calendar choice to Pam fails until somebody says what it collects. Mutation-tested: removing the file's entry fails 2 tests; rewording a covered phrase fails 1.
- **`test/calendar-link-line.test.ts` is rewritten for the signed words and tied to the code:** `calendar_links` has exactly `member_id, lookup_id, version, calendar, linked_on` and no column that could hold the address or a hash; the feed writes no log line of its own for a request (only an error message when the database fails); an event has exactly BEGIN, UID, DTSTAMP, DTSTART, DTEND, SUMMARY, LOCATION, TRANSP, END (no URL, no description, nothing about the member, no "Pam visit"); one visit added from the booked card makes its file on the phone and opens Google by a tap, with no request, database or storage; an older link keeps saying "Pam visit".
- **Stories:** the journey mock (`mockSupabase.ts`) still answered the old `calendar_link_status/make/set_details/off` RPCs while the app calls `calendar_link_state/issue/off`, so no story drew the real Calendar page's new states and the fit audit could not see them. It now answers the new ones, keeps what is linked across a make and a disconnect, and has `calendarLink: 'apple' | 'google' | 'outlook' | 'other' | 'legacy'`. `CalendarLink.stories.tsx` has eight states (which calendar, linked Apple / Google / another, the older link, get a new link asked, disconnect asked, the older link's turn-off asked) and a ninth that opens Piper's "Add one visit to a calendar" sheet on a booked visit. The old "coming back later" story is gone: Pam shows the link every time now.

## What was wrong, and what missed it

- **The stories did not draw plan C's screens** (above). The audit was green on the old ones. What would have caught it: a story that fails when the screen asks Supabase for something the mock does not know (it logs `[journey] no fixture` and answers empty).
- **p12 said "so it cannot show you the link again"**, true until plan C: the old pin and `data-collected` had no entry for the calendar at all, because the picker is a list of buttons and the guard only counts fields. It now counts the one call.
- **"Disconnect Another calendar"** is what the screen says for the fourth kind in English (and in the six languages): asked of Piper.

## Decisions made

- **The three lines are translated for meaning where a literal word does not exist:** "a secret code it can make the link from again" is *un código secreto con el que puede volver a generar el enlace*; "the day you linked it" is *el día en que lo vinculó*; in Arabic the clause keeps the subject (*Pam*) and says what it keeps in the order the English does.
- **The date is written, not computed:** the sentence is a promise about a day, so a placeholder filled at render time could say a different day from the one the page is dated. A pin makes the two move together.

## Verified

- `@pam/config` tests pass (1404) with the new pins; `copy:status` in step; `privacy-guard` 9 of 9.
- Storybook built at `e35a887d` (stub env): fit audit of the 33 calendar stories and the add-one-visit story in 7 languages at 320×760 and 320×568: **0 findings**. I looked at the pictures: Arabic linked, Russian disconnect question, Spanish add-one-visit sheet.
- `tsc` clean in `@pam/web` at that commit.

## Left undone

- **Native readers** (`docs/before-launch.md`, new entry).
- **The booked card's "Goes to {calendar}" words** (Sage's ledger a7f6b7f8): Piper adds the keys, I translate; the "your calendar" for Another calendar needs its own key.
- **If the build goes live on a day other than 18 October:** `legal:date privacy <day>`, then change the day in the seven p6 lines (the pin tells which), then `copy:ack`.
- `docs/signed-english.md` rows 55, 56 and 105 (Sage's file) still describe the old lines.

## Needs a human

- A native reader for the Privacy lines (promises) before launch.

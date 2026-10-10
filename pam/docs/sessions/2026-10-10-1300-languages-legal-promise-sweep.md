# 2026-10-10 — Languages & legal — the promise sweep: the app says only what Pam texts today

**Branch:** `claude/lena-promise-sweep` · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), relaying Will: the first slide says "Pam reminds you before you go, so nothing gets missed" and Pam sends
no such text. Make it true today in all seven languages (say only what Pam does, Will's a12), note on the before-launch list what to put
back, then sweep the rest of the app for any line that promises a text or a reminder that is not sent. Saving a trip, points for planning a
trip and points for calling a place are true and stay.

## What changed

Ten English lines and their six translations (`copy:ack`ed), no migration. Full before/after table in D-474; in short:

- `onboarding.3` → "Pam keeps your planned visits in one place." (the site's own wording for the same card)
- `onboarding.provider.2` → "Members find your program and plan a visit." (was "Fewer no-shows. Pam reminds people for you.")
- `join.booked.body`, `trips.new.done.body` → say where the visit is ("It is on your Trips now." / "It is on your map."), not that a reminder follows
- `profile.promo.reminders.body` → "We can text you if a place you saved closes or moves." (the one text a member gets)
- `profile.promo.alerts.body.providerList` / `.adminList` → "Coming soon: texts about …" (every alert switch behind them says "Coming soon")
- `join.program.review.note` → "…Your Program tab shows where yours is." (nothing texts or belled a program lead when it goes live)
- `terms.s.your-account.p3` → "…so you can still sign in and get your texts."
- `notify.empty.body` → "When someone writes to you or needs you…" (no bell row is made when a visit is booked)
- `test/promises-of-texts.test.ts` (new): no English line says Pam reminds you while the site's `VISIT_REMINDERS_LIVE` is false; and the
  app's copy of the flag must equal the site's, so neither is flipped alone.
- `docs/before-launch.md` › *Visit reminders go live*: the key-by-key list to put back, with the English proposed for the day, where the six
  old translations are in git (`717ed79`), and the other three lines that wait on their own texts. The old "seen, not mine" note is closed.
- The app's own samples that quoted the old lines: the gallery page and `ProfileCards.stories.tsx`.

## Added at Mira's ask (13:08): Piper's draft translations of "Cancel this visit" and "Past visits"

Seven keys came in on `main` with six drafts each: `place.visit.cancel`, `.title`, `.body`, `.yes`, `.no`, `.failed` and `trips.past.title`.
Read in all six languages against the words each bundle already uses for the same screens. **Spanish and Brazilian Portuguese kept as
written** (Spanish says "tu" like `place.visit.next` beside it; "cancelarla" and "Manter minha visita" are right). **Changed:**

- **zh-CN** — "拜访" (visiting somebody) and "你" became "预约" and "您", the words every other zh-CN visit screen uses ("您的预约", "更改预约", the Trips tab).
  Title: "要取消您在{place}的预约吗？"; cancel: "取消这次预约"; keep: "保留我的预约"; failed: "无法取消这次预约。…"; past: "过去的预约".
- **zh-HK** — written Cantonese ("嘅", "係", "今次") became the written style the whole bundle uses, with "您" and the Trips word "到訪":
  "取消這次到訪", "要取消您前往{place}的到訪嗎？", "是，取消", "保留我的到訪", "未能取消這次到訪。…", "過去的到訪".
- **ru** — body said "The reminder about it will also be cancelled" (it assumes there is one); now "Любое напоминание о нём тоже отменяется." like the English "Any".
- **ar** — dropped the diacritics (يُلغى, أيضًا, تعذّر, تحقّق, ألغِها) that nothing else in the Arabic bundle carries: "يلغى أيضا أي تذكير بها", "نعم، ألغها", "تعذر إلغاء… تحقق من اتصالك…".

Re-acked (`copy:ack`; status "in step"). Fit: the audit on the place-with-a-visit story (8 languages incl. pseudo) found nothing new; on the Trips and saved-trips
stories 17 findings, all already in `fit-known.json` (the Trips drawer's fade). The cancel dialog itself is not drawn by a static story, so I opened it
(Cancel this visit) in the built Storybook in en, es, pt-BR, zh-CN, zh-HK, ru, ar at 320px and measured the card: every line inside the card with
8 px to spare, nothing wide or cut; Russian is the longest and fits (screenshots only in my scratchpad). Not opened in the pseudo-language (the script
hit "Change appointment" first). "Any reminder for it is cancelled too" stays: Mira says a queued reminder is cancelled even though none is sent yet.

## What was wrong, and what missed it

- Five lines promised a visit reminder: the slide, the program leads' slide, the booked screen, the trip-added screen and the Profile card. They
  were written when the reminder was the plan (D-256); the public site was corrected on 10 October (D-458) and the app was not,
  because nothing connected the two. Now a test does.
- Four more promised other things that nothing does: a text/bell when a program goes live, a bell when a visit is booked, "choose which" alerts
  that are all "Coming soon", and "your reminders follow you" in the terms.
- **Found, not fixable with words:** a program booking a visit for a member (`/program/book/`) ends on "Booked for …" and "Pam texted … a
  link to see it", but `bookTrip` keeps a `forMemberId` booking in the browser tab: nothing is saved and nothing is texted (the step before
  it says "Example trips only for now"). Reported to the merge desk; on the before-launch list.

## Decisions made

- **D-474** — a line on screen promises only a text Pam sends; the ten lines; what was looked at and left (`reminders.intro` on the carrier-reviewed
  screen, the "Text reminders" name, the privacy "may").

## Verified

First on `main` at `717ed79` plus this change: `@pam/config` 1000 tests, `@pam/web` 76, typecheck (web, site, native) clean, `copy:status`
"in step"; the browser suite on all three viewports **924 passed** (10.4 min); Storybook builds; the fit audit (`--locales
en,ru,ar,zh-CN,pseudo --known scripts/fit-known.json`, 517 stories): 94 new in a language, 82 accepted, **12 not, none from this change**.
Six of the twelve were in this morning's audit too (Explore's four pseudo clamps, the two Block ru overlaps). The other six
(pseudo `cut` of "Work and money" on the case manager's and program lead's Homes) came in with main since this morning; to prove they
are not mine I built Storybook again with the old wording of all ten lines and audited the same stories (`--match screens--home`):
the same six, so they are the Homes', not the copy's. I did not add them to `fit-known.json` (Mira does at merge).

Then merged with `main` at `296a6f3` (24 commits; one conflict in `docs/before-launch.md`, kept both sides' facts): `@pam/config` 1018
tests, `@pam/web` 76, `@pam/site` 19, typecheck clean, `copy:status` in step; the browser suite again on that merge, `b30a74a`: **933 passed** (10.5 min) (also in the
READY note). Main's new English added one more reminder line, `place.visit.cancel.body` ("Any reminder for it is cancelled too."): an
"any", true whether or not one was queued; left.

## Left undone

- Spanish still mixes "Viajes" and "Visitas" for the same tab (`tab.trips` is "Visitas"; `join.booked.trips`, `trips.new.done.title`,
  `trips.booked.body` say "Viajes"). The new Spanish booked line follows its neighbours ("sus Viajes"). A native reader should pick one.
- The six translations are mine, not read by a native speaker (before-launch, D-466 and the standing item).
- `reminders.intro` ("Pam can text you about the things you plan.") is left: it is the first line of the screen the carrier reviewed.

## Needs a human

- Will reads the English in D-474's table (the slide and the two Profile cards are what a person sees first).
- Someone decides what the program-booking screen should say until a booking is real (Places & programs / Trips).

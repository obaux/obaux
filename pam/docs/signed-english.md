# Signed English

Who signed each new or changed English sentence in the app, on the website and in help posts, and when. Since A29
(Will, 11 October 2026, 03:52 UTC: "let's change it so every new sentence doesn't need my yes"), **Sage signs** them
against `docs/voice.md` and the true-today rule. Before that, Will signed each one on a Control Room card; those
signatures are in the decision files and the cards, and stay as they were.

**Still Will's to sign** (A29), flagged here and sent to him as a card: texts and emails Pam sends; Privacy and Terms
(`privacy.*`, `terms.*`, `legal.ts`, `transparency.ts`); and any new promise about what Pam does.

How a row is written: the key (or the post and section), the English as signed, who and when (UTC), and the reason if
it isn't obvious. A line Sage changes says what it was. Lena carries signed English into the other six languages; a
change to an existing key goes to her, and she applies it to `en.json` with the translations.

Only Sage edits this file. A lane sends its English to Sage before READY; the merge desk does not merge an unsigned
sentence.

| Key or place | English, as signed | Signed | Note |
|---|---|---|---|
| `nav.back.website` | Back to the website | Sage, 2026-10-11 04:00 | D-508. Matches every other "Back to …" label. |
| `signin.code.wrong` | **That code did not work. Check it, or tap Send again.** | Sage, 2026-10-11 04:02 | D-510. **Changed** from "That code did not work. Try again.": the notice also shows for an expired code, and trying an expired code again goes nowhere. "Send again" is the button under the code boxes (`signin.code.again`, `PhoneSignInCard.tsx`; Mira caught that the first draft named `signin.code.resend`, which this screen does not show). For Lena: one changed key, six translations, each using its own `signin.code.again`. |
| `trips.empty.body` | Plan a visit and it shows here. | Sage, 2026-10-11 04:00 | D-509. An empty state: what will appear, and how to fill it. |
| `places.saved` (Dot's "Saved" tip) | Saved | — | Nothing new: an existing, signed string reused. |
| `trips.map.many` | {count} trips | Sage, 2026-10-11 04:00 | Piper. "Trips" is the app's word (the tab, `glossary.trip.*`). Only for two or more; Lena gives Russian and Arabic their plural forms. |
| A28 words (`docs/help-drafts/a28-contact-pam.md`) | as written | **Will**, 2026-10-11 03:37 | Card a59, before A29. Includes texts and the HELP reply, which stay his under A29 too. |
| Help: Texts from Pam › Texts Pam does not send yet | Pam does not text you when a place you saved closes or moves. | Sage, 2026-10-11 04:05 | Wren, behind `PLACE_TEXTS_LIVE = false`: the saved-place note is held with the other texts until texts go live (D-481). |
| Help: On this page labels (all posts) | as listed in the Wren note of 04:05 and `claude/help-short-labels` | Sage, 2026-10-11 04:05 | Menu labels; each repeats its own heading in fewer words. |
| `reminders.today.member` | Pam does not send any of these yet. They are coming. | Sage, 2026-10-11 04:09 | Lena's (claude/lena-a28-help). Was "Today Pam sends only one of these: a note when a place you saved closes or moves…"; that note is held with the other texts (D-481). Restore line in before-launch. |
| `profile.promo.reminders.body` | Coming soon: texts about your visits and the places you saved. | Sage, 2026-10-11 04:09 | Lena's. Matches the other "Coming soon:" promo lines (D-474). |
| `flag.done.body` | Somebody at Pam looks at every one of these. | Sage, 2026-10-11 04:09 | Lena's. Drops "anyone who saved it is told", which was a held text. |
| Help desk form, "What's wrong?" left empty | Tell us what happened, in a few words. | Sage, 2026-10-11 04:52 | Wren (head 1a4acc9d). A red border alone does not say what to do, and colour alone fails people who can't see it. Shown under the field, linked to it for screen readers. |
| Help desk form, "Your email" left empty | Add your email so we can write back. | Sage, 2026-10-11 04:52 | Wren. Repeats §3's "write back"; no new promise. |
| Help desk form, "Your email" not an email | That email does not look right. Check it and try again. | Sage, 2026-10-11 04:52 | Wren. Same shape as the code error: what happened, what to do. |

# 2026-10-11 — Voice & UX copy: Pam's voice guide, and words for the website Home

**Branch:** `claude/voice-guide` · **Lane:** Voice & UX copy (new; Sage, from Will's brief of 11 October)

## What changed

- **`docs/voice.md`**, Pam's tone of voice: who we write for, four traits with do/don't pairs from real
  `en.json` keys, how the tone flexes from the website to privacy, patterns (buttons, titles, empty
  states, errors, confirmations, help, waiting), the word list, writing for seven languages, a checklist.
- **Storybook › Foundations › Writing** is now a short summary that links to the guide. It also stops
  saying "English and Spanish" (A24).
- **Figma "Pam — Website", new page "Copy proposals"** (node 31-290): a copy of Will's newest Home
  frame (Desktop 1441) with refined words, and a card beside each of the eight sections with the old
  words, the new words and why. Will's own frames are untouched. Sent to Mira as a QUESTION.
- No app strings, no site code. Nothing changes on a screen until Will signs and a lane builds it.

## What was wrong, and what missed it

- **The website's newest wording made three claims Pam can't keep yet**: "24/7 support" (help is
  weekdays 9 to 5, `help.call.body`), "powered by AI" and "in seven languages" for the support posts
  (they're written by the team and only About and the program rules are translated), and "reminders"
  (`VISIT_REMINDERS_LIVE = false`). Nothing checks design copy against the app, so the guide now says to
  check flags and the app's own strings before promising anything, and the proposals take them out.
- **Row 3 of Will's frame repeats row 1** with a missing word, and the Privacy card's body is a copy of
  the Support body. Placeholders, most likely; the proposals fill them.
- **Figma:** a fresh `clone()` doesn't list text inside its instances straight away, so matching texts
  by order failed. Matching instances by order and building the sublayer id (`I<clone instance>;<rest>`)
  works.

## Decisions made

- D-503: the four traits, the tone that flexes, and `docs/voice.md` as the one guide.

## Verified

| Check | Result |
|---|---|
| Every `en.json` key the guide cites exists, with the quoted words | checked by script (see READY) |
| Figma page built; Will's frames unchanged | page 31-290 holds only the copy and the notes; Home page untouched |
| Storybook build | see READY |

## Left undone

- The phone Home frame (390) still carries older words; Will hasn't redone it yet. The same proposals
  apply when he does.
- The "don't" strings in the guide (`home.book`, `saved.unsave`, `home.interested.count`) are not
  changed; proposing them is a separate job.
- Storybook's Foundations › Principles (Dot's) still says "English and Spanish" and "a way to get help
  on every screen" (replaced by A24 and A26). Reported, not touched.

## Needs a human

- Will: choose yes / no / change for each line on the Figma page; Philly or Philadelphia; whether to
  mention AI; "program lead" or "Program partner".
- Lena: the two privacy lines on the website restate existing promises; she checks their meaning
  before they ship.

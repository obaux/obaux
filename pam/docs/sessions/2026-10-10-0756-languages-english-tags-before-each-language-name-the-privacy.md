# 2026-10-10 — Languages — English tags before each language name; the privacy page says what a guide can read

**Branch:** `claude/lena-english-language-tags` · **Lane:** Languages & legal (Lena)

Two jobs from Will, both relayed by the merge desk (Mira), in one branch because Mira allowed it.

## What changed

**1. An English tag before each language's own name** (Will, 10 October: "add Language abbreviation in
english at front so we know what language before it says the language in their language. Always keep
these abbreviations in english"). The tags are the locale codes in capitals, constants in
`packages/config/src/i18n.ts` (`LANGUAGE_TAGS`). Dot built the `tag`, `lang` and `valueTag` props on
`MenuItem` and `ChoiceChips` (D-451); I wired them into the Language screen, the join screen's language
chips and Profile's Language row, and drew the same tag in the sign-in globe menu and its current-language
chip in `LanguageSwitcher.tsx` (Astryx's dropdown, which Dot's props do not reach). Storybook's locale
menu leads with the tag too. Decision: D-455. Proof screenshots: `docs/languages/language-tags/`.

**2. The privacy page says what a guide can and cannot read** (Will, via Mira: "every screen that
promises something Pam doesn't do is built to keep the promise or rewritten"). `privacy.s.who-can-see.p2`
and `.p3` said a guide "cannot read your messages" and sees a message "only if someone reports it"; the
transparency screen (the contract, unchanged) says a guide sees everything you send them directly and
nothing you send to anyone else. The page now says what the screen says, in seven languages. Decision:
D-452. `language.intro` ("Pam's words, buttons and texts will be in the language you choose") is kept as
Will said: it becomes true for texts once the carrier filing is done.

## What was wrong, and what missed it

- **The key Will was given was wrong.** The merge desk named `privacy.s.texts.p2`, which is about
  texts ("Reply STOP"). The contradiction was in `privacy.s.who-can-see.*`. Reading the strings next to
  `TRANSPARENCY_SCREEN` found it. The test that was meant to tie the page to the screen
  (`legal.test.ts`) *pinned* the over-broad sentence ("cannot read your messages"), which is how a
  contradiction passed every check: the test checked that the page repeated the screen's limits, not
  that it kept the screen's exceptions. It now forbids a bare "cannot read your messages" and checks the
  page says what you send a guide directly.
- **Language names never had a `lang`.** The brief said the name "keeps its `lang` attribute"; it had
  none, anywhere in a language list, so a screen reader read "العربية" in whatever voice the page was in.
  Astryx's base props leave `lang` out, so it takes a plain span. Fixed in the dropdown and, through
  Dot's `lang` prop, in the rows and chips.
- **My first browser checks tested English while claiming Arabic.** A signed-in person's own
  `preferred_language` beats the browser's choice (`LocaleSync`), so a stub without one flipped the page
  back to English after the `lang` check had passed. The checks now give the stub the language. And
  Profile cannot be reached in a browser test at all (its tab shell is Storybook-only), so Profile's row
  is covered by a Storybook screenshot and the account settings row by a browser check.
- **Dot's chip turned itself round.** `ChoiceChips` put the language's `dir` on the whole button, so on an
  English page the Arabic chip read "العربية  AR", the tag after the name for the reader who most needs it
  first. The rows were right; the chips were wrong, and no test looked at where the tag sat. Found by looking
  at the screenshot, not by a check. Fixed with Mira's OK (`lang` stays on the button for the spoken name,
  `dir` on the words only) and pinned by a unit test and a browser check on an English and an Arabic page.
- **A wait loop that never ended**, twice: `pgrep -f "next build"` inside the loop matched the loop's own
  command line. Wait on the build's log instead.

## Decisions made

- **D-455** — every list of languages leads with an English tag (constants, never bundle strings);
  hidden from screen readers; the name carries its own `lang`.
- **D-452** — the privacy page says what a guide can and cannot read, as the transparency screen does.

## Verified

The long checks were run on the tree at `9873c5c` (this branch merged with `main` at `698c7cf`), after the chip fix
and the `OptionTag` export. `main` then moved four more merges (Block, saved trips, staff text list, the database
test numbering); I merged it (`1c01741`, one conflict, in STATUS.md, kept both) and ran the fast checks again
rather than chase it with a fourth hour-long run. The merge desk measures the merged tree before it merges.

| Check | Result |
|---|---|
| `@pam/config` unit tests, on `1c01741` | 986 pass (the tag tests are in `i18n.test.ts`; `legal.test.ts` pins the privacy wording) |
| `@pam/ui` unit tests, on `1c01741` | 117 pass (10 in `option-tag.test.tsx`; a chip or row with no tag draws exactly what it drew, by snapshot) |
| `@pam/web` unit tests, on `1c01741` | 61 pass |
| Typecheck `@pam/web`, `@pam/ui`; `copy:status`, on `1c01741` | clean; all languages in step |
| Storybook build, on `9873c5c` | completes |
| Browser suite, all three projects (narrow 320, dark 320, iPhone SE), on `9873c5c` | **903 passed, 0 failed** (10.5 minutes) |
| New browser checks | the sign-in menu in all seven languages; the Language screen in en, ru and ar; the account settings row; the join chips on an English and an Arabic page |
| Fit audit, 480 stories × en, ru, ar, zh-CN, pseudo at 320px, on `9873c5c` | 93 new in a language: 81 accepted, **12 not accepted**; see below |
| Screenshots at 320px (light, dark, Arabic) | `docs/languages/language-tags/` |

**The twelve not accepted** are in two stories this branch does not touch.
- Four `pseudo clamp` on `member-created--explore` (three card descriptions and "Example Workforce Center"). A Storybook
  build of plain `main` at `5dd52b8` gives the same four on every run, so they are not from this branch.
- Eight `overlap` on `member-created--conversation-file-refused` (a sender name over the first message, in ru, ar,
  zh-CN and pseudo). The story measured alone twice in a row on this tree gave 0 defects, then 6: they come and go
  between runs of the same code, as the merge desk found on `main`.
Both are the merge desk's and Will's to rule on (a line in `fit-known.json` needs a reason somebody looked at); neither is a
layout this job changed.

**Not run:** hearing the tags with a screen reader; the database suite (no change in `packages/db`).

## Left undone

- The twelve fit defects above (Explore's four pseudo-language clamps; the file-refused conversation's overlaps).
- Three pieces of wording for the next small branch, all decided by the merge desk: `transparency.canSee.lastActive`
  becomes "The last day you used Pam." (a program does not get it: 0062; D-242's program half stays open); the
  blocking sentences come back in their true form now that the Block control has landed (D-463: "Block this
  person" in a conversation's ⋯; the other person is told); and a mail-service paragraph on the privacy page,
  whose English Will is being asked to approve.
- The six translations of the two privacy paragraphs are mine; they are promises and still need a native
  reader, like the rest.

## Needs a human

- Will: whether to merge the tags with the chip as it is and have Dot fix it after (the merge desk asks).
- A native reader for the privacy paragraphs and the screen-reader check of the tags being skipped
  (before-launch item: native and screen-reader review).

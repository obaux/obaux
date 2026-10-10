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
- **A wait loop that never ended**, twice: `pgrep -f "next build"` inside the loop matched the loop's own
  command line. Wait on the build's log instead.

## Decisions made

- **D-455** — every list of languages leads with an English tag (constants, never bundle strings);
  hidden from screen readers; the name carries its own `lang`.
- **D-452** — the privacy page says what a guide can and cannot read, as the transparency screen does.

## Verified

Filled in when the long checks have finished (below).

## Left undone

- The Arabic chip on an English page reads "العربية  AR" (tag after the name for a left-to-right reader),
  because `ChoiceChips` puts `lang` and `dir` on the whole chip. A finding for Dot (the design system),
  sent to the merge desk. Rows are right.
- `OptionTag` is not exported from `@pam/ui`, so the sign-in dropdown draws its own copy at the same size.
- The six translations of the two privacy paragraphs are mine; they are promises and still need a native
  reader, like the rest.

## Needs a human

- Will: whether to merge the tags with the chip as it is and have Dot fix it after (the merge desk asks).
- A native reader for the privacy paragraphs and the screen-reader check of the tags being skipped
  (before-launch item: native and screen-reader review).

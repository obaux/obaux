# D-455 — Every list of languages leads with an English tag, and a screen reader hears the name alone

**Date:** 2026-10-10 · **Branch:** `claude/lena-english-language-tags`

Will, 10 October 2026, with a screenshot of the Language menu in dark mode (English, Español, Português
(Brasil), 简体中文（普通话）, 繁體中文（廣東話）, Русский): "add Language abbreviation in english at front so
we know what language before it says the language in their language. Always keep these abbreviations in
english." Relayed by Mira (the merge desk), who chose the codes; Dot built the row and chip props
(D-451); this is the Languages half: the tags themselves, where they go, and what a screen reader hears.

## What was decided

**The tags** are the locale codes Pam already uses, in capitals: `EN ES PT-BR ZH-CN ZH-HK RU AR`. They
are the only short form that tells the two Chinese rows apart, and support staff see the same codes in
the records. (Mira's choice, 10 October; I found no reason against it.)

**Constants, not strings.** `LANGUAGE_TAGS` in `packages/config/src/i18n.ts`, beside `SWITCHING_LANGUAGE`,
which is the other text that travels with the code instead of a bundle. A bundle string can be
translated, left out or reworded by a translator; this must read the same in all seven languages.
`i18n.test.ts` fails if a language has no tag, if a tag stops being its code in capitals, if two tags
match, if a tag is anything but plain capital letters and a hyphen, or if any bundle ever carries a
`language.tag*` key or a tag written into a language's own name.

**Where they appear** (every place Pam lists languages): the Language screen; the sign-in globe menu and
the current-language chip beside "Language" in account settings; the join screen's language chips;
Profile's Language row (before the current language); Storybook's locale menu ("RU · Русский").
Storybook's *Pseudo-language* has no tag; it is not a language Pam offers.

**What a screen reader hears.** The tag is hidden from it (`aria-hidden`); the row or chip is read as the
language's own name, in a span with that language's `lang` and `dir`, so "Русский" is spoken in a Russian
voice. I chose to skip the tag rather than have it spoken because it is a sighted aid for staff who cannot
read the name: read aloud in the page's own voice it is noise ("PT-BR" in an Arabic voice), and the name,
in its own voice, already says which language it is. It also keeps the accessible names the e2e suite
selects on unchanged. Before this the names carried no `lang` at all, so a screen reader read "العربية"
in whatever voice the page was in; they do now.

**Left to right, at the start.** The tag is isolated (`<bdi dir="ltr">`), so "PT-BR" never turns into
"BR-PT" in an Arabic row; it sits at the start of the row (left in English, right in Arabic), in a cell as
wide for every row so the names start on one line.

**The sign-in menu** is Astryx's dropdown, which Dot's props do not reach, so `LanguageSwitcher.tsx`
draws the same cell itself, at the same size, weight and width (12px, 600, 3.6em). If `OptionTag` is
exported from `@pam/ui` the dropdown should use it instead of its own copy.

## What a later session might reverse

- A different tag for a language (for instance `ZH-S`/`ZH-T`) is one line in `LANGUAGE_TAGS` and its test.
- Having the tag read aloud is the `aria-hidden` on the cell, in `OptionTag` and in the dropdown.
- Adding a language: a tag in `LANGUAGE_TAGS` is now part of the checklist (the test fails without it).

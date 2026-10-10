# D-451 — A language tag on menu rows and choice chips

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-language-tag`

Will, 10 October 2026, with a screenshot of the Language menu: "add Language abbreviation
in english at front so we know what language before it says the language in their
language. Always keep these abbreviations in english." Lena (Languages) builds the rest and
codes against three optional props, whose names Mira fixed: `tag`, `lang`, `valueTag`.

## What was decided

`MenuItem` (`@pam/ui/MenuList`) and a `ChoiceChips` option take, all optional and additive:

- **`tag?: string`**: a short tag before the label, in a cell of its own.
- **`lang?: string`**: the language the label is written in. A language Pam offers also gets
  its `dir` (`rtl` for Arabic), so a screen reader speaks "Русский" in a Russian voice.
- **`valueTag?: string`** (rows only): the same tag before the row's `value` text, for Profile's
  Language row. Drawn only beside a `value`.

A row or chip without them draws **exactly what it drew before** (below).

## The cell

`OptionTag` (`packages/ui/src/OptionTag.tsx`): a `<span aria-hidden>` of **3.6em** at 12px,
600 weight, in `--color-text-secondary`, with the tag text in a `<bdi dir="ltr">` inside.

- **Width: 3.6em (43px).** Measured at 320px in Chrome 141, the widest tags are ZH-CN 39.5px,
  ZH-HK 38.3px, PT-BR 33.9px; EN, ES, RU and AR are 14 to 16px. 3.6em leaves about 3.5px for a
  platform whose font is a little wider, and costs 43px of a 320px row. An earlier 4.4em left
  13px of dead space. In `em` so it follows the text size. A tag Pam adds later that is wider
  than five capitals does not wrap or clip: it overflows into the 8px gap, so raise the width then.
- **`aria-hidden`** (Lena): the row's accessible name stays the language's own name.
- **Left to right and isolated**: `<bdi dir="ltr">`, so "PT-BR" is never turned round in Arabic.
- **At the start of the row**: left in English, right in Arabic. The cell keeps the row's
  direction and `text-align: start` does the rest.

### What did not work

`text-align: match-parent` was the first way to do the last point. **Chromium does not support
it** (`CSS.supports('text-align', 'match-parent')` is false in Chrome 141): it was ignored, and in
Arabic the tags sat at the far end of their cell, leaving a gap beside the icon. Only a browser
showed it (unit tests cannot). Found by screenshot; the unit tests now check the structure that
replaced it (`bdi[dir=ltr]` inside an `aria-hidden` cell).

## Where `lang` goes

- **On a row**: a `<span lang dir>` round the label, as `LanguageSwitching` does, because Astryx's
  rows take no `lang`. The row's name comes from its content, so the span is what it speaks.
- **On a chip**: on the button itself. Astryx sets `aria-label` from `label` as soon as a button has
  children, and an `aria-label` takes the language of the element it is on, not of a span inside.
  `ListItem` and `Button` both spread unknown props to the DOM element; their TypeScript types
  omit `lang`, so it is passed as a spread of a plain object, which is not checked for extra keys.

## One place this differs from the brief

`valueTag` is **not** the fixed-width cell: it takes the room its letters need (`isFixedWidth={false}`).
Beside the value there is no column of tags to line up, and a 43px cell would leave a visible gap
between "EN" and "English" and squeeze the row at 320px. Everything else about it is the same
(small, quiet, left to right, `aria-hidden`). Easy to reverse: drop the `isFixedWidth` argument.

## Untagged rows and chips are unchanged: how that was checked

A test (`test/option-tag.test.tsx`) renders a plain `MenuList` (links, a value, a description, a
badge, the dot, a button row, selected and unselected choices) and plain `ChoiceChips`, and
compares the markup with a snapshot **recorded from `main`'s components before any change**
(the files were set aside, the snapshot written, the files restored, the test run). It passes. The
only thing the test strips is StyleX's dev-only `data-style-src="file:line"`, which names the line a
style was written on and moves when a line is added above it. A first run without that strip
failed on exactly that attribute and nothing else.

## What a later session might want to reverse

- The width, if a longer tag is ever wanted: change `3.6em` in one place.
- `valueTag` as a fixed cell, if rows in a list of Profile-like rows should show a column of tags.
- Showing `valueTag` without a `value`: it is deliberately not drawn, since a tag with nothing to
  name is noise.

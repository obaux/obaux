# The English tag before each language name — proof (D-455)

Screenshots at 320px, 2x, taken from the Storybook build of this branch (10 October 2026).
Will: "add Language abbreviation in english at front so we know what language before it says
the language in their language. Always keep these abbreviations in english."

| File | Shows | Story |
|---|---|---|
| `language-screen-en-light.png` | The Language screen, English, light | `member-created--language` |
| `language-screen-en-dark.png` | The same, dark | `member-created--language`, theme dark |
| `language-screen-ar.png` | The same, Arabic (right to left: tag at the right, names flush on one line) | `member-created--language`, locale ar |
| `signin-menu-en-light.png`, `-en-dark.png`, `-ar.png` | The globe menu on the sign-in screen | `member-created--sign-in`, menu opened |
| `profile-row-ru.png` | Profile's Language row in Russian: "RU Русский" before the chevron | `member-created--profile`, locale ru |
| `join-chips-en.png`, `join-chips-ar.png` | The language chips on the join screen's first step | `member-created--sign-up` |
| `chips-story-en-page.png`, `chips-story-ar-page.png` | The chips alone, on an English and on an Arabic page | `components-inputs-choicechips--with-language-tags`, `…-arabic` |

Open any of them live with `iframe.html?id=<story>&viewMode=story&globals=locale:ar;theme:dark`.

## The chips (join screen, `ChoiceChips`)

`chips-story-en-page.png` and `chips-story-ar-page.png` are Storybook's `Inputs › ChoiceChips › With language tags`
(English page) and `… Arabic` (Arabic page). The chip is laid out the way the **page** is, the tag first at the
page's start, and only the name keeps its own direction: on an English page the Arabic chip reads "AR  العربية",
on an Arabic page the English chip "English  EN" with the tag at the right. Before the fix (D-455) `ChoiceChips`
put the language's `dir` on the whole chip, so the Arabic chip on an English page read "العربية  AR", the tag
after the name for a left-to-right reader. Rows are drawn by `MenuList` and were always right.

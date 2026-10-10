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

Open any of them live with `iframe.html?id=<story>&viewMode=story&globals=locale:ar;theme:dark`.

In the join chips the Arabic chip on an English page reads "العربية  AR" (the tag after the name
for somebody reading left to right): `ChoiceChips` puts the language's `dir` on the whole chip.
Reported to the merge desk as a finding for the design system; the rows are not affected.

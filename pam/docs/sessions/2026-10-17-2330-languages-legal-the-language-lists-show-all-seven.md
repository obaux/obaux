# 2026-10-17 — languages-legal: the language lists show all seven languages (S1)

**Branch:** `claude/lena-language-list-fits` (off main `62ba50e4`, b60 live) · **Lane:** Languages & legal (Lena) · written Saturday 17 October, about 23:30 UTC, after b60. Read `2026-10-17-1745-languages-legal-the-booking-refusals-in-six-languages.md` first.

## What changed

- **S1, Iris's interaction run-through (`claude/research-interaction-run-through`, finding S1: the one finding that stops someone).** Before sign-in, the language list was 300px tall with seven 48px rows. Russian was cut in half and Arabic was below the edge, at 390 and at 320, in the app and in Storybook, on the Sign in globe and on Sign up's "Choose a language". Nothing said there was more, and the person who needs Arabic may read nothing else on the screen.
- **Why:** Astryx caps a `DropdownMenu` (the globe) and a `Selector`'s list (Sign up) at 300px. The globe's menu is capped twice, on the menu and on the popover round it, which decides where it opens. The cap is in Astryx's compiled CSS and has no prop.
- **The fix is the same dropdown, sized to fit, so it ships as a bug fix, not a design change.** `globals.css` has one rule for the three places the cap sits (the menu, the popover round it, the list): `max-block-size: min(400px, calc(100dvh - 32px))`, 400px being seven rows and a bit more. It reaches only a menu or a list whose rows start with the English tag; `TaggedWords` (`@pam/ui`'s `OptionTag.tsx`, the one source every language list uses) now carries `data-pam-tagged`, and that is what the rule looks for. The City list and every other menu keep the 300px cap. On a short phone the viewport still limits the list, which then scrolls instead of running off the screen; a list that does not fit under its box opens above it (Astryx's own flip), which is what Sign up does at both sizes now.
- **`e2e/language-list-fits.spec.ts`:** opens the Sign in globe and Sign up's "Choose a language" at 320×568 and 390×844, in English and in Arabic (the globe moves to the other corner), and checks that every language's row is inside the list's own box, inside the screen, and that the list has nothing to scroll to. It names the rows that fail and where they are. 8 tests × 3 projects.
- **Pictures:** `docs/research/shots/2026-10-17-lena-s1-{before,after}-{signin,signup}-{320,390}.png` (8). Before is main `62ba50e4`'s build, after is this branch's.

## What was wrong, and what missed it

- **The 300px cap was Astryx's, and nobody had opened these two lists at the smallest phone.** Every spec that opens them (`languages.spec.ts`, `join.spec.ts`, `account.spec.ts`) checks the rows' words, tags and direction; none checked that a row can be seen. The fit audit looks at the closed screens and at what a story draws open. The new spec is the first thing that measures the open list.
- **The proof that it fails on main is on the assertion, not on a wait.** The wait is for the list to be open with seven rows on screen and still for two frames, which main satisfies. On main's build, all 8 cases fail on the check itself, for example `ARالعربية: outside its list (815–863 in 523–823), off the screen (815–863 of 844)` and `the list scrolls (344px of rows in 300px)`.
- **Nothing in `apps/web/e2e` measured the old list.** Grep for 300, `max-height`, `scrollHeight`/`clientHeight` and list scrolling: no spec asserts a list's height or that it scrolls; the specs that touch a combobox or an option (`account`, `case-manager-pass`, `directory`, `join`, `languages`, `places`) check words, tags and direction, and still pass.

## Decisions made

- **Same dropdown, not a sheet.** All seven fit at 320×568 on both screens, so nothing here is a design change for Will.
- **Found by the rows, not by the screen.** The rule is keyed to `data-pam-tagged` so a future language list gets it without a change, and the City picker (and `Dropdown.tsx`, which I did not touch) keeps its cap. A list that gets an eighth language is still covered by the spec, which will say if it stops fitting.

## Verified

- **The new spec, on main `62ba50e4`'s build (`build:e2e`), all three projects: 24 of 24 fail, every one on the check** ("rows the list hides, cuts off or lets run off the screen"), none on the wait (classified from the JSON report). On this branch's build, `9a6f0949`: **24 of 24 pass** (narrow-320, dark-320, iphone-se-viewport).
- **The whole e2e suite on this branch's build, all three projects: 2105 passed, 19 skipped, 0 failed** (37 minutes). The skips are the specs' own: 18 `alerts.spec.ts` tests that are skipped while the alerts are live, and one `trips-real-account.spec.ts` test that runs only at the narrowest phone. The City picker's specs (`area-picker`, and the City field in `join`) are in that run and pass; `Dropdown.tsx` is not changed.
- **Measured by hand on both builds** (`main` → this branch), the list's box and whether it scrolls: Sign in globe 320×568 and 390×844: 76–376, scrolls, Russian cut and Arabic hidden → 76–432, no scroll, all seven rows (380–428 is the last); Sign up at 320×568: 159–459 → 115–459; at 390×844: below the field, 523–823, Arabic at 815–863 off an 844px screen → above the field, 115–459.
- **Storybook** (built at `9a6f0949`, stub env): the Sign in story's globe and the LanguageField story's list, at 320×568: 7 of 7 rows in the list, nothing to scroll (the older build: scrolls, last row cut). Fit audit, 7 languages, 320×760 and 320×568: the 17 language stories and the 6 sign-in stories, **0 findings**.
- Unit tests: `@pam/ui` 130 pass, `@pam/web` 188 pass, `@pam/config` 1375 pass; `tsc` clean in `@pam/web` and `@pam/ui` at this commit.

## Left undone

- **Native readers** as before (`docs/before-launch.md`); this change has no new words.
- **a98** (Calendar Privacy lines, drafted, Sage's `03a2ed14`), **a91**, **a84/a86**, **a93**: waiting on Will.
- **W2, W3, W4 of the same run-through** are not mine (W4's words are next: Nico's "speaking can't start" lines, six languages, once Mira sends his SHA).
- Not covered by this change, as Iris says: a real finger scroll in a list, and VoiceOver and TalkBack, which need Will's phone.

## Needs a human

- Will's phone for the finger scroll and the screen readers; nothing for the fix itself.

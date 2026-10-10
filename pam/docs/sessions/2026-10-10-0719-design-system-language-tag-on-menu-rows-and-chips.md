# 2026-10-10 — Design system & Storybook (Dot): a language tag on menu rows and choice chips

**Branch:** `claude/pam-design-language-tag` · **Lane:** Design system & Storybook

Job 1 of two from Mira (the merge desk), quoting Will, 10 October 2026: "add Language
abbreviation in english at front so we know what language before it says the language in their
language. Always keep these abbreviations in english." Mira added `lang` and `valueTag` in the same
pass, from Lena's second finding. Lena (Languages) codes against the names `tag`, `lang`, `valueTag`.

## What changed

- **`@pam/ui`:** `MenuItem` takes `tag?`, `lang?`, `valueTag?`; a `ChoiceChips` option takes `tag?` and
  `lang?`. New `OptionTag.tsx` holds the tag cell and the language markup both components use.
- **Stories:** `MenuList` gets Language tags (English, Arabic, Spanish) and Value tag; `ChoiceChips`
  gets a story file of its own for the first time (Default, with language tags, Arabic).
- **Tests:** `test/option-tag.test.tsx`, 9 tests, 2 of them the before/after snapshots (below).
- **D-451**, and screenshots in `docs/design/language-tag/` (light, dark, Arabic, chips, value tag).

## What was wrong, and what missed it

- **I used `text-align: match-parent` and it did nothing.** Chromium does not support it
  (`CSS.supports` is false in Chrome 141), so in Arabic the tags sat at the wrong end of their
  cell, leaving a gap beside the icon. Unit tests cannot see it (jsdom has no layout) and the
  storybook build passes; only a screenshot at 320px in Arabic showed it. It is now plain
  `text-align: start` on a cell that keeps the row's direction, with the tag in an inner
  `<bdi dir="ltr">`. The tests check that structure; a browser still has to check the look.
- **I cited a decision number I had guessed.** The code comments said D-449; the claim came back
  D-451 because two other sessions had taken 449 and 450. Caught because I read the output of
  `pnpm claim` rather than assuming; fixed in five files before anything was pushed as ready.
  Lesson: write the number after the claim, not before.
- **The before/after snapshot first failed on the wrong thing.** StyleX's dev-only
  `data-style-src="file:line"` names the line a style was written on, so adding lines above it
  changed every row's markup. The failure was real output, not a regression. Stripped in the test,
  and the baseline re-recorded from `main`'s untouched files (set aside, run, restored) so the
  comparison is true before and after.
- **My own shell killed itself.** `pkill -f audit-language-fit` matched the command line of the
  shell that ran it (exit 144), so the merge after it never ran and I thought the audit was stopped
  when only the shell was. Checked with `pgrep` before going on.
- **The cell was too wide at first** (4.4em, 53px, for tags that measure 14 to 39px). Measured
  every tag in a browser and set 3.6em.

## Decisions made

- D-451 — the tag cell (3.6em, `aria-hidden`, left to right, at the start), where `lang` goes on a
  row and on a chip, and `valueTag` as an auto-width tag rather than the fixed cell.

## Verified

| Check | Result |
|---|---|
| Untagged `MenuList` and `ChoiceChips` markup against a snapshot recorded from `main`'s unmodified files | identical (ignoring StyleX's dev-only `data-style-src`) |
| `pnpm --filter @pam/ui test` / `typecheck` | 116 pass / clean (11 files; `option-tag.test.tsx` adds 9, 2 of them snapshots) |
| `pnpm --filter @pam/web test` / `typecheck` | 48 pass / clean |
| axe (structure) on a tagged `MenuList` and tagged `ChoiceChips` | no violations; colour contrast and target size are the browser run |
| `build-storybook` on the merged tree | passes |
| `audit:fit` on the 12 new and changed `MenuList`/`ChoiceChips` stories, 7 languages | 0 new in a language |
| `audit:fit --known`, full run on the merged tree (`main` at `a5bf393` plus this branch), 471 stories × 7 languages | 26 new in a language, 26 accepted, **0 not accepted**; English baseline 119; the same figures as before this change on 464 stories |
| Browser a11y suite (Playwright), colour contrast of the tag in light and dark | **not run**; seen in screenshots only. Contrast of `--color-text-secondary` at 12px is the thing to check |
| `pam-user-flows` map | no screen added or rewired: not updated |

## Left undone

- **The contrast of the tag** (12px, `--color-text-secondary`) in both themes is looked at, not
  measured. The Playwright a11y suite measures it once a screen that uses `tag` exists.
- **Nothing uses `tag` yet.** Lena's Language list, sign-up and Profile will. Until they do the
  stories are the only place it shows.
- **The Explore pseudo-language clamps and the `ru` limited-account overlap Mira saw on her run**
  did not appear on mine: my run is the seven languages, not the pseudo-language, so the clamps are
  not in it, and the ru overlap's key is accepted in this branch's known list. Job 2 (a scroller
  is a clip) is the fix for the overlap and is not started.

## Needs a human

- Mira / Will: whether `valueTag` should be the fixed-width cell after all (D-451 says why it is not).

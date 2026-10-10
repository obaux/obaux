# 2026-10-10 — Design system & Storybook (Dot): Points badge names wrap

**Branch:** `claude/pam-design-badge-names` · **Lane:** Design system & Storybook

Small job from Mira (10 October): the badge names on the Points screen were trimmed with an ellipsis, in
English too ("Cornerstone", "Torchbearer", "Homecoming" are 74, 72, 80px in a 67px column). Her decision: keep
four columns; the name wraps (`white-space` normal, `overflow-wrap: anywhere`, `hyphens: auto`), the row
grows, never an ellipsis; no new words.

## What changed

- `app/points/page.tsx`: `badgeName` loses `overflow: hidden`, `text-overflow: ellipsis`, `nowrap`; gains
  `overflowWrap: 'anywhere'` and `hyphens: 'auto'`.
- `scripts/fit-known.json`: 8 entries for `member-created--points` removed (7 pseudo ellipsis, 1 pseudo overlap
  between two badge names); nothing added.
- Changelog fragment. No decision file: Mira's call, one style rule, nothing a later session would
  reasonably reverse without reading the line's comment.

## What was wrong, and what missed it

- **The English baseline hid it.** Three names were trimmed in English, so the audit listed them as "the
  design's own" and nobody looked. The audit's baseline rule (D-448's family) is right for translation
  defects and wrong as a reason not to look at the baseline: a defect there still breaks the "wrap, don't cut"
  rule. Raised by Piper through Mira only because pseudo showed seven more.
- **Headless Chromium here does not hyphenate.** In the screenshot "Cornerstone" breaks as "Cornerston / e"
  at the column edge; on a phone with hyphenation dictionaries `hyphens: auto` breaks it at a syllable. I
  have not seen the syllable break; it is the browser's, and the backstop (`anywhere`) is what guarantees
  nothing is cut either way.

## Verified

| Check | Result |
|---|---|
| `audit:fit --known`, points stories, 7 languages + pseudo at 320px | 0 new in a language, English baseline 0 for these stories (it was 3), 0 not accepted |
| Screenshots, Points story: English 320 light, pseudo 320 dark | names wrap onto two lines, rows grow, nothing cut. (Also taken: ru 375 light, ar 375 dark; looked at the first two) |
| `tsc`, web build, `e2e/points.spec.ts` on three projects | clean, 18 pass |
| Storybook build | passes |
| Full Playwright suite | not run: one style rule on one screen, per Mira's instruction (once per READY) |

## Left undone

- The syllable hyphenation on a real phone (above).
- The user-flow Figma map (next).

## Needs a human

- Nothing.

# 2026-10-10 — Design system & Storybook (Dot): the fit audit treats a scroller as a clip

**Branch:** `claude/pam-design-scroller-clip` · **Lane:** Design system & Storybook

Job from Mira, from Nico's finding: the conversation overlaps in `audit:fit` changed from run to run, so
the accepted list kept going stale. D-467. Mira added one item from Piper: the Points ladder's badge names.

## What changed

- **`scripts/audit-language-fit.mjs`:** a scroller with something to scroll to is a clip box on its scrolling
  axis. A line wholly outside it is skipped (not inside, outside, cut or overlapping); a line partly outside
  is a scroll position, not a cut. Hard clips (`hidden`/`clip`) are judged as before, per axis.
- **`scripts/fit-known.json`:** 19 entries removed (13 in the seven languages, 6 in the pseudo-language), all
  overlaps in conversation threads that nothing reports now; 16 added (below), none for a thread.
- **D-467.**

## What was wrong, and what missed it

- **I wrote the decision number into a code comment before claiming it, again** (D-464 for D-467), the same
  slip as D-449 for D-451 in the language-tag session. Caught at the claim; fixed before the push. The rule
  I wrote down last time ("write the number after the claim") was not followed. The claim first, then the
  comment.
- **My first version made things worse**: it counted a scroller's axis the way it counts a hard clip, so a
  thread that hides sideways and scrolls up and down produced a new `cut` in every language. Running the old
  and the new rule on the same build, and diffing kind by kind, is what showed it; the first `--match` run
  looked clean.
- **The thread header was not a "layer".** I expected `fixed`/`sticky` to separate the header from the
  thread (the audit already skips pairs in different layers); it is a plain sibling above the scroller, which
  is why the scroll box, not the layer, is the right place for the rule.

## Decisions made

- D-467 (above).

## Verified

| Check | Result |
|---|---|
| Old rule against new, same build, 497 stories x 7 languages | new in a language 41 to 19; overlap 22 to 0; the 14 `cut` and 5 `ellipsis` the same ones; English baseline 133 to 122 (11 overlaps in threads, nothing else) |
| A screenshot of `limited-account--conversation` at 320px | header clear; the thread runs under a clean top edge |
| Known list: entries a thread overlap no longer reports | 13 + 6 removed; checked the pseudo ones with a pseudo run over `conversation` and `thread` stories |
| Full `audit:fit --known` on the merged tree (517 stories x 7 languages + pseudo) | 102 new in a language, 86 accepted, **16 not**; all 16 then looked at and accepted (below); re-checked on the affected stories: 0 not accepted |
| Playwright, unit tests | not run: only the audit script, its list and records changed |

## The 16 accepted at the end

None is from this change: the old rule reports the same cuts. 12 are the saved places strip on the old Home
(kept for staff by D-456): the next card peeks in at the right edge, so what the audit calls a cut is the peek
(pt-BR "Trabalho e dinheiro" and the pseudo-language, on six case-manager and program-lead Home stories). 4 are
Explore's place card keeping to its line count in the pseudo-language (Piper's card; seen in a screenshot).

## Points ladder, pseudo, from Piper (via Mira)

The 7 pseudo ellipsis hits on the badge names (Scholar, Craftsman, ...) were already accepted in the list; the
three Piper called unaccepted were not new in a language: **English trims "Cornerstone", "Torchbearer" and
"Homecoming" too** (74, 72 and 80 against a 67px column). The names sit in a four-column grid
(`badgeName`: 13px, `nowrap`, `text-overflow: ellipsis`, `app/points/page.tsx`). That is the design's own
defect, in the English baseline, and the rule in `CLAUDE.md` is that text wraps and grows rather than being
cut. I did not change Piper's screen. Options: let the name wrap (`white-space: normal`, `overflow-wrap:
anywhere`, `hyphens: auto`) and give the row more height, or three columns.

## Left undone

- The Points badge names (above): Piper's screen; Mira to say who changes it.
- The user-flow Figma map (next job).

## Needs a human

- Mira: who takes the Points badge-name wrapping.

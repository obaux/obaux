# D-467 — The fit audit treats a scroller as a clip

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-scroller-clip`

Nico (Messages) found it, Mira (merge desk) put it in the queue: the audit's conversation overlaps change
from run to run, because it was counting lines the thread had scrolled away.

## What was wrong

`clipsOf` in `scripts/audit-language-fit.mjs` counted only `overflow: hidden | clip` as a clip. A
conversation thread is a scroller (`overflow-y: auto`, `.astryx-chat-layout`) that begins below the
header. The earlier messages are above it, wholly outside its box: scrolled away, drawn nowhere. The
audit measured their layout position anyway and reported them as overlapping the header's name and
subtitle ("Teresa ⟷ Documento de Google"). Which message happened to sit behind the header depended on
the language and the story's clock, so the entries in `fit-known.json` went stale from run to run (D-448
accepted five of them by hand; Mira accepted more at the Block merge).

## What was decided

A scroller with something to scroll to (`overflow` `auto`/`scroll` on an axis with
`scrollWidth > clientWidth` or `scrollHeight > clientHeight`) is a clip box for that axis.

- A line **wholly outside** a scroller's box on its scrolling axis is not on the screen: it is skipped,
  and counted as neither inside, outside, cut nor a candidate for an overlap.
- A line **partly** outside is a scroll position, not a cut (a card half under the top edge of a thread is
  the thread working); it is not reported as a cut, and it still counts for an overlap, so two lines that
  really collide in view are still found.
- A hard clip (`hidden`/`clip`) is judged as before, per axis. A box that hides one axis and scrolls the
  other gets each axis its own rule.

## What it changed (same build, old rule against new, 497 stories x 7 languages)

| | old rule | new rule |
|---|---|---|
| new in a language | 41 | 19 |
| of which overlap | 22 | 0 |
| cut / ellipsis | 14 / 5 | 14 / 5, the same ones |
| English baseline | 133 | 122: the 11 overlaps in the same threads, nothing else |

Every dropped line is an overlap in a conversation thread (`conversation`, `conversation-file-refused`,
`conversation-with-a-program`, the Block and limited-account conversations, the case manager's and super
admin's thread). No `cut`, `ellipsis`, `clamp`, `spill`, `scroll` or `isolate` was added or removed. A
screenshot of the limited-account conversation at 320px shows the header clear and the thread running
under a clean top edge.

`fit-known.json` loses the entries nothing reports now: 13 for the seven languages and 6 for the pseudo-
language, all overlaps in threads (161 to 142). Nothing was added.

## What a later session might want to reverse

- A line only partly in a scroller still counts for overlap. If a scroller's own edge ever draws over text
  in view (a gradient fade, a sticky header inside the scroller), that is a real overlap and is reported.
- A scroller that does not overflow (nothing to scroll to) is not a clip, so text running out of it is
  still found.

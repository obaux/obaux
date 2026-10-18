# 2026-10-17 — design press layer a99

**Branch:** `claude/pam-design-press-layer` · **Lane:** design system (Dot)

## What changed

D-602, the press layer: rows darken while held; cards, tiles and buttons press in (0.97) with a shade on a card; reduced motion keeps the shade and drops the scale. `globals.css` (a new `pam` layer block with `--pam-press-*`), `Press` marked `data-pam-press`. Built on b60's row taps (main).

## What was wrong, and what missed it

## Decisions made

## Verified

New `e2e/press-layer.spec.ts` (4 tests): fails on main on each claimed assertion, passes on the three projects. Full e2e: see the READY. Pictures `pressed-{light,dark}.png` (held press, before over after: a row, a tile, a button) and `press-{light,dark}.webm` (left before, right after).

## Left undone

Will's yes on card a99. A lesson from b60 kept: the spec's proof fails on the assertion it claims (checked), and the `data-row-taps` wait has nothing to do with this spec.

## Needs a human

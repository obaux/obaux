# 2026-10-11 — design dark info alert

**Branch:** `claude/pam-design-dark-info-alert` · **Lane:** Design system & Storybook

## What changed

Dark `--astryx-theme-neutral-color-status-muted-accent` `#88bcff3D` → `#88bcff1A` (24% → 10%) in `pam.css`; `tokens` regenerated (no diff). Story Foundations › Dark blue alert (before/after). Unit test `info-alert-dark.test.tsx`. D-513.

## What was wrong, and what missed it

Will found the dark info Banner too blue. Mira's note guessed `--color-background-blue`; that is the badge ground. The Banner's ground is the status-muted-accent token. Banner draws no border, so there was none to keep.

## Decisions made

D-513.

## Verified

Contrast over the dark page: words 8.4:1, icon 7.3:1 (unit test, ≥ 7). `tsc`; ui unit tests; build-storybook; dark-320 a11y on the signed-out banner.

## Left undone

Other tones' grounds not dimmed. The compact alert on the wrong-code branch (D-510) draws no tinted ground, so it does not change.

## Needs a human

Will: look at Foundations › Dark blue alert (before/after).

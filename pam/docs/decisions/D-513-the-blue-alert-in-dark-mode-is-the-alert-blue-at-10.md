# D-513 — The blue alert in dark mode is the alert blue at 10%

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-dark-info-alert`

**Decided by:** Will, via the merge desk (11 October 2026, 03:03 UTC): "the blue alert use in dark mode is too blue. Let's dim that background to 10%."

**What.** The info tone of Astryx's `Banner` (the "You are signed out" line, an invite's "Dana invited you…", the no-lead note on a place) takes its ground from `--astryx-theme-neutral-color-status-muted-accent`. In dark it was `#88bcff3D` (the alert blue at 24%); it is `#88bcff1A` (10%) now, in `packages/ui/src/theme/pam.css`. Light mode is unchanged (`#b9d7ff`). It is one token, so every blue alert follows.

The words and the icon stay blue (`--color-text-blue`, `--color-icon-blue`), so it still reads as information. Banner draws no border; there was none to keep.

**Contrast.** Over the dark page (`#1B1B1B`) the new ground is about `#262B32`. The words (`#a1caff`) are 8.4:1 on it (AAA; they were 6.1:1), the icon (`#88bcff`) 7.3:1 (they were 5.2). `packages/ui/test/info-alert-dark.test.tsx` fails if the dark value stops being 10% blue or either falls under 7:1.

**Not changed.** `--color-background-blue` (`#253c5a`), which is the blue *badge* and document tile ground, not the alert's. The other tones' grounds. Storybook: Foundations › Dark blue alert shows before (24%) and after (10%), both dark.

**What a later session might reverse.** The 10%: a different step is a one-character change in that token. If the other tones should be dimmed to match, that is a separate, deliberate change.

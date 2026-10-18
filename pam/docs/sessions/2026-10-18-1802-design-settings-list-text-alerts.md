# 2026-10-18 — design settings list text alerts

**Branch:** `claude/pam-design-settings-list` (off `claude/pam-design-d608-badges`, which has `StatusBadge`; main 615e1078) · **Lane:** design system (Dot)

## What changed

- `SettingsList` and `SettingsRow` (`@pam/ui/SettingsList`): no card, rows under a thin line, the name, the `StatusBadge` under it, the switch at the end; logical directions only.
- `AlertsView` uses it (Nico handed the file over). Gone: the card, the STOP/HELP/rates line (`alerts.how`), the Privacy link (`alerts.privacy`, `alerts.privacy.label`). The label over the list is `alerts.kinds`; the badge is `common.comingSoon`. Built as if nobody can switch a text on without having agreed first (Lena and Nico confirming).
- Storybook: `Components/Lists/SettingsList` and Foundations › Patterns (the five rules).
- `alerts.spec`: five new or rewritten checks (the signed line; no card and thin lines; no STOP/rates line; no Privacy link; badge under the name).

## What was wrong, and what missed it

A card around a one-list screen, a badge beside a name that needs the room, and instructions repeated after consent: the first drawing followed the old card habit and nothing named it a pattern until Will did.

## Decisions made

D-615.

## Verified

On main's real build (615e1078, a worktree) the four new checks fail on their own assertion: `.astryx-card` count 1; "Reply STOP" count 1; the Privacy link count 1; the badge beside, not under (y 269 < 301). On this branch: alerts.spec 27 passed, 18 skipped (alerts not live), 3 failed = "the line over the list is the one Will asked for", red until Sage's words are in `alerts.kinds` (en.json still says "Kinds of texts"; I did not touch it). @pam/ui 130/130, tsc clean, `build-storybook` passes. Pictures: `docs/design/review/2026-10-18-text-alerts-list/` (member, case manager, program lead at 390 light, 320 dark, 390 Arabic; member and case manager at 320 in ru, es, pt-BR). In them, only the English line is drawn as Will wrote it; the other languages show their current line until Sage signs.

## Left undone

Sage's seven words for `alerts.kinds`; Lena retires `alerts.how`, `alerts.privacy`, `alerts.privacy.label`, `alerts.comingSoon`. If consent can be skipped, the first switch-on routes to the consent screen (the merge desk tells me).

## Needs a human

Will looks at the pictures before it ships.

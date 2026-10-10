# 2026-10-10 — Design system & Storybook: a baseline, and a fit audit that over-counted

**Branch:** `claude/pam-design-areachip-long-address` (a first baseline run sat on `claude/pam-design-chromatic-live`, local only, nothing on it) · **Lane:** Design system & Storybook

The first session in this lane under `docs/lanes.md`. Will told it Chromatic is live, then "You decide" on the first job, then "Go for it" to fixing the `AreaChip` long address. No component changed in the end.

## What changed

- **`scripts/audit-language-fit.mjs`:** a line an ellipsis trims inside its control is no longer also reported as a `spill` (D-448).
- **`scripts/fit-known.json`:** six defects looked at with screenshots and accepted, each with its reason.
- **`docs/decisions/D-448-…`:** the above, with the numbers.
- Nothing in `packages/ui` or the stories. A first attempt at `AreaChip` (wrap the plain label in the same shrinkable box the Arabic path has) was reverted: it changed no measurement because Astryx's `Button` already trims its label.

## What was wrong, and what missed it

- **I planned a component fix for a defect that was not on the screen.** The audit said the long address spilled in es, pt-BR and ru; I read that as a layout bug and edited `AreaChip.tsx`. The audit did not move. Only measuring the DOM (the label is already an `overflow: hidden` block) and a screenshot ("Cerca de 1231 N Broad St, North Phila…") showed the screen was fine and the detector was counting a trimmed line at its full width. Lesson for this lane: look at the story before editing the component.
- **I compared two different numbers.** I told Will the audit found "39, up from 29". The 29 in STATUS is defects *not in the known list*; 39 was everything found. By the like-for-like measure the count on merged `main` was 8 before this session's change and 0 after (D-448). The raw counts (39 on `16cd437`, 35 on `d4f325e`, 26 after) are a different measure and should not be set beside STATUS's.
- **One of my own reasons was wrong until I re-read it.** I wrote "sub-pixel" for the zh-HK file-name ellipsis; it measures 148 > 144. Corrected in the known list before pushing.
- **The known list already had the old spill entries** (8 for es, pt-BR, ru and ar), and they are now stale, never reported again. Harmless; I left them so the list changes only by what this session looked at.

## Decisions made

- D-448 — the fit audit does not call an ellipsis-trimmed line a spill. A call of the session's, not Will's; he can reverse it.

## Verified

| Check | Result |
|---|---|
| `build-storybook` on `16cd437` | passes (about 40 s) |
| `build-storybook` on `d4f325e` (Arabic merged) | passes |
| `audit:fit` on `d4f325e`, before | 35 new-in-a-language (464 stories × 7 languages), 8 not in the known list |
| `audit:fit` on `d4f325e`, after the change | 26, 6 not in the known list; exactly 9 `spill` entries dropped, no `cut`/`overlap`/`ellipsis` dropped; English baseline 140 to 119 (**the 21 not reviewed individually**) |
| `audit:fit --match` on the three affected stories with `--known` | 0 not accepted (limited-account 8/8, conversation-files 6/6, areachip 1/1) |
| `pnpm --filter @pam/ui test` / `typecheck` | 107 pass / clean (run before the component change was reverted; no component differs from `main` now) |
| `pnpm --filter @pam/web test` | 48 pass |
| Full `audit:fit --known` run after adding the six | **not re-run end to end** (three `--match` runs cover the stories that changed) |

## Left undone

- **STATUS.md not edited.** It has no section for this lane (it is one long document), and the rules say edit only your lane's section. The row for the Chromatic token (needs-a-human #28) still says it is owed; Chromatic is live (Will, 10 October). Someone should tick it: me, if Will names the section, otherwise the merge desk.
- **`docs/before-launch.md` has no Chromatic item**, so nothing to tick there.
- No changelog fragment: nothing a member sees changed.
- The full `audit:fit --known` run on the final tree, which is also what `pam-fit.yml` does on a pull request.
- Not fixed, outside the lane and in the English baseline: some English file names in the attachment lists are cut hard at the timestamp column with no ellipsis ("Free resume worksl"). Places & programs / Messages' screen.
- The user-flow map: nothing changed that rewires a screen, so no flow update.

## Needs a human

- Will: whether D-448's definition stands, and where STATUS's design-system section should live.
- Will: to ask the merge desk to merge this branch when ready. It touches only the audit script, its known list, and records, so no other lane's files; no migration.

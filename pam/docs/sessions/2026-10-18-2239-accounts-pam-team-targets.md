# 2026-10-18 — accounts pam team targets

**Branch:** `claude/pam-team-targets` · **Lane:** Accounts & invites

## What changed

- **C1 (Iris's b75 re-test):** Pam's hours lists the days as Astryx's `CheckboxList` (spacious, with dividers) instead of seven
  separate `CheckboxInput`s. Each day is a full-width row, about 49px tall, and the whole row is its target. The day names
  are 17px, a row's size. Before, each box was a 24×48 input on rows 32px apart, so the tap areas overlapped.

## What was wrong, and what missed it

- T5's spec measured the time fields but not the days, so the overlap went unnoticed until Iris measured it.
- **C3 needed no code.** The inbox's "Pam's hours" row and Home's "Messages to Pam" row are `MenuList` rows, 64px tall. Astryx
  draws the `<a>` only around the words, which is the 24px Iris measured, but `tapRows` (Will, 17 October) opens a row from a
  tap anywhere on it. The new specs tap 3px from each row's top edge and the row opens; they pass on the old code too, which
  is the point. Making the `<a>` itself fill the row would mean changing `MenuList` in `packages/ui` (Dot's lane), which
  affects about 54 rows. I've offered that to Mira rather than making the change.

## Decisions made

None that need a file.

## Verified

- `pam-team.spec`: the C1 spec fails on the old screen (3 of 3 projects) and passes now. The C3 specs pass. With message-pam
  and super-admin-pass: 180 passed, including axe on `/pam/hours/`.
- Web unit tests: 214 passed. tsc is clean. Storybook builds.
- Pictures: `docs/design/review/2026-10-18-pam-team-targets/pam-hours-{390-en,320-dark,320-ar}.png`.

## Left undone

- If the merge desk wants every row's `<a>` to fill its row, that is a `MenuList` change for the design-system lane.

## Needs a human

Nothing.

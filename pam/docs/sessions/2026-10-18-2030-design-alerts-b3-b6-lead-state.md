# 2026-10-18 — design alerts b3 b6 lead state

**Branch:** `claude/pam-design-alerts-b3-b6` (off main e1a2cbec, b74) · **Lane:** design system (Dot); AlertsView and SettingsRow are mine since D-615

## What changed

Iris's b74 re-test (`docs/research/2026-10-18-retest-b74.md`), three items:
- **B3.** A failed write put "Something went wrong" at the foot of the page (534-704px on a 568px screen, below the fold). `SettingsRow` takes a `below` slot; `AlertsView` keeps `failedKind` and draws the Notice under the row that failed, full width.
- **B6.** Only the 40px switch worked a setting. The row's name is now its `<label>` (`labelFor` is Astryx's own id for the input, read in the switch's ref callback): a tap on the name works the switch, still one control named once.
- **Lead state.** Confirmed from the code: after the last alert went off, `AlertsView` set its own `consent` to false while the database keeps the yes (Nico, 21b053e9), so turning one back on in the same visit opened the agree screen. That branch is gone; the screen's yes follows the database.

## What was wrong, and what missed it

The lead-state case was in a held block: alerts are not live, so no spec ran it, and Nico's change to the database side did not change this view.

## Decisions made

None; D-615.

## Verified

Specs in `alerts.spec`: B3 (member, texts_live on, writes refused, 320x568: the Notice is under the row and inside the screen), B6 (a tap on the name turns the switch off and writes once; one switch with that name), and the lead case (turn the last off, one back on: no agree screen, two writes). Fail-first on main e1a2cbec's real build, with `ALERT_TEXTS_LIVE` set true only in that scratch build so the lead case can run: B3 (Notice bottom at 694px, expected <= 568), B6 (switch still on), lead (one write, not two; the second tap went to the agree screen) all fail. On this branch: alerts.spec 57 pass, 21 skipped (the held blocks); with the flag true in a scratch build the live block passes, including the lead case (the only red there is the "Coming soon at the bottom" test, which needs unbadged rows to be absent and so cannot hold when everything is live). The flag was put back to false (not committed). tsc clean. Pictures: `docs/design/review/2026-10-18-alerts-b3/` (B3 at 320x568, before and after).

## Left undone

The lead case runs only when alerts are live (the day `ALERT_TEXTS_LIVE` flips); it is in the live block, so it is unskipped then.

## Needs a human

Nothing.

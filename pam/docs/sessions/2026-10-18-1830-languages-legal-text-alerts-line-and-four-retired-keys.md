# Languages & Legal · the Text alerts line in six languages, and four keys retired (18 October 2026, ~18:30 UTC)

Lena, on `claude/lena-text-alerts-kinds`, on Dot's `claude/pam-design-settings-list` @ `67786328` (D-615). Asked by Mira at 18:22: replace Dot's unreviewed drafts of `alerts.kinds` with my translations, and retire each of `alerts.how`, `alerts.privacy`, `alerts.privacy.label` and `alerts.comingSoon` that has no reference outside the bundles.

## What changed

- **`alerts.kinds`** ("Please choose when you'd like to get a text.", Will's line with two words changed, signed by Sage at `f0279243`). Dot's drafts for Spanish, Portuguese, both Chinese and Russian were word for word the ones I had drafted; only the Arabic differed ("تصلك" for "تتلقى"). I kept my Arabic, which uses the same verb as `reminders.agree` ("تلقي الرسائل النصية"). Text alerts is a screen members and staff share, so the register is the one its other keys already use: tú, você, 您, вы.
- **Four keys are gone from `en.json`, the six bundles and the ledger:** `alerts.how` (the STOP/HELP/rates line, which Will took off because people see it when they first agree), `alerts.privacy` and `alerts.privacy.label` (the Privacy link: no legal links on task screens), and `alerts.comingSoon` (the badge now uses `common.comingSoon`).
- 28 bundle lines and 24 ledger lines for the four; `copy:ack` pruned and re-acked the Arabic `alerts.kinds`; `copy:status` in step; `@pam/config` suite 65 files, 1,447 pass (1 skipped, 1 todo).

## How I know nothing renders the four

`git grep` over `apps` and `packages` (not the locale files) finds no reference to any of the four names. The only dynamic builder is `alerts.${kind}` in `AlertsView.tsx`, over the kinds `booked`, `changed`, `message`, `trip`, `visit`, `closed` and `connect`. The screen's literal keys are `alerts.title`, `alerts.saved` and `alerts.kinds`.

## Checked

The 320 audit of the six Text alerts stories (member, case manager, program lead, stopped, and the two "agree first" ones), in seven languages at 320×760 and 320×568, and English and Arabic at 390×760: **0 findings new in a language at all three sizes**. A separate check opened the four list stories (member, case manager, program lead, stopped) in each of the seven languages and found the `alerts.kinds` line in the page text every time (28 of 28), so the clean audit is of the real line.

## Left undone

`alerts.privacy` was also on the consent screens' list in Sage's first plan (`1c09f1de`); she and Mira then took the link off those too (`2a600d73`), so nothing on Nico's side needs it. A native reader for the line (before-launch, with the rest of D-608).

## Needs a human

Nothing.

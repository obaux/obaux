# Languages & Legal · "A reminder before your trip" in six languages (18 October 2026, ~19:15 UTC)

Lena, on `claude/lena-alerts-visit`, on Sage's `claude/sage-signs` @ `9f550846` (merged with main). Asked by Sage at 18:55 after my carrier answer on the short row names (18:4x): the one time-based row, `alerts.visit`, did not say it was a reminder.

## What changed

- **`alerts.visit`** ("A reminder before your trip", the only changed key) in es, pt-BR, zh-CN, zh-HK, ru and ar: *Un recordatorio antes de tu visita*, *Um lembrete antes da sua visita*, *预约之前的提醒*, *到訪之前的提醒*, *Напоминание перед вашим визитом*, *تذكير قبل زيارتك*. The words for "reminder" and "visit" are the ones `reminders.what.1` already uses. Register as the other `alerts.*` keys: tú, você, 您, вы.
- `copy:ack` re-acked the six; `copy:status` in step; `@pam/config` suite 65 files, 1,447 pass (1 skipped, 1 todo).

## Checked

`git grep` over `apps` and `packages` (not the locale files) finds no reference to `alerts.visit`: the screen builds it as `alerts.${kind}`. No e2e or test quotes the old "Before your trip" or its translations (Sage checked the English; the translations are not quoted either).

## Left undone

The 320 audit: this branch has no list of text kinds to draw (that is Dot's D-615 and Nico's consent screens, on other branches), and the new line is longer than the old one in every language. I run it on the merged tip when Mira sends it (Text alerts and both agree screens, 320×760, 320×568, Arabic at 390).

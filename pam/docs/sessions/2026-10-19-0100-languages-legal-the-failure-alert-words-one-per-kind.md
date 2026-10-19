# 2026-10-19 — languages & legal: the failure alert's words, one per kind (D-618)

**Branch:** `claude/lena-d618-words` (off main 9aac8b6f, Sage's `claude/sage-signs` merged) · **Lane:** Languages & legal (Lena) · from Mira (00:22) and Sage (signed `ab6b9cc4`, mapped to keys `6905e0e3`)

## What changed
- **22 keys** in English (as signed) and es, pt-BR, zh-CN, zh-HK, ru, ar: eight kinds (`offline`, `timeout`, `signedOut`, `notAllowed`, `tooMany`, `changed`, `gone`, `server`) with `.title` and `.body`; `again.title` and `again.body` for the second failure in a row; the four button words `action.retry|signIn|reload|help`. `notice.malfunction` is untouched (the line for a failure nobody could classify).
- **House words kept:** "You're offline" and "You are signed out" use the existing `notice.offline.title` and `signin.signedOut` wording; the buttons are each language's own "Try again" (`messages.thread.tryAgain`), "Sign in" (`signin.code.action`) and "Get help" (`profile.menu.help`); "tap" is Toca / toque / 点按 / 點按 / нажмите / اضغط as elsewhere; member screens, so tú, você, 您, вы.
- **Fit at 320 (measured, not drawn):** the English text group is 232px wide (320 less the banner's 16px sides, the 48px dismiss and the gap), titles 15px/600 and lines 14px. Every title is one line and every line is two lines or fewer in all seven languages, as in English. To get there: Russian "offline", "timeout", "signedOut", "changed" and "server" lines were shortened (the slow-connection line became a question: «Связь медленная? Проверьте и нажмите «Попробовать снова».»), the Russian "not allowed" title is «Аккаунту это недоступно», and the Portuguese "server" line is shorter. Dot's banner story, when it lands, is the real check.

## Open
- Native readers: the Russian slow-connection question, "Show the latest" (Mostrar lo último / Mostrar o mais recente / 显示最新 / 顯示最新 / Показать актуальное / عرض الأحدث), and the `notAllowed` titles.
- The words are not used by any screen until Dot's and Nico's branches land; an audit of the real banner (`claude/messages-failure-kinds` and Dot's alert) at 320 in ru and ar goes with them.

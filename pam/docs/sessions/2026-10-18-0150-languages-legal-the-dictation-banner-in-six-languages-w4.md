# 2026-10-18 — languages-legal: the dictation banner's ten lines in six languages (W4, D-603)

**Branch:** `claude/lena-dictation-words` (stacked on Nico's `claude/messages-dictation-cant-start` @ `8f7102c7`) · **Lane:** Languages & legal (Lena) · written Sunday 18 October, about 01:50 UTC. Read `2026-10-17-2239-messages-dictation-cant-start.md` (Nico's) first.

## What changed

- **Sage's ten lines (ledger `a2703793`, with her two edits to the hints at `8f7102c7`) are in es, pt-BR, zh-CN, zh-HK, ru and ar:** `messages.thread.dictate.problem.{blocked,noMic,offline,language,failed}.{title,hint}`. Nico's English stand-ins in the six bundles are replaced; `copy:ack` records them and `copy:status` is in step. I touched only the six bundles, the ledger and one test; `en.json`, `ThreadView.tsx` and `dictationProblem.ts` are Nico's and are not changed.
- **Register:** the sibling banner ("Pam can't send that file") is the model, so the member side: tú (es), você (pt-BR), 您 (zh), вы (ru). The hints' "type your message" says *escribir / escrever / 输入 (zh) / написать / كتابة*, as the box's own placeholder ("Write a message") does; "tap" is the bundle's own verb (*tocar / tocar / 点按 / нажать / الضغط*).
- **"Pam" stays Latin** in the titles that name it, in every language. Arabic: «لا تستطيع Pam استخدام الميكروفون»; the hint has «اسمح لـ Pam باستخدام…», the same «لـ» + space the Arabic booking-refusal line uses.
- **A pin, `test/dictation-problems.test.ts` (12 tests):** reads the kinds from `apps/web/src/lib/dictationProblem.ts` (the `DictationProblem` union), and for each kind requires a title and a hint in all seven languages with no placeholder, and in the six not equal to the English. A sixth kind that nobody has written words for fails there, in six languages, instead of showing a blank banner. It fails on Nico's tip (the English stand-ins) and passes on this branch.

## What was wrong, and what missed it

- Nothing found in Nico's wiring. One thing to know for the banner's height: it is a warning banner with a 172px text column at 320px (the close button takes 48px, the icon 24px), so the longest hint, `blocked.hint`, is four lines in English, three in Chinese, and five or six in Spanish, Portuguese, Russian and Arabic, 104px to 184px of a 568px screen. Nothing is cut and nothing reaches the message box; it wraps and grows, as the rule says.
- `copy:status` cannot see an English stand-in that was acknowledged as a translation (the lesson of 12 October); the new pin is the check for these ten lines.

## Decisions made

- The lines are translated for meaning, not word for word: "can't listen in your language" is *fails to understand speech in your language* in zh and ru and ar (*听不懂您的语言*, *не понимает речь на вашем языке*, *فهم الكلام بلغتك*), because "listen in a language" is not how any of them says it. "The microphone didn't start" is *no empezó a funcionar / não começou a funcionar / 没有启动 / не включился / لم يبدأ … بالعمل*.
- `offline.title` says *voice input / speaking / falar / 语音输入 / голосового ввода / التحدث* needs a connection, as the English does; it does not say which network.

## Verified

- Built at `f4d7e260` (Nico's tip + the six bundles + the ledger; stub env, `build:e2e`) and measured the banner by the DOM for all five kinds in all seven languages at 320×568 and 390×844 (a throwaway spec over Nico's own fake recogniser, deleted before this commit): **14 of 14 cases, 70 of 70 banners: nothing clipped, nothing past the screen's side, no sideways scroll, never over the message box, the close button 48×48.** Banner heights at 320×568: en 104–144px, es 104–164, pt-BR 124–184, zh-CN/zh-HK 64–104, ru 104–184, ar 84–164. The longest in each language is `blocked`.
- Nico's own twelve cases (`messages.spec.ts`, "speaking a message that cannot start") on narrow-320, dark-320 and iphone-se-viewport: **36 passed, 0 failed** (they assert the English).
- `@pam/config` tests 1375 passed plus the 12 new; `copy:status` in step. No code changed, so no `tsc` run.
- Pictures: `docs/research/shots/2026-10-18-lena-w4-320-{en,es,pt-BR,zh-CN,zh-HK,ru,ar}-blocked.png` (the longest hint at 320×568).

## Left undone

- **Native readers** for the ten lines in six languages (`docs/before-launch.md`).
- The banner has no Storybook story, so the fit audit cannot see it; the measurement above was by the DOM. If Nico adds a story for the five kinds, the audit covers it; I would add `messages--dictation-problem-*` stories myself if he prefers.
- pt-BR `blocked.hint` ends on a one-word line ("disso.") at 320px; cosmetic.

## Needs a human

- A person who reads each language to look at the ten lines, and Will to tap the microphone with the speech service refused on his phone (Mira's plan for the English).

# 2026-10-18 — languages & legal: the error log's words and the reporter check

**Branches:** `claude/lena-d616-words` (on Ava's `claude/pam-problems-list` @ d2454fa0, Sage's `claude/sage-signs` @ 891682a1 merged) and `claude/lena-app-errors-pins` (merged with Nico's `claude/messages-app-errors` @ 4096aba2) · **Lane:** Languages & legal (Lena) · from the merge desk (Mira 21:57, Nico 22:01)

## What changed
- **23 action names** `appError.action.<key>`, one per key of Nico's `APP_ERROR_ACTIONS` @ 362c0d27 (Sage 34f9444d for 17, f12e6544 for `function.dispatch-sms`, 689f92a6 for the five accounts keys, which supersedes 264ba3b8), **the bell row** `notify.app_error` / `.one` (Sage 1d0d2cd5) and **Ava's seven `problems.*`** (Sage 891682a1), in es, pt-BR, zh-CN, zh-HK, ru and ar. English for the names and the bell row added to `en.json` as signed (no branch had it).
- Each name is a phrase in the language's own style (es/pt-BR infinitive, ru/ar noun of the action, zh a plain verb phrase); the six text-alert switches name the alert by the row's own words (saved place, new messages, booked visit, changed booking, planned trip, trip reminder). The buttons are quoted as the agree screen says them ("Ahora no", "Agora não", 暂时不用 / 暫時不用, «Не сейчас», «ليس الآن»).
- **Tests:** `problems.times.one` joins `NO_PLURAL_VARIANTS` (English picks the singular itself, as with the Pam inbox); `copy.test.ts` knows that Russian's `.one` writes the number where English `.one` writes none (`notify.app_error.one`) and that the two Arabic duals say "twice" without the digit.
- **Test:** `app-error-action-names.test.ts` reads Nico's list and fails if a key has no name in any of the seven languages, a name has no key, or a name ends in a full stop or holds a placeholder. It skips when `src/appErrors.ts` is absent.
- **Pins:** merged Nico's new tip into `claude/lena-app-errors-pins` (STATUS conflict kept both). Sage's edited Privacy line, put into `en.json`, passes all 15 pins (thirty days, only the Pam team, not "anonymous", "no name, phone number, account, message or place", no address/IP/location/device model).

## What I checked in Nico's reporter (4096aba2)
- `reportAppError.ts` sends the screen's path, the build, the platform, the language and the closed-list action; the code is cut to three digits, five characters or `offline`/`timeout`/`unknown`, so a message passed by mistake becomes `unknown`. The queue is in memory (ten, oldest dropped) and nothing is written to the phone. The only host is the project's own `rpc/report_app_error`.
- `dispatch-sms/reportError.ts` posts to the project's own URL with the key the function already holds; it sends `/`, the action, a three-digit status and `server`. No new host; the host guard is green.

## Open / for the people who build the rest
- **The bell shows the raw key.** `notifications/page.tsx` `describe()` passes `bodyVars` as they are, and the database puts the action *key* in them (`{action: 'messages.send', count: 1}`). It needs a case like the others: `t(bodyKey, { ...bodyVars, action: <plain name> })`, with the key as the fallback until it has a name.
- The line lists the roles "a member, a case manager, a program or not signed in"; the log also holds `super_admin` and `service` (Sage's note: "the Pam team" covers them). Not a gap, but Will may prefer "or on the Pam team" in the list.
- Native readers: the six `…text alert` names (all languages) and the Russian «Изменение SMS-уведомления о…» phrases.

## Later the same night
- Piper's action names (Sage ec7c8426, 23:40) on `claude/lena-d616-names-places`, off main 9aac8b6f: seven of the nine, English as signed, six languages. The calendar pair (`calendar.link`, `calendar.link.off`) was taken out at Mira's word (23:45): Piper converts those on plan C's branch, and my translations go there when she sends its SHA. The two check-in names quote the button words from `checkin.here` / `checkin.went` in each language. `app-error-action-names.test.ts` goes red on this branch alone until Piper's keys are on `APP_ERROR_ACTIONS`; with them (put in by hand, not committed) the config suite is 70 files / 1,491 passed.

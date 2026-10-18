# Languages & Legal · Arabic twos without the digit, and the hidden label's own comma (18 October 2026, ~19:45 UTC)

Lena, on `claude/lena-arabic-two`, on Ava's `claude/pam-message-pam-admin` @ `e5b6c391` (it carries the four Arabic duals and the test allowance this builds on). Asked by Mira at 19:13 from Iris's b73 re-test (`claude/research-message-pam-retest-b73` @ `7afc9719`): R4 and R5.

## What changed

- **R4: fourteen more Arabic duals lose the digit** (18 of the 32 `*.two` keys now). Twelve were "{count} + dual noun" (`admin.points`, `directory.count`, `home.caseload.count`, `home.interested.count`, `notify.demo.newInterest`, `person.message.unread`, `places.miles`, `places.reported.count`, `points.subtitle`, `points.summary`, `program.policies.rowBody`, `trips.added.policies.title`); `trips.map.many.two` was the plural "{count} زيارات" and is now the dual "زيارتان"; `pam.inbox.sent.two` says "مسؤولين اثنين" ("two leads"), because the dual of a sound masculine noun is spelled like its plural and would otherwise read as "leads". The other fourteen `.two` strings put the number after a label ("المهتمون: {count}") and keep the digit: there it is a value, not a count before a noun.
- **R5: the hidden "{name}, {time}" label** (`messages.thread.from`, read aloud) uses the language's own comma in Arabic ("،") and both Chinese ("，"). I scanned the Arabic and Chinese bundles for other Latin commas: that was the only one (the send-limit line is English until its translation merges).
- **`copy.test.ts`**: `AR_DUAL_WITHOUT_DIGIT` lists the eighteen, and the check now says a dual carries no `{count}` and every other placeholder stays (two of them have `{program}` or `{place}`). `distance.test.ts` (`2 ميلان` → `ميلان`) and two `isolates.test.ts` expectations (`, ` → `، `) pinned the old forms.
- `copy:ack`, `copy:status` in step; `@pam/config` 66 files, 1,455 pass (1 skipped, 1 todo); `@pam/web` unit tests 206 pass. No other test or story quotes the Arabic forms.
- `docs/before-launch.md`: the native-reader entry now says which eighteen and which fourteen, and that Iris was not sure the dual alone is the house choice.

## Left undone

The 320 audit in Arabic: see the READY. A native reader for the dual forms.

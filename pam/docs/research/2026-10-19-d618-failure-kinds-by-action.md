# D-618: which failures each action can really hit (19 October 2026)

Iris. This answers the merge desk's ask at 00:17 and 00:24, for Mira, Sage, Nico and Dot. Will (00:13)
wants the failure alert to say how to fix the problem, by the kind of error. "Contact Pam" is only an
unspoken last resort.

The question was: for each of the 23 `APP_ERROR_ACTIONS`, plus Piper's seven on
`claude/places-programs-d616-malfunctions` (`ee1ee890`), which kinds of failure can really happen,
with which codes, and what the person can do. Which failures should show no alert, because the
person already has what they wanted? And Nico's question: can a person hit a database refusal raised
with no errcode (`P0001`, HTTP 400), so that a `refused` kind is needed?

## How

- **Code read only.** I read the app's calls and the database's latest definition of each function,
  policy, grant, constraint and trigger (later migrations override earlier ones). I also read the
  postgrest-js client in use (2.116.0) to see what an error object really carries.
- **Nothing was run against any database.** I never signed in to live and made no accounts.
- **Who read what.** Three read-only helpers each read one group, and I checked their sharpest claims
  in the code myself:
  - the `'timeout'` string in Piper's paths;
  - the STOP check;
  - `appErrorCode`;
  - Nico's `codeFromAnswer`.
- **Commits.** `main` at `9aac8b6f`, Piper's branch at `ee1ee890`, and Nico's classifier at `aed95a9c`
  (`FAILURE_KINDS`, `FAILURE_CODES`, `classifyFailure`, `failureKindOf`, `codeFromAnswer`).

## The answer to Nico's question: yes, add `refused`

People can reach database refusals raised as `P0001` from the screens, on six actions. None is fixed
by trying again. Today all of them fall to `server` ("Pam's side"), which says the wrong thing. But
`refused` alone doesn't say what to do either, because the reachable refusals mean different things:

| Reachable refusal | Action | What it really means | What the person can do |
|---|---|---|---|
| `OUTSIDE_THE_VISIT_WINDOW` | `schedule.checkin` | **The visit is more than 2 h away.** The circle is offered on every visit up to 60 days ahead (`my_program_visits`), but the database accepts a check-in only from 2 h before. This is likely the commonest real failure in this table. | Wait until the visit. Better: no live circle outside the window. |
| `OUTSIDE_THE_VISIT_WINDOW` | `checkin.here`, `checkin.went` | The card allows up to start + 4 h, but the database closes at `coalesce(ends_at, start + 1h) + 3h`. A visit shorter than an hour closes earlier than the card. A page left open, or a clock running wrong, does the same. | Nothing. Better: the card uses the database's window. |
| `ACCOUNT_NOT_ACTIVE` | `checkin.here`, `checkin.went`, `schedule.checkin`, `schedule.undo` | The account is paused. | Nothing themselves: ask their guide, or the Pam team for staff. |
| `NOT_A_PROGRAM_LEAD` | `schedule.checkin`, `schedule.undo` | The role was switched in another tab (`switch_role`), or the org was lost, while Schedule was open. | Switch back to the program lead role. |
| `NO_LEAD_HERE` | `checkin.here`, `checkin.went` | The place's lead was removed after the page loaded. | Nothing. |
| `VISIT_CANCELLED` | `checkin.*`, `schedule.checkin` | Cancelled elsewhere while the page was open. | Nothing; the screen should re-read. |
| `VISIT_NOT_FOUND` / `TRIP_NOT_FOUND` / `NOT_FOUND` / `No such message` / `There is nobody else in that conversation` / `REQUEST_NOT_FOUND` / `No such account` | check-ins, `trips.cancel`, `pam.thread.status`, `messages.report`, `messages.block`, `requests.review`, `directory.demo-view` | **Gone.** Usually the other person erased their account, so their rows cascaded. | Go back; the list should re-read. |
| `REQUEST_ALREADY_DECIDED` | `requests.review` | Another super admin decided first, or a lost answer had committed. | Read the request back (see "no alert" below). |
| `ROLE_PAIR_NOT_ALLOWED`, `ACCOUNT_IN_OTHER_CITY` | `requests.review` | This request can't be approved as asked: the requester's roles have changed, or the wrong city was picked. | Deny, or pick the account's city. |
| `INVITE_NEEDS_PHONE` | `invite.create` | The number passed the app's check (10+ digits) but not the database's E.164 one (for example a leading 0, or over 15 digits). | Fix the number. This is a mistake the person can fix, so it should stay inline (D-509), not be an alert. |

**My suggestion.**

1. Add `refused` as Nico proposes: 400, `P0001`, `22xxx`, `23502`, `23514`.
2. Don't make it the only answer. Where the screen still has the error's message, map the known words
   to the kind they really are:
   - the `*_NOT_FOUND` family and "nobody else" are `gone`;
   - `VISIT_CANCELLED`, `REQUEST_ALREADY_DECIDED` and `TRIP_NOT_FOUND` are `changed`;
   - `ACCOUNT_NOT_ACTIVE`, `NOT_A_PROGRAM_LEAD`, `NO_LEAD_HERE` and the `ONLY_*` words are
     `not-allowed`;
   - `OUTSIDE_THE_VISIT_WINDOW` and `PLANNED_TOO_LATE` are a new `wrong-time`, or `refused` with
     their own line.
3. Do this as `failureKindOf` already does for `PAM_RATE_LIMITED`, with the message going no further
   than the screen.
4. `refused` is then left for what's truly unexpected.
5. Better still, for the long run: give each guard its own errcode (a `PTxxx` with a hint), so the log
   can tell them apart as well.

## Problems that affect every action (fix these first)

1. **Nothing in Piper's seven logs `timeout`.**
   - All of them pass the bare string `'timeout'` as the error (`useSavedPlaces.ts:200`,
     `imHere.ts:67,85`, `checkIns.ts:49`, `savedTrips.ts:225`).
   - `codeFromError('timeout')` finds no `.name`, `.code` or `.status` on a string, so it logs
     `unknown` and Nico's classifier will say `server`. Text alerts passes `{ code: 'timeout' }` and
     is right.
   - Separately, a supabase-js abort comes back as `{ message: 'AbortError: …', code: '' }` with no
     `name`, so the `AbortError` branch in `codeFromError` never fires. The thread's 30-second send
     abort logs `unknown`.
2. **The HTTP status is lost everywhere except blocking.**
   - A `PostgrestError` has `{message, details, hint, code}` and no status.
   - PostgREST's own codes are 8 characters long, which `appErrorCode` turns into `unknown`. That
     covers `PGRST116` (406, no row), `PGRST301` and `PGRST303` (401, an expired or bad sign-in), and
     `PGRST000` to `PGRST002` (503).
   - A network failure while the phone thinks it's online has `code: ''`, also `unknown`.
   - Nico's `codeFromAnswer(error, status)` fixes this, but on `aed95a9c` only `blocking.ts` uses it.
     Until every call passes its status, signed-out and gone will show as `server`.
3. **`42501` means two things.** With no session the client falls back to the `anon` key, and every
   RPC and write here is revoked from `anon`, so "signed out" arrives as `42501`, the same code as
   "this account may not". That makes the guards' own `'Sign in first'` raises unreachable. Telling
   the two apart needs the session, not the code: no session means `signed-out`.
4. **Storage errors never reach the logger.** `uploadMessagePhoto` and `uploadMessageFile` return
   `null` on any error, and the thread throws `Error('upload failed')`. So a storage refusal, a 401
   or the 60-second upload timeout is `unknown`.
5. **`pam.ts` `call()` keeps only a word from the message and drops the code.** So the team's hours
   and close/reopen can't be classified by code.
6. **Several keys aren't reported from anywhere yet:**
   - `messages.load` and `messages.pam.open`;
   - `alerts.agree`, `reminders.agree` and `reminders.decline`;
   - `directory.demo-view`, `requests.review` and `invite.create` (Ava's `51f3e541` may wire the last
     two; I read `main` and Piper's branch);
   - and `pam.hours.save` and `pam.thread.status` go through `call()`.

   `alerts.switch.visit` can never fire: `visit` isn't a live kind, so `change()` returns before
   saving.

## Show no alert: the outcome already happened

| Action | When | What happens today | What it should do |
|---|---|---|---|
| `places.save` | `23505`: already saved (another device or tab, or a timed-out save that landed) | **Alert**, and the heart stays empty | Treat as saved, fill the heart, no alert |
| `trips.cancel` | `TRIP_NOT_FOUND` (`P0001`) because it's already cancelled (another device, or a timed-out cancel that landed) | **Alert**, and the visit stays on screen | Re-read trips; if it's cancelled, it's done (go to `/trips/`); if it's attended, show that |
| `requests.review` | `REQUEST_ALREADY_DECIDED`, decided the same way by another admin or by a lost answer | Generic failure | Read the request back and show it decided |
| `messages.send` | The 30-second abort fired but the insert committed | "Not sent", and the live poll then shows the stored copy beside it | Look before "Not sent" (as Try again already does) |
| `messages.retry` | The first send had landed but the look missed it (the phone's clock more than 5 s fast, or the look itself failed and its error was ignored) | **A duplicate is sent** | Look by a client-made id, not by time |
| `messages.photo` | The upload landed, then the insert failed or timed out | The file is left for the nightly sweep (harmless) | No alert for the file itself |
| `messages.report` | A second tap, or a retry after a lost answer | **A second report** is made | Not an error, but a duplicate the team reads twice |
| `invite.create` | A retry after a lost answer | **A second invite** (and a second staff email) | Same: not an error, but a duplicate |
| `alerts.switch.*`, `reminders.agree`/`decline` | An answer lost after the write committed (`unknown`) | Alert, and the screen only re-reads after a timeout | Re-read before alerting |
| Any action that times out and then succeeds | The 15 s alert has already shown | The late re-read fixes the screen, but the alert stays until the next tap | Acceptable, but Dot may want the late success to clear it |

These are correct today, and there's nothing to change:

- unsave of something already unsaved (zero rows, no error);
- block of someone already blocked (`on conflict do nothing`);
- unblock with nothing to undo;
- close or reopen a thread already in that state;
- the same hours saved twice;
- the same switch value upserted;
- "I'm here" / "I went" / a staff check-in on a visit already attended (success, 0 points);
- undo of something already undone;
- `open_pam_conversation` answering null with no error (the switch is off, or the caller is the Pam
  team);
- two opens at once.

## The table: kinds each action can really hit

Key:

- **Kinds:** off = offline · to = timeout · so = signed-out · na = not-allowed · tm = too-many ·
  ch = changed · go = gone · sv = server · rf = refused (`P0001` guard, invalid input) ·
  wt = wrong-time.
- **Codes** are what `codeFromError` logs today; → shows what it should be once `codeFromAnswer` is
  everywhere.
- Every action can also hit **off** (`offline`), **sv** (`unknown`, 5xx) and **so** (`42501` with no
  session; `unknown` → 401 with an expired token). Those three aren't repeated per row unless
  something is special.

### Messages

| Action | Real kinds beyond off/sv/so | Codes | What the person can do | Wired? |
|---|---|---|---|---|
| `messages.send` | **to** (30 s; may have landed); **tm** (`PAM_RATE_LIMITED`, `P0001`, already handled: draft back, not logged); **na** (limited account, already handled; suspended, `chat` off, blocked, removed from the conversation: `42501`); **rf** (`23514`, a 0-byte document or a file name with C1 control characters) | `unknown`, `P0001`, `42501`, `23514`, `57014` (statement timeout) | to: try again (it looks first). na: nothing. rf: pick another file. | yes |
| `messages.photo` | **rf** (photo can't be read, e.g. HEIC); **na** / **so** / **to** at upload (all logged `unknown`, problem 4); **tm** (10 photos an hour, handled) | `unknown` | Pick another photo; try again | yes |
| `messages.retry` | Only a chunk-load failure logs under this key; real failures log as send/photo | `offline` / `unknown` | Try again | yes |
| `messages.load` | **go** (not a member, deleted conversation or bad id: RLS returns no rows → "not found"); **so** is shown as not found today (no user, so not_found); **to** (`57014`) | — | so: sign in (today it says not found); go: back to Messages | no |
| `messages.pam.open` | Nothing beyond off/sv/so: the function raises nothing; null with no error isn't a failure | — | Try again | no |
| `messages.block` | **go** ("There is nobody else in that conversation", `P0001`: the other person erased their account, and the effect wanted has already happened); **rf** (`22P02`, typed id only) | `P0001`, `22P02` | No alert for "nobody else": they can't write any more | yes |
| `messages.unblock` | Nothing beyond off/sv/so (no block of mine = success) | — | Try again | yes |
| `messages.report` | **go** ("No such message": the sender erased their account); **na** (removed from the conversation, rare) | `P0001` | Nothing; the person is gone | yes |

### Pam team

| Action | Real kinds beyond off/sv/so | Codes | What the person can do | Wired? |
|---|---|---|---|---|
| `pam.thread.status` | **go** (`NOT_FOUND`: the person erased their account while the inbox was showing); **na** (`ONLY_A_SUPER_ADMIN` if demoted mid-screen, rare) | `P0001` (the code is dropped by `call()`) | go: refresh the inbox | via `call()` |
| `pam.hours.save` | **na** (demoted mid-screen, rare). The other guards (`INVALID_*`, `22007`) are blocked by the screen | `P0001` | Nothing | via `call()` |

### Texts

| Action | Real kinds beyond off/sv/so | Codes | What the person can do | Wired? |
|---|---|---|---|---|
| `alerts.switch.closed` | **to** (`timeout`, re-read late); a trigger fault in `queue_trip_reminder` (sv, a SQLSTATE) | `timeout`, SQLSTATE | to: wait; the screen re-reads | yes |
| `alerts.switch.message` / `booked` / `changed` / `trip` | As closed, once `ALERT_TEXTS_LIVE` is on. Today they're disabled and can't fail | — | — | yes |
| `alerts.switch.visit` | **None: can never fire** (not a live kind) | — | — | — |
| `alerts.agree`, `reminders.agree`, `reminders.decline` | As closed. Sign-up also runs `finishSetup` (a profiles update). No timeout on these screens, so a hang leaves the screen busy for ever | `unknown`, `42501` | Try again | no |
| `function.dispatch-sms` | No person sees it. Twilio 429 (tm), 401/403 (config), 400 (including 21610, a carrier STOP: **not a malfunction**, since the person already has no texts), 5xx. `claim_outbound_messages` failing always logs `unknown` (its message starts with an underscore word, so `codeOf` misses the status). A missing Twilio setting reports once per row and can flood the log up to the 60-a-minute cap. | 3-digit, `unknown` | — (team) | server |

**STOP, and a correction to a code comment.** The database does **not** refuse a "yes" after a
STOP. It only refuses clearing `sms_stopped_at`: no trigger or check looks at `sms_stopped_at` on
insert or update. The refusal is only in the app (`getTextStatus`, then `stopped: true`), and
`getTextStatus` swallows its own errors as "not stopped". So if that read fails, a "yes" is saved on
a stopped row, and the screen shows the switch on. The dispatcher still doesn't send. The comment at
`useReminderConsent.ts:115` ("the database holds the same line") isn't true for a yes. Also, the
agree screens ignore `stopped` and would show the failure Notice, not the STOP card.

### Super admin

| Action | Real kinds beyond off/sv/so | Codes | What the person can do | Wired? |
|---|---|---|---|---|
| `directory.demo-view` | **na** (`Only a super admin…`, rare); **go** (`No such account`: erased while the list was open). Today the result is ignored and the switch snaps back silently | `P0001` | go: refresh | no |
| `requests.review` | **ch** (`REQUEST_ALREADY_DECIDED`: no alert if decided the same way); **go** (`REQUEST_NOT_FOUND`); **rf** (`ROLE_PAIR_NOT_ALLOWED`, `ACCOUNT_IN_OTHER_CITY`); **na** (rare) | `P0001` | ch: see it decided; go: back to the list; rf: deny, or pick their city | no (sorted by message today) |
| `invite.create` | **rf** (`INVITE_NEEDS_PHONE`: a number the app accepts but the database doesn't; `INVITE_EMAIL_INVALID` only past 254 characters); **na** (role changed mid-session, rare) | `P0001` | Fix the number. It's a field to correct, so inline, not an alert. | no |

### Places and programs (Piper's seven)

| Action | Real kinds beyond off/sv/so | Codes | What the person can do |
|---|---|---|---|
| `places.save` | **ch** (`23505` already saved: **no alert**); **go** (`23503`, place removed); **rf** (`22P02`: an example place on a demo account only); **to** (logs `unknown`, problem 1) | `23505`, `23503`, `22P02`, `unknown` | ch: nothing, it's saved; go: nothing, it's gone |
| `places.unsave` | **to**. Nothing else: zero rows is success | `unknown` | Try again |
| `checkin.here` | **wt** (`OUTSIDE_THE_VISIT_WINDOW`); **na** (`ACCOUNT_NOT_ACTIVE`, `NO_LEAD_HERE`); **ch** (`VISIT_CANCELLED`); **go** (`VISIT_NOT_FOUND`); **to**. These are already inline, with no alert: `PLANNED_TOO_LATE`, `NO_PLACE_LOCATION`, more than 150 m away | `P0001`, `unknown` | wt / na / ch / go: nothing; to: try again |
| `checkin.went` | As here, plus `SELF_REPORT_LIMIT` (tm, 3 in 7 days; already inline) | `P0001` | Use "I'm here" with location, or wait |
| `trips.cancel` | **ch** (`TRIP_NOT_FOUND`: already cancelled, **no alert**; or already attended); **go** (deleted); **to** | `P0001`, `unknown` | Re-read; nothing to do |
| `schedule.checkin` | **wt** (`OUTSIDE_THE_VISIT_WINDOW`: more than 2 h ahead, **likely the commonest**); **na** (`NOT_A_PROGRAM_LEAD`, `ACCOUNT_NOT_ACTIVE`); **ch** (`VISIT_CANCELLED`); **go** (`VISIT_NOT_FOUND`); **to** | `P0001`, `unknown` | wt: wait until 2 h before; na: switch back to lead; ch / go: re-read |
| `schedule.undo` | **na**, **go** as above; **wt** only more than 14 days after the visit (rare); **to**. A member's own mark stays filled with no explanation (by design, D-535) | `P0001`, `unknown` | Mostly nothing |

## Kinds nobody can hit

- **too-many over HTTP (429):** nothing on these paths limits by HTTP. The only real limits are:
  - Pam's message limit (`PAM_RATE_LIMITED`);
  - "I went" (3 in 7 days);
  - the error log's own 10 a minute;
  - Twilio's 429, server side.
- **changed by `40001`:** the database runs at read-committed.

## Smaller things found on the way (for the lanes)

- **Nico:** `messages.retry` can send a duplicate. The look uses `created_at >= startedAt − 5 s`
  against the server's clock, and ignores its own error.
- **Nico:** the document path in a Pam conversation has no storage policy for the Pam team or a
  limited asker. The composer only offers a photo there, so it's unreachable today.
- **Nico:** at sign-up, a STOP sent before the account existed (`phone_stops`, by hash) isn't
  carried onto the new account. `claim_outbound_messages` checks `phone_is_stopped` only for rows
  with no member.
- **Ava:** `invite.create`. If `listRegions()` fails for a super admin, `regionId` is empty and
  `needsCity` is set, but the note is only drawn when there's more than one region, so the tap does
  nothing visible.
- **Ava:** `requests.review` shows "gone" with the "decided" words.
- **Piper:** the "I'm here" card's window (start + 4 h) is longer than the database's for visits under
  an hour. The Schedule circle is live on visits up to 60 days ahead.
- **Ava:** `directory.demo-view` ignores the RPC's result, so a failure just snaps the switch back.

Iris

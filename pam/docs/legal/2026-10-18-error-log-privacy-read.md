# The error log (D-616): a Privacy read

**Written by:** Lena (Languages & legal), 18 October 2026, for Mira, Nico and then Will. **Asked:** Will, 18 October, 21:14, relayed by Mira at 21:15:
"if something breaks, please create an error log so the team can be notified and fix the issue", with a small alert at the bottom of the screen for failed actions.
**Status:** first written from Mira's description (21:15); **checked against Nico's migration, `claude/messages-app-errors` @ `1f142e4a` (21:35), at 21:45** (section 3 now says what each requirement turned out to be). The pins that hold the line to the migration are on `claude/lena-app-errors-pins`.
**Nothing is signed, translated or switched on.**

## The short version

1. **Yes, Privacy needs a line.** It is a new record, kept for 30 days, that people read, about when and where a particular kind of person used
   Pam and met an error. Privacy's rule since a66 and a76 is that every record kept about use has its line, even when it holds no name (the request
   log, p11; the daily screen counter, p13). A record that exists and is not named is the one thing the page may not do.
2. **The line must not say the notes are anonymous.** The table has no account id, but for the first week the request log (p11: when, what was asked
   for, which account, IP address) also holds the call that wrote the note. A person on the Pam team who looked at both could tie a note to an account.
   "It has no name, phone number, account, message or place in it" is true of the note. "It can't show who you are" would not be, in week one, and
   with role + language + time in a small pilot it is not safe to claim after that either.
3. **It ships with the switch, not before.** While `app_errors_live` is off nothing is kept, and a line that says Pam keeps something it does not
   is as wrong as the reverse. Will signs the line before the switch turns on (A29); the line goes live the same day (`legal:date privacy`).
4. **The weak point was the "short detail".** A database or API error often carries the value that broke it (`Key (phone)=(+1215…) already
   exists`, a failing constraint with the row's values, a URL with an id). Nico's migration has no detail column at all, and takes none; section 3a
   checks each of the nine requirements against it.
5. **No new outside company.** If the notes go only into Pam's own database (Mira's description), `third-party-hosts.test.ts` is untouched, and so is
   the Privacy sentence about other companies (`sharing.p3`). Emailing the team about errors later, or sending them to a service such as Sentry,
   would add a host: the guard fails until that host is listed and Privacy names the company.

## What the table holds (Mira's description, 21:15)

When · area (the route) · action key · error code · a short detail with no user content · app build · platform · role · locale. No account id, phone,
message text or place name. Kept 30 days. Super admins get a bell and a list. Behind `app_errors_live`, which starts off.

*(This is the description I was given. The table Nico built has **no detail column**: it keeps when, route pattern, action, code, build, platform, role and locale, and nothing else. Section 3a is the check against the migration.)*

## 1. Does the line belong in Privacy?

| Question | Answer |
|---|---|
| Is it about a person's use of Pam? | Yes: a time, a screen, an action, a kind of person (role), a language, a kind of phone. Individually harmless; together, in a pilot with few people in each role and language, they can point to someone. |
| Is it kept? | Yes, 30 days in the database. That is longer than the request log (a week), so p11 does not cover it. |
| Does a human read it? | Yes: the Pam team (super admins), in a list and a bell. |
| Does it leave Pam? | No, as described. |
| Is there a precedent for naming something this small? | Yes. p13 names a daily count that "has no name, phone number or account in it" because the rule Privacy follows is that it lists what Pam keeps, not only what it keeps about named people. |

So: a line, in "What we keep", next to the other records of use.

## 2. The draft line (for Sage's edit, then Will's signature)

Key for now: `privacy.s.what-we-keep.p17` (renumber when it lands; the Google card and a84's lines are also waiting for numbers).

> If something goes wrong, Pam sends us a short note so we can fix it: when, which screen and action, the kind of error, the version of Pam, the kind of phone or browser, whether you are a member, a case manager or a program (or not signed in), and your language. It has no name, phone number, account, message or place in it. Only the Pam team reads these notes, and we delete them after 30 days.

(Changed after reading the migration: "kind of phone or browser" is `platform`, which is only web, iOS, Android, server or unknown; "or not signed in" because a failure to sign in is reported too, with the role `signed-out`.)

Why each clause is there, and what makes it true:

| Clause | True when |
|---|---|
| "a short note … when, which screen and action, the kind of error" | `occurred_at`, `area`, `action`, `code` are the columns, and `area` is a route **pattern** (`/person/[id]/`), never a URL with an id or a query. |
| "the version of Pam, your kind of phone" | `build` and `platform`. `platform` is a coarse value (iOS, Android, desktop, and the browser family), like p11's "kind of phone or browser". Not a user-agent string, which can carry a model and an OS patch level. |
| "whether you are a member, a case manager or a program, and your language" | `role` and `locale`, nothing else about the person. |
| "no name, phone number, account, message or place in it" | No account or user column, and **no detail column at all**: the only words in a row are the action key from a closed list and a code that is an HTTP status, a database error number or `offline`/`timeout`/`unknown`. The route is a pattern with no ids. |
| "Only the Pam team reads these notes" | Row-level security lets only super admins select; no member, case manager or program lead can, through a table or a function. A database test holds it. |
| "we delete them after 30 days" | A scheduled job deletes rows older than 30 days, and a test reads the job. |

## 3a. Checked against `1f142e4a` (Nico, 21:35)

| # | Requirement | In the migration |
|---|---|---|
| 1 | The detail is never an error's own message | **Met.** There is no detail column and the function takes none. The code must be an HTTP status, a SQLSTATE or `offline`/`timeout`/`unknown`; anything else is stored as `unknown`. The app's closed list (`APP_ERROR_ACTIONS`) and `appErrorCode` match the database's shape, and test 85 offers an error whose message holds a phone, an email, a first name and a street and finds none of it. |
| 2 | The route is a pattern | **Met.** The query and fragment are cut, a uuid or a run of four or more digits becomes `[id]`, anything outside `/[A-Za-z0-9/_[]-]` becomes `/unknown`. Pam's app has **no dynamic path segment** (it is a static export: ids travel in the query, `/person/?id=…`), so a real pathname never holds an id; the database's cut is a second guard. |
| 3 | The action is from a closed list | **Met.** Closed list in the app; the database refuses a key that is not lowercase words and dots. |
| 4 | Size limits and a rate limit | **Met.** Length limits on every field (the table's own checks); ten reports a minute for a signed-in account, thirty a minute shared by everyone signed out, two hundred overall. **No network address is read or kept, not even as a hash** (`0160c1b5`, `f71a4665`); the counters are deleted after five minutes. |
| 5 | Only super admins read | **Met.** Forced row security, a deny-all policy, no grants; the one read is `app_errors_grouped()`, which refuses everyone but a super admin, and returns counts by route, action and code. Test 85 refuses anon, member, case manager, program lead, and even a super admin on the table directly. |
| 6 | Thirty days is enforced | **Met.** `app_errors_keep_days()` is 30; `sweep_app_errors()` deletes older rows; `pg_cron` schedules it nightly at 04:20, and **`pg_cron` 1.6.4 is installed on the live project** (checked 21:44; the migration skips the schedule silently where it is not, so this was worth asking). The bell rows go at the same age. |
| 7 | The bell holds nothing the log does not | **Met.** `body_vars` is `{action, count}`. |
| 8 | No new host | **Met** in this branch (a database function; no http, no edge function). The app's client is not on the branch yet; when it lands, `third-party-hosts.test.ts` runs on it. |
| 9 | Off means off | **Met.** The switch is read first; off returns before the counter or the row is touched. Test 85 shows an empty log, no counter and no bell row while it is off. |

### Notes from the read (updated 21:50 for Nico's `0160c1b5`)

- **No network address is read or kept at all** (Nico's last change: signed-out reports share one cap of 30 a minute, and the signed-in counter is
  keyed on the account). That removes the salted-md5 question I raised at 21:40 and a sentence Privacy would otherwise have needed. The pin
  holds it (`error-log-line.test.ts`).
- **The signed-in rate-limit counter holds an account id for five minutes at most, and now that is true:** Nico gave the counters their own `pg_cron` job
  every five minutes (`f71a4665`) on top of the clear at each report, after I pointed out that a quiet night could leave one until 04:20. It is no
  new fact either way: the request log (p11) already holds which account called and when, for a week. The pin holds the function and the schedule.
- **The shared caps (30 a minute signed out, 200 overall) can be used up** by a script, which would hide real reports for that minute. A robustness
  question for Nico, not a Privacy one.

### The rate-limit counter (Iris D4, 19 October)

`app_error_limits` holds `u:<account id>`, the minute and a number, so that one account cannot send more than ten notes a minute. It is not the note, and the line is still true: **"It has no name, phone number, account, message or place in it" is about the note**, and the note row has none. Choice made (Lena, 19 October): **(a), no clause.**

- Nobody can read the counter: row security is on and forced, there is a deny-all policy, anon and signed-in people have no grant. Only the report function writes it.
- It is emptied fast: each report drops rows older than five minutes and a job runs every five minutes, so none lives past ten (and nothing is written while `app_errors_live` is off).
- It adds nothing to who: `p11` already says the servers write down "which account" and the IP address each time a phone asks Pam for something, for a week. The report is one of those calls. A minute's count under the same account, kept for minutes and unreadable, is less than what is already said.
- Why not (b): a clause about a ten-minute rate counter would read as new tracking and say less than `p11` does. If Will wants one, it is "We also count, for a few minutes, how many notes one account sends, so that a fault cannot flood us" (needs Sage).
- Why not (c): hashing the account id changes nothing for anyone who can read the table (they can hash the profiles list too), and the one who could not read it still cannot. The way to hold no account id at all is one shared bucket for every signed-in person, as signed-out reports already have: no per-account fairness, so one looping phone could use up the minute for everyone's notes. That costs a real thing for no gain the line needs; it is Nico's to build if Will wants it.
- Held by a pin: `error-log-line.test.ts` fails if the counter gains a column, is keyed by anything but the account or `s:signed-out` (no address), loses its lock, or its sweep lengthens.

## 3. What the code had to do (the list I sent to Nico at 21:15; section 3a is the answer)

1. **The detail is never an error's own message.** Not `error.message`, not PostgREST's `details` or `hint`, not a URL. Take the error `code`
   (a Postgres five-character code, `PAM_RATE_LIMITED`, an HTTP status) and, if a detail helps, map it to a phrase from a closed list in the app; or
   truncate and strip on the **server** side (runs of seven or more digits, anything with `@`, anything after `=`). A function the app calls to write a note
   cannot be trusted to have scrubbed; it can be trusted to refuse a string that does not match the list or the shape.
   *Test:* feed the writer an error whose message holds a phone number, an email address, a first name and a place name, and assert none is in the
   stored row.
2. **The route is a pattern.** `/person/[id]/` and `/place/[id]/`, not `/person/3f9c…/`; no query string (`?next=alerts&kind=message` is harmless
   today, `?q=` is not). *Test:* a note written from a route with an id and a query is stored without them.
3. **The action key is from a closed list** (`messages.send`, `trips.cancel`, …), so a bug cannot put user text in it.
4. **Size limits.** Each field has a maximum length the database enforces (`check (char_length(detail) <= 120)`), so the table cannot become a place
   to send text. The writer is rate-limited per account (the same way sending a message is), so a loop cannot fill it.
5. **Who writes and who reads.** Any signed-in account may write (through one function, `security definer`, `set search_path = public, extensions`),
   nobody may read except super admins. *Test (`packages/db`):* a member, a case manager and a program lead each get nothing from `select` on the
   table and from the list function; a super admin gets rows.
6. **30 days is enforced, not intended.** A scheduled delete, and a test that finds it and reads "30 days" in it. The line then says what the job does.
7. **The bell does not carry the detail.** A bell text such as "Something failed on Messages" is fine; the bell and its notification row must not hold
   anything the note does not (and nothing from the person who met the error).
8. **No new host.** The write is a call to Pam's own database. `third-party-hosts.test.ts` needs no change. If someone later adds an email or a chat
   message to the team, that is a new server host and a new Privacy sentence, not an edit to this one.
9. **Off means off.** With `app_errors_live` off the app does not call the writer and the table stays empty, and the Privacy line is not live. The
   switch and the line turn on together.

## 4. Choices for Will

1. **Sign the line above** (or Sage's edit of it) before `app_errors_live` turns on. I translate it into the six languages after the signature, run
   `legal:date privacy`, and pin it.
2. **Thirty days is Nico's number.** It is longer than anything else Pam keeps about use except the six-month deletion record. If a week would do, the
   line says "a week", and it matches p11. A shorter time costs the team nothing if errors are fixed within days.
3. **Is "role" worth keeping?** It is what makes a note useful to fix ("only program leads see this") and what, with language and time, narrows a note
   to a handful of people. It stays in the draft; say so if you would rather drop it.

## 5. Not asked, noted

- The small alert at the bottom of the screen for a failed action is words members read: Sage's `notice.malfunction` is the first. I translate it in six
  languages once she signs it (Mira, 21:15), at the register of the screen it appears on (tú for members; one string, so tú, like the other shared
  notices, D-577).
- The bell for super admins is a new notification kind. Its text is English-only in the team's own view unless Piper or Nico ask otherwise; if it is
  shown in the app it comes to me for six languages like any other.

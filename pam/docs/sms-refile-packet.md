# Text-message campaign: the refile packet

Draft by Lena, 18 October 2026, read off `main` @ `615e1078` (the templates, `dispatch-sms`, `sms-inbound`, the
queueing migrations and the screens, not older docs). **Docs only: nothing here has been submitted to Twilio or sent
to anyone.** It is in the order the campaign form asks. Where a field says *paste*, the block is the text to paste.

`docs/sms-campaign-samples.md` stays as the history of the earlier filings. Where it disagrees with this page, this
page is right (three of its statements were wrong against the screens: see §10).

## 0. What is not ready, and what that does to the paste blocks

| Not ready | Effect |
|---|---|
| The two agree screens: **`/reminders/` is built** (Nico's `TextKindsList`, `f648db12` on `claude/messages-text-kinds-list`, not yet on main; 320 audit clean in seven languages), **the join step is not** (it still draws the old intro, three bell bullets and "Yes, text me reminders": Ava's `JoinScreen` swap; Sage `1c09f1de`, `2a600d73`) | §3 describes both as one set of words. **It is true of the join step only once the swap lands,** and the join step is the screen a new member meets first. Compare it with Wren's screenshots word for word before pasting. |
| `saved_place_closed` is queued **without its link** (`queue_saved_place_closed`, migration 0037, writes `{reason_key}` only; the template needs `link`), so the dispatcher refuses it every time | **Fixed by Nico** on `claude/messages-pam-s0-s1a` @ `d272c53b` (migration 20261018185235, a DB test and a dispatcher test; link = `{app_url}/`; Mira takes it in b75). Until it is on main and deployed, sample 8 cannot send and is not one of the texts Will tests on his phone. |
| `support_reply` and `reply_no_read` have no `reviewedBy`; the START reply below is a proposal | Will's to sign (A29). The dispatcher will not send an unsigned template. |
| `texts_live` is `off`; `ALERT_TEXTS_LIVE` (app) and `VISIT_REMINDERS_LIVE`, `PLACE_TEXTS_LIVE` (website) are `false` | Only the **account texts** leave Pam today (sign-in code, the decision on a staff request). Everything else is queued and held. |

## 1. Campaign use case

**Low Volume Mixed**, as registered: account notifications and appointment reminders, plus one customer-care answer.
Not marketing. Pam never sends a promotional message. Leave it as filed unless Twilio asks.

## 2. Campaign description (paste)

1,020 of 1,024 characters. **Recount after any edit.** It names every kind of text the code can send, because a
description narrower than the traffic is how an approved campaign is suspended.

```
Pam is an app by Oba that connects people to community programs, services and the staff who support them. People enter their own phone number on Pam's sign-in screen, which says Pam will text them a code.

Messages are account notifications and appointment reminders, at low volume. After the one-time sign-in code, a person who agreed on a screen made for that choice may get a reminder the day before an appointment they or a program scheduled, a notice that a saved place closed or moved, or a notice that a message is waiting; staff may get a notice of a visit booked, changed or planned. Staff get a text with the decision on their request, and a person who asks in a help form gets one answer.

Nothing is promotional; numbers are never sold or shared. Every message names Pam. Languages: English, Spanish, Portuguese, Chinese, Russian, Arabic. One segment per message, except appointment reminders in Chinese, Russian and Arabic: two. STOP ends all messages, START turns them on again, HELP gives support contact.
```

What changed from the filed description: it no longer says the sign-in screen states "how to stop" (it does not, §10);
"STOP ends all messages permanently" is now "STOP ends all messages, START turns them on again" (START works: D-460);
the staff decision text and the help answer are named; "a message is waiting" and the staff visit notices stay.
If "Someone wants to connect" goes in this filing, see §9 for the clause.

## 3. How end users consent / message flow (paste)

**Draft, true only once the join step says what `/reminders/` says (§0).** 1,005 of 1,024 characters. Recount after any edit.

```
People opt in in the Pam app, on a screen for that one choice. Nothing is pre-selected; there is no checkbox. A person enters their own mobile number on the sign-in screen to get a one-time code; asking for the code is the request to be texted it. After signing in they see a "Text reminders" screen. Its "Kinds of texts" list names what Pam sends, for example "A reminder before your trip" or "Someone messages you" (staff see their own), marks any not yet live "Coming soon", and says Pam sends one text each time something on the list happens, that STOP stops them, HELP gets help, and text and data rates may apply. Consent is pressing the button "Agree to receive texts". "Not now" records a decline, and Pam works either way. A Text alerts switch never records consent; with none on file it opens this screen. Numbers are never bought or rented. A staff member may type an invited person's number so only that number can use the invite link; Pam never texts it, and the person agrees for themselves.
```

Each claim and what makes it true:

| Claim | Where it is true |
|---|---|
| Button reads "Agree to receive texts"; "Not now" beside it; no checkbox | `reminders.agree`, `reminders.skip`; both screens, Sage `1c09f1de` (one set of words). `/reminders/` built (`f648db12`); **join step not built yet** (it still has `reminders.optIn`, "Yes, text me reminders"). |
| "Kinds of texts" lists them by name, "Coming soon" on any not live | `TextKindsList` (`reminders.what` = "Kinds of texts"; rows are Text alerts' own names, Sage `11175802`, `9f550846`; the badge is `common.comingSoon`, set by data: `textKindsFor`). Member rows: `alerts.closed` "A saved place closes or moves", `alerts.visit` "A reminder before your trip" (Coming soon: the visit reminders are not built). The two names quoted in the paragraph are those two and `alerts.message` "Someone messages you". |
| STOP / HELP / rates line | `reminders.how`, on main: "Pam sends one text each time something on this list happens. Reply STOP to stop, or HELP for help. Text and data rates may apply." |
| A Text alerts switch never records consent | Dot's D-615 routing and its specs (`claude/pam-design-settings-list`). `AlertsView` used to record consent on any switch; that is why the routing exists. |
| Staff see it with their own kinds of text | `textKindsFor`: case manager `alerts.message`, `alerts.trip` ("Someone plans a trip"); program lead `alerts.booked` ("Someone books a visit"), `alerts.changed` ("Someone changes a booking"), `alerts.message`. All "Coming soon" until `texts_live` and `ALERT_TEXTS_LIVE` are on. |
| No Privacy link on the screens | Sage `2a600d73`, Mira 17:58. The Privacy URL is a field on the form (§7). |
| "Numbers are never bought or rented. A staff member may type an invited person's number…" | **The earlier paragraph said staff never enter numbers. They do:** inviting someone needs their name and mobile number (`invite.who.phone`, "Only this number can use the link"; `create_invite`, 0070/0077). Pam never texts that number: `invite_member` and `invite_provider` have a template and nothing queues them, the person has to type their own number at sign-in, and the only consent is the agree button. |
| The pending help-form number (card a61) | Not in the paste block. If Will says yes, add: "A person asking for help on joinpam.org may type their own mobile number into the help form to ask for an answer by text; Pam sends that one answer, once, with STOP." (about 180 characters; shorten elsewhere to fit.) |

## 4. Sample messages (paste, in this order)

Placeholders stay as `{braces}`; reviewers read them as placeholders. The form takes a limited number of samples (the
last filing used nine): paste in this order and stop where the form stops. The description covers the rest.
Every English text is one segment: with real values the longest is the help answer with its STOP line, 151 characters of 160; the day-before reminder is about 108.

1. Sign-in code (the opt-in message; set in the Twilio console, §5)
   `Pam: Your code is {code}. It works for 10 minutes. Msg & data rates may apply. Reply HELP for help, STOP to stop.`
2. Day-before reminder, `appointment_24h` (signed Will 13 Sep)
   `Pam: You have a visit tomorrow at {time}. {address}. Tap for directions: {link}`
3. A message is waiting, `message_waiting` (signed Will 10 Oct)
   `Pam: You have a new message in Pam. Open it: {link}`
4. To a program: a visit was booked, `visit_booked` (Will 10 Oct)
   `Pam: Someone booked a visit with your program. Open Pam to see it: {link}`
5. To a program: a visit was changed, `booking_changed` (Will 10 Oct)
   `Pam: A visit with your program was changed. Open Pam to see it: {link}`
6. To a case manager: someone on their list planned a visit, `trip_planned` (Will 10 Oct)
   `Pam: Someone on your list planned a visit. Open Pam to see it: {link}`
7. A staff request was approved, `staff_request_approved` (Will 17 Sep; account text, sends today)
   `Pam: Your request was approved. Open Pam to get started: {link}`
8. A saved place closed or moved, `saved_place_closed` (Will 13 Sep; **sends only once Nico's fix `d272c53b` is deployed, §0**)
   `Pam: A place you saved is {reason}. Find others in Pam: {link}`
   `{reason}` is one of four fixed phrases: "closed, so there is no need to go", "at a new address now", "not taking
   new people, so there is no need to go", "listed wrong here".
9. A staff request was not approved, `staff_request_denied` (Will 17 Sep, wording changed by A28 and signed with card a59)
   `Pam: Your request was not approved. Questions? Visit joinpam.org/support`
10. An answer to a help request, `support_reply` (**unsigned**; only if Will says yes on card a61)
    `Pam: {reply} Reply STOP to stop texts.` (`{reply}` is one sentence a person at Pam writes, 120 characters at most.)
11. Slot for "Someone wants to connect": §9.

The day-before reminder also exists in the other six languages (signed "to learn from" by Will, 9 Oct; no native
reader yet), and the earlier filing attached them: Spanish, Portuguese (written without accents), Simplified and
Traditional Chinese, Russian, Arabic. They are in `packages/config/src/sms-templates.ts` (`appointment_24h`), read from
there when the form takes them. Chinese, Russian and Arabic are two segments, as the description says.

## 5. Opt-in, opt-out and help keywords and replies

| Field | Answer | State |
|---|---|---|
| Opt-in keywords | none. Consent is given in the app, not by texting a keyword. | as filed |
| Opt-in confirmation message | The sign-in code text (sample 1): it carries the brand, rates, HELP and STOP. It comes from **Twilio Verify** (Supabase calls it), so its wording is the Verify service's message template in the console, not `sms-templates.ts`. **Will: read the template on the Verify service today and paste exactly what it says.** | check |
| Opt-out keywords | Twilio's defaults (STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT) with Advanced Opt-Out on; Pam's `sms-inbound` uses the same list. | as filed |
| Opt-out reply | `You will not get any more texts from Pam. Reply START to get them again.` (72 characters) | on file |
| Start keywords | Twilio's defaults (START, YES, UNSTOP). Pam's `sms-inbound` records START and UNSTOP only and leaves YES alone. | as filed |
| Start reply | **Proposal, unsigned (Will's):** `Pam: Texts are on again. Msg & data rates may apply. Reply STOP to stop, HELP for help.` (87 characters) | Will signs |
| Help keyword | HELP | as filed |
| Help reply | `Pam: Get help at joinpam.org/support or write to hello@joinpam.org. Reply STOP to stop.` (87 characters; Will's wording, card a59, 11 Oct) | signed |

The replies are set in the console (Messaging → Services → the Pam service → Advanced Opt-Out), not in Pam. Pam's own
`sms-inbound` answers nothing: it only records a STOP or a START against the number (D-460), so nobody gets two
replies. Its Twilio webhook and Will's STOP/START test are in `docs/sms-setup.md` §3.

## 6. Content attributes

| Field | Answer | Why |
|---|---|---|
| Embedded links | **Yes** | *Rejected before for undeclared links.* Samples 2–8 carry `{link}`. |
| Link domains | `app.joinpam.org` (`/trips/` in the reminder, `/messages/` in a message alert, `/` in the others and in the saved-place text, `/programs/new/` for a new program lead's approval); and the bare text `joinpam.org/support` in sample 9 (and in `access_limited_notice`, which nothing sends) | `app_url` is `https://app.joinpam.org` (migration 20261010190831). |
| Public URL shortener | none in Pam's own links. **Will: check the Messaging Service's link-shortening setting.** If Twilio shortens links, name its short domain in the notes. | |
| Embedded phone numbers | **No** | No text carries Pam's number (A28); `hello@joinpam.org` is an email address. |
| Age-gated content | No | |
| Direct lending or loan arrangement | No | |
| Affiliate marketing | No | |

## 7. Privacy policy and Terms URLs

`https://app.joinpam.org/privacy/` and `https://app.joinpam.org/terms/`. **Open both in a private window the day you
submit.** A reviewer fetches them signed out from a machine that has never seen the site; a page behind a login, or a
deployment that has moved, was rejection 30921 or 30933.

## 8. Every template in the code (the 21), and what sends

The "gate" is `claim_outbound_messages` (latest: 20261011042645): an account text goes when due; every other text also
needs `texts_live = on`, a yes to texts, no STOP, outside the person's quiet hours (default 9 pm to 7 am), a phone
number, and for the time-bound ones not more than 12 hours late.

| Key | Sends today? | Queued by | To | Link | Signed |
|---|---|---|---|---|---|
| `verify_code` | **Yes** | Twilio Verify, with the console's own template (the repo's `verify_code` is not what sends) | whoever asks for a code | none | the repo template Will 13 Sep; the console wording is not in the repo, so check it (§5) |
| `staff_request_approved` | **Yes** (account text) | approving a staff request (20261010192105) | the requester | `{app_url}` or `{app_url}/programs/new/` | Will 17 Sep |
| `staff_request_denied` | **Yes** (account text) | denying one (0055, phone-only row) | the requester | `joinpam.org/support` (text) | Will 17 Sep; A28 wording, card a59 |
| `appointment_24h` | held (`texts_live`) | a saved trip (20261010130831) | the member, if agreed | `{app_url}/trips/` | Will 13 Sep |
| `message_waiting` | held | `queue_message_text_alert` (20261010134429) | the others in the thread who switched it on (a Pam reply to someone who opted in queues the same text; Pam's welcome and out-of-hours reply have no sender and queue none) | `{app_url}/messages/` | Will 10 Oct |
| `visit_booked`, `booking_changed` | held | same | the program's lead who switched it on | `{app_url}/` | Will 10 Oct |
| `trip_planned` | held | same | the member's case manager who switched it on | `{app_url}/` | Will 10 Oct |
| `saved_place_closed` | held, **and not yet able to send (§0)** | `queue_saved_place_closed` (0037; the link added by `d272c53b`) | people who saved the place | `{app_url}/` once `d272c53b` is deployed | Will 13 Sep |
| `support_reply` | held; **unsigned** | `send_support_text` (super admin) | a number typed into the help form | none; ends with the STOP suffix | **not signed** (card a61) |
| `reply_no_read` | no | nothing sends it (`sms-inbound` never answers in words) | would be: anyone who texts Pam back | none (`hello@joinpam.org`) | **not signed** |
| `appointment_2h`, `appointment_morning_of`, `attendance_check`, `attendance_missed_followup`, `facilitation_member`, `facilitation_provider`, `access_limited_notice`, `invite_member`, `invite_provider`, `connection_request` | **No**: a template and a signature, but nothing queues them | none | none | various | Will 13 Sep |

Not filed as samples: the ten in the last row. The two invitations are in the account-text list but no code queues
them (a case manager shares the link from their own phone). If one of them is ever wired, it is filed first.

## 9. Slot: "Someone wants to connect" (`connection_request`)

`Pam: Someone on Pam wants to connect. Open Pam to reply: {link}` (Will 13 Sep). **Nothing queues it today** and no
switch controls it (the member's Text alerts list has a `connect` row that is not live). If Will wants it in this
filing: add it as sample 11 and add to the description's second paragraph, before "staff may get": "or a notice that
someone wants to connect" (about 38 characters; the description has 4 spare, so drop "Every message names Pam." or
the "at low volume" clause to make room, and recount). If it is not built by the time the filing goes in, leave it
out: a registered text that nothing sends is allowed, an unregistered text that does send is not.

## 10. What would repeat an old rejection

1. **Undeclared links** (*rejected before*). Embedded links must say Yes (§6), samples must show `{link}` where the real
   text has one, and the two domains (§6) must be named. The saved-place text has no link today; when it gets one it is
   `app.joinpam.org`.
2. **Implied consent, 30925** ("opt-in must be unchecked by default; active consent required"). The screenshot must show
   the agree screen **as a person meets it**, with the button and no tick box, and the words in §3 must be the words
   on it. Two ways this fails: a screenshot of the old screen ("Pam does not send any of these yet…" and the long STOP line,
   which Wren's current picture still shows), and a Text alerts switch that records consent (the reason for Dot's routing).
3. **A claim the screens do not back.** Two sentences in `docs/sms-campaign-samples.md` were wrong against the code and
   are corrected here: (a) the description and the short opt-in field said the **sign-in screen** "states that STOP stops
   it and that rates may apply". It says "Pam texts you a code to sign in. No password to remember." (`signin.phone.consent`).
   STOP, HELP and rates are on the first text and on the agree screen. (b) "STOP … permanently" and "HELP … reaches a
   person": STOP can be undone by START, and the HELP reply is an address. (c) "Numbers are never … entered by staff for anyone": staff type the invited person's number (§3). Do not reuse the old short fields. **The paragraph already on file with the carrier carries (a) and (c)**, which is another reason to refile rather than wait.
4. **Unreachable Privacy or Terms URL** (§7).
5. **A description narrower than the traffic.** After this page, nothing the code can send is missing from §2; if a
   template in the last row of §8 is ever wired, file it first.

## 11. Screenshots Wren re-shoots, once the agree screens land

Placeholders; Wren fills the file names. All at 390 wide, light mode, English, signed in with nothing answered yet.

| # | Screen | Route | Attach to | File |
|---|---|---|---|---|
| S1 | Sign-in, the number field and "Pam texts you a code…" | `/signin/` | opt-in flow (supporting) | *placeholder* |
| S2 | **Text reminders, as a member** (rows with "Coming soon", the STOP/HELP/rates line, "Agree to receive texts", "Not now") | `/reminders/` | **the form's opt-in screenshot** | *placeholder* |
| S3 | the same, as a case manager | `/reminders/` | supporting | *placeholder* |
| S4 | the same, as a program lead | `/reminders/` | supporting | *placeholder* |
| S5 | the join step a new member meets first (same words as S2) | `/join/` (texts step) | supporting | *placeholder* |
| S6 | Text alerts with no consent on file: a tap opens the agree screen | `/alerts/` → `/reminders/?next=alerts` | supporting | *placeholder* |
| S7 | Privacy page, signed out, URL visible | `/privacy/` | Will, in a private window | *placeholder* |
| S8 | Terms page, signed out, URL visible | `/terms/` | Will, in a private window | *placeholder* |
| S9 | the help form with a number and "answer by text" (only if card a61 is yes) | `/help/` | optional | *placeholder* |
| S10 | the Advanced Opt-Out page in the Twilio console with the STOP, START and HELP replies as set | console | Will | *placeholder* |

## 12. Order of work (Mira, 18:40)

1. The two agree screens are finished (Nico, Ava) → Wren shoots S1–S6 → this page's §3 is compared with them word for word.
2. Will signs what is unsigned (§0, §5 start reply, §4 sample 10 if used) and decides §9 and the help-form line.
3. Will files in Twilio from this page; the saved-place link and the console templates (§0, §5) are checked first.
4. Merge desk deploys `dispatch-sms` from main and sets up STOP/START (`docs/sms-setup.md` §3); Will tests STOP and START on his phone.
5. The switch-on batch: `texts_live`, `ALERT_TEXTS_LIVE`, `VISIT_REMINDERS_LIVE`, and the "put back the lines" list in `docs/before-launch.md`.

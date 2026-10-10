# Sample messages for the carrier registration

Everything Pam can send, in the order a person is likely to meet it. Paste these
into the A2P campaign's sample-message boxes exactly as they appear — carriers
compare them against real traffic later, and a sample that does not match what
goes out is what gets a campaign suspended after approval.

Keep the curly placeholders (`{code}`, `{link}`, `{time}`). Reviewers read them
as placeholders, which is the point: they show the shape of the message without
inventing a fake appointment.

**Source of truth:** `packages/config/src/sms-templates.ts`. If a message is
edited there, regenerate this list rather than editing it here.

## What to say in the campaign's own fields

- **Use case:** Low Volume Mixed — account notifications (sign-in codes) and
  appointment reminders. Not marketing. Pam never sends promotional messages.
- **How people opt in:** a person is invited by their case manager, then types
  their own phone number into Pam's sign-in screen, which states that Pam will
  text them, that STOP stops it, and that rates may apply. Attach a screenshot of
  that screen.
- **How people opt out:** STOP, which is honoured immediately and permanently
  and is never overridden by a setting inside the app.
- **Message volume:** low. A sign-in code when somebody signs in, and a reminder
  the day before each visit they plan.

## The resubmission checklist

Every field, with the answer and the reason it is worded that way. Work down it
in order; the two marked **rejected before** are where this campaign has already
failed once each.

| Field | Answer |
|---|---|
| Brand | **Oba** — the registered LLC, matching the EIN letter exactly. Pam is the campaign beneath it, not the brand. |
| Use case | **Low Volume Mixed** — account notifications (sign-in codes) and appointment reminders |
| Embedded links | **Yes** ← *rejected before.* Seven of the nine messages carry `{link}`, which opens Pam at `https://app.joinpam.org/` (a short link, about 22 characters, once Twilio shortens it). |
| Embedded phone numbers | **Yes** — `staff_request_denied` ends "Call {supportPhone}" |
| Age-gated content | No |
| Direct lending or loan arrangement | No |
| Affiliate marketing | No |
| Opt-in type | **Web form / in-app**, not a keyword. Nobody texts a keyword to a number. |
| Opt-in description | ← *rejected before (30925).* Paste the answer below, attach the **Text reminders** screenshot. |
| Opt-out | Reply **STOP**. Honoured immediately and permanently; no in-app setting can override it. |
| Help | Reply **HELP**. |
| Privacy policy URL | `https://app.joinpam.org/privacy/` |
| Terms URL | `https://app.joinpam.org/terms/` |
| Sample messages | All nine, below (6–9 are the Text alerts texts, approved by Will on 10 October and not yet sent: file them anyway, so the campaign is not filed twice), placeholders intact — and the appointment reminder in each added language (the form takes a few; send those five if all do not fit) |

**Before submitting, open both URLs in a private window.** A reviewer fetches
them signed out, from a machine that has never seen the site. A page behind a
login, or a deployment that has moved, is rejection 30921 or 30933 and costs
another round.

## "Opt-in message" — what a person receives right after consenting

The first message anybody gets from Pam is their sign-in code, because
submitting their number *is* the consent and the code is the answer to it.
Carriers expect that first message to carry the brand, the rates warning and
both keywords, so it reads:

> Pam: Your code is 123456. It works for 10 minutes. Msg & data rates may apply. Reply HELP for help, STOP to stop.

113 characters, one segment.

**Where this message actually comes from, which matters.** Sign-in codes are sent
by Twilio Verify, called by Supabase — not by Pam's own dispatcher. So the
wording above is set in the Twilio console under Verify → Services → the Pam
service → message template, not in `packages/config/src/sms-templates.ts`. The
`verify_code` template in this repo is not the text that sends while sign-in
goes through Verify; it exists for the day Pam sends its own codes.

Two consequences worth knowing before submitting:

1. Custom Verify templates go through their own Twilio approval, and a default
   template will say something closer to *"Your Pam verification code is:
   123456"* — no rates line, no keywords. Submit the wording you will actually
   have. If the custom template is not approved in time, declare the default and
   correct it later rather than declaring copy that does not send.
2. If Verify will not carry the wording at all, the alternative is switching
   Supabase from Twilio Verify to plain Twilio messaging, where the text is
   entirely ours. That is a bigger change and not worth making for this alone.

## "How do end-users consent to receive messages?", to paste as written

990 characters, so it clears a 1024 cap — count before editing it.

**This is the third version, and the app changed twice under it.** The first
described consent as implied by typing a number; rejected with **30925,
"opt-in must be unchecked by default; active consent required"**. The second put
a tick box on the sign-in screen, which satisfied the carrier and made the front
door do two jobs at once. The third moves the question to its own screen, shown
to a member after their first sign-in.

That last move is not a workaround, it is the right shape:

- **Sign-in is one job.** A person getting into the app should not have to weigh
  a messaging policy to do it (§2.5, one primary action per screen).
- **It is a members' question.** Reminders are about visits somebody plans. A
  case manager signing in to look at their caseload never meets the screen,
  because nothing in their work depends on being texted one.
- **A screen has room to be honest.** What is sent, how often, STOP, HELP,
  rates — all of it fits without shrinking to fine print, and that page is the
  screenshot the registration wants.

A promise that used to be on this screen and is not any more: *"never at
night."* The dispatcher really does hold a message until morning (0039), but
sign-in codes go out whenever somebody asks for one, and a person reading a
screen about text messages does not separate the two. Will's call, and the right
one — a promise that is true of most messages is not a promise.

The sign-in screen still carries the one line the code itself needs: *"Pam texts
you a code to sign in. No password to remember."* The STOP/rates language moved
to the reminders screen below (D-139, 17 September) — sign-in codes are not
optional the way reminders are, so the room to be honest about STOP, HELP and
rates belongs on the screen where a member is actually choosing something.

> End users opt in inside the Pam app, on a screen dedicated to that choice, and nothing is pre-selected. A person is invited by a staff member and enters their own mobile number on the sign-in screen to request a one-time code; Pam has no passwords, so requesting the code is the request to be texted it. After signing in, the person is shown a "Text reminders" screen listing what would be sent (for a member: a reminder before a planned visit and a note if a saved place closes or moves), saying plainly which of them Pam sends today, and that STOP stops them permanently, HELP reaches a person, and rates may apply. Consent is a button labelled "Agree to receive texts": pressing it is the affirmative act, and the words agreed to are on the control itself. There is no checkbox, so nothing can arrive pre-selected. A "Not now" button records the decline, and Pam works either way, so consent is never required to use Pam. Numbers are never bought, rented, or entered by staff for anyone.

Attach the **Text reminders** screenshot, not the sign-in one. The reviewer is
checking that the box is really unticked and that the wording quoted here is
really on that screen.

## The campaign description, to paste as written

The field caps at **1024 characters**. What follows is 981, so it fits with a
little room — if you edit it, count before you paste. Every message type a person
can receive is named on purpose: reviewers compare the description against the
samples and, later, against real traffic, and a description narrower than what
actually sends is how an approved campaign gets suspended.

> Pam is an app by Oba that connects people to community programs, services and the staff who support them. People get messages only after entering their own phone number on Pam's sign-in screen, which says Pam will text them and how to stop.
>
> Messages are account notifications and appointment reminders, at low volume. First comes a one-time sign-in code. After that a person who agreed may receive a reminder the day before an appointment they scheduled in the app, a notice when a saved place has closed or moved, and a notice that a message is waiting; staff may receive a decision on their request, or a notice of a visit booked, changed or planned.
>
> Nothing is promotional or third-party, and numbers are never sold or shared. Every message names Pam. Languages: English, Spanish, Portuguese, Chinese, Russian, Arabic. A message is one segment, except appointment reminders in Chinese, Russian and Arabic: two. STOP ends all messages permanently; HELP returns support contact.

### The shorter fields, if the form asks separately

- **Campaign use case:** Low Volume Mixed — account notification and customer
  care.
- **Description of opt-in:** The person is invited by a staff member, then enters
  their own phone number on Pam's sign-in screen to request a code. That screen
  states that Pam will text them, that STOP stops it, that HELP gets help, and
  that message and data rates may apply. A screenshot is attached.
- **Opt-in keywords:** none. Consent is given in the app, not by texting a
  keyword to a number.
- **Opt-out message:** You will not get any more texts from Pam. Reply START to
  get them again.
- **Help message:** Pam: Call {supportPhone} and a person will help you.
- **Age-gated or affiliate marketing:** No.

## The messages

Nine, which is what Pam sends today or has been told to send. **Taken out on 10 October
2026** (they had a template and no builder and no plan, and a sample that does not match
what goes out is what gets a campaign suspended): the invitations (2, 3 in the old list; a
case manager shares the link from their own phone, so Pam's number never sends it), the two
introductions, the two-hours-before and morning-of reminders (the first reminder built is the
day before only), "did you make it" and the missed-appointment follow-up (they need a
receiver for replies that does not exist), "someone wants to connect", and "some parts of the
app are switched off". Each comes back with the job that builds it, and the description
changes with it. The templates stay in `sms-templates.ts`.

**1. Sign-in code (the one carriers care most about)**

> Pam: Your code is {code}. It works for 10 minutes.
>
> _Spanish:_ Pam: Su codigo es {code}. Sirve por 10 minutos.

**2. Request approved (a person who asked to be a case manager or program lead)**

> Pam: Your request was approved. Open Pam to get started: {link}
>
> _Spanish:_ Pam: Su solicitud fue aprobada. Abra Pam para empezar: {link}

**3. Request not approved**

> Pam: Your request was not approved. Questions? Call {supportPhone}.
>
> _Spanish:_ Pam: Su solicitud no fue aprobada. Preguntas? Llame al {supportPhone}.

**4. A saved place is no longer worth a trip**

> Pam: A place you saved is {reason}. Find others in Pam: {link}
>
> _Spanish:_ Pam: Un lugar que guardo {reason}. Vea otros en Pam: {link}

**5. Appointment reminder, the day before**

> Pam: You have a visit tomorrow at {time}. {address}. Tap for directions: {link}
>
> _Spanish:_ Pam: Tiene una visita mañana a las {time}. {address}. Toque para llegar: {link}

**6. Somebody wrote to you (approved by Will 10 October; not yet sent)**

> Pam: You have a new message in Pam. Open it: {link}
>
> _Spanish:_ Pam: Tiene un mensaje nuevo en Pam. Abralo aqui: {link}

**7. To a program: somebody booked a visit (approved; not yet sent)**

> Pam: Someone booked a visit with your program. Open Pam to see it: {link}
>
> _Spanish:_ Pam: Alguien reservo una visita en su programa. Abra Pam para verla: {link}

**8. To a program: a booking was changed (approved; not yet sent)**

> Pam: A visit with your program was changed. Open Pam to see it: {link}
>
> _Spanish:_ Pam: Cambio una visita en su programa. Abra Pam para verla: {link}

**9. To a case manager: somebody on their list planned a visit (approved; not yet sent)**

> Pam: Someone on your list planned a visit. Open Pam to see it: {link}
>
> _Spanish:_ Pam: Alguien de su lista planeo una visita. Abra Pam para verla: {link}

6–9 are the texts behind the **Text alerts** switches (Will, 10 October 2026). They say that
something happened, never what or to whom: no name, no place, no day. Will approved them on
10 October 2026 ("Text alerts: approved"), the other languages as drafts to learn from. Nothing
queues them yet, so none sends, and the Text alerts screen says "coming soon" until one does. They are in `packages/config/src/sms-templates.ts` (`message_waiting`,
`visit_booked`, `booking_changed`, `trip_planned`); each is one segment in every language, and
the other languages' drafts are there too. 6 goes to anyone who has a message waiting; 7 and 8
to a program lead; 9 to a case manager. Message 5 is built next (the day before only, sent
only to somebody who agreed to texts).

## The same messages in the other languages

Pam is also written in Brazilian Portuguese, Simplified and Traditional Chinese,
Russian and Arabic (A24), and a person is texted in the language they chose in the
app (D-424). Every message above exists in them; the reminder is the one that
changes the registration, so these are its samples. The Chinese, Russian and Arabic
ones are two segments (a joined message of the wide encoding holds 67 characters a
part, 134 for two), which is Will's decision of 9 October 2026 (D-431) and is why
the description above says so. Portuguese is written without accents and stays one.

**6, in the other languages. Appointment reminder, the day before** (`appointment_24h`)

> _Brazilian Portuguese:_ Pam: Voce tem uma visita amanha as {time}. {address}. Toque para chegar: {link}
>
> _Simplified Chinese:_ Pam: 您明天{time}有预约。{address}。点按查看路线：{link}
>
> _Traditional Chinese:_ Pam: 你明天{time}有一次到訪。{address}。點按查看路線：{link}
>
> _Russian:_ Pam: Завтра в {time} у вас визит. {address}. Маршрут: {link}
>
> _Arabic:_ Pam: لديك زيارة غدا في {time}. {address}. الاتجاهات: {link}

The two-hour and morning-of reminders, and every other message, are in
`packages/config/src/sms-templates.ts` under `more`; a
sample that does not match what goes out is what gets a campaign suspended, so
paste from there, not from this page, if they differ.

## Notes a reviewer may ask about

- **Seven languages.** Pam sends in the language the person chose: English,
  Spanish, Brazilian Portuguese, Simplified and Traditional Chinese, Russian or
  Arabic. The drafts in the five newer ones were approved by Will on 9 October 2026
  to learn from, with no native reader yet (D-430), and are corrected as people who
  read them say what is wrong. English, Spanish and Portuguese are written inside
  the cheap encoding (160 characters, one segment). Chinese, Russian and Arabic are
  the wide one (70 characters, one segment), except the three appointment reminders,
  which take two (134 characters; D-431). **The carrier filing has to say so
  before `dispatch-sms` is redeployed** — docs/before-launch.md.
- **STOP on first contact.** The two invitations are the first message anybody
  receives from an unknown number, so they carry the opt-out instruction in the
  message itself. Later messages do not repeat it, because the number is by then
  a known one and the instruction still works.
- **No message names a program, a condition, or anything about why somebody is
  using Pam.** A text lands on a lock screen a stranger can read, and that rule
  is enforced by tests rather than by care.

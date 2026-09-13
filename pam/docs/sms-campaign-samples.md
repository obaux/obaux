# Sample messages for the carrier registration

Everything PAM can send, in the order a person is likely to meet it. Paste these
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
  appointment reminders. Not marketing. PAM never sends promotional messages.
- **How people opt in:** a person is invited by their case manager, then types
  their own phone number into PAM's sign-in screen, which states that PAM will
  text them, that STOP stops it, and that rates may apply. Attach a screenshot of
  that screen.
- **How people opt out:** STOP, which is honoured immediately and permanently
  and is never overridden by a setting inside the app.
- **Message volume:** low. A sign-in code when somebody signs in, and at most a
  few reminders a week per person.

## "Opt-in message" — what a person receives right after consenting

The first message anybody gets from PAM is their sign-in code, because
submitting their number *is* the consent and the code is the answer to it.
Carriers expect that first message to carry the brand, the rates warning and
both keywords, so it reads:

> PAM: Your code is 123456. It works for 10 minutes. Msg & data rates may apply. Reply HELP for help, STOP to stop.

113 characters, one segment.

**Where this message actually comes from, which matters.** Sign-in codes are sent
by Twilio Verify, called by Supabase — not by PAM's own dispatcher. So the
wording above is set in the Twilio console under Verify → Services → the PAM
service → message template, not in `packages/config/src/sms-templates.ts`. The
`verify_code` template in this repo is not the text that sends while sign-in
goes through Verify; it exists for the day PAM sends its own codes.

Two consequences worth knowing before submitting:

1. Custom Verify templates go through their own Twilio approval, and a default
   template will say something closer to *"Your PAM verification code is:
   123456"* — no rates line, no keywords. Submit the wording you will actually
   have. If the custom template is not approved in time, declare the default and
   correct it later rather than declaring copy that does not send.
2. If Verify will not carry the wording at all, the alternative is switching
   Supabase from Twilio Verify to plain Twilio messaging, where the text is
   entirely ours. That is a bigger change and not worth making for this alone.

## "How do end-users consent to receive messages?", to paste as written

1022 characters, so it just clears a 1024 cap — count before editing it.

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
- **A screen has room to be honest.** What is sent, how often, never at night,
  STOP, HELP, rates — all of it fits without shrinking to fine print, and that
  page is the screenshot the registration wants.

The sign-in screen still carries the one line the code itself needs: *"PAM texts
you a code to sign in. Reply STOP to stop texts. Rates may apply."*

> End users opt in inside the PAM app, on a screen dedicated to that choice, and nothing is pre-selected. A person is invited by a staff member and enters their own mobile number on the sign-in screen to request a one-time code; PAM has no passwords, so requesting the code is the request to be texted it. After signing in, a member sees a "Text reminders" screen listing exactly what would be sent (a reminder before a visit they planned, a note if a place they saved closes or moves, a note when someone wants to connect), the frequency (a few messages a week at most, never at night), and that STOP stops them permanently, HELP reaches a person, and message and data rates may apply. On that screen is a checkbox, UNCHECKED by default: "Yes, text me reminders". Ticking it and saving is the active consent. A "Not now" button records the decline, and PAM works fully either way, so consent is never required to use PAM. Numbers are never bought, rented, imported, or entered by staff for anyone else. Screenshot attached.

Attach the **Text reminders** screenshot, not the sign-in one. The reviewer is
checking that the box is really unticked and that the wording quoted here is
really on that screen.

## The campaign description, to paste as written

The field caps at **1024 characters**. What follows is 1004, so it fits with a
little room — if you edit it, count before you paste. Every message type a person
can receive is named on purpose: reviewers compare the description against the
samples and, later, against real traffic, and a description narrower than what
actually sends is how an approved campaign gets suspended.

> PAM is an app by Oba that connects people to community programs, services and the staff who support them. People receive messages only after entering their own phone number on PAM's sign-in screen, which states that PAM will text them and how to stop.
>
> Messages are account notifications and appointment reminders, at low volume and low throughput. A person first receives a one-time sign-in code, because PAM uses a phone number instead of a password. After that they may receive: reminders for appointments they scheduled in the app, a check-in asking whether they made it, a notice when a place they saved has closed or moved, a notice that someone wants to connect, and, for staff, a notice of an introduction or an account change.
>
> Nothing is promotional. PAM sends no marketing, no advertising and no third-party content, and does not sell or share phone numbers. Every message names PAM and fits one segment, in English or Spanish. STOP ends all messages permanently; HELP returns support contact.

### The shorter fields, if the form asks separately

- **Campaign use case:** Low Volume Mixed — account notification and customer
  care.
- **Description of opt-in:** The person is invited by a staff member, then enters
  their own phone number on PAM's sign-in screen to request a code. That screen
  states that PAM will text them, that STOP stops it, that HELP gets help, and
  that message and data rates may apply. A screenshot is attached.
- **Opt-in keywords:** none. Consent is given in the app, not by texting a
  keyword to a number.
- **Opt-out message:** You will not get any more texts from PAM. Reply START to
  get them again.
- **Help message:** PAM: Call {supportPhone} and a person will help you.
- **Age-gated or affiliate marketing:** No.

## The messages

**1. Sign-in code (the one carriers care most about)**

> PAM: Your code is {code}. It works for 10 minutes.
>
> _Spanish:_ PAM: Su codigo es {code}. Sirve por 10 minutos.

**2. Invitation to join, sent by a case manager**

> PAM: You've been invited to PAM, an app for finding help and people near you. Tap to join: {link} Reply STOP to stop texts.
>
> _Spanish:_ PAM: Le invitaron a PAM, una app para encontrar ayuda y personas cerca. Toque para entrar: {link} Responda STOP para no recibir mas.

**3. Invitation to an organisation to list its services**

> PAM: You have been invited to list your services on PAM. Tap to set up your page: {link} Reply STOP to stop texts.
>
> _Spanish:_ PAM: Le invitaron a publicar sus servicios en PAM. Toque para crear su pagina: {link} Responda STOP para no recibir mas.

**4. A case manager introduced someone to a program**

> PAM: {adminFirstName} connected you with a program that can help. Open PAM to say hi: {link}
>
> _Spanish:_ PAM: {adminFirstName} le conecto con un programa que puede ayudar. Abra PAM para saludar: {link}

**5. A program is told someone was introduced to them**

> PAM: Someone was introduced to your program. Open PAM to reply: {link}
>
> _Spanish:_ PAM: Alguien fue presentado a su programa. Abra PAM para responder: {link}

**6. Appointment reminder, the day before**

> PAM: You have a visit tomorrow at {time}. {address}. Tap for directions: {link}
>
> _Spanish:_ PAM: Tiene una visita mañana a las {time}. {address}. Toque para llegar: {link}

**7. Appointment reminder, two hours before**

> PAM: Your visit is at {time} today. {address}. Tap for directions: {link}
>
> _Spanish:_ PAM: Su visita es hoy a las {time}. {address}. Toque para llegar: {link}

**8. Appointment reminder, the morning of**

> PAM: Today at {time} you have a visit. {address}. Tap for directions: {link}
>
> _Spanish:_ PAM: Hoy a las {time} tiene una visita. {address}. Toque para llegar: {link}

**9. Did you make it? (the only message expecting a reply)**

> PAM: Did you make it today? Reply YES or NO.
>
> _Spanish:_ PAM: Pudo ir hoy? Responda YES o NO.

**10. After a missed appointment**

> PAM: No problem. We saved a step to set up a new time. Open PAM when you are ready: {link}
>
> _Spanish:_ PAM: No hay problema. Guardamos un paso para buscar otra fecha. Abra PAM cuando pueda: {link}

**11. Somebody wants to connect**

> PAM: Someone on PAM wants to connect. Open PAM to reply: {link}
>
> _Spanish:_ PAM: Alguien en PAM quiere conectar. Abra PAM para responder: {link}

**12. A saved place is no longer worth a trip**

> PAM: A place you saved is {reason}. Find others in PAM: {link}
>
> _Spanish:_ PAM: Un lugar que guardo {reason}. Vea otros en PAM: {link}

**13. Some parts of the app are switched off**

> PAM: Some parts of PAM are turned off for now. Call {supportPhone} with questions.
>
> _Spanish:_ PAM: Algunas partes de PAM estan apagadas por ahora. Llame al {supportPhone} si tiene preguntas.

## Notes a reviewer may ask about

- **Two languages.** PAM sends in English or Spanish, whichever the person chose.
  Both are listed above, and the Spanish is written without accents so every
  message fits a single segment.
- **STOP on first contact.** The two invitations are the first message anybody
  receives from an unknown number, so they carry the opt-out instruction in the
  message itself. Later messages do not repeat it, because the number is by then
  a known one and the instruction still works.
- **No message names a program, a condition, or anything about why somebody is
  using PAM.** A text lands on a lock screen a stranger can read, and that rule
  is enforced by tests rather than by care.

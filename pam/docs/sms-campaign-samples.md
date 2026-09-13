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

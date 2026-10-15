# D-577 — Spanish: tú for everything a member reads, and for the screens both roles use

**Date:** 2026-10-15 · **Branch:** `claude/lena-es-member-tu`

## What was decided

Spanish addresses the reader as **tú** in everything a member reads, and in every key on a screen that
members and staff both use. **Usted** stays on screens only staff see, and on Privacy, Terms and the
legal pages. One screen never mixes the two.

The standing rule was already "tú for members, usted for staff" (it is why Iris's 10 October P12 and her
15 October P4 count a *usted* line on a member screen as a defect). Nobody had written down what to do with
a screen both roles use, and the drafting brief the model was given (`LOCALE_BRIEFS.es`) said "Formal
usted" for everything, which is how 194 member lines came out in *usted*. Lena decided the shared-screen
case on Mira's 15 October 13:24 job (Iris P4, Friday batch) and told Mira the rule before building it.

## What changed

194 Spanish lines (English and the other six languages untouched), plus one quoted screen name in the
Privacy counter line:

- messages 37, transparency 26, onboarding 13, notice 13, reminders 13, badge 12, checkin 7, place 7,
  trips 7, alerts 7, home 6, saved 6, signin 6, profile 5, flag 5, points 4, notify 4, connections 3,
  explore 2, guide 2, help 2, friend 2, and one each of places, offline, voice, copy, app.
- Every line Iris named: `trips.confirm.title(.self)`, `checkin.done`, `points.title`, `explore.nextTrip.*`,
  `place.schedule.pickService`, `place.dropin.body(.self)`, `guide.*`, `transparency.*`, `signin.phone.label`.
- Many she did not, most with no "su" or "usted" in them, only a third-person verb: the badge descriptions
  ("Aprendió un oficio que vale"), `saved.leave.body` ("Quítelos"), `onboarding.3` ("las visitas que planea"),
  `messages.thread.you` ("Usted").
- `what-we-keep.p13` quotes the Your points screen by its name, which `privacy-counter-line.test.ts` pins to
  `points.title`. Only that name changed: "abrieron “Tus puntos” y su Perfil". The rest of the Privacy line is
  still usted.
- `connections.empty.body` said "administrador de casos"; it now says "gestor de casos" like the other 18.
- `LOCALE_BRIEFS.es` and `docs/copy-changes.md` now state the rule, so the next draft is not usted again.

## What stays usted, on purpose

- Screens only staff see: the staff homes, People, Schedule, Book, Interested, Policies upload, Program,
  Invite, Requests and Review, Reported places, `admin.*`, `directory.*`, `home.setup.*`, the staff welcome
  slides (`onboarding.admin.*`, `onboarding.provider.*`), `signin.invited.admin/provider`, `join.program.*`,
  `join.privacy.admin/provider.*`, `join.staff.*`, `useAs.*`, `verified.*`, `trips.booked.*` (the staff booking
  confirmation, and the sample SMS in it, which is not the real text template).
- Privacy, Terms and `legal.*`.
- Names and idioms that read the same either way (`level.steady` "Firme" is an adjective).

## Where a reader will meet the seam

- **A staff member now reads *tú* on the shared screens** (text reminders, alerts, Messages thread, notices,
  Help, sign-in) and *usted* on their own. *Tú* to a colleague is informal, not wrong. If staff should read
  *usted* there, the fix is separate keys per role (the way `reminders.introStaff` and `messages.empty.body.*`
  already are), which is code, not translation.
- **Transparency is now *tú*; the Privacy page next to it is *usted*.** Mira asked for `transparency.*` in *tú*.
  The Privacy page is Will's signed text; whether it follows is his call, and not decided here.
- Some staff screens already mixed before this (`home.caseload.*`, `join.program.services.hint` are *tú* among
  *usted* lines). Not touched: they are staff screens, outside P4.

## What a later session might reverse

The shared-screen rule. The alternative is *usted* on shared screens, which makes the member's Messages
thread and Help formal again; Iris's P4 is the evidence against it. A native reader still owed for all of
Spanish (D-424's list) should read these lines first.
